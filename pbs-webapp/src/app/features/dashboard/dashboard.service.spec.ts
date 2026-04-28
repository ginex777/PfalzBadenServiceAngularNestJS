import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import {
  AccountingApiClient,
  InvoicesApiClient,
  NotificationsApiClient,
  OffersApiClient,
} from '../../core/api/clients';
import { BuchhaltungJahr, Rechnung, Angebot, Benachrichtigung } from '../../core/models';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        {
          provide: InvoicesApiClient,
          useValue: {
            loadInvoices: () => of<Rechnung[]>([]),
          },
        },
        {
          provide: OffersApiClient,
          useValue: {
            loadOffers: () => of<Angebot[]>([]),
          },
        },
        {
          provide: NotificationsApiClient,
          useValue: {
            loadNotifications: () => of<Benachrichtigung[]>([]),
            markNotificationRead: () => of<void>(void 0),
            markAllNotificationsRead: () => of<void>(void 0),
          },
        },
        {
          provide: AccountingApiClient,
          useValue: {
            loadAccounting: () => of<BuchhaltungJahr>({}),
          },
        },
      ],
    });

    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
