import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  Rechnung,
  Angebot,
  Benachrichtigung,
  BuchhaltungJahr,
} from '../../core/models';

export interface DashboardData {
  invoices: Rechnung[];
  offers: Angebot[];
  notifications: Benachrichtigung[];
  accounting: BuchhaltungJahr;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  loadDashboardData(year: number): Observable<DashboardData> {
    return forkJoin({
      invoices: this.api.loadInvoices(),
      offers: this.api.loadOffers(),
      notifications: this.api.loadNotifications(),
      accounting: this.api.loadAccounting(year),
    });
  }

  markNotificationRead(id: number): Observable<void> {
    return this.api.markNotificationRead(id);
  }

  markAllNotificationsRead(): Observable<void> {
    return this.api.markAllNotificationsRead();
  }

  reloadNotifications(): Observable<Benachrichtigung[]> {
    return this.api.loadNotifications();
  }
}
