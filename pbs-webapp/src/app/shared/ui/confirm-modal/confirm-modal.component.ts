import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  readonly titel = input<string>('Bestätigung erforderlich');
  readonly nachricht = input.required<string>();
  readonly bestaetigenLabel = input<string>('Löschen');
  readonly abbrechenLabel = input<string>('Abbrechen');
  readonly gefaehrlich = input<boolean>(true);
  readonly bestaetigt = output<void>();
  readonly abgebrochen = output<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.abgebrochen.emit();
  }

  protected bestaetigen(): void {
    this.bestaetigt.emit();
  }

  protected abbrechen(): void {
    this.abgebrochen.emit();
  }
}
