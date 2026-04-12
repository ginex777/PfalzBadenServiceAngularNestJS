// ============================================================
// Angebote — Facade (State + Koordination)
// ============================================================

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AngeboteService } from './angebote.service';
import { ToastService } from '../../core/services/toast.service';
import { Angebot, Kunde, FirmaSettings, RechnungPosition } from '../../core/models';
import {
  AngebotFilter, AngebotFormularDaten, AngebotPrefill,
  LEERES_ANGEBOTS_FORMULAR,
} from './angebote.models';

@Injectable({ providedIn: 'root' })
export class AngeboteFacade {
  private readonly service = inject(AngeboteService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly speichert = signal(false);
  readonly fehler = signal<string | null>(null);
  readonly angebote = signal<Angebot[]>([]);
  readonly kunden = signal<Kunde[]>([]);
  readonly firma = signal<FirmaSettings>({});
  readonly suchbegriff = signal('');
  readonly aktiverFilter = signal<AngebotFilter>('alle');
  readonly aktiverTab = signal<'formular' | 'tracker'>('formular');
  readonly bearbeitetesAngebot = signal<Angebot | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly formularDaten = signal<AngebotFormularDaten>({ ...LEERES_ANGEBOTS_FORMULAR });

  // Send-Modal nach Speichern
  readonly sendModal = signal<{ angebot: Angebot; email: string } | null>(null);

  private readonly _openId = signal<number | null>(null);

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as {
      prefill?: AngebotPrefill;
      openId?: number;
    } | undefined;
    if (state?.prefill) {
      this.prefillAusRouterState(state.prefill);
    }
    if (state?.openId) {
      this._openId.set(state.openId);
    }
  }

  readonly gefilterteAngebote = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    const filter = this.aktiverFilter();
    const heute = new Date(); heute.setHours(0, 0, 0, 0);

    return this.angebote()
      .filter(a => {
        if (filter === 'offen') return !a.angenommen && !a.abgelehnt;
        if (filter === 'angenommen') return a.angenommen;
        if (filter === 'abgelehnt') return a.abgelehnt;
        if (filter === 'gesendet') return a.gesendet;
        return true;
      })
      .filter(a => {
        if (!q) return true;
        return (
          a.nr.toLowerCase().includes(q) ||
          a.empf.toLowerCase().includes(q) ||
          (a.titel ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''));
  });

  readonly aktuelleSeite = signal(1);
  readonly PAGE_SIZE = 25;
  readonly gesamtSeiten = computed(() =>
    Math.max(1, Math.ceil(this.gefilterteAngebote().length / this.PAGE_SIZE))
  );
  readonly seitenAngebote = computed(() => {
    const start = (this.aktuelleSeite() - 1) * this.PAGE_SIZE;
    return this.gefilterteAngebote().slice(start, start + this.PAGE_SIZE);
  });

  seiteZurueck(): void { this.aktuelleSeite.update(p => Math.max(1, p - 1)); }
  seiteVor(): void { this.aktuelleSeite.update(p => Math.min(this.gesamtSeiten(), p + 1)); }

  readonly netto = computed(() =>
    this.service.nettoBerechnen(this.formularDaten().positionen)
  );

  readonly brutto = computed(() =>
    this.service.bruttoBerechnen(this.formularDaten().positionen)
  );

  readonly mwstBetrag = computed(() => this.brutto() - this.netto());

  ladeDaten(): void {
    this.laedt.set(true);
    this.fehler.set(null);
    this.service.angeboteUndKundenLaden().subscribe({
      next: ({ angebote, kunden }) => {
        this.angebote.set(angebote);
        this.kunden.set(kunden);
        this.laedt.set(false);
        if (!this.formularDaten().nr) {
          this.formularDaten.update(d => ({
            ...d,
            nr: this._naechsteAngebotNr(angebote),
            datum: d.datum || new Date().toISOString().split('T')[0],
          }));
        }
        // Auto-open a specific angebot when navigated from dashboard
        const openId = this._openId();
        if (openId !== null) {
          const target = angebote.find(a => a.id === openId);
          if (target) this.bearbeitungStarten(target);
          this._openId.set(null);
        }
      },
      error: () => { this.fehler.set('Daten konnten nicht geladen werden.'); this.laedt.set(false); },
    });
    this.service.firmaEinstellungenLaden().subscribe({ next: f => this.firma.set(f), error: () => {} });
  }

