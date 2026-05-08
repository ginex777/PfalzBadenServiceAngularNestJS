import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { AngeboteTabelleComponent } from './angebote-tabelle.component';
import type { Angebot } from '../../../../core/models';

const quote: Angebot = {
  id: 1,
  nr: 'A-1',
  empf: 'Kunde GmbH',
  titel: 'Testangebot',
  datum: '2026-05-08',
  brutto: 119,
  angenommen: false,
  abgelehnt: false,
  gesendet: false,
  positionen: [{ bez: 'Reinigung', gesamtpreis: 100 }],
};

describe('AngeboteTabelleComponent', () => {
  let component: AngeboteTabelleComponent;
  let fixture: ComponentFixture<AngeboteTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngeboteTabelleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngeboteTabelleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('quotes', []);
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

    component.editRequested.emit(quote);
    component.copyRequested.emit(quote);
    component.deleteRequested.emit(quote.id);

    expect(editSpy).toHaveBeenCalledWith(quote);
    expect(copySpy).toHaveBeenCalledWith(quote);
    expect(deleteSpy).toHaveBeenCalledWith(quote.id);
  });
});
