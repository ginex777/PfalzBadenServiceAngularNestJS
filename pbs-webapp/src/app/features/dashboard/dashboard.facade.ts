import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { ToastService } from '../../core/services/toast.service';
import {
  DashboardStats,
  DashboardRechnungZeile,
  DashboardAngebotZeile,
  AktivitaetZeile,
  MonatsvergleichZeile,
  DashboardAktivitaet,
} from './dashboard.models';
import {
  Benachrichtigung,
  BackupInfo,
  MuellplanTermin,
  HausmeisterEinsatz,
} from '../../core/models';
import { nettoBerechnen, MONATE } from '../../core/utils/format.utils';
import { MS_PER_DAY } from '../../core/constants';

const TABELLE_LABEL: Record<string, string> = {
  rechnungen: 'Rechnung',
  angebote: 'Angebot',
  kunden: 'Kunde',
  mitarbeiter: 'Mitarbeiter',
  hausmeister_einsaetze: 'Einsatz',
  aufgaben: 'Aufgabe',
  belege: 'Beleg',
  vertraege: 'Vertrag',
};

const TABELLE_ROUTE: Record<string, string> = {
  rechnungen: '/rechnungen',
  angebote: '/angebote',
  kunden: '/kunden',
  mitarbeiter: '/mitarbeiter',
  hausmeister_einsaetze: '/hausmeister',
  aufgaben: '/aufgaben',
  belege: '/belege',
  vertraege: '/vertraege',
};

