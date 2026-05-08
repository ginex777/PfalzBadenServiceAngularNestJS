import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { OverflowMenuComponent } from './overflow-menu.component';

describe('OverflowMenuComponent', () => {
  let fixture: ComponentFixture<OverflowMenuComponent>;
  let component: OverflowMenuComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverflowMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OverflowMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('toggles the menu and updates aria-expanded', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    button.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on document clicks', () => {
    component.isOpen.set(true);

    document.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });
});
