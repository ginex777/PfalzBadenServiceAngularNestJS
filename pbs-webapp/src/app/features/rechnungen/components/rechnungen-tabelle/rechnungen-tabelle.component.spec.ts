import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { RechnungenTabelleComponent } from './rechnungen-tabelle.component';
import type { Rechnung } from '../../../../core/models';

const invoice: Rechnung = {
  id: 1,
  nr: 'R-1',
  empf: 'Kunde GmbH',
  titel: 'Testrechnung',
  datum: '2026-05-08',
  brutto: 119,
  bezahlt: false,
  positionen: [{ bez: 'Reinigung', gesamtpreis: 100 }],
};

describe('RechnungenTabelleComponent', () => {
  let component: RechnungenTabelleComponent;
  let fixture: ComponentFixture<RechnungenTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechnungenTabelleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RechnungenTabelleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('invoices', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits explicit row action request events', () => {
    const editSpy = vi.fn();
    const copySpy = vi.fn();
    const deleteSpy = vi.fn();
    component.editRequested.subscribe(editSpy);
    component.copyRequested.subscribe(copySpy);
    component.deleteRequested.subscribe(deleteSpy);

    component.editRequested.emit(invoice);
    component.copyRequested.emit(invoice);
    component.deleteRequested.emit(invoice.id);

    expect(editSpy).toHaveBeenCalledWith(invoice);
    expect(copySpy).toHaveBeenCalledWith(invoice);
    expect(deleteSpy).toHaveBeenCalledWith(invoice.id);
  });
});
