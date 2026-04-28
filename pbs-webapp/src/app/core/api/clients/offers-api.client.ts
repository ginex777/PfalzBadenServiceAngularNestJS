import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Angebot, PaginatedResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class OffersApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadOffers(): Observable<Angebot[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<Angebot>>(`${this.baseUrl}/angebote`, { params })
      .pipe(map((r) => r.data));
  }

  createOffer(data: Partial<Angebot>): Observable<Angebot> {
    return this.http.post<Angebot>(`${this.baseUrl}/angebote`, data);
  }

  updateOffer(id: number, data: Partial<Angebot>): Observable<Angebot> {
    return this.http.put<Angebot>(`${this.baseUrl}/angebote/${id}`, data);
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/angebote/${id}`);
  }
}

