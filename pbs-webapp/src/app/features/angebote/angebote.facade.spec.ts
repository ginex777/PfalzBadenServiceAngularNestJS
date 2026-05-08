import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AngeboteFacade } from './angebote.facade';
import { AngeboteService } from './angebote.service';
import { ToastService } from '../../core/services/toast.service';
import { API_BASE_URL } from '../../core/tokens';
import type { Angebot } from '../../core/models';

const testAngebote: Angebot[] = [
  {
    id: 1,
    nr: '2026-001',
    empf: 'Müller GmbH',
    angenommen: false,
    abgelehnt: false,
    gesendet: false,
    brutto: 300,
    datum: '2026-04-01',
  } as Angebot,
  {
    id: 2,
    nr: '2026-002',
    empf: 'Schulz AG',
    angenommen: true,
    abgelehnt: false,
    gesendet: true,
    brutto: 150,
    datum: '2026-03-15',
  } as Angebot,
  {
    id: 3,
    nr: '2026-003',
    empf: 'Koch KG',
    angenommen: false,
    abgelehnt: true,
    gesendet: false,
    brutto: 200,
    datum: '2026-02-20',
  } as Angebot,
];

const mockService = {
  angeboteUndKundenLaden: jest.fn(),
  firmaEinstellungenLaden: jest.fn(),
  createOffer: jest.fn(),
  updateOffer: jest.fn(),
  deleteOffer: jest.fn(),
  createCustomer: jest.fn(),
  nettoBerechnen: jest.fn().mockReturnValue(0),
  bruttoBerechnen: jest.fn().mockReturnValue(0),
  pdfOeffnen: jest.fn().mockResolvedValue(undefined),
};

const mockToast = { success: jest.fn(), error: jest.fn() };

