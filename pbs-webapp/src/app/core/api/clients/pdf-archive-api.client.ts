import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponse, PdfArchiveEntry } from '../../models';

@Injectable({ providedIn: 'root' })
export class PdfArchiveApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadPdfArchivePage(query?: {
    page?: number;
    pageSize?: number;
    q?: string;
    typ?: string;
  }): Observable<PaginatedResponse<PdfArchiveEntry>> {
    let params = new HttpParams()
      .set('page', String(query?.page ?? 1))
      .set('pageSize', String(query?.pageSize ?? 50));
    if (query?.q) params = params.set('q', query.q);
    if (query?.typ) params = params.set('typ', query.typ);
    return this.http.get<PaginatedResponse<PdfArchiveEntry>>(`${this.baseUrl}/pdf/archiv`, { params });
  }

  loadPdfArchive(): Observable<PdfArchiveEntry[]> {
    return this.loadPdfArchivePage({ pageSize: 1000 }).pipe(map((r) => r.data));
  }

  deletePdfArchiveEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pdf/archiv/${id}`);
  }

  deleteAllPdfArchive(): Observable<{ ok: boolean; deleted: number }> {
    return this.http.delete<{ ok: boolean; deleted: number }>(`${this.baseUrl}/pdf/archiv/cleanup`);
  }
}

