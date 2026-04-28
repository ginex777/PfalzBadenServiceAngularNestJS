import { Injectable, inject, signal, computed } from '@angular/core';
import { MitarbeiterService } from './mitarbeiter.service';
import { ToastService } from '../../core/services/toast.service';
import { Mitarbeiter, MitarbeiterStunden } from '../../core/models';
import {
  MitarbeiterFormularDaten,
  StundenFormularDaten,
  StundenStatistik,
  LEERES_STUNDEN_FORMULAR,
} from './mitarbeiter.models';

interface Stempel {
  id: number;
  mitarbeiter_id: number;
  start: string;
  stop?: string | null;
  dauer_minuten?: number | null;
  notiz?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class MitarbeiterFacade {
  private readonly service = inject(MitarbeiterService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly mitarbeiter = signal<Mitarbeiter[]>([]);
  readonly aktiverMitarbeiter = signal<Mitarbeiter | null>(null);
  readonly stunden = signal<MitarbeiterStunden[]>([]);
  readonly stundenLaedt = signal(false);
  readonly stempelEintraege = signal<Stempel[]>([]);
  readonly stempelLaedt = signal(false);
  readonly bearbeiteterMitarbeiter = signal<Mitarbeiter | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly loeschStundenKandidat = signal<number | null>(null);
  readonly formularSichtbar = signal(false);
  readonly stundenFormular = signal<StundenFormularDaten>({ ...LEERES_STUNDEN_FORMULAR });

  readonly statistik = computed<StundenStatistik>(() => {
    const alle = this.stunden();
    const grundlohn = alle.reduce((s, r) => s + r.lohn, 0);
    const zuschlaege = alle.reduce((s, r) => s + (r.zuschlag ?? 0), 0);
    const gesamtLohn = grundlohn + zuschlaege;
    const bezahlt = alle
      .filter((r) => r.bezahlt)
      .reduce((s, r) => s + r.lohn + (r.zuschlag ?? 0), 0);
    return {
      gesamtStunden: alle.reduce((s, r) => s + r.stunden, 0),
      grundlohn,
      zuschlaege,
      gesamtLohn,
      bezahlt,
      offen: gesamtLohn - bezahlt,
    };
  });

  readonly lohnVorschau = computed(() => {
    const f = this.stundenFormular();
    const ma = this.aktiverMitarbeiter();
    const rate = f.lohnSatz || (ma?.stundenlohn ?? 0);
    const grundlohn = Math.round(f.stunden * rate * 100) / 100;
    const zuschlag = Math.round(((grundlohn * f.zuschlagProzent) / 100) * 100) / 100;
    return { grundlohn, zuschlag, gesamt: grundlohn + zuschlag };
  });

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.alleLaden().subscribe({
      next: (ma) => {
        this.mitarbeiter.set(ma);
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Mitarbeiter konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
  }

  formularOeffnen(ma?: Mitarbeiter): void {
    this.bearbeiteterMitarbeiter.set(ma ?? null);
    this.formularSichtbar.set(true);
  }

  formularSchliessen(): void {
    this.formularSichtbar.set(false);
    this.bearbeiteterMitarbeiter.set(null);
  }

  speichern(daten: MitarbeiterFormularDaten): void {
    if (!daten.name) {
      this.toast.error('Bitte Name eingeben.');
      return;
    }
    const editId = this.bearbeiteterMitarbeiter()?.id;
    const anfrage = editId
      ? this.service.aktualisieren(editId, daten)
      : this.service.erstellen(daten);
    anfrage.subscribe({
      next: (gespeichert) => {
        if (editId)
          this.mitarbeiter.update((list) => list.map((m) => (m.id === editId ? gespeichert : m)));
        else this.mitarbeiter.update((list) => [...list, gespeichert]);
        this.formularSchliessen();
      },
      error: () => this.toast.error('Mitarbeiter konnte nicht gespeichert werden.'),
    });
  }

  aktivToggle(id: number, aktiv: boolean): void {
    const ma = this.mitarbeiter().find((m) => m.id === id);
    if (!ma) return;
    this.service.aktualisieren(id, { ...ma, aktiv }).subscribe({
      next: (aktualisiert) =>
        this.mitarbeiter.update((list) => list.map((m) => (m.id === id ? aktualisiert : m))),
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
    this.service.loeschen(id).subscribe({
      next: () => {
        this.mitarbeiter.update((list) => list.filter((m) => m.id !== id));
        if (this.aktiverMitarbeiter()?.id === id) this.stundenSchliessen();
        this.loeschKandidat.set(null);
      },
      error: () => {
        this.toast.error('Mitarbeiter konnte nicht gelöscht werden.');
        this.loeschKandidat.set(null);
      },
    });
  }

  stundenOeffnen(id: number): void {
    const ma = this.mitarbeiter().find((m) => m.id === id);
    if (!ma) return;
    this.aktiverMitarbeiter.set(ma);
    this.stundenLaedt.set(true);
    this.stempelLaedt.set(true);
    this.stundenFormular.set({
      ...LEERES_STUNDEN_FORMULAR,
      datum: new Date().toISOString().slice(0, 10),
    });

    this.service.stundenLaden(id).subscribe({
      next: (s) => {
        this.stunden.set(s);
        this.stundenLaedt.set(false);
      },
      error: () => {
        this.stunden.set([]);
        this.stundenLaedt.set(false);
      },
    });

    this.service.loadTimeTracking(id).subscribe({
      next: (s) => {
        this.stempelEintraege.set(s);
        this.stempelLaedt.set(false);
      },
      error: () => {
        this.stempelEintraege.set([]);
        this.stempelLaedt.set(false);
      },
    });
  }

  stundenSchliessen(): void {
    this.aktiverMitarbeiter.set(null);
    this.stunden.set([]);
    this.stempelEintraege.set([]);
  }

  stundenEintragen(): void {
    const ma = this.aktiverMitarbeiter();
    if (!ma) return;
    const f = this.stundenFormular();
    if (!f.datum || !f.stunden) {
      this.toast.error('Datum und Stunden sind Pflichtfelder.');
      return;
    }
    const rate = f.lohnSatz || ma.stundenlohn;
    const grundlohn = Math.round(f.stunden * rate * 100) / 100;
    const zuschlag = Math.round(((grundlohn * f.zuschlagProzent) / 100) * 100) / 100;
    const payload: Partial<MitarbeiterStunden> = {
      datum: f.datum,
      stunden: f.stunden,
      beschreibung: f.beschreibung,
      ort: f.ort,
      lohn: grundlohn,
      zuschlag,
      zuschlag_typ: f.zuschlagProzent ? `${f.zuschlagProzent}%` : '',
      bezahlt: false,
    };
    this.service.stundenErstellen(ma.id, payload).subscribe({
      next: (s) => {
        this.stunden.update((list) => [s, ...list]);
        this.stundenFormular.set({ ...LEERES_STUNDEN_FORMULAR, datum: f.datum });
      },
      error: () => this.toast.error('Stunden konnten nicht eingetragen werden.'),
    });
  }

  bezahltToggle(id: number, bezahlt: boolean): void {
    const s = this.stunden().find((x) => x.id === id);
    if (!s) return;
    this.service.stundenAktualisieren(id, { ...s, bezahlt }).subscribe({
      next: (aktualisiert) =>
        this.stunden.update((list) => list.map((x) => (x.id === id ? aktualisiert : x))),
    });
  }

  stundenLoeschenBestaetigen(id: number): void {
    this.loeschStundenKandidat.set(id);
  }
  stundenLoeschenAbbrechen(): void {
    this.loeschStundenKandidat.set(null);
  }

  stundenLoeschenAusfuehren(): void {
    const id = this.loeschStundenKandidat();
    if (id === null) return;
    this.service.stundenLoeschen(id).subscribe({
      next: () => {
        this.stunden.update((list) => list.filter((s) => s.id !== id));
        this.loeschStundenKandidat.set(null);
      },
      error: () => {
        this.toast.error('Stunden konnten nicht gelöscht werden.');
        this.loeschStundenKandidat.set(null);
      },
    });
  }

  stundenFormularFeldAktualisieren<K extends keyof StundenFormularDaten>(
    feld: K,
    wert: StundenFormularDaten[K],
  ): void {
    this.stundenFormular.update((d) => ({ ...d, [feld]: wert }));
  }

  // ── PDF Stundenabrechnung ─────────────────────────────────────────────────
  abrechnungPdfGenerieren(): void {
    const ma = this.aktiverMitarbeiter();
    if (!ma) {
      this.toast.error('Kein Mitarbeiter ausgewählt.');
      return;
    }
    if (!this.stunden().length) {
      this.toast.error('Keine Stunden vorhanden.');
      return;
    }
    this.service
      .abrechnungPdfOeffnen(ma.id)
      .catch(() => this.toast.error('PDF konnte nicht erstellt werden.'));
  }

  // ── Mobile Stempeluhr Integration ─────────────────────────────────────────
  clockIn(notiz?: string): void {
    const ma = this.aktiverMitarbeiter();
    if (!ma) {
      this.toast.error('Kein Mitarbeiter ausgewählt.');
      return;
    }

    this.service.clockIn(ma.id, notiz).subscribe({
      next: (stempel) => {
        this.stempelEintraege.update((list) => [stempel, ...list]);
      },
      error: () => this.toast.error('Stempel konnte nicht gestartet werden.'),
    });
  }

  clockOut(): void {
    const ma = this.aktiverMitarbeiter();
    if (!ma) {
      this.toast.error('Kein Mitarbeiter ausgewählt.');
      return;
    }

    this.service.clockOut(ma.id).subscribe({
      next: (stempel) => {
        this.stempelEintraege.update((list) =>
          list.map((s) => (s.id === stempel.id ? stempel : s)),
        );
      },
      error: () => this.toast.error('Stempel konnte nicht gestoppt werden.'),
    });
  }

  readonly aktuellerStempel = computed(() => {
    return this.stempelEintraege().find((s) => !s.stop);
  });

  readonly stempelStatistik = computed(() => {
    const eintraege = this.stempelEintraege();
    const heute = new Date().toISOString().slice(0, 10);
    const heuteEintraege = eintraege.filter((s) => s.start.slice(0, 10) === heute);
    const heuteMinuten = heuteEintraege.reduce((sum, s) => sum + (s.dauer_minuten || 0), 0);

    return {
      heuteStunden: Math.round((heuteMinuten / 60) * 100) / 100,
      heuteEintraege: heuteEintraege.length,
      offenerStempel: eintraege.find((s) => !s.stop),
    };
  });
}
