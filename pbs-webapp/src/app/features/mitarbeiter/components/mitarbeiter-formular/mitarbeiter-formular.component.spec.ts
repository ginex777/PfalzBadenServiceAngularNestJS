import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MitarbeiterFormularComponent } from './mitarbeiter-formular.component';

function firstTextInput(fixture: ComponentFixture<MitarbeiterFormularComponent>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input[type="text"]');
}

function saveButton(fixture: ComponentFixture<MitarbeiterFormularComponent>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button.btn-primary');
}

describe('MitarbeiterFormularComponent', () => {
  let fixture: ComponentFixture<MitarbeiterFormularComponent>;
  let component: MitarbeiterFormularComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MitarbeiterFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MitarbeiterFormularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps save disabled while the required name is empty', () => {
    expect(saveButton(fixture).disabled).toBe(true);
  });

  it('emits form data after entering a valid name', () => {
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    const nameInput = firstTextInput(fixture);
    nameInput.value = 'Max Mustermann';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    saveButton(fixture).click();

    expect(savedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Max Mustermann',
      }),
    );
  });
});
