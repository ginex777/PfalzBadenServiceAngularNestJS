import { Injectable, computed, inject, signal } from '@angular/core';
import { AuditLogService } from './audit-log.service';
import { ToastService } from '../../core/services/toast.service';
import { AuditLogEntry } from '../../core/models';
import { AuditAktion } from './audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogFacade {
  private readonly service = inject(AuditLogService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);

  readonly entries = signal<AuditLogEntry[]>([]);
  readonly total = signal(0);

  readonly page = signal(1);
  readonly pageSize = signal(25);

  readonly searchTerm = signal('');
  readonly actionFilter = signal<AuditAktion>('alle');
  readonly tableFilter = signal('');

  readonly tables = signal<string[]>([]);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );

  init(): void {
    this.service.loadTables().subscribe({
      next: (t) => this.tables.set(t),
      error: () => {},
    });
  }

  applyQuery(query: {
    page?: number;
    pageSize?: number;
    q?: string;
    aktion?: AuditAktion;
    tabelle?: string;
  }): void {
    const nextPage = query.page && query.page > 0 ? query.page : 1;
    const nextPageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : this.pageSize();
    this.page.set(nextPage);
    this.pageSize.set(nextPageSize);
    this.searchTerm.set(query.q ?? this.searchTerm());
    this.actionFilter.set(query.aktion ?? this.actionFilter());
    this.tableFilter.set(query.tabelle ?? this.tableFilter());
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.service
      .loadPage({
        page: this.page(),
        pageSize: this.pageSize(),
        q: this.searchTerm().trim() || undefined,
        aktion: this.actionFilter() === 'alle' ? undefined : this.actionFilter(),
        tabelle: this.tableFilter().trim() || undefined,
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
          this.toast.error('Audit-Log konnte nicht geladen werden.');
          this.isLoading.set(false);
        },
      });
  }
}
