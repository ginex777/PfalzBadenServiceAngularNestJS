import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../models';
import { MobileFeedbackItemApi } from '../api.contract';

@Injectable({ providedIn: 'root' })
export class MobileFeedbackApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadMobileFeedbackPage(query: {
    page: number;
    pageSize: number;
    objectId?: number;
  }): Observable<PaginatedResponse<MobileFeedbackItemApi>> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));
    if (query.objectId) params = params.set('objectId', String(query.objectId));
    return this.http.get<PaginatedResponse<MobileFeedbackItemApi>>(`${this.baseUrl}/mobile-feedback`, {
      params,
    });
  }
}

