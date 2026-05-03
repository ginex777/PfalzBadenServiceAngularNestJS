import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Kunde, PaginatedResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class CustomersApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadCustomers(): Observable<Kunde[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<Kunde>>(`${this.baseUrl}/kunden`, { params })
      .pipe(map((r) => r.data));
  }

  createCustomer(data: Partial<Kunde>): Observable<Kunde> {
    return this.http.post<Kunde>(`${this.baseUrl}/kunden`, data);
  }

  updateCustomer(id: number, data: Partial<Kunde>): Observable<Kunde> {
    return this.http.put<Kunde>(`${this.baseUrl}/kunden/${id}`, data);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/kunden/${id}`);
  }
}