  private _naechsteAngebotNr(angebote: Angebot[]): string {
    const jahr = new Date().getFullYear();
    const nummern = angebote
      .filter(a => a.nr?.startsWith(`${jahr}-`))
      .map(a => parseInt(a.nr.split('-')[1]) || 0);
    const naechste = nummern.length ? Math.max(...nummern) + 1 : 1;
    return `${jahr}-${String(naechste).padStart(3, '0')}`;
  }

  speichern(): void {
    const daten = this.formularDaten();
    if (!daten.empf || !daten.nr) {
      this.fehler.set('Bitte Angebots-Nr. und Empfänger ausfüllen.');
      return;
    }
    this.speichert.set(true);
    const brutto = this.brutto();
    const emailSnapshot = daten.email ?? '';
    const payload: Partial<Angebot> = {
      nr: daten.nr, empf: daten.empf, str: daten.str, ort: daten.ort,
      datum: daten.datum, gueltig_bis: daten.gueltig_bis, titel: daten.titel,
      positionen: daten.positionen, zusatz: daten.zusatz,
      kunden_id: daten.kunden_id, brutto,
      angenommen: false, abgelehnt: false, gesendet: false,
    };

    const editId = this.bearbeitetesAngebot()?.id;
    const anfrage = editId
      ? this.service.angebotAktualisieren(editId, payload)
      : this.service.angebotErstellen(payload);

    anfrage.subscribe({
      next: gespeichert => {
        if (editId) {
          this.angebote.update(list => list.map(a => a.id === editId ? gespeichert : a));
          this.toast.success('Angebot aktualisiert.');
        } else {
          this.angebote.update(list => [gespeichert, ...list]);
          this.toast.success('Angebot gespeichert.');
        }
        this.speichert.set(false);
        this.bearbeitungAbbrechen();
        this.aktiverTab.set('tracker');
        if (emailSnapshot) {
          this.sendModal.set({ angebot: gespeichert, email: emailSnapshot });
        }
      },
      error: () => {
        this.fehler.set('Angebot konnte nicht gespeichert werden.');
        this.toast.error('Angebot konnte nicht gespeichert werden.');
        this.speichert.set(false);
      },
    });
  }

  sendModalSchliessen(): void {
    this.sendModal.set(null);
  }

