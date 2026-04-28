import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mahnung } from '../../models';

@Injectable({ providedIn: 'root' })
export class RemindersApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadReminders(invoiceId: number): Observable<Mahnung[]> {
    return this.http.get<Mahnung[]>(`${this.baseUrl}/mahnungen/rechnung/${invoiceId}`);
  }

  createReminder(data: Partial<Mahnung>): Observable<Mahnung> {
    return this.http.post<Mahnung>(`${this.baseUrl}/mahnungen`, data);
  }

  deleteReminder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/mahnungen/${id}`);
  }
}

