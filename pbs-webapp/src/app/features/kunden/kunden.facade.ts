import { Injectable, inject, signal, computed } from '@angular/core';
import { MS_PER_DAY, DEFAULT_PAGE_SIZE } from '../../core/constants';
import { Router } from '@angular/router';
import { KundenService } from './kunden.service';
import { ToastService } from '../../core/services/toast.service';
import { Kunde, Rechnung } from '../../core/models';
import {
  KundeUmsatz,
  KundenFormularDaten,
  OffenePostenDaten,
  OffenePostenRechnung,
} from './kunden.models';

@Injectable({ providedIn: 'root' })
export class KundenFacade {
  private readonly service = inject(KundenService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly kunden = signal<Kunde[]>([]);
  readonly umsaetze = signal<KundeUmsatz[]>([]);
  readonly suchbegriff = signal('');
  readonly bearbeiteterKunde = signal<Kunde | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly formularSichtbar = signal(false);
  readonly offenePosten = signal<OffenePostenDaten | null>(null);
  readonly offenePostenSichtbar = signal(false);

  // Sammel-Mahnung
  readonly sammelMahnungSichtbar = signal(false);
  readonly sammelMahnungText = signal('');
  readonly sammelMahnungEmail = signal('');
  readonly sammelMahnungBetreff = signal('');

  private cachedRechnungen: Rechnung[] = [];

  readonly gefilterteKunden = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    if (!q) return this.kunden();
    return this.kunden().filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        (k.ort ?? '').toLowerCase().includes(q) ||
        (k.email ?? '').toLowerCase().includes(q),
    );
  });

  readonly aktuelleSeite = signal(1);
  readonly PAGE_SIZE = DEFAULT_PAGE_SIZE;
  readonly gesamtSeiten = computed(() =>
    Math.max(1, Math.ceil(this.gefilterteKunden().length / this.PAGE_SIZE)),
  );
  readonly seitenKunden = computed(() => {
    const start = (this.aktuelleSeite() - 1) * this.PAGE_SIZE;
    return this.gefilterteKunden().slice(start, start + this.PAGE_SIZE);
  });

  seiteZurueck(): void {
    this.aktuelleSeite.update((p) => Math.max(1, p - 1));
  }
  seiteVor(): void {
    this.aktuelleSeite.update((p) => Math.min(this.gesamtSeiten(), p + 1));
  }

  umsatzFuerKunde(kundeId: number): KundeUmsatz | undefined {
    return this.umsaetze().find((u) => u.kundeId === kundeId);
  }

  hatVerknuepfteDokumente(kundeId: number): boolean {
    const u = this.umsatzFuerKunde(kundeId);
    return u ? u.rechnungenAnzahl + u.angeboteAnzahl > 0 : false;
  }

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.allesDatenLaden().subscribe({
      next: ({ kunden, umsaetze, rechnungen }) => {
        this.kunden.set(kunden);
        this.umsaetze.set(umsaetze);
        this.cachedRechnungen = rechnungen;
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Kunden konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
  }

  speichern(daten: KundenFormularDaten): void {
    const editId = this.bearbeiteterKunde()?.id;
    const anfrage = editId
      ? this.service.updateCustomer(editId, daten)
      : this.service.createCustomer(daten);

    anfrage.subscribe({
      next: (gespeicherterKunde) => {
        if (editId) {
          this.kunden.update((list) => list.map((k) => (k.id === editId ? gespeicherterKunde : k)));
          this.umsaetze.update((list) => list.map((u) => (u.kundeId === editId ? { ...u } : u)));
          this.toast.success('Kunde aktualisiert.');
        } else {
          this.kunden.update((list) => [...list, gespeicherterKunde]);
          this.umsaetze.update((list) => [
            ...list,
            {
              kundeId: gespeicherterKunde.id,
              rechnungenAnzahl: 0,
              angeboteAnzahl: 0,
              umsatzBezahlt: 0,
            },
          ]);
          this.toast.success('Kunde gespeichert.');
        }
        this.bearbeitungAbbrechen();
      },
      error: () => {
        this.toast.error('Kunde konnte nicht gespeichert werden.');
      },
    });
  }

  bearbeitungStarten(kunde: Kunde | null): void {
    this.bearbeiteterKunde.set(kunde);
    this.formularSichtbar.set(true);
  }

  bearbeitungAbbrechen(): void {
    this.bearbeiteterKunde.set(null);
    this.formularSichtbar.set(false);
  }

  loeschenBestaetigen(id: number): void {
    this.loeschKandidat.set(id);
  }

  loeschenAbbrechen(): void {
    this.loeschKandidat.set(null);
  }

  loeschenAusfuehren(): void {
    const id = this.loeschKandidat();
    if (id === null) return;
    this.service.deleteCustomer(id).subscribe({
      next: () => {
        this.kunden.update((list) => list.filter((k) => k.id !== id));
        this.umsaetze.update((list) => list.filter((u) => u.kundeId !== id));
        this.loeschKandidat.set(null);
        this.toast.success('Kunde gelöscht.');
      },
      error: () => {
        this.toast.error('Kunde konnte nicht gelöscht werden.');
        this.loeschKandidat.set(null);
      },
    });
  }

  offenePostenAnzeigen(kundeId: number): void {
    const kunde = this.kunden().find((k) => k.id === kundeId);
    if (!kunde) return;

    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const kundenRe = this.cachedRechnungen.filter(
      (r) => r.kunden_id === kundeId || r.empf === kunde.name,
    );
    const offen = kundenRe.filter((r) => !r.bezahlt);
    const bezahlt = kundenRe.filter((r) => r.bezahlt);
    const ueberfaellig = offen.filter((r) => r.frist && new Date(r.frist) < heute);

    const rechnungen: OffenePostenRechnung[] = kundenRe
      .sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))
      .map((r) => ({
        id: r.id,
        nr: r.nr,
        titel: r.titel ?? '',
        datum: r.datum,
        brutto: r.brutto,
        bezahlt: r.bezahlt,
        ueberfaellig: !r.bezahlt && !!r.frist && new Date(r.frist) < heute,
        frist: r.frist,
        bezahlt_am: r.bezahlt_am,
      }));

    this.offenePosten.set({
      kundeId,
      kundeName: kunde.name,
      offenSaldo: offen.reduce((s, r) => s + (r.brutto ?? 0), 0),
      offeneAnzahl: offen.length,
      umsatzBezahlt: bezahlt.reduce((s, r) => s + (r.brutto ?? 0), 0),
      ueberfaelligeAnzahl: ueberfaellig.length,
      ueberfaelligeSumme: ueberfaellig.reduce((s, r) => s + (r.brutto ?? 0), 0),
      rechnungen,
    });
    this.offenePostenSichtbar.set(true);
  }

  offenePostenSchliessen(): void {
    this.offenePostenSichtbar.set(false);
    this.offenePosten.set(null);
  }

  sammelMahnungOeffnen(kundeId: number): void {
    const kunde = this.kunden().find((k) => k.id === kundeId);
    if (!kunde) return;
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const ueberfaellig = this.cachedRechnungen.filter(
      (r) =>
        (r.kunden_id === kundeId || r.empf === kunde.name) &&
        !r.bezahlt &&
        !!r.frist &&
        new Date(r.frist) < heute,
    );
    const gesamtBrutto = ueberfaellig.reduce((s, r) => s + (r.brutto ?? 0), 0);
    const reList = ueberfaellig
      .map((r) => {
        const tage = Math.ceil((heute.getTime() - new Date(r.frist!).getTime()) / MS_PER_DAY);
        return `  - Rechnung ${r.nr}: ${(r.brutto ?? 0).toFixed(2)} € (${tage} Tage überfällig)`;
      })
      .join('\n');
    const text = `Sehr geehrte Damen und Herren,\n\nwir erlauben uns, Sie freundlich an die Begleichung folgender offener Rechnungen zu erinnern:\n\n${reList}\n\nGesamtbetrag: ${gesamtBrutto.toFixed(2)} €\n\nBitte überweisen Sie den ausstehenden Betrag umgehend.\n\nMit freundlichen Grüßen\nPfalz-Baden Service GbR`;
    this.sammelMahnungText.set(text);
    this.sammelMahnungEmail.set(kunde.email ?? '');
    this.sammelMahnungBetreff.set(
      `Zahlungserinnerung — ${ueberfaellig.length} offene Rechnung(en) — ${kunde.name}`,
    );
    this.sammelMahnungSichtbar.set(true);
  }

  sammelMahnungSchliessen(): void {
    this.sammelMahnungSichtbar.set(false);
  }

  zuRechnungNavigieren(kunde: Kunde): void {
    this.router.navigate(['/rechnungen'], {
      state: {
        prefill: {
          empf: kunde.name,
          str: kunde.strasse,
          ort: kunde.ort,
          email: kunde.email,
          kunden_id: kunde.id,
        },
      },
    });
  }

  zuAngebotNavigieren(kunde: Kunde): void {
    this.router.navigate(['/angebote'], {
      state: {
        prefill: {
          empf: kunde.name,
          str: kunde.strasse,
          ort: kunde.ort,
          email: kunde.email,
          kunden_id: kunde.id,
        },
      },
    });
  }
}
