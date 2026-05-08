import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  readonly title = input<string>('Etwas ist schiefgelaufen');
  readonly message = input<string>('Bitte versuchen Sie es erneut.');
  readonly actionLabel = input<string | null>(null);

  readonly action = output<void>();
}
