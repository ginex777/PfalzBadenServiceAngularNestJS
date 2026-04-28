import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { Rechnung, Angebot, Benachrichtigung, BuchhaltungJahr } from '../../core/models';
import {
  AccountingApiClient,
  InvoicesApiClient,
  NotificationsApiClient,
  OffersApiClient,
} from '../../core/api/clients';

export interface DashboardData {
  invoices: Rechnung[];
  offers: Angebot[];
  notifications: Benachrichtigung[];
  accounting: BuchhaltungJahr;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly invoicesApi = inject(InvoicesApiClient);
  private readonly offersApi = inject(OffersApiClient);
  private readonly notificationsApi = inject(NotificationsApiClient);
  private readonly accountingApi = inject(AccountingApiClient);

  loadDashboardData(year: number): Observable<DashboardData> {
    return forkJoin({
      invoices: this.invoicesApi.loadInvoices(),
      offers: this.offersApi.loadOffers(),
      notifications: this.notificationsApi.loadNotifications(),
      accounting: this.accountingApi.loadAccounting(year),
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
