import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import type { OnChanges } from '@angular/core';

const FOCUSABLE =
  'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent implements OnChanges {
  private readonly el = inject(ElementRef);
  private _previousFocus: HTMLElement | null = null;

  readonly isOpen = input<boolean>(false);
  readonly ariaLabel = input<string>('Drawer');
  readonly position = input<'left' | 'right'>('left');
  readonly title = input<string>('');

  readonly closed = output<void>();

  ngOnChanges(): void {
    if (this.isOpen()) {
      this._previousFocus = document.activeElement as HTMLElement | null;
      setTimeout(() => {
        const first = this.el.nativeElement.querySelector(FOCUSABLE) as HTMLElement | null;
        first?.focus();
      });
    } else {
      this._previousFocus?.focus();
      this._previousFocus = null;
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isOpen()) this.closed.emit();
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen() || event.key !== 'Tab') return;
    const focusable = Array.from<HTMLElement>(this.el.nativeElement.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  protected close(): void {
    this.closed.emit();
  }
}
