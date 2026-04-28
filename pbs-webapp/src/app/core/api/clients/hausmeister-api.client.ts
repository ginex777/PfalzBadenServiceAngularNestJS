import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HausmeisterEinsatz, PaginatedResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class HausmeisterApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadServiceAssignments(): Observable<HausmeisterEinsatz[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<HausmeisterEinsatz>>(`${this.baseUrl}/hausmeister`, { params })
      .pipe(map((r) => r.data));
  }

  createServiceAssignment(data: Partial<HausmeisterEinsatz>): Observable<HausmeisterEinsatz> {
    return this.http.post<HausmeisterEinsatz>(`${this.baseUrl}/hausmeister`, data);
  }

  updateServiceAssignment(
    id: number,
    data: Partial<HausmeisterEinsatz>,
  ): Observable<HausmeisterEinsatz> {
    return this.http.put<HausmeisterEinsatz>(`${this.baseUrl}/hausmeister/${id}`, data);
  }

  deleteServiceAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/hausmeister/${id}`);
  }
}

