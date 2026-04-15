// ============================================================
// Rechnungen — Facade (State + Koordination)
// ============================================================

import { Injectable, inject, signal, computed } from '@angular/core';
import { DEFAULT_PAGE_SIZE } from '../../core/constants';
import { Router } from '@angular/router';
import { RechnungenService } from './rechnungen.service';
import { ToastService } from '../../core/services/toast.service';
import { Rechnung, Kunde, FirmaSettings, RechnungPosition, Mahnung, AuditLogEntry } from '../../core/models';
import {
  RechnungFilter, RechnungFormularDaten, RechnungPrefill,
  AngebotKonvertierungsDaten, WiederkehrendPrefill,
  RechnungStatistik, LEERES_RECHNUNGS_FORMULAR,
} from './rechnungen.models';

@Injectable({ providedIn: 'root' })
export class RechnungenFacade {
  private readonly service = inject(RechnungenService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly speichert = signal(false);
  readonly fehler = signal<string | null>(null);
  readonly rechnungen = signal<Rechnung[]>([]);
  readonly kunden = signal<Kunde[]>([]);
  readonly firma = signal<FirmaSettings>({});
  readonly suchbegriff = signal('');
  readonly aktiverFilter = signal<RechnungFilter>('alle');
  readonly aktiverTab = signal<'formular' | 'tracker'>('formular');
  readonly bearbeiteteRechnung = signal<Rechnung | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly bezahltKandidat = signal<Rechnung | null>(null);
  readonly bezahltDatum = signal('');
  readonly prefill = signal<RechnungPrefill | null>(null);
  readonly formularDaten = signal<RechnungFormularDaten>({ ...LEERES_RECHNUNGS_FORMULAR });

  // Mahnungen
  readonly mahnungenModalRechnung = signal<Rechnung | null>(null);
  readonly mahnungen = signal<Mahnung[]>([]);
  readonly mahnungenLaedt = signal(false);
  readonly mahnungFormular = signal({ datum: new Date().toISOString().split('T')[0], stufe: 1, betrag_gebuehr: 0, notiz: '' });

  // Send-Modal nach Speichern
  readonly sendModalRechnung = signal<Rechnung | null>(null);

  // Audit-Trail
  readonly aktivitaeten = signal<AuditLogEntry[]>([]);
  readonly aktivitaetenLaedt = signal(false);

  /** ID of a rechnung to open automatically after data loads (set via router state) */
  private readonly _openId = signal<number | null>(null);

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as {
      prefill?: RechnungPrefill;
      convertFrom?: string;
      data?: unknown;
      openId?: number;
    } | undefined;
    if (state?.prefill) {
      this.prefill.set(state.prefill);
      this.prefillAusRouterState(state.prefill);
    }
    if (state?.convertFrom === 'angebot') {
      this.prefillAusAngebot(state.data as AngebotKonvertierungsDaten);
    }
    if (state?.convertFrom === 'wiederkehrend') {
      this.prefillAusWiederkehrend(state.data as WiederkehrendPrefill);
    }
    if (state?.openId) {
      this._openId.set(state.openId);
    }
  }

  readonly gefilterteRechnungen = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    const filter = this.aktiverFilter();
    const heute = new Date(); heute.setHours(0, 0, 0, 0);

    return this.rechnungen()
      .filter(r => {
        if (filter === 'offen') return !r.bezahlt;
        if (filter === 'bezahlt') return r.bezahlt;
        if (filter === 'ueberfaellig') return !r.bezahlt && !!r.frist && new Date(r.frist) < heute;
        return true;
      })
      .filter(r => {
        if (!q) return true;
        return (
          r.nr.toLowerCase().includes(q) ||
          r.empf.toLowerCase().includes(q) ||
          (r.titel ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''));
  });

