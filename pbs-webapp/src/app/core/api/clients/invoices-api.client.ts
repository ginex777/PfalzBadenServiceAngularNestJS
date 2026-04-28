import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponse, Rechnung } from '../../models';

@Injectable({ providedIn: 'root' })
export class InvoicesApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadInvoices(): Observable<Rechnung[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<Rechnung>>(`${this.baseUrl}/rechnungen`, { params })
      .pipe(map((r) => r.data));
  }

  createInvoice(data: Partial<Rechnung>): Observable<Rechnung> {
    return this.http.post<Rechnung>(`${this.baseUrl}/rechnungen`, data);
  }

  updateInvoice(id: number, data: Partial<Rechnung>): Observable<Rechnung> {
    return this.http.put<Rechnung>(`${this.baseUrl}/rechnungen/${id}`, data);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/rechnungen/${id}`);
  }
}

