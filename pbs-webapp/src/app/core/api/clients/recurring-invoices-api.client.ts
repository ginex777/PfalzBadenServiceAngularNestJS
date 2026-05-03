import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { PaginatedResponse, WiederkehrendeRechnung } from '../../models';

@Injectable({ providedIn: 'root' })
export class RecurringInvoicesApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadRecurringInvoices(): Observable<WiederkehrendeRechnung[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<WiederkehrendeRechnung>>(`${this.baseUrl}/wiederkehrend-rechnungen`, {
        params,
      })
      .pipe(map((r) => r.data));
  }

  createRecurringInvoice(
    data: Partial<WiederkehrendeRechnung>,
  ): Observable<WiederkehrendeRechnung> {
    return this.http.post<WiederkehrendeRechnung>(`${this.baseUrl}/wiederkehrend-rechnungen`, data);
  }

  updateRecurringInvoice(
    id: number,
    data: Partial<WiederkehrendeRechnung>,
  ): Observable<WiederkehrendeRechnung> {
    return this.http.put<WiederkehrendeRechnung>(
      `${this.baseUrl}/wiederkehrend-rechnungen/${id}`,
      data,
    );
  }

  deleteRecurringInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/wiederkehrend-rechnungen/${id}`);
  }
}

