import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MarketingService } from './marketing.service';
import { MarketingKontakt, Kunde } from '../../core/models';
import {
  MarketingStatusFilter, MarketingStatistik, CsvImportZeile,
  MarketingFormularDaten, LEERES_MARKETING_FORMULAR,
} from './marketing.models';

@Injectable({ providedIn: 'root' })
export class MarketingFacade {
  private readonly service = inject(MarketingService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly laedt = signal(false);
  readonly fehler = signal<string | null>(null);
  readonly kontakte = signal<MarketingKontakt[]>([]);
  readonly kunden = signal<Kunde[]>([]);
  readonly suchbegriff = signal('');
  readonly statusFilter = signal<MarketingStatusFilter>('');
  readonly bearbeiteterKontakt = signal<MarketingKontakt | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly formularSichtbar = signal(false);
  readonly statusModalKontakt = signal<MarketingKontakt | null>(null);
  readonly importVorschau = signal<CsvImportZeile[]>([]);
  readonly importModalSichtbar = signal(false);
  readonly formularDaten = signal<MarketingFormularDaten>({ ...LEERES_MARKETING_FORMULAR });

  // E-Mail Vorlage
  readonly DEFAULT_BETREFF = 'Entlasten Sie Ihr Unternehmen — Pfalz-Baden Service';
  readonly DEFAULT_TEXT = `Sehr geehrte Damen und Herren,\n\nwir bieten professionelle Dienstleistungen für Unternehmen, Büros und Wohnanlagen:\n\n- Hausmeisterservice & Objektbetreuung\n- Unterhaltsreinigung\n- Treppenhausreinigung\n- Garten- und Außenanlagenpflege\n- Winterdienst\n- Mülldienst\n\nGerne erstellen wir Ihnen ein unverbindliches Angebot.\n\nMit freundlichen Grüßen\nPfalz-Baden Service GbR`;
  readonly vorlageBetreff = signal('');
  readonly vorlageText = signal('');
  readonly vorlageModalSichtbar = signal(false);

  vorlageModalOeffnen(): void {
    if (!this.vorlageBetreff()) this.vorlageBetreff.set(this.DEFAULT_BETREFF);
    if (!this.vorlageText()) this.vorlageText.set(this.DEFAULT_TEXT);
    this.vorlageModalSichtbar.set(true);
  }
  vorlageModalSchliessen(): void { this.vorlageModalSichtbar.set(false); }
  vorlageZuruecksetzen(): void {
    this.vorlageBetreff.set(this.DEFAULT_BETREFF);
    this.vorlageText.set(this.DEFAULT_TEXT);
  }
  vorlageSpeichern(): void {
    this.http.post('/api/settings/marketing_template', { betreff: this.vorlageBetreff(), text: this.vorlageText() }).subscribe({
      next: () => this.vorlageModalSchliessen(),
      error: () => this.fehler.set('Vorlage konnte nicht gespeichert werden.'),
    });
  }

  readonly gefilterteKontakte = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    const sf = this.statusFilter();
    return this.kontakte()
      .filter(k => !sf || k.status === sf)
      .filter(k => !q || [k.name, k.email, k.person, k.notiz, k.tel].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''));
  });

  readonly aktuelleSeite = signal(1);
  readonly PAGE_SIZE = 25;
  readonly gesamtSeiten = computed(() =>
    Math.max(1, Math.ceil(this.gefilterteKontakte().length / this.PAGE_SIZE))
  );
  readonly seitenKontakte = computed(() => {
    const start = (this.aktuelleSeite() - 1) * this.PAGE_SIZE;
    return this.gefilterteKontakte().slice(start, start + this.PAGE_SIZE);
  });

  seiteZurueck(): void { this.aktuelleSeite.update(p => Math.max(1, p - 1)); }
  seiteVor(): void { this.aktuelleSeite.update(p => Math.min(this.gesamtSeiten(), p + 1)); }

  readonly statistik = computed<MarketingStatistik>(() => {
    const alle = this.kontakte();
    return {
      neu: alle.filter(k => k.status === 'neu').length,
      gesendet: alle.filter(k => k.status === 'gesendet').length,
      interesse: alle.filter(k => k.status === 'interesse').length,
      keinInteresse: alle.filter(k => k.status === 'kein-interesse').length,
      angebot: alle.filter(k => k.status === 'angebot').length,
    };
  });

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.allesDatenLaden().subscribe({
      next: ({ kontakte, kunden }) => {
        this.kontakte.set(kontakte);
        this.kunden.set(kunden);
        this.laedt.set(false);
      },
      error: () => { this.fehler.set('Daten konnten nicht geladen werden.'); this.laedt.set(false); },
    });
    // Load email template
    this.http.get<{ betreff?: string; text?: string }>('/api/settings/marketing_template').subscribe({
      next: t => {
        if (t?.betreff) this.vorlageBetreff.set(t.betreff);
        if (t?.text) this.vorlageText.set(t.text);
      },
      error: () => {},
    });
  }

  formularOeffnen(kontakt?: MarketingKontakt): void {
    this.bearbeiteterKontakt.set(kontakt ?? null);
    this.formularDaten.set(kontakt ? {
      name: kontakt.name, person: kontakt.person ?? '', email: kontakt.email,
      tel: kontakt.tel ?? '', strasse: kontakt.strasse ?? '', ort: kontakt.ort ?? '',
      notiz: kontakt.notiz ?? '', status: kontakt.status,
      status_notiz: kontakt.status_notiz ?? '', datum: kontakt.datum ?? '',
    } : { ...LEERES_MARKETING_FORMULAR, datum: new Date().toISOString().slice(0, 10) });
    this.formularSichtbar.set(true);
  }

  formularSchliessen(): void {
    this.formularSichtbar.set(false);
    this.bearbeiteterKontakt.set(null);
    this.formularDaten.set({ ...LEERES_MARKETING_FORMULAR });
  }

  speichern(): void {
    const daten = this.formularDaten();
    if (!daten.name || !daten.email) { this.fehler.set('Name und E-Mail sind Pflichtfelder.'); return; }
    const editId = this.bearbeiteterKontakt()?.id;
    const anfrage = editId
      ? this.service.kontaktAktualisieren(editId, daten)
      : this.service.kontaktErstellen(daten);
    anfrage.subscribe({
      next: gespeichert => {
        if (editId) this.kontakte.update(list => list.map(k => k.id === editId ? gespeichert : k));
        else this.kontakte.update(list => [gespeichert, ...list]);
        this.formularSchliessen();
      },
      error: () => this.fehler.set('Kontakt konnte nicht gespeichert werden.'),
    });
  }

  statusModalOeffnen(kontakt: MarketingKontakt): void { this.statusModalKontakt.set(kontakt); }
  statusModalSchliessen(): void { this.statusModalKontakt.set(null); }

  statusSpeichern(status: MarketingKontakt['status'], statusNotiz: string): void {
    const k = this.statusModalKontakt();
    if (!k) return;
    this.service.kontaktAktualisieren(k.id, { ...k, status, status_notiz: statusNotiz }).subscribe({
      next: aktualisiert => {
        this.kontakte.update(list => list.map(x => x.id === k.id ? aktualisiert : x));
        this.statusModalSchliessen();
      },
      error: () => this.fehler.set('Status konnte nicht gespeichert werden.'),
    });
  }

  loeschenBestaetigen(id: number): void { this.loeschKandidat.set(id); }
  loeschenAbbrechen(): void { this.loeschKandidat.set(null); }

  loeschenAusfuehren(): void {
    const id = this.loeschKandidat();
    if (id === null) return;
    this.service.kontaktLoeschen(id).subscribe({
      next: () => { this.kontakte.update(list => list.filter(k => k.id !== id)); this.loeschKandidat.set(null); },
      error: () => { this.fehler.set('Kontakt konnte nicht gelöscht werden.'); this.loeschKandidat.set(null); },
    });
  }

  csvImportVorschauZeigen(zeilen: CsvImportZeile[]): void {
    this.importVorschau.set(zeilen);
    this.importModalSichtbar.set(true);
  }

  csvImportAbbrechen(): void { this.importVorschau.set([]); this.importModalSichtbar.set(false); }

  csvImportBestaetigen(): void {
    const zeilen = this.importVorschau().filter(z => !z.istDuplikat);
    const heute = new Date().toISOString().slice(0, 10);
    let abgeschlossen = 0;
    zeilen.forEach(z => {
      this.service.kontaktErstellen({ ...z, status: 'neu', status_notiz: '', datum: heute }).subscribe({
        next: k => {
          this.kontakte.update(list => [k, ...list]);
          abgeschlossen++;
          if (abgeschlossen === zeilen.length) this.csvImportAbbrechen();
        },
      });
    });
    if (!zeilen.length) this.csvImportAbbrechen();
  }

  zuKundeKonvertieren(kontakt: MarketingKontakt): void {
    this.service.kundeErstellen({
      name: kontakt.name, email: kontakt.email, tel: kontakt.tel,
      strasse: kontakt.strasse, ort: kontakt.ort,
    }).subscribe({
      next: kunde => {
        this.service.kontaktAktualisieren(kontakt.id, { ...kontakt, status: 'angebot' }).subscribe({
          next: aktualisiert => this.kontakte.update(list => list.map(k => k.id === kontakt.id ? aktualisiert : k)),
        });
        this.router.navigate(['/angebote'], {
          state: { prefill: { empf: kunde.name, str: kunde.strasse, ort: kunde.ort, email: kunde.email, kunden_id: kunde.id } },
        });
      },
      error: () => this.fehler.set('Kunde konnte nicht erstellt werden.'),
    });
  }

  filterSetzen(filter: MarketingStatusFilter): void { this.statusFilter.set(filter); this.aktuelleSeite.set(1); }
  suchbegriffAktualisieren(q: string): void { this.suchbegriff.set(q); }
  formularFeldAktualisieren<K extends keyof MarketingFormularDaten>(feld: K, wert: MarketingFormularDaten[K]): void {
    this.formularDaten.update(d => ({ ...d, [feld]: wert }));
  }
}
