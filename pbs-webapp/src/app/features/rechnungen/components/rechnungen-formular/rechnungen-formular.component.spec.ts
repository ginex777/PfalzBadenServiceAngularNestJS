import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { RechnungenFormularComponent } from './rechnungen-formular.component';

describe('RechnungenFormularComponent', () => {
  let component: RechnungenFormularComponent;
  let fixture: ComponentFixture<RechnungenFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechnungenFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RechnungenFormularComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formData', {
      nr: '',
      empf: '',
      str: '',
      ort: '',
      email: '',
      datum: '',
      leistungsdatum: '',
      zahlungsziel: 14,
      titel: '',
      positionen: [{ bez: '', stunden: '', gesamtpreis: 0 }],
      mwst_satz: 19,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits explicit save and cancel request events', () => {
    const saveSpy = vi.fn();
    const cancelSpy = vi.fn();
    component.saveRequested.subscribe(saveSpy);
    component.cancelRequested.subscribe(cancelSpy);

    component.saveRequested.emit();
    component.cancelRequested.emit();

    expect(saveSpy).toHaveBeenCalledOnce();
    expect(cancelSpy).toHaveBeenCalledOnce();
  });
});