  readonly aktuelleSeite = signal(1);
  readonly PAGE_SIZE = DEFAULT_PAGE_SIZE;
  readonly gesamtSeiten = computed(() =>
    Math.max(1, Math.ceil(this.gefilterteRechnungen().length / this.PAGE_SIZE))
  );
  readonly seitenRechnungen = computed(() => {
    const start = (this.aktuelleSeite() - 1) * this.PAGE_SIZE;
    return this.gefilterteRechnungen().slice(start, start + this.PAGE_SIZE);
  });

  seiteZurueck(): void { this.aktuelleSeite.update(p => Math.max(1, p - 1)); }
  seiteVor(): void { this.aktuelleSeite.update(p => Math.min(this.gesamtSeiten(), p + 1)); }

  readonly statistik = computed<RechnungStatistik>(() => {
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    const jetztMonat = heute.getMonth();
    const jetztJahr = heute.getFullYear();
    const alle = this.rechnungen();

    return {
      offen: alle.filter(r => !r.bezahlt).reduce((s, r) => s + (r.brutto ?? 0), 0),
      bezahltMonat: alle
        .filter(r => r.bezahlt && r.bezahlt_am)
        .filter(r => {
          const d = new Date(r.bezahlt_am!);
          return d.getMonth() === jetztMonat && d.getFullYear() === jetztJahr;
        })
        .reduce((s, r) => s + (r.brutto ?? 0), 0),
      ueberfaellig: alle
        .filter(r => !r.bezahlt && !!r.frist && new Date(r.frist) < heute)
        .reduce((s, r) => s + (r.brutto ?? 0), 0),
      gesamtumsatz: alle.filter(r => r.bezahlt).reduce((s, r) => s + (r.brutto ?? 0), 0),
    };
  });

  readonly netto = computed(() =>
    this.service.nettoBerechnen(this.formularDaten().positionen, this.formularDaten().mwst_satz)
  );

  readonly brutto = computed(() =>
    this.service.bruttoBerechnen(this.formularDaten().positionen)
  );

  readonly mwstBetrag = computed(() => this.brutto() - this.netto());

  ladeDaten(): void {
    this.laedt.set(true);
    this.fehler.set(null);
    this.service.rechnungenUndKundenLaden().subscribe({
      next: ({ rechnungen, kunden }) => {
        this.rechnungen.set(rechnungen);
        this.kunden.set(kunden);
        this.laedt.set(false);
        // Auto-increment Nr if form is empty
        if (!this.formularDaten().nr) {
          this.formularDaten.update(d => ({ ...d, nr: this._naechsteRechnungsNr(rechnungen) }));
        }
        // Set today as default date if empty
        if (!this.formularDaten().datum) {
          this.formularDaten.update(d => ({ ...d, datum: new Date().toISOString().split('T')[0] }));
        }
        // Auto-open a specific rechnung when navigated from dashboard
        const openId = this._openId();
        if (openId !== null) {
          const target = rechnungen.find(r => r.id === openId);
          if (target) this.bearbeitungStarten(target);
          this._openId.set(null);
        }
        this.toast.success(`${rechnungen.length} Rechnungen geladen.`);
      },
      error: () => {
        this.fehler.set('Daten konnten nicht geladen werden.');
        this.laedt.set(false);
        this.toast.error('Daten konnten nicht geladen werden.');
      },
    });
    this.service.firmaEinstellungenLaden().subscribe({
      next: firma => this.firma.set(firma),
      error: () => {},
    });
  }

  private _naechsteRechnungsNr(rechnungen: Rechnung[]): string {
    const jahr = new Date().getFullYear();
    const nummern = rechnungen
      .filter(r => r.nr?.startsWith(`R-${jahr}-`))
      .map(r => parseInt(r.nr.split('-')[2]) || 0);
    const naechste = nummern.length ? Math.max(...nummern) + 1 : 1;
    return `R-${jahr}-${String(naechste).padStart(3, '0')}`;
  }

