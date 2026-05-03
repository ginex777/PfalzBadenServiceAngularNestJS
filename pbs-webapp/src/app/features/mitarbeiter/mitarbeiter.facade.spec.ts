import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MitarbeiterFacade } from './mitarbeiter.facade';
import { MitarbeiterService } from './mitarbeiter.service';
import { ToastService } from '../../core/services/toast.service';
import type { MitarbeiterStunden } from '../../core/models';

const mockService = {
  alleLaden: jest.fn(),
  aktualisieren: jest.fn(),
  erstellen: jest.fn(),
  loeschen: jest.fn(),
  stundenLaden: jest.fn(),
  stundenErstellen: jest.fn(),
  stundenAktualisieren: jest.fn(),
  stundenLoeschen: jest.fn(),
  loadTimeTracking: jest.fn(),
  abrechnungPdfOeffnen: jest.fn(),
  clockIn: jest.fn(),
  clockOut: jest.fn(),
};

const mockToast = { error: jest.fn(), success: jest.fn() };

describe('MitarbeiterFacade', () => {
  let facade: MitarbeiterFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        MitarbeiterFacade,
        { provide: MitarbeiterService, useValue: mockService },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    facade = TestBed.inject(MitarbeiterFacade);
  });

  it('should be created', () => {
    expect(facade).toBeTruthy();
  });

  it('sendet beim Stundeneintrag nur Eingaben, nicht berechneten Lohn', () => {
    const saved = {
      id: 1,
      mitarbeiter_id: 10,
      datum: '2026-05-01',
      stunden: 2,
      lohn: 50,
      zuschlag: 5,
      bezahlt: false,
    } satisfies MitarbeiterStunden;
    mockService.stundenErstellen.mockReturnValue(of(saved));
    facade.aktiverMitarbeiter.set({
      id: 10,
      name: 'Test',
      stundenlohn: 20,
      aktiv: true,
    });
    facade.stundenFormular.update((form) => ({
      ...form,
      datum: '2026-05-01',
      stunden: 2,
      lohnSatz: 25,
      zuschlagProzent: 10,
    }));

    facade.stundenEintragen();

    expect(mockService.stundenErstellen).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        datum: '2026-05-01',
        stunden: 2,
        lohn_satz: 25,
        zuschlag_typ: '10%',
      }),
    );
    expect(mockService.stundenErstellen).toHaveBeenCalledWith(
      10,
      expect.not.objectContaining({
        lohn: expect.any(Number),
        zuschlag: expect.any(Number),
      }),
    );
  });

  it('sendet beim Bezahlt-Toggle nur den Status', () => {
    const existing = {
      id: 1,
      mitarbeiter_id: 10,
      datum: '2026-05-01',
      stunden: 2,
      lohn: 50,
      zuschlag: 5,
      bezahlt: false,
    } satisfies MitarbeiterStunden;
    mockService.stundenAktualisieren.mockReturnValue(of({ ...existing, bezahlt: true }));
    facade.stunden.set([existing]);

    facade.bezahltToggle(1, true);

    expect(mockService.stundenAktualisieren).toHaveBeenCalledWith(1, { bezahlt: true });
  });
});
