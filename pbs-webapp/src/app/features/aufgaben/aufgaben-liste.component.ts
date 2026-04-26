import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { PaginierungComponent } from '../../shared/ui/paginierung/paginierung.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { AufgabenStatusBadgeComponent } from './aufgaben-status-badge.component';
import { AufgabenTypBadgeComponent } from './aufgaben-typ-badge.component';
import { TaskListItemApi } from './aufgaben.models';

@Component({
  selector: 'app-aufgaben-liste',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonRowsComponent,
    PaginierungComponent,
    AufgabenTypBadgeComponent,
    AufgabenStatusBadgeComponent,
  ],
  templateUrl: './aufgaben-liste.component.html',
  styleUrl: './aufgaben-liste.component.scss',
})
export class AufgabenListeComponent {
  readonly tasks = input.required<readonly TaskListItemApi[]>();
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly isLoading = input.required<boolean>();
  readonly errorMessage = input<string | null>(null);

  readonly taskSelected = output<TaskListItemApi>();
  readonly reload = output<void>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly hasData = computed(() => this.tasks().length > 0);

  protected select(task: TaskListItemApi): void {
    this.taskSelected.emit(task);
  }

  protected onPageChange(nextPage: number): void {
    this.pageChange.emit(nextPage);
  }

  protected onPageSizeChange(nextSize: number): void {
    this.pageSizeChange.emit(nextSize);
  }

  protected formatDate(value: string | null): string {
    if (!value) return '–';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '–';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  protected formatDateTime(value: string | null): string {
    if (!value) return '–';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '–';
    return d.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatDuration(minutes: number | null): string {
    if (minutes == null) return '–';
    const total = Math.max(0, Math.round(minutes));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h <= 0) return `${m}m`;
    if (m <= 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  protected personLabel(task: TaskListItemApi): string {
    return task.employeeName ?? task.userEmail ?? '–';
  }

  protected hasComment(task: TaskListItemApi): boolean {
    return Boolean(task.comment && task.comment.trim());
  }

  protected hasPhoto(task: TaskListItemApi): boolean {
    return Boolean(task.photoUrl && task.photoUrl.trim());
  }
}
