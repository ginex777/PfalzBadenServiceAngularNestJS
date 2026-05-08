import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { CustomersApiClient, InvoicesApiClient, OffersApiClient } from '../../core/api/clients';
import { KundenService } from './kunden.service';

describe('KundenService', () => {
  let service: KundenService;
  const customersApi = {
    loadCustomers: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
  };
  const invoicesApi = { loadInvoices: vi.fn() };
  const offersApi = { loadOffers: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        KundenService,
        { provide: CustomersApiClient, useValue: customersApi },
        { provide: InvoicesApiClient, useValue: invoicesApi },
        { provide: OffersApiClient, useValue: offersApi },
      ],
    });

    service = TestBed.inject(KundenService);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads customers with invoice and offer revenue metrics', async () => {
    customersApi.loadCustomers.mockReturnValue(of([{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }]));
    invoicesApi.loadInvoices.mockReturnValue(
      of([
        { id: 10, nr: 'R-1', empf: 'Alpha', kunden_id: 1, brutto: 100, bezahlt: true, positionen: [] },
        { id: 11, nr: 'R-2', empf: 'Alpha', brutto: 50, bezahlt: false, positionen: [] },
      ]),
    );
    offersApi.loadOffers.mockReturnValue(
      of([{ id: 20, nr: 'A-1', empf: 'Beta', kunden_id: 2, brutto: 25, angenommen: false, abgelehnt: false, gesendet: false, positionen: [] }]),
    );

    const result = await firstValueFrom(service.allesDatenLaden());

    expect(result.umsaetze).toEqual([
      { kundeId: 1, rechnungenAnzahl: 2, angeboteAnzahl: 0, umsatzBezahlt: 100 },
      { kundeId: 2, rechnungenAnzahl: 0, angeboteAnzahl: 1, umsatzBezahlt: 0 },
    ]);
  });

  it('delegates customer persistence operations', async () => {
    customersApi.createCustomer.mockReturnValue(of({ id: 1, name: 'Neu' }));
    customersApi.updateCustomer.mockReturnValue(of({ id: 1, name: 'Update' }));
    customersApi.deleteCustomer.mockReturnValue(of(undefined));

    await firstValueFrom(service.createCustomer({ name: 'Neu' }));
    await firstValueFrom(service.updateCustomer(1, { name: 'Update' }));
    await firstValueFrom(service.deleteCustomer(1));

    expect(customersApi.createCustomer).toHaveBeenCalledWith({ name: 'Neu' });
    expect(customersApi.updateCustomer).toHaveBeenCalledWith(1, { name: 'Update' });
    expect(customersApi.deleteCustomer).toHaveBeenCalledWith(1);
  });
});
