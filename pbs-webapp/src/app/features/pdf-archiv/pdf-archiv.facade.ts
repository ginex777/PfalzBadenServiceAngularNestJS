import { Injectable, inject, signal, computed } from '@angular/core';
import { PdfArchivService } from './pdf-archiv.service';
import { ToastService } from '../../core/services/toast.service';
import { PdfArchiveEntry } from '../../core/models';
import { PdfArchivFilter } from './pdf-archiv.models';

@Injectable({ providedIn: 'root' })
export class PdfArchivFacade {
  private readonly service = inject(PdfArchivService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly eintraege = signal<PdfArchiveEntry[]>([]);
  readonly suchbegriff = signal('');
  readonly aktiverFilter = signal<PdfArchivFilter>('alle');
  readonly loeschenLaedt = signal(false);

  readonly gefilterteEintraege = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    const f = this.aktiverFilter();
    return this.eintraege()
      .filter((e) => f === 'alle' || e.typ === f)
      .filter(
        (e) =>
          !q || [e.referenz_nr, e.empf, e.titel, e.filename].join(' ').toLowerCase().includes(q),
      )
      .sort((a, b) => b.erstellt_am.localeCompare(a.erstellt_am));
  });

  readonly aktuelleSeite = signal(1);
  readonly PAGE_SIZE = 25;
  readonly gesamtSeiten = computed(() =>
    Math.max(1, Math.ceil(this.gefilterteEintraege().length / this.PAGE_SIZE)),
  );
  readonly seitenEintraege = computed(() => {
    const start = (this.aktuelleSeite() - 1) * this.PAGE_SIZE;
    return this.gefilterteEintraege().slice(start, start + this.PAGE_SIZE);
  });

  seiteZurueck(): void {
    this.aktuelleSeite.update((p) => Math.max(1, p - 1));
  }
  seiteVor(): void {
    this.aktuelleSeite.update((p) => Math.min(this.gesamtSeiten(), p + 1));
  }

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.alleLaden().subscribe({
      next: (e) => {
        this.eintraege.set(e);
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('PDF-Archiv konnte nicht geladen werden.');
        this.laedt.set(false);
      },
    });
  }

  pdfOeffnen(id: number): void {
    this.service.pdfOeffnen(id).catch(() => this.toast.error('PDF konnte nicht geöffnet werden.'));
  }

  eintragLoeschen(id: number): void {
    this.service.eintragLoeschen(id).subscribe({
      next: () => this.eintraege.update((list) => list.filter((e) => e.id !== id)),
      error: () => this.toast.error('Löschen fehlgeschlagen'),
    });
  }

  alleLoeschen(): void {
    if (!confirm('Alle PDF-Einträge aus dem Protokoll löschen? Die Dateien bleiben erhalten.'))
      return;
    this.loeschenLaedt.set(true);
    this.service.alleLoeschen().subscribe({
      next: () => {
        this.eintraege.set([]);
        this.loeschenLaedt.set(false);
      },
      error: () => {
        this.toast.error('Protokoll konnte nicht geleert werden.');
        this.loeschenLaedt.set(false);
      },
    });
  }

  filterSetzen(filter: PdfArchivFilter): void {
    this.aktiverFilter.set(filter);
    this.aktuelleSeite.set(1);
  }
  suchbegriffAktualisieren(q: string): void {
    this.suchbegriff.set(q);
    this.aktuelleSeite.set(1);
  }
}
