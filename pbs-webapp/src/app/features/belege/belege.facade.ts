import { Injectable, inject, signal, computed } from '@angular/core';
import { BelegeService } from './belege.service';
import { Beleg } from '../../core/models';
import { BelegeFilter } from './belege.models';
import { dateigroesseFormatieren, datumFormatieren } from '../../core/utils/format.utils';

@Injectable({ providedIn: 'root' })
export class BelegeFacade {
  private readonly service = inject(BelegeService);

  readonly laedt = signal(false);
  readonly fehler = signal<string | null>(null);
  readonly belege = signal<Beleg[]>([]);
  readonly suchbegriff = signal('');
  readonly aktiverFilter = signal<BelegeFilter>('alle');
  readonly jahrFilter = signal<number | null>(null);
  readonly aktivesJahr = signal(new Date().getFullYear());
  readonly notizBearbeitungId = signal<number | null>(null);
  readonly loeschKandidat = signal<number | null>(null);

  readonly verfuegbareJahre = computed(() => {
    const years = [...new Set(this.belege().map(b => new Date(b.erstellt_am ?? '').getFullYear()))].filter(y => !isNaN(y)).sort().reverse();
    return years;
  });

  readonly gesamtGroesse = computed(() => {
    const bytes = this.belege().reduce((s, b) => s + (b.filesize || 0), 0);
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  });

  readonly spaetesteAufbewahrung = computed(() => {
    const dates = this.belege().map(b => b.aufbewahrung_bis).filter(Boolean).sort() as string[];
    return dates[dates.length - 1] ? datumFormatieren(dates[dates.length - 1]) : '–';
  });

  readonly gefilterteBelege = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    const f = this.aktiverFilter();
    const j = this.jahrFilter();
    return this.belege()
      .filter(b => f === 'alle' || b.typ === f)
      .filter(b => !j || (b.erstellt_am && new Date(b.erstellt_am).getFullYear() === j))
      .filter(b => !q || [b.filename, b.notiz, b.buchung_name, b.buchung_kategorie].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (b.erstellt_am ?? '').localeCompare(a.erstellt_am ?? ''));
  });

  readonly aktuelleSeite = signal(1);
  readonly PAGE_SIZE = 25;
  readonly gesamtSeiten = computed(() =>
    Math.max(1, Math.ceil(this.gefilterteBelege().length / this.PAGE_SIZE))
  );
  readonly seitenBelege = computed(() => {
    const start = (this.aktuelleSeite() - 1) * this.PAGE_SIZE;
    return this.gefilterteBelege().slice(start, start + this.PAGE_SIZE);
  });

  seiteZurueck(): void { this.aktuelleSeite.update(p => Math.max(1, p - 1)); }
  seiteVor(): void { this.aktuelleSeite.update(p => Math.min(this.gesamtSeiten(), p + 1)); }

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.alleLaden(this.aktivesJahr()).subscribe({
      next: b => { this.belege.set(b); this.laedt.set(false); },
      error: () => { this.fehler.set('Belege konnten nicht geladen werden.'); this.laedt.set(false); },
    });
  }

  hochladen(datei: File, typ: Beleg['typ'], notiz: string): void {
    const formData = new FormData();
    formData.append('beleg', datei);
    formData.append('typ', typ);
    formData.append('notiz', notiz);
    this.service.hochladen(formData).subscribe({
      next: b => this.belege.update(list => [b, ...list]),
      error: () => this.fehler.set('Beleg konnte nicht hochgeladen werden.'),
    });
  }

  notizSpeichern(id: number, notiz: string): void {
    this.service.notizAktualisieren(id, notiz).subscribe({
      next: aktualisiert => {
        this.belege.update(list => list.map(b => b.id === id ? aktualisiert : b));
        this.notizBearbeitungId.set(null);
      },
      error: () => this.fehler.set('Notiz konnte nicht gespeichert werden.'),
    });
  }

  loeschenBestaetigen(id: number): void { this.loeschKandidat.set(id); }
  loeschenAbbrechen(): void { this.loeschKandidat.set(null); }

  loeschenAusfuehren(): void {
    const id = this.loeschKandidat();
    if (id === null) return;
    this.service.loeschen(id).subscribe({
      next: () => { this.belege.update(list => list.filter(b => b.id !== id)); this.loeschKandidat.set(null); },
      error: () => { this.fehler.set('Beleg konnte nicht gelöscht werden.'); this.loeschKandidat.set(null); },
    });
  }

  downloadUrl(id: number, inline = false): string { return this.service.downloadUrl(id, inline); }
  dateigroesseFormatieren(bytes: number): string { return dateigroesseFormatieren(bytes); }
  filterSetzen(filter: BelegeFilter): void { this.aktiverFilter.set(filter); this.aktuelleSeite.set(1); }
  jahrFilterSetzen(jahr: number | null): void { this.jahrFilter.set(jahr); this.aktuelleSeite.set(1); }
  suchbegriffAktualisieren(q: string): void { this.suchbegriff.set(q); this.aktuelleSeite.set(1); }
  notizBearbeitungStarten(id: number): void { this.notizBearbeitungId.set(id); }
  notizBearbeitungAbbrechen(): void { this.notizBearbeitungId.set(null); }

  // ── Inline-Viewer ─────────────────────────────────────────────────────────
  readonly viewerBeleg = signal<Beleg | null>(null);

  viewerOeffnen(beleg: Beleg): void { this.viewerBeleg.set(beleg); }
  viewerSchliessen(): void { this.viewerBeleg.set(null); }

  istBild(beleg: Beleg): boolean {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(beleg.filename ?? '');
  }
}