describe('AngeboteFacade', () => {
  let facade: AngeboteFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService.angeboteUndKundenLaden.mockReturnValue(of({ angebote: [], kunden: [] }));
    mockService.firmaEinstellungenLaden.mockReturnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        AngeboteFacade,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AngeboteService, useValue: mockService },
        { provide: ToastService, useValue: mockToast },
      ],
    });
    facade = TestBed.inject(AngeboteFacade);
  });

  it('sollte erstellt werden', () => {
    expect(facade).toBeTruthy();
  });

  describe('gefilterteAngebote()', () => {
    beforeEach(() => facade.angebote.set(testAngebote));

    it('zeigt alle Angebote bei Filter "alle"', () => {
      facade.aktiverFilter.set('alle');
      expect(facade.gefilterteAngebote()).toHaveLength(3);
    });

    it('filtert nach "offen" (weder angenommen noch abgelehnt)', () => {
      facade.aktiverFilter.set('offen');
      const result = facade.gefilterteAngebote();
      expect(result.every((a) => !a.angenommen && !a.abgelehnt)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('filtert nach "angenommen"', () => {
      facade.aktiverFilter.set('angenommen');
      expect(facade.gefilterteAngebote().every((a) => a.angenommen)).toBe(true);
    });

    it('filtert nach "abgelehnt"', () => {
      facade.aktiverFilter.set('abgelehnt');
      expect(facade.gefilterteAngebote().every((a) => a.abgelehnt)).toBe(true);
    });

    it('filtert nach "gesendet"', () => {
      facade.aktiverFilter.set('gesendet');
      expect(facade.gefilterteAngebote().every((a) => a.gesendet)).toBe(true);
    });
  });

  describe('Suche (suchbegriff)', () => {
    beforeEach(() => facade.angebote.set(testAngebote));

    it('filtert nach Rechnungsnummer', () => {
      facade.suchbegriff.set('2026-001');
      expect(facade.gefilterteAngebote()).toHaveLength(1);
      expect(facade.gefilterteAngebote()[0].empf).toBe('Müller GmbH');
    });

    it('filtert nach Empfänger (case-insensitive)', () => {
      facade.suchbegriff.set('schulz');
      expect(facade.gefilterteAngebote()).toHaveLength(1);
    });

    it('gibt alle zurück wenn Suchbegriff leer', () => {
      facade.suchbegriff.set('');
      expect(facade.gefilterteAngebote()).toHaveLength(3);
    });
  });

  describe('Pagination', () => {
    it('berechnet gesamtSeiten korrekt', () => {
      const viele = Array.from({ length: 30 }, (_, i) => ({
        ...testAngebote[0],
        id: i + 1,
        nr: `${i + 1}`,
      }));
      facade.angebote.set(viele);
      expect(facade.gesamtSeiten()).toBe(2); // PAGE_SIZE = 25
    });

    it('seiteVor() erhöht Seite', () => {
      const viele = Array.from({ length: 30 }, (_, i) => ({
        ...testAngebote[0],
        id: i + 1,
        nr: `${i + 1}`,
      }));
      facade.angebote.set(viele);
      facade.aktuelleSeite.set(1);
      facade.seiteVor();
      expect(facade.aktuelleSeite()).toBe(2);
    });

    it('seiteZurueck() unterschreitet nicht 1', () => {
      facade.aktuelleSeite.set(1);
      facade.seiteZurueck();
      expect(facade.aktuelleSeite()).toBe(1);
    });

    it('seiteSetzen() begrenzt die Seite auf den vorhandenen Bereich', () => {
      const viele = Array.from({ length: 30 }, (_, i) => ({
        ...testAngebote[0],
        id: i + 1,
        nr: `${i + 1}`,
      }));
      facade.angebote.set(viele);

      facade.seiteSetzen(99);
      expect(facade.aktuelleSeite()).toBe(2);

      facade.seiteSetzen(0);
      expect(facade.aktuelleSeite()).toBe(1);
    });
  });

  describe('loeschenAusfuehren()', () => {
    it('entfernt Angebot aus Liste nach erfolgreichem Löschen', () => {
      facade.angebote.set(testAngebote);
      facade.loeschKandidat.set(2);
      mockService.deleteOffer.mockReturnValue(of(undefined));

      facade.loeschenAusfuehren();

      expect(facade.angebote()).toHaveLength(2);
      expect(facade.angebote().find((a) => a.id === 2)).toBeUndefined();
      expect(facade.loeschKandidat()).toBeNull();
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('zeigt Fehler-Toast bei Löschen-Fehler', () => {
      facade.angebote.set(testAngebote);
      facade.loeschKandidat.set(1);
      mockService.deleteOffer.mockReturnValue(throwError(() => new Error('Netzwerk')));

      facade.loeschenAusfuehren();

      expect(facade.angebote()).toHaveLength(3); // nicht verändert
      expect(mockToast.error).toHaveBeenCalled();
    });

    it('tut nichts wenn kein loeschKandidat gesetzt', () => {
      facade.loeschKandidat.set(null);
      facade.loeschenAusfuehren();
      expect(mockService.deleteOffer).not.toHaveBeenCalled();
    });
  });

  describe('speichern()', () => {
    it('zeigt Fehler wenn empf oder nr fehlt', () => {
      facade.formularDaten.update((d) => ({ ...d, empf: '', nr: '' }));
      facade.speichern();
      expect(mockToast.error).toHaveBeenCalledWith('Bitte Angebots-Nr. und Empfänger ausfüllen.');
      expect(mockService.createOffer).not.toHaveBeenCalled();
    });

    it('erstellt neues Angebot und fügt es der Liste hinzu', () => {
      const gespeichert = { ...testAngebote[0], id: 99 };
      mockService.createOffer.mockReturnValue(of(gespeichert));
      facade.formularDaten.update((d) => ({ ...d, empf: 'Neuer Kunde', nr: '2026-099' }));
      facade.angebote.set([]);

      facade.speichern();

      expect(facade.angebote()).toHaveLength(1);
      expect(facade.angebote()[0].id).toBe(99);
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('sendet keine autoritative Angebotssumme an das Backend', () => {
      const gespeichert = { ...testAngebote[0], id: 100, brutto: 238 };
      mockService.createOffer.mockReturnValue(of(gespeichert));
      facade.formularDaten.update((d) => ({
        ...d,
        empf: 'Neuer Kunde',
        nr: '2026-100',
        positionen: [{ bez: 'Pos 1', gesamtpreis: 200 }],
      }));

      facade.speichern();

      expect(mockService.createOffer).toHaveBeenCalledWith(
        expect.not.objectContaining({ brutto: expect.any(Number) }),
      );
      expect(mockService.createOffer).toHaveBeenCalledWith(
        expect.objectContaining({ positionen: [{ bez: 'Pos 1', gesamtpreis: 200 }] }),
      );
    });

    it('aktualisiert vorhandenes Angebot bei Bearbeitungsmodus', () => {
      const existing = testAngebote[1];
      const updated = { ...existing, empf: 'Geändert' };
      facade.angebote.set(testAngebote);
      facade.bearbeitungStarten(existing);
      facade.formularDaten.update((d) => ({ ...d, empf: 'Geändert' }));
      mockService.updateOffer.mockReturnValue(of(updated));

      facade.speichern();

      const inList = facade.angebote().find((a) => a.id === existing.id);
      expect(inList?.empf).toBe('Geändert');
    });
  });

  describe('angebotKopieren()', () => {
    it('befüllt Formular mit Daten des geklonten Angebots (neue Nr)', () => {
      facade.angebote.set(testAngebote);
      facade.angebotKopieren(testAngebote[0]);
      expect(facade.formularDaten().empf).toBe(testAngebote[0].empf);
      expect(facade.bearbeitetesAngebot()).toBeNull(); // kein Edit-Modus
    });
  });

  describe('filterSetzen()', () => {
    it('setzt Filter und resettet Seite auf 1', () => {
      facade.aktuelleSeite.set(3);
      facade.filterSetzen('angenommen');
      expect(facade.aktiverFilter()).toBe('angenommen');
      expect(facade.aktuelleSeite()).toBe(1);
    });
  });
});
