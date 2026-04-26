import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginierung',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paginierung.component.html',
  styleUrl: './paginierung.component.scss',
})
export class PaginierungComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.total() / size));
  });

  protected readonly fromToLabel = computed(() => {
    const total = this.total();
    if (total === 0) return '0';
    const page = Math.max(1, this.page());
    const size = Math.max(1, this.pageSize());
    const from = (page - 1) * size + 1;
    const to = Math.min(total, page * size);
    return `${from}–${to} von ${total}`;
  });

  protected prev(): void {
    this.pageChange.emit(Math.max(1, this.page() - 1));
  }

  protected next(): void {
    this.pageChange.emit(Math.min(this.totalPages(), this.page() + 1));
  }

  protected onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(value) || value <= 0) return;
    this.pageSizeChange.emit(value);
  }
}
