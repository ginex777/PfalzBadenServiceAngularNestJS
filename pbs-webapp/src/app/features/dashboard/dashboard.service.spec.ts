import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ApiService } from '../../core/api/api.service';
import { BuchhaltungJahr, Rechnung, Angebot, Benachrichtigung } from '../../core/models';
import { DashboardService } from './dashboard.service';

class ApiServiceStub {
  loadInvoices() {
    return of<Rechnung[]>([]);
  }

  loadOffers() {
    return of<Angebot[]>([]);
  }

  loadNotifications() {
    return of<Benachrichtigung[]>([]);
  }

  loadAccounting() {
    return of<BuchhaltungJahr>({});
  }

  markNotificationRead() {
    return of<void>(void 0);
  }

  markAllNotificationsRead() {
    return of<void>(void 0);
  }
}

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: ApiService, useClass: ApiServiceStub }],
    });

    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
