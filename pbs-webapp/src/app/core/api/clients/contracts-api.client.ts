import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponse, Vertrag } from '../../models';

@Injectable({ providedIn: 'root' })
export class ContractsApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadContracts(customerId?: number): Observable<Vertrag[]> {
    let params = new HttpParams().set('pageSize', '1000');
    if (customerId) params = params.set('kunden_id', String(customerId));
    return this.http
      .get<PaginatedResponse<Vertrag>>(`${this.baseUrl}/vertraege`, { params })
      .pipe(map((r) => r.data));
  }

  createContract(data: Partial<Vertrag>): Observable<Vertrag> {
    return this.http.post<Vertrag>(`${this.baseUrl}/vertraege`, data);
  }

  updateContract(id: number, data: Partial<Vertrag>): Observable<Vertrag> {
    return this.http.put<Vertrag>(`${this.baseUrl}/vertraege/${id}`, data);
  }

  deleteContract(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/vertraege/${id}`);
  }
}

