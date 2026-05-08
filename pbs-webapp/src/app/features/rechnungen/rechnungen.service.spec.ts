import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  AuditLogApiClient,
  CustomersApiClient,
  InvoicesApiClient,
  PdfApiClient,
  RemindersApiClient,
  SettingsApiClient,
} from '../../core/api/clients';
import { BrowserService } from '../../core/services/browser.service';
import { RechnungenService } from './rechnungen.service';

describe('RechnungenService', () => {
  let service: RechnungenService;
  const invoicesApi = {
    loadInvoices: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
  };
  const customersApi = { loadCustomers: vi.fn() };
  const settingsApi = { loadSettings: vi.fn() };
  const pdfApi = { createInvoicePdf: vi.fn() };
  const remindersApi = {
    loadReminders: vi.fn(),
    createReminder: vi.fn(),
    deleteReminder: vi.fn(),
  };
  const auditLogApi = { loadAuditLogForRecord: vi.fn() };
  const browser = { openUrl: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RechnungenService,
        { provide: InvoicesApiClient, useValue: invoicesApi },
        { provide: CustomersApiClient, useValue: customersApi },
        { provide: SettingsApiClient, useValue: settingsApi },
        { provide: PdfApiClient, useValue: pdfApi },
        { provide: RemindersApiClient, useValue: remindersApi },
        { provide: AuditLogApiClient, useValue: auditLogApi },
        { provide: BrowserService, useValue: browser },
      ],
    });

    service = TestBed.inject(RechnungenService);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads invoices and customers together', async () => {
    invoicesApi.loadInvoices.mockReturnValue(of([{ id: 1 }]));
    customersApi.loadCustomers.mockReturnValue(of([{ id: 2 }]));

    await expect(firstValue(service.rechnungenUndKundenLaden())).resolves.toEqual({
      rechnungen: [{ id: 1 }],
      kunden: [{ id: 2 }],
    });
  });

  it('delegates CRUD, settings, reminders, and audit-log calls', async () => {
    settingsApi.loadSettings.mockReturnValue(of({ firma: 'PBS' }));
    invoicesApi.createInvoice.mockReturnValue(of({ id: 1 }));
    invoicesApi.updateInvoice.mockReturnValue(of({ id: 2 }));
    invoicesApi.deleteInvoice.mockReturnValue(of(undefined));
    remindersApi.loadReminders.mockReturnValue(of([{ id: 3 }]));
    remindersApi.createReminder.mockReturnValue(of({ id: 4 }));
    remindersApi.deleteReminder.mockReturnValue(of(undefined));
    auditLogApi.loadAuditLogForRecord.mockReturnValue(of([{ id: 5 }]));

    await firstValue(service.firmaEinstellungenLaden());
    await firstValue(service.createInvoice({ nr: 'R-1' }));
    await firstValue(service.updateInvoice(2, { nr: 'R-2' }));
    await firstValue(service.deleteInvoice(3));
    await firstValue(service.loadReminders(4));
    await firstValue(service.createReminder({ rechnung_id: 4 }));
    await firstValue(service.deleteReminder(5));
    await firstValue(service.auditEintraegeLaden(6));

    expect(settingsApi.loadSettings).toHaveBeenCalledWith('firma');
    expect(invoicesApi.createInvoice).toHaveBeenCalledWith({ nr: 'R-1' });
    expect(invoicesApi.updateInvoice).toHaveBeenCalledWith(2, { nr: 'R-2' });
    expect(invoicesApi.deleteInvoice).toHaveBeenCalledWith(3);
    expect(remindersApi.loadReminders).toHaveBeenCalledWith(4);
    expect(remindersApi.createReminder).toHaveBeenCalledWith({ rechnung_id: 4 });
    expect(remindersApi.deleteReminder).toHaveBeenCalledWith(5);
    expect(auditLogApi.loadAuditLogForRecord).toHaveBeenCalledWith('rechnungen', 6);
  });

  it('opens server-generated invoice PDFs and calculates totals', async () => {
    pdfApi.createInvoicePdf.mockReturnValue(of({ url: '/pdf/r-1.pdf' }));

    await service.pdfOeffnen(
      {
        id: 7,
        nr: 'R-7',
        empf: 'PBS',
        brutto: 119,
        bezahlt: false,
        positionen: [],
      },
      {
        firma: 'PBS',
      },
    );

    expect(pdfApi.createInvoicePdf).toHaveBeenCalledWith(7);
    expect(browser.openUrl).toHaveBeenCalledWith('/pdf/r-1.pdf');
    expect(service.nettoSummeBerechnen([{ bez: 'A', gesamtpreis: 10.5 }, { bez: 'B', gesamtpreis: 2 }])).toBe(12.5);
    expect(service.bruttoBerechnen([{ bez: 'A', gesamtpreis: 100 }], 7)).toBe(107);
  });
});

function firstValue<T>(source: import('rxjs').Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => source.subscribe({ next: resolve, error: reject }));
}
