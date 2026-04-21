import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RechnungenFacade } from './rechnungen.facade';
import { API_BASE_URL } from '../../core/tokens';
import { Rechnung } from '../../core/models';

describe('RechnungenFacade', () => {
  let facade: RechnungenFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RechnungenFacade,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    facade = TestBed.inject(RechnungenFacade);
  });

  it('sollte erstellt werden', () => {
    expect(facade).toBeTruthy();
  });

  describe('statistik()', () => {
    it('sollte offene Rechnungen korrekt summieren', () => {
      facade.rechnungen.set([
        { id: 1, nr: 'R-1', empf: 'A', bezahlt: false, brutto: 100 } as Rechnung,
        { id: 2, nr: 'R-2', empf: 'B', bezahlt: true, brutto: 200 } as Rechnung,
        { id: 3, nr: 'R-3', empf: 'C', bezahlt: false, brutto: 50 } as Rechnung,
      ]);
      expect(facade.statistik().offen).toBe(150);
      expect(facade.statistik().gesamtumsatz).toBe(200);
    });

    it('sollte 0 zurückgeben wenn keine Rechnungen', () => {
      facade.rechnungen.set([]);
      expect(facade.statistik().offen).toBe(0);
      expect(facade.statistik().gesamtumsatz).toBe(0);
      expect(facade.statistik().ueberfaellig).toBe(0);
    });
  });

  describe('gefilterteRechnungen()', () => {
    const testRechnungen: Rechnung[] = [
      { id: 1, nr: 'R-2026-001', empf: 'Müller GmbH', titel: 'April', bezahlt: false } as Rechnung,
      { id: 2, nr: 'R-2026-002', empf: 'Schulz AG', titel: 'Mai', bezahlt: true } as Rechnung,
      { id: 3, nr: 'R-2026-003', empf: 'Koch KG', titel: 'Juni', bezahlt: false } as Rechnung,
    ];

    beforeEach(() => {
      facade.rechnungen.set(testRechnungen);
    });

    it('sollte nach "offen" filtern', () => {
      facade.aktiverFilter.set('offen');
      const result = facade.gefilterteRechnungen();
      expect(result.every((r) => !r.bezahlt)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('sollte nach "bezahlt" filtern', () => {
      facade.aktiverFilter.set('bezahlt');
      const result = facade.gefilterteRechnungen();
      expect(result.every((r) => r.bezahlt)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('sollte nach Suchbegriff (Empfänger) filtern', () => {
      facade.suchbegriff.set('müller');
      const result = facade.gefilterteRechnungen();
      expect(result.length).toBe(1);
      expect(result[0].empf).toBe('Müller GmbH');
    });

    it('sollte nach Rechnungs-Nr. suchen', () => {
      facade.suchbegriff.set('002');
      const result = facade.gefilterteRechnungen();
      expect(result.length).toBe(1);
      expect(result[0].nr).toBe('R-2026-002');
    });

    it('sollte alle zurückgeben wenn kein Filter gesetzt', () => {
      facade.aktiverFilter.set('alle');
      facade.suchbegriff.set('');
      expect(facade.gefilterteRechnungen().length).toBe(3);
    });
  });

  describe('Paginierung', () => {
    it('sollte gesamtSeiten korrekt berechnen (30 Einträge → 2 Seiten)', () => {
      facade.rechnungen.set(
        Array.from(
          { length: 30 },
          (_, i) => ({ id: i + 1, nr: `R-${i}`, empf: 'Test', bezahlt: false }) as Rechnung,
        ),
      );
      expect(facade.gesamtSeiten()).toBe(2);
    });

    it('sollte seiteVor die Seite erhöhen', () => {
      facade.rechnungen.set(
        Array.from(
          { length: 30 },
          (_, i) => ({ id: i + 1, nr: `R-${i}`, empf: 'Test', bezahlt: false }) as Rechnung,
        ),
      );
      facade.seiteVor();
      expect(facade.aktuelleSeite()).toBe(2);
    });

    it('sollte seiteZurueck nicht unter 1 gehen', () => {
      facade.aktuelleSeite.set(1);
      facade.seiteZurueck();
      expect(facade.aktuelleSeite()).toBe(1);
    });
  });

  describe('netto() / brutto()', () => {
    it('sollte Netto korrekt aus Positionen summieren', () => {
      facade.formularDaten.update((d) => ({
        ...d,
        positionen: [
          { bez: 'Pos 1', gesamtpreis: 100, stunden: '', einzelpreis: undefined },
          { bez: 'Pos 2', gesamtpreis: 50, stunden: '', einzelpreis: undefined },
        ],
        mwst_satz: 19,
      }));
      expect(facade.netto()).toBe(150);
    });

    it('sollte Brutto mit 19% MwSt berechnen', () => {
      facade.formularDaten.update((d) => ({
        ...d,
        positionen: [{ bez: 'Pos 1', gesamtpreis: 100, stunden: '', einzelpreis: undefined }],
        mwst_satz: 19,
      }));
      expect(facade.brutto()).toBeCloseTo(119);
    });

    it('sollte Brutto mit 0% MwSt gleich Netto sein', () => {
      facade.formularDaten.update((d) => ({
        ...d,
        positionen: [{ bez: 'Pos 1', gesamtpreis: 200, stunden: '', einzelpreis: undefined }],
        mwst_satz: 0,
      }));
      expect(facade.brutto()).toBe(200);
    });
  });

  describe('formularGeaendert()', () => {
    it('sollte false sein bei leerem Formular', () => {
      expect(facade.formularGeaendert()).toBe(false);
    });

    it('sollte true sein wenn Empfänger gesetzt', () => {
      facade.formularDaten.update((d) => ({ ...d, empf: 'Test GmbH' }));
      expect(facade.formularGeaendert()).toBe(true);
    });

    it('sollte true sein wenn Titel gesetzt', () => {
      facade.formularDaten.update((d) => ({ ...d, titel: 'Rechnung Mai' }));
      expect(facade.formularGeaendert()).toBe(true);
    });
  });
});
