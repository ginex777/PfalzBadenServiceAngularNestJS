import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<Array<TableColumn<T>>>();
  readonly rows = input.required<T[]>();
  readonly isLoading = input<boolean>(false);
  readonly rowClick = output<T>();

  protected handleRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  protected onRowKeydown(event: KeyboardEvent, row: T): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.rowClick.emit(row);
    }
  }

  protected readCellValue(row: T, key: keyof T | string): unknown {
    return row[key as keyof T];
  }
}
