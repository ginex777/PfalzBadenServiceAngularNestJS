import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AppButtonVariant = 'primary' | 'secondary' | 'neutral' | 'danger' | 'ghost';
export type AppButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<AppButtonVariant>('neutral');
  readonly size = input<AppButtonSize>('md');
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = input<string | null>(null);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());
  protected readonly cssClass = computed(
    () => `app-btn app-btn--${this.variant()} app-btn--${this.size()}`,
  );
}

