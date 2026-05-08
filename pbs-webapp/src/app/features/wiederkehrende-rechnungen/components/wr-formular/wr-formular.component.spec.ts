import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { WrFormularComponent } from './wr-formular.component';

function titleInput(fixture: ComponentFixture<WrFormularComponent>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input[type="text"]');
}

function saveButton(fixture: ComponentFixture<WrFormularComponent>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button.btn-primary');
}

describe('WrFormularComponent', () => {
  let fixture: ComponentFixture<WrFormularComponent>;
  let component: WrFormularComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WrFormularComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('customers', []);
    fixture.detectChanges();
  });

  it('keeps save disabled while the required title is empty', () => {
    expect(saveButton(fixture).disabled).toBe(true);
  });

  it('emits recurring invoice data after entering a valid title', () => {
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    const input = titleInput(fixture);
    input.value = 'Monatliche Reinigung';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    saveButton(fixture).click();

    expect(savedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        titel: 'Monatliche Reinigung',
      }),
    );
  });
});
