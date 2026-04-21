import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import {
  Rechnung,
  Angebot,
  MuellplanTermin,
  Benachrichtigung,
  BackupInfo,
  BuchhaltungJahr,
  HausmeisterEinsatz,
} from '../../core/models';
import { DashboardAktivitaet } from './dashboard.models';

export interface DashboardRohdaten {
  rechnungen: Rechnung[];
  angebote: Angebot[];
  muellTermine: MuellplanTermin[];
  benachrichtigungen: Benachrichtigung[];
  backupInfo: BackupInfo | null;
  buchhaltung: BuchhaltungJahr;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  aktivitaetenLaden(): Observable<DashboardAktivitaet[]> {
    return this.http.get<DashboardAktivitaet[]>('/api/dashboard/activity');
  }

  rohdatenLaden(jahr: number): Observable<DashboardRohdaten> {
    return new Observable((observer) => {
      forkJoin({
        rechnungen: this.api.loadInvoices(),
        angebote: this.api.loadOffers(),
        muellTermine: this.api.loadUpcomingGarbageTerms(5),
        benachrichtigungen: this.api.loadNotifications(),
        buchhaltung: this.api.loadAccounting(jahr),
      }).subscribe({
        next: (daten) => {
          this.api.loadLastBackup().subscribe({
            next: (backup) => observer.next({ ...daten, backupInfo: backup }),
            error: () => observer.next({ ...daten, backupInfo: null }),
            complete: () => observer.complete(),
          });
        },
        error: (err) => observer.error(err),
      });
    });
  }

  markNotificationRead(id: number): Observable<void> {
    return this.api.markNotificationRead(id);
  }

  markAllNotificationsRead(): Observable<void> {
    return this.api.markAllNotificationsRead();
  }

  benachrichtigungenNeuLaden(): Observable<Benachrichtigung[]> {
    return this.api.loadNotifications();
  }

  loadServiceAssignments(): Observable<HausmeisterEinsatz[]> {
    return this.api.loadServiceAssignments();
  }

  createBackup(): Observable<BackupInfo> {
    return this.api.createBackup();
  }
}
