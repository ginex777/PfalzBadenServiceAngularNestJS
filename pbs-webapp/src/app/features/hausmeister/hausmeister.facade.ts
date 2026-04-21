import { Injectable, inject, signal, computed } from '@angular/core';
import { HausmeisterService } from './hausmeister.service';
import { ToastService } from '../../core/services/toast.service';
import { HausmeisterEinsatz, Mitarbeiter, Kunde, Taetigkeit } from '../../core/models';
import {
  HausmeisterFormularDaten,
  HausmeisterFilter,
  LEERES_EINSATZ_FORMULAR,
} from './hausmeister.models';

@Injectable({ providedIn: 'root' })
export class HausmeisterFacade {
  private readonly service = inject(HausmeisterService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly einsaetze = signal<HausmeisterEinsatz[]>([]);
  readonly mitarbeiter = signal<Mitarbeiter[]>([]);
  readonly kunden = signal<Kunde[]>([]);
  readonly suchbegriff = signal('');
  readonly aktiverFilter = signal<HausmeisterFilter>('alle');
  readonly filterMitarbeiter = signal('');
  readonly filterMonat = signal('');
  readonly bearbeiteterEinsatz = signal<HausmeisterEinsatz | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly formularSichtbar = signal(false);
  readonly formularDaten = signal<HausmeisterFormularDaten>({ ...LEERES_EINSATZ_FORMULAR });

  readonly gefilterteEinsaetze = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    const maFilter = this.filterMitarbeiter();
    const moFilter = this.filterMonat();
    return this.einsaetze()
      .filter((e) => !maFilter || e.mitarbeiter_name === maFilter)
      .filter((e) => !moFilter || e.datum.startsWith(moFilter))
      .filter((e) => !q || JSON.stringify(e).toLowerCase().includes(q))
      .sort((a, b) => b.datum.localeCompare(a.datum));
  });

  readonly statistik = computed(() => {
    const heute = new Date();
    const dieserMonat = heute.toISOString().slice(0, 7);
    const monat = this.einsaetze().filter((e) => e.datum.startsWith(dieserMonat));
    return {
      gesamt: this.einsaetze().length,
      monat: monat.length,
      stundenMonat: monat.reduce((s, e) => s + e.stunden_gesamt, 0),
    };
  });

  readonly eindeutigeMitarbeiter = computed(() =>
    [...new Set(this.einsaetze().map((e) => e.mitarbeiter_name))].sort(),
  );

  readonly eindeutigeMonate = computed(() =>
    [...new Set(this.einsaetze().map((e) => e.datum.slice(0, 7)))].sort().reverse(),
  );

  readonly stundenGesamt = computed(() =>
    this.formularDaten().taetigkeiten.reduce((s, t) => s + (t.stunden || 0), 0),
  );

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.allesDatenLaden().subscribe({
      next: ({ einsaetze, mitarbeiter, kunden }) => {
        this.einsaetze.set(einsaetze);
        this.mitarbeiter.set(mitarbeiter.filter((m) => m.aktiv));
        this.kunden.set(kunden);
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Daten konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
  }

  formularOeffnen(einsatz?: HausmeisterEinsatz): void {
    this.bearbeiteterEinsatz.set(einsatz ?? null);
    this.formularDaten.set(
      einsatz
        ? {
            mitarbeiter_id: einsatz.mitarbeiter_id ?? null,
            mitarbeiter_name: einsatz.mitarbeiter_name,
            kunden_id: einsatz.kunden_id ?? null,
            kunden_name: einsatz.kunden_name ?? '',
            datum: einsatz.datum,
            taetigkeiten: einsatz.taetigkeiten?.length
              ? [...einsatz.taetigkeiten]
              : [{ beschreibung: '', stunden: 0 }],
            notiz: einsatz.notiz ?? '',
          }
        : {
            ...LEERES_EINSATZ_FORMULAR,
            datum: new Date().toISOString().slice(0, 10),
            taetigkeiten: [{ beschreibung: '', stunden: 0 }],
          },
    );
    this.formularSichtbar.set(true);
  }

  formularSchliessen(): void {
    this.formularSichtbar.set(false);
    this.bearbeiteterEinsatz.set(null);
  }

  speichern(withPdf = true, syncStunden = false): void {
    const daten = this.formularDaten();
    if (!daten.mitarbeiter_name || !daten.datum) {
      this.toast.error('Mitarbeiter und Datum sind Pflichtfelder.');
      return;
    }
    const taetigkeiten = daten.taetigkeiten.filter((t) => t.beschreibung || t.stunden > 0);
    if (!taetigkeiten.length) {
      this.toast.error('Bitte mindestens eine Tätigkeit eintragen.');
      return;
    }
    const stunden_gesamt = taetigkeiten.reduce((s, t) => s + t.stunden, 0);
    const payload: Partial<HausmeisterEinsatz> = {
      ...daten,
      mitarbeiter_id: daten.mitarbeiter_id ?? undefined,
      kunden_id: daten.kunden_id ?? undefined,
      taetigkeiten,
      stunden_gesamt,
      abgeschlossen: false,
    };
    const editId = this.bearbeiteterEinsatz()?.id;
    const anfrage = editId
      ? this.service.einsatzAktualisieren(editId, payload)
      : this.service.einsatzErstellen(payload);
    anfrage.subscribe({
      next: (gespeichert) => {
        if (editId)
          this.einsaetze.update((list) => list.map((e) => (e.id === editId ? gespeichert : e)));
        else this.einsaetze.update((list) => [gespeichert, ...list]);

        if (syncStunden && daten.mitarbeiter_id) {
          const beschreibung = taetigkeiten
            .map((t) => t.beschreibung)
            .filter(Boolean)
            .join(', ');
          this.service
            .mitarbeiterStundenEintragen(daten.mitarbeiter_id, {
              datum: daten.datum,
              stunden: stunden_gesamt,
              beschreibung,
              ort: daten.kunden_name || '',
            })
            .subscribe({
              error: () => this.toast.error('Stunden konnten nicht synchronisiert werden.'),
            });
        }

        if (withPdf) {
          this.service
            .einsatzPdfOeffnen(gespeichert.id)
            .catch(() => this.toast.error('PDF konnte nicht erstellt werden.'));
        }

        this.formularSchliessen();
      },
      error: () => this.toast.error('Einsatz konnte nicht gespeichert werden.'),
    });
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
    this.service.einsatzLoeschen(id).subscribe({
      next: () => {
        this.einsaetze.update((list) => list.filter((e) => e.id !== id));
        this.loeschKandidat.set(null);
      },
      error: () => {
        this.toast.error('Einsatz konnte nicht gelöscht werden.');
        this.loeschKandidat.set(null);
      },
    });
  }

  mitarbeiterAuswaehlen(id: string): void {
    const ma = this.mitarbeiter().find((m) => m.id === parseInt(id));
    this.formularDaten.update((d) => ({
      ...d,
      mitarbeiter_id: ma?.id ?? null,
      mitarbeiter_name: ma?.name ?? '',
    }));
  }

  kundeAuswaehlen(id: string): void {
    const k = this.kunden().find((k) => k.id === parseInt(id));
    this.formularDaten.update((d) => ({
      ...d,
      kunden_id: k?.id ?? null,
      kunden_name: k?.name ?? '',
    }));
  }

  taetigkeitHinzufuegen(): void {
    this.formularDaten.update((d) => ({
      ...d,
      taetigkeiten: [...d.taetigkeiten, { beschreibung: '', stunden: 0 }],
    }));
  }

  taetigkeitEntfernen(index: number): void {
    this.formularDaten.update((d) => ({
      ...d,
      taetigkeiten: d.taetigkeiten.filter((_, i) => i !== index),
    }));
  }

  taetigkeitAktualisieren(index: number, taetigkeit: Taetigkeit): void {
    this.formularDaten.update((d) => {
      const taetigkeiten = [...d.taetigkeiten];
      taetigkeiten[index] = taetigkeit;
      return { ...d, taetigkeiten };
    });
  }

  formularFeldAktualisieren(feld: 'datum' | 'notiz', wert: string): void {
    this.formularDaten.update((d) => ({ ...d, [feld]: wert }));
  }

  filterSetzen(filter: HausmeisterFilter): void {
    this.aktiverFilter.set(filter);
  }
  suchbegriffAktualisieren(q: string): void {
    this.suchbegriff.set(q);
  }
  mitarbeiterFilterSetzen(ma: string): void {
    this.filterMitarbeiter.set(ma);
  }
  monatFilterSetzen(monat: string): void {
    this.filterMonat.set(monat);
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  einsatzPdfGenerieren(einsatz: HausmeisterEinsatz): void {
    this.service
      .einsatzPdfOeffnen(einsatz.id)
      .catch(() => this.toast.error('PDF konnte nicht erstellt werden.'));
  }

  monatsnachweisPdfGenerieren(): void {
    const monat = this.filterMonat();
    if (!monat) {
      this.toast.error('Bitte zuerst einen Monat filtern.');
      return;
    }
    const ma = this.filterMitarbeiter() || undefined;
    this.service
      .monatsnachweisPdfOeffnen(monat, ma)
      .catch(() => this.toast.error('PDF konnte nicht erstellt werden.'));
  }
}
