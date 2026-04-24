import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Objekt } from '../../core/models';
import { EvidenceListItem, NachweiseService } from './nachweise.service';

@Injectable({ providedIn: 'root' })
export class NachweiseFacade {
  private readonly service = inject(NachweiseService);

  readonly objects = signal<Objekt[]>([]);
  readonly objectsLoading = signal(false);

  readonly selectedObjectId = signal<number | null>(null);

  readonly evidences = signal<EvidenceListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(200);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly hasMore = computed(() => this.evidences().length < this.total());

  loadInitial(): void {
    this.loadObjects();
    this.reload();
  }

  reload(): void {
    this.page.set(1);
    this.evidences.set([]);
    this.total.set(0);
    this.loadPage(1);
  }

  loadNextPage(): void {
    if (!this.hasMore() || this.loading()) return;
    const next = this.page() + 1;
    this.loadPage(next);
  }

  setObjectFilter(objectId: number | null): void {
    this.selectedObjectId.set(objectId);
    this.reload();
  }

  downloadUrl(id: number, inline = false): string {
    return this.service.getEvidenceDownloadUrl(id, inline);
  }

  private loadObjects(): void {
    this.objectsLoading.set(true);
    this.service
      .loadObjectsAll()
      .pipe(finalize(() => this.objectsLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.objects.set(rows);
          if (this.selectedObjectId() == null && rows.length > 0) {
            this.selectedObjectId.set(rows[0]!.id);
          }
        },
        error: () => {
          this.objects.set([]);
        },
      });
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const objectId = this.selectedObjectId() ?? undefined;
    this.service
      .loadEvidencePage({
        page,
        pageSize: this.pageSize(),
        objectId,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.page.set(res.page);
          this.pageSize.set(res.pageSize);
          this.total.set(res.total);
          this.evidences.update((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        },
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage.set(err?.error?.message ?? 'Nachweise konnten nicht geladen werden.');
        },
      });
  }
}
