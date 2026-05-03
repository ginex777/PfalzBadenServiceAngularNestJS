import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { WiederkehrendeAusgabe } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { WiederkehrendeAusgabenFacade } from './wiederkehrende-ausgaben.facade';
import { WiederkehrendeAusgabenService } from './wiederkehrende-ausgaben.service';
import type { WiederkehrendeAusgabeFormularDaten } from './wiederkehrende-ausgaben.models';

interface WiederkehrendeAusgabenServiceMock {
  alleLaden: ReturnType<typeof vi.fn>;
  erstellen: ReturnType<typeof vi.fn>;
  aktualisieren: ReturnType<typeof vi.fn>;
  loeschen: ReturnType<typeof vi.fn>;
}

const savedExpense: WiederkehrendeAusgabe = {
  id: 1,
  name: 'Software',
  kategorie: 'Betriebsausgabe',
  brutto: 119,
  mwst: 19,
  abzug: 100,
  aktiv: true,
};

describe('WiederkehrendeAusgabenFacade', () => {
  let facade: WiederkehrendeAusgabenFacade;
  let expensesService: WiederkehrendeAusgabenServiceMock;

  beforeEach(() => {
    expensesService = {
      alleLaden: vi.fn(() => of([savedExpense])),
      erstellen: vi.fn(() => of(savedExpense)),
      aktualisieren: vi.fn(() => of(savedExpense)),
      loeschen: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        WiederkehrendeAusgabenFacade,
        { provide: WiederkehrendeAusgabenService, useValue: expensesService },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });

    facade = TestBed.inject(WiederkehrendeAusgabenFacade);
  });

  it('creates recurring expenses with raw form data only', () => {
    const formData: WiederkehrendeAusgabeFormularDaten = {
      name: 'Software',
      kategorie: 'Betriebsausgabe',
      brutto: 119,
      mwst: 19,
      abzug: 100,
      belegnr: 'B-001',
      aktiv: true,
    };

    facade.formularDaten.set(formData);
    facade.speichern();

    expect(expensesService.erstellen).toHaveBeenCalledWith(formData);
    expect(expensesService.erstellen).not.toHaveBeenCalledWith(
      expect.objectContaining({ netto: expect.any(Number) }),
    );
    expect(expensesService.erstellen).not.toHaveBeenCalledWith(
      expect.objectContaining({ vst: expect.any(Number) }),
    );
  });
});
