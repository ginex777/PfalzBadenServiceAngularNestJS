import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { PaginatedResponse } from '../../models';

interface EvidenceListItemApi {
  id: number;
  objekt_id: number;
  mitarbeiter_id: number | null;
  filename: string;
  mimetype: string;
  filesize: number;
  sha256: string;
  notiz: string | null;
  erstellt_am: string;
  erstellt_von: string;
  erstellt_von_name: string | null;
}

@Injectable({ providedIn: 'root' })
export class EvidenceApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadEvidencePage(query: {
    page: number;
    pageSize: number;
    objectId?: number;
    q?: string;
  }): Observable<PaginatedResponse<EvidenceListItemApi>> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));
    if (query.q) params = params.set('q', query.q);
    if (query.objectId) params = params.set('objectId', String(query.objectId));
    return this.http.get<PaginatedResponse<EvidenceListItemApi>>(`${this.baseUrl}/nachweise`, {
      params,
    });
  }

  getEvidenceDownloadUrl(id: number, inline = false): string {
    return `${this.baseUrl}/nachweise/${id}/download?inline=${inline ? '1' : '0'}`;
  }

  uploadEvidence(formData: FormData): Observable<EvidenceListItemApi> {
    return this.http.post<EvidenceListItemApi>(`${this.baseUrl}/nachweise/upload`, formData);
  }
}
