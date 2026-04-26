import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AktivitaetenListResponse, AktivitaetenFilterState } from './aktivitaeten.models';

@Injectable({
  providedIn: 'root',
})
export class AktivitaetenService {
  private readonly http = inject(HttpClient);
  private readonly basis = '/api';

  list(
    objektId: number,
    filters: AktivitaetenFilterState,
    page: number,
    pageSize: number,
  ): Observable<AktivitaetenListResponse> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.userId) {
      params = params.set('userId', filters.userId);
    }
    if (filters.employeeId) {
      params = params.set('employeeId', filters.employeeId);
    }
    if (filters.createdFrom) {
      params = params.set('createdFrom', filters.createdFrom);
    }
    if (filters.createdTo) {
      params = params.set('createdTo', filters.createdTo);
    }

    return this.http.get<AktivitaetenListResponse>(
      `${this.basis}/objekte/${objektId}/aktivitaeten`,
      {
        params,
      },
    );
  }
}
