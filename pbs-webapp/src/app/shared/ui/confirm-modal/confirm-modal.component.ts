import type {
  OnInit} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';

const FOCUSABLE =
  'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent implements OnInit {
  private readonly el = inject(ElementRef);

  readonly title = input<string>('Bestaetigung erforderlich');
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Loeschen');
  readonly cancelLabel = input<string>('Abbrechen');
  readonly isDangerous = input<boolean>(true);
  readonly confirmed = output<void>();
  readonly canceled = output<void>();

  ngOnInit(): void {
    setTimeout(() => {
      const first = this.el.nativeElement.querySelector(FOCUSABLE) as HTMLElement | null;

      if (first) {
        first.focus();
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.canceled.emit();
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
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

  protected confirm(): void {
    this.confirmed.emit();
  }

  protected cancel(): void {
    this.canceled.emit();
  }
}