function mapAuditAktivitaet(e: DashboardAktivitaet): AktivitaetZeile {
  const statusKlasse: AktivitaetZeile['statusKlasse'] =
    e.aktion === 'CREATE' ? 'text-success' : e.aktion === 'DELETE' ? 'text-danger' : 'text-warning';
  const status =
    e.aktion === 'CREATE' ? 'erstellt' : e.aktion === 'DELETE' ? 'gelöscht' : 'geändert';
  return {
    typ: TABELLE_LABEL[e.tabelle] ?? e.tabelle,
    nr: e.nr ?? `#${e.datensatzId}`,
    name: e.empf ?? e.nutzer,
    betrag: e.brutto,
    datum: e.zeitstempel,
    status,
    statusKlasse,
    routerLink: TABELLE_ROUTE[e.tabelle] ?? '/audit-log',
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly service = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly backupLaedt = signal(false);
  readonly stats = signal<DashboardStats | null>(null);
  readonly ueberfaelligeRechnungen = signal<DashboardRechnungZeile[]>([]);
  readonly offeneRechnungen = signal<DashboardRechnungZeile[]>([]);
  readonly offeneAngebote = signal<DashboardAngebotZeile[]>([]);
  readonly letzteAktivitaeten = signal<AktivitaetZeile[]>([]);
  readonly muellTermine = signal<MuellplanTermin[]>([]);
  readonly benachrichtigungen = signal<Benachrichtigung[]>([]);
  readonly backupInfo = signal<BackupInfo | null>(null);
  readonly monatsvergleich = signal<MonatsvergleichZeile[]>([]);
  readonly aktuellesJahr = signal(new Date().getFullYear());
  readonly naechsteEinsaetze = signal<HausmeisterEinsatz[]>([]);

  readonly ungeleseneNotifAnzahl = computed(
    () => this.benachrichtigungen().filter((n) => !n.gelesen).length,
  );

  readonly ungeleseneNotifs = computed(() =>
    this.benachrichtigungen()
      .filter((n) => !n.gelesen)
      .slice(0, 10),
  );

  ladeDaten(): void {
    this.laedt.set(true);
    const jahr = this.aktuellesJahr();

    this.service.rohdatenLaden(jahr).subscribe({
      next: (daten) => {
        const heute = new Date();
        heute.setHours(0, 0, 0, 0);

        const rechnungen = daten.rechnungen;
        const angebote = daten.angebote;

        // ── Rechnungen aufteilen ──────────────────────────────────────
        const reOffen = rechnungen.filter((r) => !r.bezahlt);
        const reUeberfaellig = reOffen.filter((r) => r.frist && new Date(r.frist) < heute);
        const reNurOffen = reOffen.filter((r) => !r.frist || new Date(r.frist) >= heute);

        this.ueberfaelligeRechnungen.set(
          reUeberfaellig.map((r) => ({
            id: r.id,
            nr: r.nr,
            empf: r.empf,
            brutto: r.brutto,
            frist: r.frist,
            ueberfaellig: true,
            tageUeberfaellig: r.frist
              ? Math.ceil((heute.getTime() - new Date(r.frist).getTime()) / MS_PER_DAY)
              : null,
            tageVerbleibend: null,
          })),
        );

        this.offeneRechnungen.set(
          reNurOffen.map((r) => ({
            id: r.id,
            nr: r.nr,
            empf: r.empf,
            brutto: r.brutto,
            frist: r.frist,
            ueberfaellig: false,
            tageUeberfaellig: null,
            tageVerbleibend: r.frist
              ? Math.ceil((new Date(r.frist).getTime() - heute.getTime()) / MS_PER_DAY)
              : null,
          })),
        );

        // ── Angebote ──────────────────────────────────────────────────
        const angOffen = angebote.filter((a) => !a.angenommen && !a.abgelehnt);
        this.offeneAngebote.set(
          angOffen.map((a) => {
            const gueltig = a.gueltig_bis ? new Date(a.gueltig_bis) : null;
            const abgelaufen = gueltig ? gueltig < heute : false;
            const tage = gueltig
              ? Math.ceil(Math.abs(gueltig.getTime() - heute.getTime()) / MS_PER_DAY)
              : null;
            return {
              id: a.id,
              nr: a.nr,
              empf: a.empf,
              brutto: a.brutto,
              gueltigBis: a.gueltig_bis,
              abgelaufen,
              tageVerbleibend: tage,
            };
          }),
        );

        // ── Stats ─────────────────────────────────────────────────────
        let jahresEinnahmen = 0;
        let jahresAusgaben = 0;
        for (const m of Object.values(daten.buchhaltung)) {
          (m.inc ?? []).forEach((r) => {
            jahresEinnahmen += nettoBerechnen(r.brutto, r.mwst ?? 19);
          });
          (m.exp ?? []).forEach((r) => {
            const abzug = r.abzug ?? 100;
            jahresAusgaben += nettoBerechnen(r.brutto, r.mwst ?? 19) * (abzug / 100);
          });
        }

        this.stats.set({
          jahresEinnahmen,
          jahresAusgaben,
          gewinn: jahresEinnahmen - jahresAusgaben,
          offeneRechnungenAnzahl: reOffen.length,
          offeneRechnungenSumme: reOffen.reduce((s, r) => s + (r.brutto ?? 0), 0),
          ueberfaelligeRechnungenAnzahl: reUeberfaellig.length,
          ueberfaelligeRechnungenSumme: reUeberfaellig.reduce((s, r) => s + (r.brutto ?? 0), 0),
          offeneAngeboteAnzahl: angOffen.length,
          offeneAngeboteSumme: angOffen.reduce((s, a) => s + (a.brutto ?? 0), 0),
        });

        // ── Monatsvergleich ───────────────────────────────────────────
        const aktMonat = new Date().getMonth();
        const zeilen: MonatsvergleichZeile[] = [];
        for (let m = Math.max(0, aktMonat - 5); m <= aktMonat; m++) {
          const d = daten.buchhaltung[m] ?? { inc: [], exp: [] };
          const inc = (d.inc ?? []).reduce((s, r) => s + nettoBerechnen(r.brutto, r.mwst ?? 19), 0);
          const exp = (d.exp ?? []).reduce(
            (s, r) => s + nettoBerechnen(r.brutto, r.mwst ?? 19) * ((r.abzug ?? 100) / 100),
            0,
          );
          zeilen.push({
            monatIndex: m,
            monatName: MONATE[m],
            einnahmen: inc,
            ausgaben: exp,
            gewinn: inc - exp,
            balkenEinnahmen: 0,
            balkenAusgaben: 0,
          });
        }
        const maxWert = Math.max(...zeilen.map((z) => Math.max(z.einnahmen, z.ausgaben)), 1);
        zeilen.forEach((z) => {
          z.balkenEinnahmen = Math.round((z.einnahmen / maxWert) * 80);
          z.balkenAusgaben = Math.round((z.ausgaben / maxWert) * 80);
        });
        this.monatsvergleich.set(zeilen);

        this.muellTermine.set(daten.muellTermine);
        this.benachrichtigungen.set(daten.benachrichtigungen);
        this.backupInfo.set(daten.backupInfo);
        this.laedt.set(false);

        this.service.aktivitaetenLaden().subscribe({
          next: (entries) => this.letzteAktivitaeten.set(entries.map(mapAuditAktivitaet)),
          error: () => {},
        });

        this.service.loadServiceAssignments().subscribe({
          next: (einsaetze) => {
            const heute = new Date();
            heute.setHours(0, 0, 0, 0);
            const naechste = einsaetze
              .filter((e) => new Date(e.datum) >= heute)
              .sort((a, b) => a.datum.localeCompare(b.datum))
              .slice(0, 3);
            this.naechsteEinsaetze.set(naechste);
          },
          error: () => {},
        });
      },
      error: () => {
        this.toast.error('Daten konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
  }

  createBackup(): void {
    this.backupLaedt.set(true);
    this.service.createBackup().subscribe({
      next: (info) => {
        this.backupInfo.set(info);
        this.backupLaedt.set(false);
      },
      error: () => {
        this.toast.error('Backup fehlgeschlagen.');
        this.backupLaedt.set(false);
      },
    });
  }

  markNotificationRead(id: number): void {
    this.service.markNotificationRead(id).subscribe(() => {
      this.benachrichtigungen.update((list) =>
        list.map((n) => (n.id === id ? { ...n, gelesen: true } : n)),
      );
    });
  }

  markAllNotificationsRead(): void {
    this.service.markAllNotificationsRead().subscribe(() => {
      this.benachrichtigungen.update((list) => list.map((n) => ({ ...n, gelesen: true })));
    });
  }

  zuRechnungenNavigieren(): void {
    this.router.navigate(['/rechnungen']);
  }

  rechnungOeffnen(id: number): void {
    this.router.navigate(['/rechnungen'], { state: { openId: id } });
  }

  angebotOeffnen(id: number): void {
    this.router.navigate(['/angebote'], { state: { openId: id } });
  }

  zuAngeboteNavigieren(): void {
    this.router.navigate(['/angebote']);
  }

  zuNeuerRechnungNavigieren(): void {
    this.router.navigate(['/rechnungen'], { state: { neueRechnung: true } });
  }

  zuNeuesAngebotNavigieren(): void {
    this.router.navigate(['/angebote'], { state: { neuesAngebot: true } });
  }

  zuKundenNavigieren(): void {
    this.router.navigate(['/kunden']);
  }

  zuBuchhaltungNavigieren(): void {
    this.router.navigate(['/buchhaltung']);
  }
}
