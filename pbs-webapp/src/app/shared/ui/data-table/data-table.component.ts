import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TabellenSpalte<T> {
  schluessel: keyof T | string;
  bezeichnung: string;
  ausrichtung?: 'links' | 'rechts' | 'mitte';
  breite?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends Record<string, unknown>> {
  readonly spalten = input.required<TabellenSpalte<T>[]>();
  readonly zeilen = input.required<T[]>();
  readonly laedt = input<boolean>(false);
  readonly zeilenklick = output<T>();

  protected zeilenKlickAusfuehren(zeile: T): void {
    this.zeilenklick.emit(zeile);
  }

  protected zellenWertLesen(zeile: T, schluessel: keyof T | string): unknown {
    return zeile[schluessel as keyof T];
  }
}
