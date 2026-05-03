import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { AuditLogEntry, PaginatedResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class AuditLogApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadAuditLogTables(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/audit/tables`);
  }

  loadAuditLogPage(query: {
    page: number;
    pageSize: number;
    q?: string;
    aktion?: string;
    tabelle?: string;
  }): Observable<PaginatedResponse<AuditLogEntry>> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));
    if (query.q) params = params.set('q', query.q);
    if (query.aktion) params = params.set('aktion', query.aktion);
    if (query.tabelle) params = params.set('tabelle', query.tabelle);
    return this.http.get<PaginatedResponse<AuditLogEntry>>(`${this.baseUrl}/audit/all`, { params });
  }

  loadAuditLogAll(): Observable<AuditLogEntry[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<AuditLogEntry>>(`${this.baseUrl}/audit/all`, { params })
      .pipe(map((r) => r.data));
  }

  loadAuditLogForTable(table: string): Observable<AuditLogEntry[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<AuditLogEntry>>(`${this.baseUrl}/audit/${table}/all`, { params })
      .pipe(map((r) => r.data));
  }

  loadAuditLogForRecord(table: string, id: number): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.baseUrl}/audit/${table}/${id}`);
  }
}

