import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { PaginierungComponent } from '../../shared/ui/paginierung/paginierung.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import type { ZeiterfassungEintrag } from './zeiterfassung.models';

@Component({
  selector: 'app-zeiterfassung-liste',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, ErrorStateComponent, SkeletonRowsComponent, PaginierungComponent],
  templateUrl: './zeiterfassung-liste.component.html',
  styleUrl: './zeiterfassung-liste.component.scss',
})
export class ZeiterfassungListeComponent {
  readonly eintraege = input.required<readonly ZeiterfassungEintrag[]>();
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly isLoading = input.required<boolean>();
  readonly totalDurationMinutes = input.required<number>();
  readonly errorMessage = input<string | null>(null);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly hasData = computed(() => this.eintraege().length > 0);

  protected onPageChange(nextPage: number): void {
    this.pageChange.emit(nextPage);
  }

  protected onPageSizeChange(nextSize: number): void {
    this.pageSizeChange.emit(nextSize);
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

  protected formatTotalDuration(minutes: number): string {
    const total = Math.max(0, Math.round(minutes));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h <= 0) return `${m}m`;
    if (m <= 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  protected emptyName(value: string | null): string {
    return value ?? '–';
  }
}
