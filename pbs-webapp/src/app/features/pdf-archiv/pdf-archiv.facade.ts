import { Injectable, computed, inject, signal } from '@angular/core';
import { PdfArchivService } from './pdf-archiv.service';
import { ToastService } from '../../core/services/toast.service';
import { PdfArchiveEntry } from '../../core/models';
import { PdfArchivFilter } from './pdf-archiv.models';

@Injectable({ providedIn: 'root' })
export class PdfArchivFacade {
  private readonly service = inject(PdfArchivService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly isClearing = signal(false);

  readonly entries = signal<PdfArchiveEntry[]>([]);
  readonly total = signal(0);

  readonly page = signal(1);
  readonly pageSize = signal(25);

  readonly searchTerm = signal('');
  readonly activeFilter = signal<PdfArchivFilter>('alle');

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );

  applyQuery(query: {
    page?: number;
    pageSize?: number;
    q?: string;
    typ?: PdfArchivFilter;
  }): void {
    const nextPage = query.page && query.page > 0 ? query.page : 1;
    const nextPageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : this.pageSize();
    const nextSearch = query.q ?? this.searchTerm();
    const nextFilter = query.typ ?? this.activeFilter();

    this.page.set(nextPage);
    this.pageSize.set(nextPageSize);
    this.searchTerm.set(nextSearch);
    this.activeFilter.set(nextFilter);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    const typ = this.activeFilter() === 'alle' ? undefined : this.activeFilter();
    const q = this.searchTerm().trim() || undefined;

    this.service
      .seiteLaden({
        page: this.page(),
        pageSize: this.pageSize(),
        q,
        typ,
      })
      .subscribe({
        next: (r) => {
          this.entries.set(r.data);
          this.total.set(r.total);
          this.page.set(r.page);
          this.pageSize.set(r.pageSize);
          this.isLoading.set(false);
        },
        error: () => {
          this.toast.error('PDF-Archiv konnte nicht geladen werden.');
          this.isLoading.set(false);
        },
      });
  }

  setPage(page: number): void {
    this.page.set(Math.max(1, page));
    this.load();
  }

  setPageSize(pageSize: number): void {
    this.pageSize.set(Math.max(1, pageSize));
    this.page.set(1);
    this.load();
  }

  setFilter(filter: PdfArchivFilter): void {
    this.activeFilter.set(filter);
    this.page.set(1);
    this.load();
  }

  setSearchTerm(q: string): void {
    this.searchTerm.set(q);
    this.page.set(1);
    this.load();
  }

  openPdf(id: number): void {
    this.service.pdfOeffnen(id).catch(() => this.toast.error('PDF konnte nicht geöffnet werden.'));
  }

  deleteEntry(id: number): void {
    this.service.eintragLoeschen(id).subscribe({
      next: () => this.load(),
      error: () => this.toast.error('Löschen fehlgeschlagen'),
    });
  }

  clearLog(): void {
    if (!confirm('Alle PDF-Einträge aus dem Protokoll löschen? Die Dateien bleiben erhalten.'))
      return;
    this.isClearing.set(true);
    this.service.alleLoeschen().subscribe({
      next: () => {
        this.entries.set([]);
        this.total.set(0);
        this.page.set(1);
        this.isClearing.set(false);
      },
      error: () => {
        this.toast.error('Protokoll konnte nicht geleert werden.');
        this.isClearing.set(false);
      },
    });
  }
}
