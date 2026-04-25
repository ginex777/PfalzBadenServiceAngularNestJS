import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatCardVariant = 'standard' | 'success' | 'danger' | 'warning' | 'primary';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly subtitle = input<string>('');
  readonly variant = input<StatCardVariant>('standard');
  readonly isLoading = input<boolean>(false);
}
