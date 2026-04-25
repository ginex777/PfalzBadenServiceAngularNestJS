import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { DEFAULT_PAGE_SIZE } from '../../core/constants';
import { ApiService } from '../../core/api/api.service';
import { Mitarbeiter, Objekt, Kunde } from '../../core/models';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { ZeiterfassungFilterComponent } from './zeiterfassung-filter.component';
import { ZeiterfassungListeComponent } from './zeiterfassung-liste.component';
import { DEFAULT_ZEITERFASSUNG_FILTER, DropdownOption, ZeiterfassungEintrag, ZeiterfassungFilterState, ZeiterfassungListResponse } from './zeiterfassung.models';
import { ZeiterfassungService } from './zeiterfassung.service';

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

@Component({
  selector: 'app-stempeluhr',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent, ZeiterfassungFilterComponent, ZeiterfassungListeComponent],
  templateUrl: './stempeluhr.component.html',
  styleUrl: './stempeluhr.component.scss',
})
export class StempeluhrComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly service = inject(ZeiterfassungService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly mitarbeiter = signal<DropdownOption[]>([]);
  protected readonly objekte = signal<DropdownOption[]>([]);
  protected readonly kunden = signal<DropdownOption[]>([]);

  protected readonly filters = signal<ZeiterfassungFilterState>({ ...DEFAULT_ZEITERFASSUNG_FILTER });

  protected readonly eintraege = signal<ZeiterfassungEintrag[]>([]);
  protected readonly total = signal(0);
  protected readonly totalDurationMinutes = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  private readonly requestId = signal(0);

  constructor() {
    this.loadFilterData();
    this.watchQueryParams();
  }

  protected onFiltersChange(next: ZeiterfassungFilterState): void {
    this.router.navigate([], {
      queryParams: {
        mitarbeiterId: next.mitarbeiterId ?? null,
        objektId: next.objektId ?? null,
        kundenId: next.kundenId ?? null,
        von: next.von || null,
        bis: next.bis || null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected onResetFilters(): void {
    this.router.navigate([], {
      queryParams: {
        mitarbeiterId: null,
        objektId: null,
        kundenId: null,
        von: null,
        bis: null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected onPageChange(nextPage: number): void {
    this.router.navigate([], { queryParams: { page: nextPage }, queryParamsHandling: 'merge' });
  }

  protected onPageSizeChange(nextSize: number): void {
    this.router.navigate([], { queryParams: { pageSize: nextSize, page: 1 }, queryParamsHandling: 'merge' });
  }

  private loadFilterData(): void {
    forkJoin({
      mitarbeiter: this.api.loadEmployees().pipe(
        map((res: Mitarbeiter[]) => res.map((m) => ({ id: m.id, name: m.name }))),
      ),
      objekte: this.api.loadObjects().pipe(
        map((res: Objekt[]) => res.map((o) => ({ id: o.id, name: o.name }))),
      ),
      kunden: this.api.loadCustomers().pipe(
        map((res: Kunde[]) => res.map((k) => ({ id: k.id, name: k.name }))),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ mitarbeiter, objekte, kunden }) => {
          this.mitarbeiter.set(mitarbeiter);
          this.objekte.set(objekte);
          this.kunden.set(kunden);
        },
        error: () => {
          // Non-blocking error
        },
      });
  }

  private watchQueryParams(): void {
    this.route.queryParams
      .pipe(
        map((params) => {
          const page = parseNumber(params['page']) ?? 1;
          const pageSize = parseNumber(params['pageSize']) ?? DEFAULT_PAGE_SIZE;

          const mitarbeiterId = parseNumber(params['mitarbeiterId']);
          const objektId = parseNumber(params['objektId']);
          const kundenId = parseNumber(params['kundenId']);

          const von = typeof params['von'] === 'string' ? params['von'] : null;
          const bis = typeof params['bis'] === 'string' ? params['bis'] : null;

          this.page.set(page);
          this.pageSize.set(pageSize);
          this.filters.set({
            mitarbeiterId,
            objektId,
            kundenId,
            von,
            bis,
          } satisfies ZeiterfassungFilterState);

          return { page, pageSize, filters: this.filters() };
        }),
        tap(() => {
          this.isLoading.set(true);
          this.errorMessage.set(null);
          this.requestId.update((v) => v + 1);
        }),
        switchMap(({ page, pageSize, filters }) => {
          const expectedId = this.requestId();
          return this.service.list(filters, page, pageSize).pipe(
            map((res) => ({ res, expectedId })),
            catchError(() => {
              this.errorMessage.set('Zeiterfassungen konnten nicht geladen werden.');
              return of({ res: null as ZeiterfassungListResponse | null, expectedId });
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ res, expectedId }) => {
        if (expectedId !== this.requestId()) return;
        if (!res) {
          this.isLoading.set(false);
          return;
        }
        this.eintraege.set(res.data);
        this.total.set(res.total);
        this.totalDurationMinutes.set(res.totalDurationMinutes);
        this.isLoading.set(false);
      });
  }
}

