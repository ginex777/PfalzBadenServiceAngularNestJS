import { Injectable, inject } from '@angular/core';
import type { Observable} from 'rxjs';
import { forkJoin } from 'rxjs';
import type { Rechnung, Angebot, Benachrichtigung } from '../../core/models';
import {
  DashboardApiClient,
  type DashboardYearlyStats,
  InvoicesApiClient,
  NotificationsApiClient,
  OffersApiClient,
} from '../../core/api/clients';

export interface DashboardData {
  invoices: Rechnung[];
  offers: Angebot[];
  notifications: Benachrichtigung[];
  yearlyStats: DashboardYearlyStats;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly invoicesApi = inject(InvoicesApiClient);
  private readonly offersApi = inject(OffersApiClient);
  private readonly notificationsApi = inject(NotificationsApiClient);
  private readonly dashboardApi = inject(DashboardApiClient);

  loadDashboardData(year: number): Observable<DashboardData> {
    return forkJoin({
      invoices: this.invoicesApi.loadInvoices(),
      offers: this.offersApi.loadOffers(),
      notifications: this.notificationsApi.loadNotifications(),
      yearlyStats: this.dashboardApi.loadYearlyStats(year),
    });
  }

  markNotificationRead(id: number): Observable<void> {
    return this.notificationsApi.markNotificationRead(id);
  }

  markAllNotificationsRead(): Observable<void> {
    return this.notificationsApi.markAllNotificationsRead();
  }

  reloadNotifications(): Observable<Benachrichtigung[]> {
    return this.notificationsApi.loadNotifications();
  }
}
