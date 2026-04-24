import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Objekt } from '../../core/models';
import { MobileFeedbackItem, MobileFeedbackKind, MobileRueckmeldungenService } from './mobile-rueckmeldungen.service';

type KindFilter = 'ALL' | MobileFeedbackKind;

@Injectable({ providedIn: 'root' })
export class MobileRueckmeldungenFacade {
  private readonly service = inject(MobileRueckmeldungenService);

  readonly objects = signal<Objekt[]>([]);
  readonly objectsLoading = signal(false);

  readonly selectedObjectId = signal<number | null>(null);
  readonly kindFilter = signal<KindFilter>('ALL');

  readonly entries = signal<MobileFeedbackItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(100);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly filteredEntries = computed(() => {
    const kind = this.kindFilter();
    const list = this.entries();
    if (kind === 'ALL') return list;
    return list.filter((e) => e.kind === kind);
  });

  readonly filteredTotal = computed(() => this.filteredEntries().length);

  readonly hasMore = computed(() => this.entries().length < this.total());

  loadInitial(): void {
    this.loadObjects();
    this.reload();
  }

  reload(): void {
    this.page.set(1);
    this.entries.set([]);
    this.total.set(0);
    this.loadPage(1);
  }

  loadNextPage(): void {
    if (!this.hasMore() || this.loading()) return;
    this.loadPage(this.page() + 1);
  }

  setObjectFilter(objectId: number | null): void {
    this.selectedObjectId.set(objectId);
    this.reload();
  }

  setKindFilter(kind: KindFilter): void {
    this.kindFilter.set(kind);
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
      .loadFeedbackPage({ page, pageSize: this.pageSize(), objectId })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.page.set(res.page);
          this.pageSize.set(res.pageSize);
          this.total.set(res.total);
          this.entries.update((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        },
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage.set(
            err?.error?.message ?? 'Mobile Rückmeldungen konnten nicht geladen werden.',
          );
        },
      });
  }
}