  speichern(): void {
    const daten = this.formularDaten();
    const fehler: string[] = [];
    if (!daten.nr?.trim()) fehler.push('Rechnungs-Nr.');
    if (!daten.empf?.trim()) fehler.push('Empfänger');
    if (fehler.length) {
      this.fehler.set(`Pflichtfelder fehlen: ${fehler.join(', ')}`);
      return;
    }
    this.fehler.set(null);
    this.speichert.set(true);
    const brutto = this.brutto();
    const frist = this._fristBerechnen(daten.datum, daten.zahlungsziel);
    const payload: Partial<Rechnung> = {
      nr: daten.nr, empf: daten.empf, str: daten.str, ort: daten.ort,
      email: daten.email, datum: daten.datum, leistungsdatum: daten.leistungsdatum,
      zahlungsziel: daten.zahlungsziel, titel: daten.titel,
      positionen: daten.positionen, mwst_satz: daten.mwst_satz,
      kunden_id: daten.kunden_id, brutto, frist,
    };

    const editId = this.bearbeiteteRechnung()?.id;
    const anfrage = editId
      ? this.service.rechnungAktualisieren(editId, payload)
      : this.service.rechnungErstellen(payload);

    anfrage.subscribe({
      next: gespeichert => {
        if (editId) {
          this.rechnungen.update(list => list.map(r => r.id === editId ? gespeichert : r));
          this.toast.success('Rechnung aktualisiert.');
        } else {
          this.rechnungen.update(list => [gespeichert, ...list]);
          this.toast.success('Rechnung gespeichert.');
        }
        this.speichert.set(false);
        this.bearbeitungAbbrechen();
        this.aktiverTab.set('tracker');
        if (gespeichert.email) {
          this.sendModalRechnung.set(gespeichert);
        }
      },
      error: () => {
        this.fehler.set('Rechnung konnte nicht gespeichert werden.');
        this.toast.error('Rechnung konnte nicht gespeichert werden.');
        this.speichert.set(false);
      },
    });
  }

