import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { DEFAULT_PAGE_SIZE } from '../../core/constants';
import { ApiService, UserEintrag } from '../../core/api/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Kunde, Mitarbeiter, Objekt, PaginatedResponse } from '../../core/models';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { AufgabeDetailComponent } from './aufgabe-detail.component';
import { AufgabenFilterComponent, UserOption } from './aufgaben-filter.component';
import { AufgabenListeComponent } from './aufgaben-liste.component';
import {
  DEFAULT_TASK_FILTERS,
  TaskFilterState,
  TaskListItemApi,
  TaskListQuery,
  TaskStatus,
  TaskType,
} from './aufgaben.models';
import { TasksService } from './aufgaben.service';

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseCsv(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const TASK_TYPES: readonly TaskType[] = [
  'MUELL',
  'CHECKLISTE',
  'REINIGUNG',
  'KONTROLLE',
  'REPARATUR',
  'ZEITERFASSUNG',
  'SONSTIGES',
];

const TASK_STATUSES: readonly TaskStatus[] = [
  'OFFEN',
  'IN_BEARBEITUNG',
  'ERLEDIGT',
  'UEBERFAELLIG',
  'GEPRUEFT',
  'ABGELEHNT',
];

function parseEnumList<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  const values = parseCsv(raw);
  const allowedSet = new Set<string>(allowed);
  const parsed: T[] = [];
  for (const v of values) {
    if (allowedSet.has(v)) parsed.push(v as T);
  }
  return parsed;
}

