import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Benachrichtigung, BuchhaltungJahr, Angebot, Rechnung } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { DashboardData } from './dashboard.service';
import { DashboardFacade } from './dashboard.facade';
import { DashboardService } from './dashboard.service';

class DashboardServiceStub {
  loadDashboardData() {
    const invoices: Rechnung[] = [];
    const offers: Angebot[] = [];
    const notifications: Benachrichtigung[] = [];
    const accounting: BuchhaltungJahr = {};
    const data: DashboardData = {
      invoices,
      offers,
      notifications,
      accounting,
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
});
