import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { EinsatzFormularComponent } from './einsatz-formular.component';

describe('EinsatzFormularComponent', () => {
  let component: EinsatzFormularComponent;
  let fixture: ComponentFixture<EinsatzFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EinsatzFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EinsatzFormularComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', {
      mitarbeiter_id: null,
      mitarbeiter_name: '',
      kunden_id: null,
      kunden_name: '',
      datum: '',
      taetigkeiten: [{ beschreibung: '', stunden: 0 }],
      notiz: '',
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

    component.saveRequested.emit({ withPdf: true, syncStunden: false });
    component.cancelRequested.emit();

    expect(saveSpy).toHaveBeenCalledWith({ withPdf: true, syncStunden: false });
    expect(cancelSpy).toHaveBeenCalledOnce();
  });
});
