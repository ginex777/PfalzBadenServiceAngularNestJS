import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-overflow-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-menu" [class.open]="isOpen()">
      <button
        class="btn-action overflow-menu__trigger"
        type="button"
        [attr.aria-expanded]="isOpen()"
        aria-label="Weitere Aktionen"
        (click)="toggle($event)"
      >
        ···
      </button>
      <div class="overflow-menu__panel" role="menu">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .overflow-menu {
        position: relative;
        display: inline-block;
      }

      .overflow-menu__trigger {
        letter-spacing: 2px;
        padding: 5px 10px;
        line-height: 1;
      }

      .overflow-menu__panel {
        display: none;
        position: absolute;
        right: 0;
        top: calc(100% + 4px);
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: var(--z-dropdown, 100);
        min-width: 160px;
        padding: 4px;
        flex-direction: column;
        gap: 2px;
      }

      .overflow-menu.open .overflow-menu__panel {
        display: flex;
      }

      :host ::ng-deep .overflow-menu__panel .btn-action {
        width: 100%;
        justify-content: flex-start;
        border-radius: 4px;
      }
    `,
  ],
})
export class OverflowMenuComponent {
  private readonly el = inject(ElementRef);
  readonly isOpen = signal(false);

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
