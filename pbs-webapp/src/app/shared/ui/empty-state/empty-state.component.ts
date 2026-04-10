import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly titel = input.required<string>();
  readonly beschreibung = input<string>('');
  readonly aktionLabel = input<string>('');
  readonly aktion = output<void>();

  protected aktionAusfuehren(): void {
    this.aktion.emit();
  }
}
