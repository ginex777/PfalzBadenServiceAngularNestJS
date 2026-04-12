import {
  waehrungFormatieren,
  datumFormatieren,
  steuerBerechnen,
  nettoBerechnen,
  abzugBerechnen,
  monatsnameLaden,
  dateigroesseFormatieren,
  textKuerzen,
  MONATE,
  KATEGORIEN,
} from './index';

describe('@pbs/utils', () => {

  describe('waehrungFormatieren()', () => {
    it('formatiert 1234.5 → "1.234,50 €"', () => {
      expect(waehrungFormatieren(1234.5)).toBe('1.234,50 €');
    });

    it('formatiert 0 → "0,00 €"', () => {
      expect(waehrungFormatieren(0)).toBe('0,00 €');
    });

    it('formatiert negative Beträge', () => {
      expect(waehrungFormatieren(-50)).toBe('-50,00 €');
    });

    it('behandelt undefined/null als 0', () => {
      expect(waehrungFormatieren(undefined as any)).toBe('0,00 €');
      expect(waehrungFormatieren(null as any)).toBe('0,00 €');
    });

    it('rundet auf 2 Nachkommastellen', () => {
      expect(waehrungFormatieren(9.999)).toBe('10,00 €');
    });
  });

  describe('datumFormatieren()', () => {
    it('formatiert ISO-Datum (YYYY-MM-DD) → "DD.MM.YYYY"', () => {
      expect(datumFormatieren('2026-04-12')).toBe('12.04.2026');
    });

    it('formatiert Datumstring mit März korrekt', () => {
      expect(datumFormatieren('2024-03-15')).toBe('15.03.2024');
    });

    it('gibt "–" für null zurück', () => {
      expect(datumFormatieren(null)).toBe('–');
    });

    it('gibt "–" für undefined zurück', () => {
      expect(datumFormatieren(undefined)).toBe('–');
    });

    it('gibt "–" für leeren String zurück', () => {
      expect(datumFormatieren('')).toBe('–');
    });
  });

  describe('steuerBerechnen()', () => {
    it('berechnet MwSt aus Bruttobetrag: 119€ mit 19% → 19€', () => {
      expect(steuerBerechnen(119, 19)).toBeCloseTo(19, 2);
    });

    it('berechnet MwSt mit 7%: 107€ → 7€', () => {
      expect(steuerBerechnen(107, 7)).toBeCloseTo(7, 2);
    });

    it('gibt 0 bei 0% MwSt zurück', () => {
      expect(steuerBerechnen(100, 0)).toBeCloseTo(0, 2);
    });
  });

  describe('nettoBerechnen()', () => {
    it('berechnet Nettobetrag: 119€ mit 19% → 100€', () => {
      expect(nettoBerechnen(119, 19)).toBeCloseTo(100, 2);
    });

    it('berechnet Nettobetrag: 107€ mit 7% → 100€', () => {
      expect(nettoBerechnen(107, 7)).toBeCloseTo(100, 2);
    });

    it('gibt Bruttobetrag zurück bei 0%', () => {
      expect(nettoBerechnen(100, 0)).toBeCloseTo(100, 2);
    });
  });

  describe('abzugBerechnen()', () => {
    it('berechnet 100% Abzug', () => {
      expect(abzugBerechnen(100, 100)).toBe(100);
    });

    it('berechnet 70% Abzug (Bewirtung)', () => {
      expect(abzugBerechnen(100, 70)).toBe(70);
    });

    it('berechnet 0% Abzug (nicht abzugsfähig)', () => {
      expect(abzugBerechnen(100, 0)).toBe(0);
    });

    it('berechnet 50% Abzug (PKW gemischt)', () => {
      expect(abzugBerechnen(200, 50)).toBe(100);
    });
  });

  describe('monatsnameLaden()', () => {
    it('gibt "Januar" für Index 1 zurück', () => {
      expect(monatsnameLaden(1)).toBe('Januar');
    });

    it('gibt "Dezember" für Index 12 zurück', () => {
      expect(monatsnameLaden(12)).toBe('Dezember');
    });

    it('gibt "–" für ungültigen Index zurück', () => {
      expect(monatsnameLaden(0)).toBe('–');
      expect(monatsnameLaden(13)).toBe('–');
    });
  });

  describe('dateigroesseFormatieren()', () => {
    it('formatiert Bytes < 1024', () => {
      expect(dateigroesseFormatieren(512)).toBe('512 B');
    });

    it('formatiert KB', () => {
      expect(dateigroesseFormatieren(1536)).toBe('1.5 KB');
    });

    it('formatiert MB', () => {
      expect(dateigroesseFormatieren(1024 * 1024 * 2)).toBe('2.0 MB');
    });
  });

  describe('textKuerzen()', () => {
    it('kürzt langen Text und fügt "…" an', () => {
      expect(textKuerzen('Hallo Welt, das ist ein langer Text', 10)).toBe('Hallo Welt…');
    });

    it('gibt Text unverändert zurück wenn kürzer als Limit', () => {
      expect(textKuerzen('Kurz', 100)).toBe('Kurz');
    });

    it('gibt Text unverändert zurück wenn genau auf Limit', () => {
      expect(textKuerzen('Genau', 5)).toBe('Genau');
    });
  });

  describe('MONATE Konstante', () => {
    it('hat genau 12 Einträge', () => {
      expect(MONATE).toHaveLength(12);
    });

    it('startet mit Januar und endet mit Dezember', () => {
      expect(MONATE[0]).toBe('Januar');
      expect(MONATE[11]).toBe('Dezember');
    });
  });

  describe('KATEGORIEN Konstante', () => {
    it('hat Bewirtung mit 70% Abzug', () => {
      expect(KATEGORIEN['Bewirtung']).toBe(70);
    });

    it('hat PKW (gemischt 50%) mit 50% Abzug', () => {
      expect(KATEGORIEN['PKW (gemischt 50%)']).toBe(50);
    });

    it('hat Repräsentation mit 0% Abzug (nicht abzugsfähig)', () => {
      expect(KATEGORIEN['Repräsentation']).toBe(0);
    });

    it('hat Betriebsausgabe mit 100% Abzug', () => {
      expect(KATEGORIEN['Betriebsausgabe']).toBe(100);
    });
  });
});
