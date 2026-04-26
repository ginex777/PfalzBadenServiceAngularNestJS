import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ZeiterfassungListResponse, ZeiterfassungFilterState } from './zeiterfassung.models';

@Injectable({
  providedIn: 'root',
})
export class ZeiterfassungService {
  private readonly baseUrl = '/api/stempeluhr';

  constructor(private http: HttpClient) {}

  list(
    filters: ZeiterfassungFilterState,
    page: number = 1,
    pageSize: number = 50,
  ): Observable<ZeiterfassungListResponse> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));

    if (filters.mitarbeiterId) {
      params = params.set('mitarbeiterId', String(filters.mitarbeiterId));
    }
    if (filters.objektId) {
      params = params.set('objektId', String(filters.objektId));
    }
    if (filters.kundenId) {
      params = params.set('kundenId', String(filters.kundenId));
    }
    if (filters.von) {
      params = params.set('von', filters.von);
    }
    if (filters.bis) {
      params = params.set('bis', filters.bis);
    }

    return this.http.get<ZeiterfassungListResponse>(this.baseUrl, { params });
  }
}
