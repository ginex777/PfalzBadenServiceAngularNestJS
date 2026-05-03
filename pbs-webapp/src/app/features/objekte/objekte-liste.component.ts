import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '../../core/constants';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import type { Kunde, Objekt } from '../../core/models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { PaginierungComponent } from '../../shared/ui/paginierung/paginierung.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ObjectsService } from './objekte.service';
import type { ObjectStatusFilter } from './objekte.models';
import { RoleAllowedDirective } from '../../core/directives/role-allowed.directive';
import { ConfirmService } from '../../shared/services/confirm.service';

type CustomerFilterValue = 'ALL' | number;

@Component({
  selector: 'app-objekte-liste',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageTitleComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PaginierungComponent,
    StatusBadgeComponent,
    RoleAllowedDirective,
  ],
  templateUrl: './objekte-liste.component.html',
  styleUrl: './objekte-liste.component.scss',
})
export class ObjekteListeComponent {
  private readonly service = inject(ObjectsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly objects = signal<Objekt[]>([]);
  protected readonly customers = signal<Kunde[]>([]);

  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<ObjectStatusFilter>('ALL');
  protected readonly customerFilter = signal<CustomerFilterValue>('ALL');

  protected readonly page = signal(1);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  protected readonly filteredObjects = computed((): Objekt[] => {
    const q = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const customer = this.customerFilter();

    return this.objects().filter((o) => {
      if (status !== 'ALL' && (o.status ?? 'AKTIV') !== status) return false;
      if (customer !== 'ALL' && o.kunden_id !== customer) return false;

      if (!q) return true;
      const address = this.formatAddress(o).toLowerCase();
      const customerName = (o.kunden_name ?? '').toLowerCase();
      return o.name.toLowerCase().includes(q) || address.includes(q) || customerName.includes(q);
    });
  });

  protected readonly total = computed(() => this.filteredObjects().length);

  protected readonly pageObjects = computed((): Objekt[] => {
    const size = Math.max(1, this.pageSize());
    const start = (Math.max(1, this.page()) - 1) * size;
    return this.filteredObjects().slice(start, start + size);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.loadInitialData().subscribe({
      next: ({ objects, customers }) => {
        this.objects.set(objects);
        this.customers.set(customers);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Objekte konnten nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  protected onSearch(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.searchTerm.set(target.value);
    this.page.set(1);
  }

  protected onStatusFilter(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const value = target.value as ObjectStatusFilter | 'ALL';
    this.statusFilter.set(value === 'AKTIV' || value === 'INAKTIV' ? value : 'ALL');
    this.page.set(1);
  }

  protected onCustomerFilter(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value;
    this.customerFilter.set(v === 'ALL' ? 'ALL' : Number(v));
    this.page.set(1);
  }

  protected navigateToNew(): void {
    this.router.navigate(['/verwaltung/objekte/neu']);
  }

  protected navigateToDetail(objectId: number): void {
    this.router.navigate(['/verwaltung/objekte', objectId]);
  }

  protected onRowKeydown(event: KeyboardEvent, objectId: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToDetail(objectId);
    }
  }

  protected onPageChange(nextPage: number): void {
    this.page.set(nextPage);
  }

  protected onPageSizeChange(nextSize: number): void {
    this.pageSize.set(nextSize);
    this.page.set(1);
  }

  protected async deactivateFromList(objectId: number): Promise<void> {
    const ok = await this.confirm.confirm({
      message: 'Dieses Objekt wirklich deaktivieren?',
      confirmLabel: 'Deaktivieren',
    });
    if (!ok) return;
    this.service.deactivateObject(objectId).subscribe({
      next: () => {
        this.objects.update((list) =>
          list.map((o) => (o.id === objectId ? { ...o, status: 'INAKTIV' } : o)),
        );
        this.toast.success('Objekt deaktiviert.');
      },
      error: () => this.toast.error('Objekt konnte nicht deaktiviert werden.'),
    });
  }

  protected formatAddress(o: Objekt): string {
    const street = [o.strasse, o.hausnummer].filter(Boolean).join(' ').trim();
    const city = [o.plz, o.ort].filter(Boolean).join(' ').trim();
    return [street, city].filter(Boolean).join(', ');
  }

  protected statusBadge(status: Objekt['status'] | undefined): 'aktiv' | 'inaktiv' {
    return (status ?? 'AKTIV') === 'INAKTIV' ? 'inaktiv' : 'aktiv';
  }

  protected canEdit(): boolean {
    return this.auth.currentUser()?.rolle === 'admin';
  }

  protected customerOptions(): ReadonlyArray<{ value: string; label: string }> {
    const options = this.customers()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ value: String(c.id), label: c.name }));
    return [{ value: 'ALL', label: 'Alle Kunden' }, ...options];
  }
}
