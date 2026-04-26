import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AppBadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  readonly variant = input<AppBadgeVariant>('neutral');
  protected readonly cssClass = computed(() => `app-badge app-badge--${this.variant()}`);
}
