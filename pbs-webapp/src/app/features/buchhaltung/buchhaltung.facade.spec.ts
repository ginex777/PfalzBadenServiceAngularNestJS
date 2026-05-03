import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { BuchhaltungFacade } from './buchhaltung.facade';
import { BuchhaltungService } from './buchhaltung.service';
import { ToastService } from '../../core/services/toast.service';
import { API_BASE_URL } from '../../core/tokens';
import type { BuchhaltungEintrag } from '../../core/models';

const mockService = {
  jahresDateLaden: jest.fn(),
  jahresZusammenfassungLaden: jest.fn(),
  loadVst: jest.fn(),
  loadLockedMonths: jest.fn(),
  batchSpeichern: jest.fn(),
  eintragLoeschen: jest.fn(),
  lockMonth: jest.fn(),
  unlockMonth: jest.fn(),
  saveVst: jest.fn(),
  loadRecurringExpenses: jest.fn(),
};

const mockToast = { success: jest.fn(), error: jest.fn() };

function makeZeile(
  overrides: Partial<BuchhaltungEintrag & { _tempId: string }> = {},
): BuchhaltungEintrag & { _tempId: string } {
  const base = {
    id: 1,
    jahr: 2026,
    monat: 1,
    typ: 'inc',
    brutto: 100,
    mwst: 19,
    abzug: 100,
    _tempId: 'tmp-1',
  } satisfies BuchhaltungEintrag & { _tempId: string };

  return { ...base, ...overrides };
}