  bearbeitungStarten(angebot: Angebot): void {
    this.bearbeitetesAngebot.set(angebot);
    this.formularDaten.set({
      nr: angebot.nr, empf: angebot.empf, str: angebot.str ?? '',
      ort: angebot.ort ?? '', email: '',
      datum: angebot.datum ?? '', gueltig_bis: angebot.gueltig_bis ?? '',
      titel: angebot.titel ?? '',
      positionen: angebot.positionen?.length
        ? angebot.positionen
        : [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
      zusatz: angebot.zusatz ?? '',
      kunden_id: angebot.kunden_id,
    });
    this.aktiverTab.set('formular');
  }

  bearbeitungAbbrechen(): void {
    this.bearbeitetesAngebot.set(null);
    this.formularDaten.set({
      ...LEERES_ANGEBOTS_FORMULAR,
      nr: this._naechsteAngebotNr(this.angebote()),
      datum: new Date().toISOString().split('T')[0],
    });
    this.fehler.set(null);
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
    this.service.angebotLoeschen(id).subscribe({
      next: () => {
        this.angebote.update(list => list.filter(a => a.id !== id));
        this.loeschKandidat.set(null);
        this.toast.success('Angebot gelöscht.');
      },
      error: () => {
        this.fehler.set('Angebot konnte nicht gelöscht werden.');
        this.toast.error('Angebot konnte nicht gelöscht werden.');
        this.loeschKandidat.set(null);
      },
    });
  }

  statusSetzen(id: number, status: 'angenommen' | 'abgelehnt' | 'gesendet'): void {
    const angebot = this.angebote().find(a => a.id === id);
    if (!angebot) return;

    const update: Partial<Angebot> = {
      angenommen: status === 'angenommen',
      abgelehnt: status === 'abgelehnt',
      gesendet: status === 'gesendet' ? true : angebot.gesendet,
    };

    this.service.angebotAktualisieren(id, update).subscribe({
      next: aktualisiert => {
        this.angebote.update(list => list.map(a => a.id === id ? aktualisiert : a));
      },
      error: () => {
        this.fehler.set('Status konnte nicht aktualisiert werden.');
      },
    });
  }

  pdfGenerieren(angebot: Angebot): void {
    this.service.pdfOeffnen(angebot, this.firma()).catch(() => {
      this.fehler.set('PDF konnte nicht generiert werden.');
    });
  }

  vorschauGenerieren(): void {
    const daten = this.formularDaten();
    if (!daten.nr?.trim() || !daten.empf?.trim()) {
      this.fehler.set('Bitte Angebots-Nr. und Empfänger ausfüllen für Vorschau.');
      return;
    }
    this.fehler.set(null);
    this.speichert.set(true);
    const brutto = this.brutto();
    const payload: Partial<Angebot> = {
      nr: daten.nr, empf: daten.empf, str: daten.str, ort: daten.ort,
      datum: daten.datum, gueltig_bis: daten.gueltig_bis, titel: daten.titel,
      positionen: daten.positionen, zusatz: daten.zusatz,
      kunden_id: daten.kunden_id, brutto,
      angenommen: false, abgelehnt: false, gesendet: false,
    };
    const editId = this.bearbeitetesAngebot()?.id;
    const anfrage = editId
      ? this.service.angebotAktualisieren(editId, payload)
      : this.service.angebotErstellen(payload);
    anfrage.subscribe({
      next: gespeichert => {
        if (editId) this.angebote.update(list => list.map(a => a.id === editId ? gespeichert : a));
        else { this.angebote.update(list => [gespeichert, ...list]); this.bearbeitetesAngebot.set(gespeichert); }
        this.speichert.set(false);
        this.service.pdfOeffnen(gespeichert, this.firma()).catch(() => this.fehler.set('PDF konnte nicht generiert werden.'));
      },
      error: () => { this.fehler.set('Angebot konnte nicht gespeichert werden.'); this.speichert.set(false); },
    });
  }

  angebotKopieren(angebot: Angebot): void {
    const neueNr = this._naechsteAngebotNr(this.angebote());
    this.formularDaten.set({
      nr: neueNr,
      empf: angebot.empf, str: angebot.str ?? '', ort: angebot.ort ?? '', email: '',
      datum: new Date().toISOString().split('T')[0],
      gueltig_bis: '', titel: angebot.titel ?? '',
      positionen: angebot.positionen?.length ? angebot.positionen.map(p => ({ ...p })) : [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
      zusatz: angebot.zusatz ?? '', kunden_id: angebot.kunden_id,
    });
    this.bearbeitetesAngebot.set(null);
    this.aktiverTab.set('formular');
  }

  empfaengerAlsKundeSpeichern(): void {
    const daten = this.formularDaten();
    if (!daten.empf?.trim()) { this.fehler.set('Bitte Empfänger eingeben.'); return; }
    this.service.kundeErstellen({ name: daten.empf, strasse: daten.str, ort: daten.ort, email: daten.email }).subscribe({
      next: kunde => {
        this.kunden.update(list => [...list, kunde]);
        this.formularDaten.update(d => ({ ...d, kunden_id: kunde.id }));
        this.fehler.set(null);
      },
      error: () => this.fehler.set('Kunde konnte nicht angelegt werden.'),
    });
  }

  zuRechnungKonvertieren(angebot: Angebot): void {
    this.router.navigate(['/rechnungen'], {
      state: {
        convertFrom: 'angebot',
        data: {
          empf: angebot.empf,
          str: angebot.str,
          ort: angebot.ort,
          positionen: angebot.positionen,
          titel: angebot.titel,
          kunden_id: angebot.kunden_id,
        },
      },
    });
  }

  positionKopieren(index: number): void {
    const pos = this.formularDaten().positionen[index];
    if (!pos) return;
    this.formularDaten.update(d => ({
      ...d,
      positionen: [...d.positionen.slice(0, index + 1), { ...pos }, ...d.positionen.slice(index + 1)],
    }));
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

  formularFeldAktualisieren<K extends keyof AngebotFormularDaten>(
    feld: K, wert: AngebotFormularDaten[K]
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

  filterSetzen(filter: AngebotFilter): void {
    this.aktiverFilter.set(filter);
    this.aktuelleSeite.set(1);
  }

  private prefillAusRouterState(prefill: AngebotPrefill): void {
    this.formularDaten.update(d => ({
      ...d,
      empf: prefill.empf ?? d.empf,
      str: prefill.str ?? d.str,
      ort: prefill.ort ?? d.ort,
      email: prefill.email ?? d.email,
      kunden_id: prefill.kunden_id ?? d.kunden_id,
    }));
  }
}
