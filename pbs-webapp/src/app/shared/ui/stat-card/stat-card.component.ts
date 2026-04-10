import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatCardVariante = 'standard' | 'success' | 'danger' | 'warning' | 'primary';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  readonly titel = input.required<string>();
  readonly wert = input.required<string>();
  readonly untertitel = input<string>('');
  readonly variante = input<StatCardVariante>('standard');
  readonly laedt = input<boolean>(false);
}