describe('BuchhaltungFacade', () => {
  let facade: BuchhaltungFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService.jahresDateLaden.mockReturnValue(of({}));
    mockService.jahresZusammenfassungLaden.mockReturnValue(
      of({
        months: Array.from({ length: 12 }, (_, month) => ({
          month,
          incomeNet: 0,
          incomeVat: 0,
          expenseNet: 0,
          inputVat: 0,
          vatLiability: 0,
          profit: 0,
        })),
        quarters: [],
      }),
    );
    mockService.loadVst.mockReturnValue(of([]));
    mockService.loadLockedMonths.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        BuchhaltungFacade,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: BuchhaltungService, useValue: mockService },
        { provide: ToastService, useValue: mockToast },
      ],
    });
    facade = TestBed.inject(BuchhaltungFacade);
  });

  it('sollte erstellt werden', () => {
    expect(facade).toBeTruthy();
  });

  describe('istGesperrt()', () => {
    it('gibt false zurück wenn aktueller Monat nicht gesperrt', () => {
      facade.aktuellerMonat.set(3);
      facade.gesperrteMonateSet.set(new Set([0, 1, 2]));
      expect(facade.istGesperrt()).toBe(false);
    });

    it('gibt true zurück wenn aktueller Monat gesperrt', () => {
      facade.aktuellerMonat.set(2);
      facade.gesperrteMonateSet.set(new Set([2]));
      expect(facade.istGesperrt()).toBe(true);
    });
  });

  describe('einnahmeZeileHinzufuegen()', () => {
    it('fügt neue Zeile zu aktuellem Monat hinzu', () => {
      facade.aktuellerMonat.set(0);
      facade.gesperrteMonateSet.set(new Set());
      facade.einnahmeZeileHinzufuegen();
      expect(facade.aktuelleEinnahmen()).toHaveLength(1);
      expect(facade.aktuelleEinnahmen()[0].typ).toBe('inc');
    });

    it('tut nichts wenn Monat gesperrt', () => {
      facade.aktuellerMonat.set(0);
      facade.gesperrteMonateSet.set(new Set([0]));
      facade.einnahmeZeileHinzufuegen();
      expect(facade.aktuelleEinnahmen()).toHaveLength(0);
    });
  });

  describe('ausgabeZeileHinzufuegen()', () => {
    it('fügt neue Ausgaben-Zeile hinzu', () => {
      facade.aktuellerMonat.set(0);
      facade.gesperrteMonateSet.set(new Set());
      facade.ausgabeZeileHinzufuegen();
      expect(facade.aktuelleAusgaben()).toHaveLength(1);
      expect(facade.aktuelleAusgaben()[0].typ).toBe('exp');
    });
  });

  describe('aktuellesMonatsergebnis', () => {
    it('berechnet Einnahmen-Netto korrekt (brutto 119€ mit 19% MwSt → Netto ~100€)', () => {
      facade.aktuellerMonat.set(0);
      facade.gesperrteMonateSet.set(new Set());
      facade['_jahresZusammenfassung'].set({
        months: Array.from({ length: 12 }, (_, month) => ({
          month,
          incomeNet: month === 0 ? 100 : 0,
          incomeVat: month === 0 ? 19 : 0,
          expenseNet: 0,
          inputVat: 0,
          vatLiability: month === 0 ? 19 : 0,
          profit: month === 0 ? 100 : 0,
        })),
        quarters: [],
      });

      const ergebnis = facade.aktuellesMonatsergebnis();
      expect(ergebnis.einnahmenNetto).toBeCloseTo(100, 1);
      expect(ergebnis.einnahmenUst).toBeCloseTo(19, 1);
    });

    it('berechnet Ausgaben-Vorsteuer mit Abzugsquote', () => {
      facade.aktuellerMonat.set(0);
      facade['_jahresZusammenfassung'].set({
        months: Array.from({ length: 12 }, (_, month) => ({
          month,
          incomeNet: 0,
          incomeVat: 0,
          expenseNet: month === 0 ? 50 : 0,
          inputVat: month === 0 ? 9.5 : 0,
          vatLiability: month === 0 ? -9.5 : 0,
          profit: month === 0 ? -50 : 0,
        })),
        quarters: [],
      });

      const ergebnis = facade.aktuellesMonatsergebnis();
      // Vorsteuer = 19 * 50% = 9.5
      expect(ergebnis.vorsteuer).toBeCloseTo(9.5, 1);
    });

    it('berechnet Gewinn = Einnahmen-Netto minus Ausgaben-Netto', () => {
      facade.aktuellerMonat.set(5);
      facade['_jahresZusammenfassung'].set({
        months: Array.from({ length: 12 }, (_, month) => ({
          month,
          incomeNet: month === 5 ? 100 : 0,
          incomeVat: month === 5 ? 19 : 0,
          expenseNet: month === 5 ? 50 : 0,
          inputVat: month === 5 ? 9.5 : 0,
          vatLiability: month === 5 ? 9.5 : 0,
          profit: month === 5 ? 50 : 0,
        })),
        quarters: [],
      });

      const ergebnis = facade.aktuellesMonatsergebnis();
      expect(ergebnis.gewinn).toBeCloseTo(50, 0); // ~100 - ~50
    });
  });

  describe('zeileKopieren()', () => {
    it('fügt eine Kopie der Zeile nach der Original-Zeile ein', () => {
      facade.aktuellerMonat.set(0);
      facade.gesperrteMonateSet.set(new Set());
      const z1 = makeZeile({ _tempId: 'a', brutto: 100, typ: 'inc' });
      const z2 = makeZeile({ _tempId: 'b', brutto: 200, typ: 'inc' });
      facade['_einnahmenZeilen'].set({ 0: [z1, z2] });

      facade.zeileKopieren('inc', 'a');

      const zeilen = facade.aktuelleEinnahmen();
      expect(zeilen).toHaveLength(3);
      expect(zeilen[0]._tempId).toBe('a');
      expect(zeilen[1].brutto).toBe(100); // Kopie von z1
      expect(zeilen[2]._tempId).toBe('b');
    });
  });

  describe('batchSpeichern()', () => {
    it('ruft Service auf und zeigt Erfolgs-Toast', async () => {
      facade.aktuellerMonat.set(0);
      facade.gesperrteMonateSet.set(new Set());
      const saved = [
        { id: 1, jahr: 2026, monat: 1, typ: 'inc', brutto: 100, mwst: 19, abzug: 100 },
      ] as BuchhaltungEintrag[];
      mockService.batchSpeichern.mockReturnValue(of(saved));

      await facade.batchSpeichern();

      expect(mockService.batchSpeichern).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalled();
      expect(facade.speicherStatus().dirty).toBe(false);
    });

    it('setzt dirty=true bei Fehler', async () => {
      facade.aktuellerMonat.set(0);
      facade.gesperrteMonateSet.set(new Set());
      mockService.batchSpeichern.mockReturnValue(throwError(() => new Error('Server error')));

      await facade.batchSpeichern().catch(() => {});

      expect(facade.speicherStatus().dirty).toBe(true);
      expect(mockToast.error).toHaveBeenCalled();
    });

    it('tut nichts wenn Monat gesperrt', async () => {
      facade.aktuellerMonat.set(0);
      facade.gesperrteMonateSet.set(new Set([0]));

      await facade.batchSpeichern();

      expect(mockService.batchSpeichern).not.toHaveBeenCalled();
    });
  });
});