  bearbeitungStarten(rechnung: Rechnung): void {
    if (rechnung.bezahlt) return;
    this.bearbeiteteRechnung.set(rechnung);
    this.formularDaten.set({
      nr: rechnung.nr, empf: rechnung.empf, str: rechnung.str ?? '',
      ort: rechnung.ort ?? '', email: rechnung.email ?? '',
      datum: rechnung.datum ?? '', leistungsdatum: rechnung.leistungsdatum ?? '',
      zahlungsziel: rechnung.zahlungsziel ?? 14, titel: rechnung.titel ?? '',
      positionen: rechnung.positionen?.length
        ? rechnung.positionen
        : [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
      mwst_satz: rechnung.mwst_satz ?? 19,
      kunden_id: rechnung.kunden_id,
    });
    this.aktiverTab.set('formular');
    if (rechnung.id) {
      this.aktivitaetenLaden(rechnung.id);
    }
  }

  private aktivitaetenLaden(rechnungId: number): void {
    this.aktivitaetenLaedt.set(true);
    this.service.auditEintraegeLaden(rechnungId).subscribe({
      next: eintraege => {
        this.aktivitaeten.set(eintraege);
        this.aktivitaetenLaedt.set(false);
      },
      error: () => this.aktivitaetenLaedt.set(false),
    });
  }

  bearbeitungAbbrechen(): void {
    this.bearbeiteteRechnung.set(null);
    const neueNr = this._naechsteRechnungsNr(this.rechnungen());
    this.formularDaten.set({
      ...LEERES_RECHNUNGS_FORMULAR,
      nr: neueNr,
      datum: new Date().toISOString().split('T')[0],
    });
    this.fehler.set(null);
  }

  loeschenBestaetigen(id: number): void {
    const r = this.rechnungen().find(x => x.id === id);
    if (r?.bezahlt) return;
    this.loeschKandidat.set(id);
  }

  loeschenAbbrechen(): void {
    this.loeschKandidat.set(null);
  }

  loeschenAusfuehren(): void {
    const id = this.loeschKandidat();
    if (id === null) return;
    this.service.rechnungLoeschen(id).subscribe({
      next: () => {
        this.rechnungen.update(list => list.filter(r => r.id !== id));
        this.loeschKandidat.set(null);
        this.toast.success('Rechnung gelöscht.');
      },
      error: () => {
        this.fehler.set('Rechnung konnte nicht gelöscht werden.');
        this.toast.error('Rechnung konnte nicht gelöscht werden.');
        this.loeschKandidat.set(null);
      },
    });
  }

  loeschenSofort(id: number): void {
    this.service.rechnungLoeschen(id).subscribe({
      next: () => this.rechnungen.update(list => list.filter(r => r.id !== id)),
      error: () => this.fehler.set(`Rechnung #${id} konnte nicht gelöscht werden.`),
    });
  }

  alsGezahltMarkierenStarten(rechnung: Rechnung): void {
    this.bezahltKandidat.set(rechnung);
    const heute = new Date();
    this.bezahltDatum.set(heute.toISOString().split('T')[0]);
  }

  alsGezahltMarkierenAbbrechen(): void {
    this.bezahltKandidat.set(null);
    this.bezahltDatum.set('');
  }

  alsGezahltMarkieren(): void {
    const r = this.bezahltKandidat();
    if (!r) return;
    const datum = this.bezahltDatum();
    this.service.rechnungAktualisieren(r.id, { bezahlt: true, bezahlt_am: datum }).subscribe({
      next: aktualisiert => {
        this.rechnungen.update(list => list.map(x => x.id === r.id ? aktualisiert : x));
        this.bezahltKandidat.set(null);
        this.bezahltDatum.set('');
        this.toast.success(`Rechnung ${r.nr} als bezahlt markiert.`);
      },
      error: () => {
        this.fehler.set('Status konnte nicht aktualisiert werden.');
        this.toast.error('Status konnte nicht aktualisiert werden.');
      },
    });
  }

  positionKopieren(index: number): void {
    const pos = this.formularDaten().positionen[index];
    if (!pos) return;
    this.formularDaten.update(d => ({
      ...d,
      positionen: [
        ...d.positionen.slice(0, index + 1),
        { ...pos },
        ...d.positionen.slice(index + 1),
      ],
    }));
  }

  vorschauGenerieren(): void {
    const daten = this.formularDaten();
    if (!daten.nr?.trim() || !daten.empf?.trim()) {
      this.fehler.set('Bitte Rechnungs-Nr. und Empfänger ausfüllen für Vorschau.');
      return;
    }
    this.fehler.set(null);
    this.speichert.set(true);
    const brutto = this.brutto();
    const frist = this._fristBerechnen(daten.datum, daten.zahlungsziel);
    const payload: Partial<Rechnung> = {
      nr: daten.nr, empf: daten.empf, str: daten.str, ort: daten.ort,
      email: daten.email, datum: daten.datum, leistungsdatum: daten.leistungsdatum,
      zahlungsziel: daten.zahlungsziel, titel: daten.titel,
      positionen: daten.positionen, mwst_satz: daten.mwst_satz,
      kunden_id: daten.kunden_id, brutto, frist,
    };
    const editId = this.bearbeiteteRechnung()?.id;
    const anfrage = editId
      ? this.service.rechnungAktualisieren(editId, payload)
      : this.service.rechnungErstellen(payload);

    anfrage.subscribe({
      next: gespeichert => {
        if (editId) {
          this.rechnungen.update(list => list.map(r => r.id === editId ? gespeichert : r));
        } else {
          this.rechnungen.update(list => [gespeichert, ...list]);
          this.bearbeiteteRechnung.set(gespeichert);
        }
        this.speichert.set(false);
        // Open PDF after save
        this.service.pdfOeffnen(gespeichert, this.firma()).catch(() => {
          this.fehler.set('PDF konnte nicht generiert werden.');
        });
      },
      error: () => {
        this.fehler.set('Rechnung konnte nicht gespeichert werden.');
        this.speichert.set(false);
      },
    });
  }

  rechnungKopieren(rechnung: Rechnung): void {
    const jahr = new Date().getFullYear();
    const nummern = this.rechnungen()
      .filter(r => r.nr?.startsWith(`R-${jahr}-`))
      .map(r => parseInt(r.nr.split('-')[2]) || 0);
    const naechste = nummern.length ? Math.max(...nummern) + 1 : 1;
    const neueNr = `R-${jahr}-${String(naechste).padStart(3, '0')}`;
    this.formularDaten.set({
      nr: neueNr,
      empf: rechnung.empf,
      str: rechnung.str ?? '',
      ort: rechnung.ort ?? '',
      email: rechnung.email ?? '',
      datum: new Date().toISOString().split('T')[0],
      leistungsdatum: rechnung.leistungsdatum ?? '',
      zahlungsziel: rechnung.zahlungsziel ?? 14,
      titel: rechnung.titel ?? '',
      positionen: rechnung.positionen?.length
        ? rechnung.positionen.map(p => ({ ...p }))
        : [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
      mwst_satz: rechnung.mwst_satz ?? 19,
      kunden_id: rechnung.kunden_id,
    });
    this.bearbeiteteRechnung.set(null);
    this.aktiverTab.set('formular');
    this.toast.info(`Rechnung ${rechnung.nr} als Vorlage kopiert.`);
  }

  pdfGenerieren(rechnung: Rechnung): void {
    this.service.pdfOeffnen(rechnung, this.firma()).catch(() => {
      this.fehler.set('PDF konnte nicht generiert werden.');
      this.toast.error('PDF konnte nicht generiert werden.');
    });
  }

  positionHinzufuegen(): void {
    this.formularDaten.update(d => ({
      ...d,
      positionen: [...d.positionen, { bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
    }));
  }

  positionEntfernen(index: number): void {
    this.formularDaten.update(d => ({
      ...d,
      positionen: d.positionen.filter((_, i) => i !== index),
    }));
  }

  positionAktualisieren(index: number, position: RechnungPosition): void {
    this.formularDaten.update(d => {
      const positionen = [...d.positionen];
      positionen[index] = position;
      return { ...d, positionen };
    });
  }

  formularFeldAktualisieren<K extends keyof RechnungFormularDaten>(
    feld: K, wert: RechnungFormularDaten[K]
  ): void {
    this.formularDaten.update(d => ({ ...d, [feld]: wert }));
  }

  kundeAuswaehlen(kundeId: number): void {
    const kunde = this.kunden().find(k => k.id === kundeId);
    if (!kunde) return;
    this.formularDaten.update(d => ({
      ...d,
      empf: kunde.name,
      str: kunde.strasse ?? '',
      ort: [(kunde as { plz?: string }).plz, kunde.ort].filter(Boolean).join(' '),
      email: kunde.email ?? '',
      kunden_id: kunde.id,
    }));
  }

  tabWechseln(tab: 'formular' | 'tracker'): void {
    this.aktiverTab.set(tab);
  }

  filterSetzen(filter: RechnungFilter): void {
    this.aktiverFilter.set(filter);
    this.aktuelleSeite.set(1);
  }

  private prefillAusRouterState(prefill: RechnungPrefill): void {
    this.formularDaten.update(d => ({
      ...d,
      empf: prefill.empf ?? d.empf,
      str: prefill.str ?? d.str,
      ort: prefill.ort ?? d.ort,
      email: prefill.email ?? d.email,
      kunden_id: prefill.kunden_id ?? d.kunden_id,
    }));
  }

  private prefillAusAngebot(daten: AngebotKonvertierungsDaten): void {
    if (!daten) return;
    this.formularDaten.update(d => ({
      ...d,
      empf: daten.empf ?? d.empf,
      str: daten.str ?? d.str,
      ort: daten.ort ?? d.ort,
      titel: daten.titel ?? d.titel,
      positionen: daten.positionen?.length ? daten.positionen : d.positionen,
      kunden_id: daten.kunden_id ?? d.kunden_id,
    }));
  }

  private prefillAusWiederkehrend(daten: WiederkehrendPrefill): void {
    if (!daten) return;
    this.formularDaten.update(d => ({
      ...d,
      empf: daten.empf ?? d.empf,
      str: daten.str ?? d.str,
      ort: daten.ort ?? d.ort,
      email: daten.email ?? d.email,
      titel: daten.titel ?? d.titel,
      positionen: daten.positionen?.length ? daten.positionen : d.positionen,
      kunden_id: daten.kunden_id ?? d.kunden_id,
    }));
  }

  // ── Mahnungen ─────────────────────────────────────────────────────────────

  mahnungenOeffnen(rechnung: Rechnung): void {
    this.mahnungenModalRechnung.set(rechnung);
    this.mahnungenLaedt.set(true);
    this.service.mahnungenLaden(rechnung.id).subscribe({
      next: m => { this.mahnungen.set(m); this.mahnungenLaedt.set(false); },
      error: () => { this.mahnungenLaedt.set(false); },
    });
    this.mahnungFormular.set({ datum: new Date().toISOString().split('T')[0], stufe: 1, betrag_gebuehr: 0, notiz: '' });
  }

  mahnungenSchliessen(): void {
    this.mahnungenModalRechnung.set(null);
    this.mahnungen.set([]);
  }

  mahnungHinzufuegen(): void {
    const r = this.mahnungenModalRechnung();
    if (!r) return;
    const d = this.mahnungFormular();
    this.service.mahnungErstellen({ rechnung_id: r.id, datum: d.datum, stufe: d.stufe, betrag_gebuehr: d.betrag_gebuehr, notiz: d.notiz || undefined }).subscribe({
      next: m => {
        this.mahnungen.update(list => [...list, m]);
        this.mahnungFormular.set({ datum: new Date().toISOString().split('T')[0], stufe: this.mahnungen().length + 1, betrag_gebuehr: 0, notiz: '' });
        this.toast.success(`${d.stufe}. Mahnung erstellt.`);
      },
      error: () => {
        this.fehler.set('Mahnung konnte nicht erstellt werden.');
        this.toast.error('Mahnung konnte nicht erstellt werden.');
      },
    });
  }

  mahnungLoeschen(id: number): void {
    this.service.mahnungLoeschen(id).subscribe({
      next: () => {
        this.mahnungen.update(list => list.filter(m => m.id !== id));
        this.toast.success('Mahnung gelöscht.');
      },
      error: () => {
        this.fehler.set('Mahnung konnte nicht gelöscht werden.');
        this.toast.error('Mahnung konnte nicht gelöscht werden.');
      },
    });
  }

  mahnungFormularFeld(feld: string, wert: unknown): void {
    this.mahnungFormular.update(d => ({ ...d, [feld]: wert }));
  }

  // ── Send-Modal ─────────────────────────────────────────────────────────────

  readonly formularGeaendert = computed(() => {
    const d = this.formularDaten();
    return !!(d.empf?.trim() || d.titel?.trim() || d.positionen.some(p => p.bez?.trim()));
  });

  readonly sendBetreff = computed(() => {
    const r = this.sendModalRechnung();
    if (!r) return '';
    return encodeURIComponent(`Rechnung ${r.nr}`);
  });

  readonly sendText = computed(() => {
    const r = this.sendModalRechnung();
    const f = this.firma();
    if (!r) return '';
    return `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unsere Rechnung ${r.nr} vom ${r.datum ?? ''} über ${r.brutto?.toFixed(2) ?? '0.00'} EUR.\n\nBitte überweisen Sie den Betrag bis zum ${r.frist ?? ''} auf unser Konto.\n\nMit freundlichen Grüßen\n ${f.firma ?? ''}`;
  });

  sendModalSchliessen(): void {
    this.sendModalRechnung.set(null);
  }

  private _fristBerechnen(datum: string, tage: number): string {
    if (!datum) return '';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(datum)
      ? (() => { const [y, m, day] = datum.split('-').map(Number); return new Date(y, m - 1, day); })()
      : new Date(datum);
    d.setDate(d.getDate() + tage);
    return d.toISOString().split('T')[0];
  }
}
