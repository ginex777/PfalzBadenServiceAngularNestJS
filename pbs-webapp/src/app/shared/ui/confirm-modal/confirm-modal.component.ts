import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, inject, input, output } from '@angular/core';

const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent implements OnInit {
  private readonly el = inject(ElementRef);

  readonly titel = input<string>('Bestätigung erforderlich');
  readonly nachricht = input.required<string>();
  readonly bestaetigenLabel = input<string>('Löschen');
  readonly abbrechenLabel = input<string>('Abbrechen');
  readonly gefaehrlich = input<boolean>(true);
  readonly bestaetigt = output<void>();
  readonly abgebrochen = output<void>();

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
    this.abgebrochen.emit();
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const focusable = Array.from<HTMLElement>(this.el.nativeElement.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) { event.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  protected bestaetigen(): void {
    this.bestaetigt.emit();
  }

  protected abbrechen(): void {
    this.abgebrochen.emit();
  }
}