@Component({
  selector: 'app-aufgaben',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageTitleComponent,
    AufgabenFilterComponent,
    AufgabenListeComponent,
    DrawerComponent,
    AufgabeDetailComponent,
  ],
  templateUrl: './aufgaben.component.html',
  styleUrl: './aufgaben.component.scss',
})
export class AufgabenComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly service = inject(TasksService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly customers = signal<Kunde[]>([]);
  protected readonly objects = signal<Objekt[]>([]);
  protected readonly employees = signal<Mitarbeiter[]>([]);
  protected readonly users = signal<UserOption[]>([]);

  protected readonly filters = signal<TaskFilterState>({ ...DEFAULT_TASK_FILTERS });

  protected readonly tasks = signal<TaskListItemApi[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  protected readonly selectedTask = signal<TaskListItemApi | null>(null);
  protected readonly isDrawerOpen = computed(() => this.selectedTask() !== null);
  protected readonly canEdit = computed(() => this.auth.currentUser()?.rolle === 'admin');

  private readonly requestId = signal(0);

  constructor() {
    this.loadFilterData();
    this.watchQueryParams();
  }

  protected closeDrawer(): void {
    this.selectedTask.set(null);
  }

  protected onTaskSelected(task: TaskListItemApi): void {
    this.selectedTask.set(task);
  }

  protected onTaskUpdated(task: TaskListItemApi): void {
    this.tasks.update((list) => list.map((t) => (t.id === task.id ? task : t)));
    this.selectedTask.set(task);
  }

  protected onFiltersChange(next: TaskFilterState): void {
    this.router.navigate([], {
      queryParams: {
        q: next.q?.trim() ? next.q.trim() : null,
        customerId: next.customerId ?? null,
        objectId: next.objectId ?? null,
        employeeId: next.employeeId ?? null,
        userId: next.userId ?? null,
        type: next.type.length > 0 ? next.type.join(',') : null,
        status: next.status.length > 0 ? next.status.join(',') : null,
        createdFrom: next.createdFrom || null,
        createdTo: next.createdTo || null,
        dueFrom: next.dueFrom || null,
        dueTo: next.dueTo || null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected onResetFilters(): void {
    this.router.navigate([], {
      queryParams: {
        q: null,
        customerId: null,
        objectId: null,
        employeeId: null,
        userId: null,
        type: null,
        status: null,
        createdFrom: null,
        createdTo: null,
        dueFrom: null,
        dueTo: null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected onPageChange(nextPage: number): void {
    this.router.navigate([], { queryParams: { page: nextPage }, queryParamsHandling: 'merge' });
  }

  protected onPageSizeChange(nextSize: number): void {
    this.router.navigate([], {
      queryParams: { pageSize: nextSize, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected reload(): void {
    this.fetchTasks(this.buildQueryFromState());
  }

  private loadFilterData(): void {
    forkJoin({
      customers: this.api.loadCustomers(),
      objects: this.api.loadObjects(),
      employees: this.api.loadEmployees(),
      users: this.api.loadUsers().pipe(map((raw) => this.mapUsers(raw))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ customers, objects, employees, users }) => {
          this.customers.set(customers);
          this.objects.set(objects);
          this.employees.set(employees);
          this.users.set(users);
        },
        error: () => {
          // Non-blocking: filters still work via IDs, list still works.
        },
      });
  }

  private mapUsers(raw: readonly UserEintrag[]): UserOption[] {
    const options: UserOption[] = [];
    for (const u of raw) {
      const id = Number(u.id);
      if (!Number.isFinite(id)) continue;
      const name = [u.vorname, u.nachname].filter(Boolean).join(' ').trim();
      options.push({ id, label: name ? `${name} (${u.email})` : u.email });
    }
    return options;
  }

  private watchQueryParams(): void {
    this.route.queryParams
      .pipe(
        map((params) => {
          const page = parseNumber(params['page']) ?? 1;
          const pageSize = parseNumber(params['pageSize']) ?? DEFAULT_PAGE_SIZE;

          const q = typeof params['q'] === 'string' ? params['q'] : '';
          const customerId = parseNumber(params['customerId']);
          const objectId = parseNumber(params['objectId']);
          const employeeId = parseNumber(params['employeeId']);
          const userId = parseNumber(params['userId']);

          const type = parseEnumList(params['type'], TASK_TYPES);
          const status = parseEnumList(params['status'], TASK_STATUSES);

          const createdFrom =
            typeof params['createdFrom'] === 'string' ? params['createdFrom'] : '';
          const createdTo = typeof params['createdTo'] === 'string' ? params['createdTo'] : '';
          const dueFrom = typeof params['dueFrom'] === 'string' ? params['dueFrom'] : '';
          const dueTo = typeof params['dueTo'] === 'string' ? params['dueTo'] : '';

          this.page.set(page);
          this.pageSize.set(pageSize);
          this.filters.set({
            q,
            customerId,
            objectId,
            employeeId,
            userId,
            type,
            status,
            createdFrom,
            createdTo,
            dueFrom,
            dueTo,
          } satisfies TaskFilterState);

          return this.buildQueryFromState();
        }),
        tap(() => {
          this.isLoading.set(true);
          this.errorMessage.set(null);
          this.requestId.update((v) => v + 1);
        }),
        switchMap((query) => {
          const expectedId = this.requestId();
          return this.service.list(query).pipe(
            map((res) => ({ res, expectedId })),
            catchError(() => {
              this.errorMessage.set('Aufgaben konnten nicht geladen werden.');
              return of({ res: null as PaginatedResponse<TaskListItemApi> | null, expectedId });
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
        this.tasks.set(res.data);
        this.total.set(res.total);
        this.page.set(res.page);
        this.pageSize.set(res.pageSize);
        this.isLoading.set(false);
      });
  }

  private buildQueryFromState(): TaskListQuery {
    const filters = this.filters();
    return {
      page: this.page(),
      pageSize: this.pageSize(),
      q: filters.q?.trim() ? filters.q.trim() : undefined,
      customerId: filters.customerId ?? undefined,
      objectId: filters.objectId ?? undefined,
      employeeId: filters.employeeId ?? undefined,
      userId: filters.userId ?? undefined,
      type: filters.type.length > 0 ? filters.type : undefined,
      status: filters.status.length > 0 ? filters.status : undefined,
      createdFrom: filters.createdFrom || undefined,
      createdTo: filters.createdTo || undefined,
      dueFrom: filters.dueFrom || undefined,
      dueTo: filters.dueTo || undefined,
    };
  }

  private fetchTasks(query: TaskListQuery): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.requestId.update((v) => v + 1);
    const expectedId = this.requestId();

    this.service
      .list(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (expectedId !== this.requestId()) return;
          this.tasks.set(res.data);
          this.total.set(res.total);
          this.page.set(res.page);
          this.pageSize.set(res.pageSize);
          this.isLoading.set(false);
        },
        error: () => {
          if (expectedId !== this.requestId()) return;
          this.errorMessage.set('Aufgaben konnten nicht geladen werden.');
          this.isLoading.set(false);
        },
      });
  }
}
