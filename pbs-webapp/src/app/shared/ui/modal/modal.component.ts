import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly closed = output<void>();

  protected close(): void {
    this.closed.emit();
  }
}
