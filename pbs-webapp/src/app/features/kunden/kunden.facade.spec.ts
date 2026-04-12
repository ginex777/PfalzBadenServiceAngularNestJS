import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { KundenFacade } from './kunden.facade';
import { KundenService } from './kunden.service';
import { ToastService } from '../../core/services/toast.service';
import { API_BASE_URL } from '../../core/tokens';
import { Kunde, Rechnung } from '../../core/models';

const testKunden: Kunde[] = [
  { id: 1, name: 'Müller GmbH', email: 'mueller@test.de', ort: 'München', strasse: 'Musterstr. 1', tel: null, notiz: null } as Kunde,
  { id: 2, name: 'Schulz AG',   email: 'schulz@test.de',  ort: 'Berlin',  strasse: 'Lindenstr. 5', tel: null, notiz: null } as Kunde,
  { id: 3, name: 'Koch KG',     email: null,               ort: 'Hamburg', strasse: null, tel: null, notiz: null } as Kunde,
];

const mockService = {
  allesDatenLaden: jest.fn(),
  kundeErstellen: jest.fn(),
  kundeAktualisieren: jest.fn(),
  kundeLoeschen: jest.fn(),
};

const mockToast = { success: jest.fn(), error: jest.fn() };

describe('KundenFacade', () => {
  let facade: KundenFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService.allesDatenLaden.mockReturnValue(of({ kunden: [], umsaetze: [], rechnungen: [] }));

    TestBed.configureTestingModule({
      providers: [
        KundenFacade,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: KundenService, useValue: mockService },
        { provide: ToastService, useValue: mockToast },
      ],
    });
    facade = TestBed.inject(KundenFacade);
  });

  it('sollte erstellt werden', () => {
    expect(facade).toBeTruthy();
  });

  describe('gefilterteKunden()', () => {
    beforeEach(() => facade.kunden.set(testKunden));

    it('gibt alle Kunden zurück wenn kein Suchbegriff', () => {
      facade.suchbegriff.set('');
      expect(facade.gefilterteKunden()).toHaveLength(3);
    });

    it('filtert nach Name (case-insensitive)', () => {
      facade.suchbegriff.set('müller');
      expect(facade.gefilterteKunden()).toHaveLength(1);
      expect(facade.gefilterteKunden()[0].name).toBe('Müller GmbH');
    });

    it('filtert nach E-Mail', () => {
      facade.suchbegriff.set('schulz@');
      expect(facade.gefilterteKunden()).toHaveLength(1);
    });

    it('filtert nach Ort', () => {
      facade.suchbegriff.set('hamburg');
      expect(facade.gefilterteKunden()).toHaveLength(1);
      expect(facade.gefilterteKunden()[0].name).toBe('Koch KG');
    });

    it('gibt leere Liste wenn kein Treffer', () => {
      facade.suchbegriff.set('xyz-gibt-es-nicht');
      expect(facade.gefilterteKunden()).toHaveLength(0);
    });
  });

  describe('bearbeitungStarten() / bearbeitungAbbrechen()', () => {
    it('setzt bearbeiteterKunde', () => {
      facade.kunden.set(testKunden);
      facade.bearbeitungStarten(testKunden[0]);
      expect(facade.bearbeiteterKunde()).toBe(testKunden[0]);
    });

    it('bearbeitungAbbrechen() setzt bearbeiteterKunde auf null zurück', () => {
      facade.bearbeitungStarten(testKunden[0]);
      facade.bearbeitungAbbrechen();
      expect(facade.bearbeiteterKunde()).toBeNull();
    });
  });

  describe('speichern()', () => {
    it('erstellt neuen Kunden und fügt ihn der Liste hinzu', () => {
      const neuerKunde = { id: 99, name: 'Neuer Kunde', email: null, ort: null, strasse: null, tel: null, notiz: null } as Kunde;
      mockService.kundeErstellen.mockReturnValue(of(neuerKunde));
      facade.kunden.set([]);
      facade.bearbeiteterKunde.set(null);

      facade.speichern({ name: 'Neuer Kunde' } as any);

      expect(facade.kunden()).toHaveLength(1);
      expect(facade.kunden()[0].name).toBe('Neuer Kunde');
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('aktualisiert vorhandenen Kunden im Bearbeitungsmodus', () => {
      const updated = { ...testKunden[0], name: 'Müller Neue GmbH' };
      facade.kunden.set(testKunden);
      facade.bearbeitungStarten(testKunden[0]);
      mockService.kundeAktualisieren.mockReturnValue(of(updated));

      facade.speichern({ name: 'Müller Neue GmbH' } as any);

      const inList = facade.kunden().find(k => k.id === 1);
      expect(inList?.name).toBe('Müller Neue GmbH');
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('zeigt Fehler-Toast bei Speichern-Fehler', () => {
      mockService.kundeErstellen.mockReturnValue(throwError(() => new Error('Fehler')));
      facade.speichern({ name: 'Test' } as any);
      expect(mockToast.error).toHaveBeenCalled();
      expect(facade.fehler()).toBeTruthy();
    });
  });

  describe('loeschenAusfuehren()', () => {
    it('entfernt Kunden aus Liste', () => {
      facade.kunden.set(testKunden);
      facade.loeschKandidat.set(2);
      mockService.kundeLoeschen.mockReturnValue(of({ ok: true }));

      facade.loeschenAusfuehren();

      expect(facade.kunden()).toHaveLength(2);
      expect(facade.kunden().find(k => k.id === 2)).toBeUndefined();
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('tut nichts wenn kein loeschKandidat', () => {
      facade.loeschKandidat.set(null);
      facade.loeschenAusfuehren();
      expect(mockService.kundeLoeschen).not.toHaveBeenCalled();
    });
  });

  describe('offenePostenAnzeigen()', () => {
    it('berechnet offenSaldo korrekt aus Rechnungen', () => {
      facade.kunden.set(testKunden);
      const rechnungen: Rechnung[] = [
        { id: 1, nr: 'R-001', kunden_id: 1, empf: 'Müller GmbH', bezahlt: false, brutto: 200, frist: '2026-01-01' } as Rechnung,
        { id: 2, nr: 'R-002', kunden_id: 1, empf: 'Müller GmbH', bezahlt: true,  brutto: 100, frist: null } as Rechnung,
      ];
      // Inject rechnungen via internal property
      (facade as any).cachedRechnungen = rechnungen;

      facade.offenePostenAnzeigen(1);

      const posten = facade.offenePosten();
      expect(posten).not.toBeNull();
      expect(posten?.offenSaldo).toBe(200);
      expect(posten?.umsatzBezahlt).toBe(100);
      expect(facade.offenePostenSichtbar()).toBe(true);
    });

    it('tut nichts für unbekannte Kunden-ID', () => {
      facade.kunden.set([]);
      facade.offenePostenAnzeigen(999);
      expect(facade.offenePosten()).toBeNull();
    });
  });

  describe('Pagination', () => {
    it('seiteVor() erhöht Seite, seiteZurueck() verringert sie', () => {
      const viele = Array.from({ length: 60 }, (_, i) => ({ ...testKunden[0], id: i + 1 }));
      facade.kunden.set(viele);
      facade.aktuelleSeite.set(1);
      facade.seiteVor();
      expect(facade.aktuelleSeite()).toBe(2);
      facade.seiteZurueck();
      expect(facade.aktuelleSeite()).toBe(1);
    });
  });
});
