import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DrawerComponent } from './drawer.component';

@Component({
  standalone: true,
  imports: [DrawerComponent],
  template: `
    <button id="before">Before</button>
    <app-drawer
      [isOpen]="isOpen()"
      ariaLabel="Test drawer"
      title="Details"
      position="right"
      (closed)="closedCount.set(closedCount() + 1)"
    >
      <button id="inside">Inside</button>
      <button id="last">Last</button>
    </app-drawer>
  `,
})
class DrawerHostComponent {
  readonly isOpen = signal(true);
  readonly closedCount = signal(0);
}

describe('DrawerComponent', () => {
  let fixture: ComponentFixture<DrawerHostComponent>;
  let host: DrawerHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawerHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an accessible right-side dialog', () => {
    const drawer = fixture.nativeElement.querySelector('aside') as HTMLElement;

    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(drawer.getAttribute('aria-label')).toBe('Test drawer');
    expect(drawer.classList.contains('app-drawer--right')).toBe(true);
  });

  it('emits closed from the close button, overlay, and escape key', () => {
    const close = fixture.nativeElement.querySelector('.app-modal__close') as HTMLButtonElement;
    close.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const overlay = fixture.nativeElement.querySelector('.app-drawer__overlay') as HTMLElement;
    overlay.click();

    expect(host.closedCount()).toBe(3);
  });
});
