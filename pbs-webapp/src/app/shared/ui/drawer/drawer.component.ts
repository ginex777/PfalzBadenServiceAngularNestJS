import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent {
  readonly isOpen = input<boolean>(false);
  readonly ariaLabel = input<string>('Drawer');
  readonly position = input<'left' | 'right'>('left');

  readonly closed = output<void>();

  protected close(): void {
    this.closed.emit();
  }
}

