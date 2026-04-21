import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MarketingFacade } from './marketing.facade';
import { MarketingService } from './marketing.service';
import { ToastService } from '../../core/services/toast.service';
import { API_BASE_URL } from '../../core/tokens';
import { MarketingKontakt } from '../../core/models';

const testKontakte: MarketingKontakt[] = [
  {
    id: 1,
    name: 'Müller GmbH',
    email: 'mueller@test.de',
    status: 'offen',
    person: null,
    tel: null,
    notiz: null,
  } as MarketingKontakt,
  {
    id: 2,
    name: 'Schulz AG',
    email: 'schulz@ag.de',
    status: 'kontaktiert',
    person: 'Anna',
    tel: null,
    notiz: null,
  } as MarketingKontakt,
  {
    id: 3,
    name: 'Koch Immobil',
    email: null,
    status: 'abgesagt',
    person: null,
    tel: null,
    notiz: null,
  } as MarketingKontakt,
];

const mockService = {
  allesDatenLaden: jest.fn(),
  kontaktErstellen: jest.fn(),
  kontaktAktualisieren: jest.fn(),
  kontaktLoeschen: jest.fn(),
};

const mockToast = { success: jest.fn(), error: jest.fn() };

describe('MarketingFacade', () => {
  let facade: MarketingFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService.allesDatenLaden.mockReturnValue(of({ kontakte: [], kunden: [] }));

    TestBed.configureTestingModule({
      providers: [
        MarketingFacade,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: MarketingService, useValue: mockService },
        { provide: ToastService, useValue: mockToast },
      ],
    });
    facade = TestBed.inject(MarketingFacade);
  });

  it('sollte erstellt werden', () => {
    expect(facade).toBeTruthy();
  });

  describe('gefilterteKontakte()', () => {
    beforeEach(() => facade.kontakte.set(testKontakte));

    it('gibt alle Kontakte zurück wenn kein Filter', () => {
      facade.suchbegriff.set('');
      facade.statusFilter.set('');
      expect(facade.gefilterteKontakte()).toHaveLength(3);
    });

    it('filtert nach Status "offen"', () => {
      facade.statusFilter.set('offen');
      expect(facade.gefilterteKontakte()).toHaveLength(1);
      expect(facade.gefilterteKontakte()[0].name).toBe('Müller GmbH');
    });

    it('filtert nach Status "kontaktiert"', () => {
      facade.statusFilter.set('kontaktiert');
      expect(facade.gefilterteKontakte()).toHaveLength(1);
    });

    it('filtert nach Status "abgesagt"', () => {
      facade.statusFilter.set('abgesagt');
      expect(facade.gefilterteKontakte()).toHaveLength(1);
    });

    it('filtert nach Name (case-insensitive)', () => {
      facade.suchbegriff.set('müller');
      expect(facade.gefilterteKontakte()).toHaveLength(1);
    });

    it('filtert nach E-Mail', () => {
      facade.suchbegriff.set('@ag.de');
      expect(facade.gefilterteKontakte()).toHaveLength(1);
    });

    it('filtert nach Person', () => {
      facade.suchbegriff.set('Anna');
      expect(facade.gefilterteKontakte()).toHaveLength(1);
    });

    it('kombiniert Status- und Suchfilter', () => {
      facade.statusFilter.set('offen');
      facade.suchbegriff.set('müller');
      expect(facade.gefilterteKontakte()).toHaveLength(1);
    });

    it('gibt leere Liste wenn kein Treffer', () => {
      facade.suchbegriff.set('xyz-gibt-es-nicht');
      expect(facade.gefilterteKontakte()).toHaveLength(0);
    });
  });

  describe('loeschenAusfuehren()', () => {
    it('entfernt Kontakt aus Liste', () => {
      facade.kontakte.set(testKontakte);
      facade.loeschKandidat.set(2);
      mockService.kontaktLoeschen.mockReturnValue(of(undefined));

      facade.loeschenAusfuehren();

      expect(facade.kontakte()).toHaveLength(2);
      expect(facade.kontakte().find((k) => k.id === 2)).toBeUndefined();
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('tut nichts wenn kein loeschKandidat gesetzt', () => {
      facade.loeschKandidat.set(null);
      facade.loeschenAusfuehren();
      expect(mockService.kontaktLoeschen).not.toHaveBeenCalled();
    });

    it('zeigt Fehler-Toast bei Fehler', () => {
      facade.kontakte.set(testKontakte);
      facade.loeschKandidat.set(1);
      mockService.kontaktLoeschen.mockReturnValue(throwError(() => new Error('Netzwerk')));

      facade.loeschenAusfuehren();

      expect(mockToast.error).toHaveBeenCalled();
      expect(facade.kontakte()).toHaveLength(3);
    });
  });

  describe('Vorlage-Modal', () => {
    it('öffnet Vorlage-Modal und setzt DEFAULT_BETREFF wenn leer', () => {
      facade.vorlageModalOeffnen();
      expect(facade.vorlageModalSichtbar()).toBe(true);
      expect(facade.vorlageBetreff()).toBe(facade.DEFAULT_BETREFF);
    });

    it('schließt Vorlage-Modal', () => {
      facade.vorlageModalOeffnen();
      facade.vorlageModalSchliessen();
      expect(facade.vorlageModalSichtbar()).toBe(false);
    });

    it('vorlageZuruecksetzen() stellt DEFAULT-Werte wieder her', () => {
      facade.vorlageBetreff.set('Eigener Betreff');
      facade.vorlageText.set('Eigener Text');
      facade.vorlageZuruecksetzen();
      expect(facade.vorlageBetreff()).toBe(facade.DEFAULT_BETREFF);
      expect(facade.vorlageText()).toBe(facade.DEFAULT_TEXT);
    });
  });
});
