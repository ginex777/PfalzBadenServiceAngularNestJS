import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  AccountingApiClient,
  ReceiptsApiClient,
  RecurringExpensesApiClient,
} from '../../core/api/clients';
import { BuchhaltungService } from './buchhaltung.service';

describe('BuchhaltungService', () => {
  let service: BuchhaltungService;
  const accountingApi = {
    loadAccounting: vi.fn(),
    loadAccountingSummary: vi.fn(),
    saveAccountingBatch: vi.fn(),
    deleteAccountingEntry: vi.fn(),
    loadVst: vi.fn(),
    saveVst: vi.fn(),
    loadLockedMonths: vi.fn(),
    lockMonth: vi.fn(),
    unlockMonth: vi.fn(),
  };
  const recurringExpensesApi = { loadRecurringExpenses: vi.fn() };
  const receiptsApi = {
    loadReceiptsForEntry: vi.fn(),
    uploadReceipt: vi.fn(),
    getReceiptDownloadUrl: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BuchhaltungService,
        { provide: AccountingApiClient, useValue: accountingApi },
        { provide: RecurringExpensesApiClient, useValue: recurringExpensesApi },
        { provide: ReceiptsApiClient, useValue: receiptsApi },
      ],
    });

    service = TestBed.inject(BuchhaltungService);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('delegates accounting, VAT, lock, recurring, and receipt operations', async () => {
    const formData = new FormData();
    accountingApi.loadAccounting.mockReturnValue(of({ jahr: 2026 }));
    accountingApi.loadAccountingSummary.mockReturnValue(of({ year: 2026 }));
    accountingApi.saveAccountingBatch.mockReturnValue(of([{ id: 1 }]));
    accountingApi.deleteAccountingEntry.mockReturnValue(of(undefined));
    accountingApi.loadVst.mockReturnValue(of([{ id: 2 }]));
    accountingApi.saveVst.mockReturnValue(of({ id: 3 }));
    accountingApi.loadLockedMonths.mockReturnValue(of([{ id: 4 }]));
    accountingApi.lockMonth.mockReturnValue(of({ id: 5 }));
    accountingApi.unlockMonth.mockReturnValue(of(undefined));
    recurringExpensesApi.loadRecurringExpenses.mockReturnValue(of([{ id: 6 }]));
    receiptsApi.loadReceiptsForEntry.mockReturnValue(of([{ id: 7 }]));
    receiptsApi.uploadReceipt.mockReturnValue(of({ id: 8 }));
    receiptsApi.getReceiptDownloadUrl.mockReturnValue('/api/belege/8/download');

    await firstValueFrom(service.jahresDateLaden(2026));
    await firstValueFrom(service.jahresZusammenfassungLaden(2026));
    await firstValueFrom(service.batchSpeichern(2026, 5, [{ typ: 'inc' }]));
    await firstValueFrom(service.eintragLoeschen(1));
    await firstValueFrom(service.loadVst(2026));
    await firstValueFrom(service.saveVst({ jahr: 2026 }));
    await firstValueFrom(service.loadLockedMonths(2026));
    await firstValueFrom(service.lockMonth(2026, 5));
    await firstValueFrom(service.unlockMonth(2026, 5));
    await firstValueFrom(service.loadRecurringExpenses());
    await firstValueFrom(service.loadReceiptsForEntry(1));
    await firstValueFrom(service.uploadReceipt(formData));

    expect(service.getReceiptDownloadUrl(8, true)).toBe('/api/belege/8/download');
    expect(accountingApi.saveAccountingBatch).toHaveBeenCalledWith(2026, 5, [{ typ: 'inc' }]);
    expect(accountingApi.unlockMonth).toHaveBeenCalledWith(2026, 5);
    expect(receiptsApi.uploadReceipt).toHaveBeenCalledWith(formData);
  });
});
