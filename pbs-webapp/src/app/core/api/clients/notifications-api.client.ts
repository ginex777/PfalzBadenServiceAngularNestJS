import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Benachrichtigung } from '../../models';

@Injectable({ providedIn: 'root' })
export class NotificationsApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadNotifications(): Observable<Benachrichtigung[]> {
    return this.http.get<Benachrichtigung[]>(`${this.baseUrl}/benachrichtigungen`);
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/benachrichtigungen/alle-lesen`, {});
  }

  markNotificationRead(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/benachrichtigungen/${id}/lesen`, {});
  }
}

