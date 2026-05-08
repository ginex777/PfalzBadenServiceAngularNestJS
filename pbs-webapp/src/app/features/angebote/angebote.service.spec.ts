import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  CustomersApiClient,
  OffersApiClient,
  PdfApiClient,
  SettingsApiClient,
} from '../../core/api/clients';
import { BrowserService } from '../../core/services/browser.service';
import { AngeboteService } from './angebote.service';

describe('AngeboteService', () => {
  let service: AngeboteService;
  const offersApi = {
    loadOffers: vi.fn(),
    createOffer: vi.fn(),
    updateOffer: vi.fn(),
    deleteOffer: vi.fn(),
  };
  const customersApi = {
    loadCustomers: vi.fn(),
    createCustomer: vi.fn(),
  };
  const settingsApi = { loadSettings: vi.fn() };
  const pdfApi = { createOfferPdf: vi.fn() };
  const browser = { openUrl: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AngeboteService,
        { provide: OffersApiClient, useValue: offersApi },
        { provide: CustomersApiClient, useValue: customersApi },
        { provide: SettingsApiClient, useValue: settingsApi },
        { provide: PdfApiClient, useValue: pdfApi },
        { provide: BrowserService, useValue: browser },
      ],
    });

    service = TestBed.inject(AngeboteService);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads offers and customers together', async () => {
    offersApi.loadOffers.mockReturnValue(of([{ id: 1 }]));
    customersApi.loadCustomers.mockReturnValue(of([{ id: 2 }]));

    await expect(firstValue(service.angeboteUndKundenLaden())).resolves.toEqual({
      angebote: [{ id: 1 }],
      kunden: [{ id: 2 }],
    });
  });

  it('delegates persistence and settings calls', async () => {
    settingsApi.loadSettings.mockReturnValue(of({ firma: 'PBS' }));
    offersApi.createOffer.mockReturnValue(of({ id: 1 }));
    offersApi.updateOffer.mockReturnValue(of({ id: 2 }));
    offersApi.deleteOffer.mockReturnValue(of(undefined));
    customersApi.createCustomer.mockReturnValue(of({ id: 3 }));

    await firstValue(service.firmaEinstellungenLaden());
    await firstValue(service.createOffer({ nr: 'A-1' }));
    await firstValue(service.updateOffer(2, { nr: 'A-2' }));
    await firstValue(service.deleteOffer(3));
    await firstValue(service.createCustomer({ name: 'Kunde' }));

    expect(settingsApi.loadSettings).toHaveBeenCalledWith('firma');
    expect(offersApi.createOffer).toHaveBeenCalledWith({ nr: 'A-1' });
    expect(offersApi.updateOffer).toHaveBeenCalledWith(2, { nr: 'A-2' });
    expect(offersApi.deleteOffer).toHaveBeenCalledWith(3);
    expect(customersApi.createCustomer).toHaveBeenCalledWith({ name: 'Kunde' });
  });

  it('opens server-generated offer PDFs and calculates totals', async () => {
    pdfApi.createOfferPdf.mockReturnValue(of({ url: '/pdf/a-1.pdf' }));

    await service.pdfOeffnen(
      {
        id: 4,
        nr: 'A-4',
        empf: 'PBS',
        brutto: 238,
        angenommen: false,
        abgelehnt: false,
        gesendet: false,
        positionen: [],
      },
      { firma: 'PBS' },
    );

    expect(pdfApi.createOfferPdf).toHaveBeenCalledWith(4);
    expect(browser.openUrl).toHaveBeenCalledWith('/pdf/a-1.pdf');
    expect(service.nettoBerechnen([{ bez: 'A', gesamtpreis: 10 }, { bez: 'B', gesamtpreis: 2.5 }])).toBe(12.5);
    expect(service.bruttoBerechnen([{ bez: 'A', gesamtpreis: 100 }], 19)).toBe(119);
  });
});

function firstValue<T>(source: import('rxjs').Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => source.subscribe({ next: resolve, error: reject }));
}
