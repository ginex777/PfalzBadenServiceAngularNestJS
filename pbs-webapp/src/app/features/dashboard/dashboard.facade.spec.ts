import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { Benachrichtigung, Angebot, Rechnung } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import type { DashboardData } from './dashboard.service';
import { DashboardFacade } from './dashboard.facade';
import { DashboardService } from './dashboard.service';

class DashboardServiceStub {
  loadDashboardData() {
    const invoices: Rechnung[] = [];
    const offers: Angebot[] = [];
    const notifications: Benachrichtigung[] = [];
    const data: DashboardData = {
      invoices,
      offers,
      notifications,
      yearlyStats: {
        year: 2026,
        upToMonth: 5,
        revenueNet: 1200,
        expensesNet: 300,
        profitNet: 900,
      },
    };
    return of(data);
  }

  markNotificationRead() {
    return of<void>(void 0);
  }

  markAllNotificationsRead() {
    return of<void>(void 0);
  }
}

class RouterStub {
  navigate() {
    return Promise.resolve(true);
  }
}

class ToastServiceStub {
  error() {}
}

describe('DashboardFacade', () => {
  let service: DashboardFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardFacade,
        { provide: DashboardService, useClass: DashboardServiceStub },
        { provide: Router, useClass: RouterStub },
        { provide: ToastService, useClass: ToastServiceStub },
      ],
    });

    service = TestBed.inject(DashboardFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('uses backend yearly dashboard stats without frontend accounting totals', () => {
    service.loadData();

    expect(service.stats()?.yearRevenueNet).toBe(1200);
    expect(service.stats()?.yearExpensesNet).toBe(300);
    expect(service.stats()?.yearProfitNet).toBe(900);
  });
});
