import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AktivitaetItem, AKTIVITAET_TYPE_LABELS, TaskType } from './aktivitaeten.models';

@Component({
  selector: 'app-aktivitaeten-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './aktivitaeten-feed.component.html',
  styleUrl: './aktivitaeten-feed.component.scss',
})
export class AktivitaetenfeedComponent {
  readonly eintraege = input.required<AktivitaetItem[]>();
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly isLoading = input.required<boolean>();
  readonly errorMessage = input<string | null>(null);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly AKTIVITAET_TYPE_LABELS = AKTIVITAET_TYPE_LABELS;

  protected formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  protected getTypeColor(type: TaskType): string {
    switch (type) {
      case 'MUELL':
        return '#8b5a2b';
      case 'CHECKLISTE':
        return '#2196f3';
      case 'ZEITERFASSUNG':
        return '#f7931e';
      case 'KONTROLLE':
        return '#9c27b0';
      case 'REPARATUR':
        return '#f44336';
      case 'REINIGUNG':
        return '#00bcd4';
      default:
        return '#757575';
    }
  }

  protected hasData(): boolean {
    return this.eintraege().length > 0;
  }

  protected totalPages(): number {
    return Math.ceil(this.total() / this.pageSize());
  }

  protected onPageChange(newPage: number): void {
    this.pageChange.emit(newPage);
  }

  protected onPageSizeChange(newSize: number): void {
    this.pageSizeChange.emit(newSize);
  }
}
