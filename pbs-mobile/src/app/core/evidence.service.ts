import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { MobileApiConfigService } from './api-config.service';

export interface EvidenceListItemApi {
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

export interface EvidenceListItem {
  id: number;
  objectId: number;
  employeeId: number | null;
  filename: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
  note: string | null;
  createdAt: string;
  createdByEmail: string;
  createdByName: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

function mapEvidence(item: EvidenceListItemApi): EvidenceListItem {
  return {
    id: item.id,
    objectId: item.objekt_id,
    employeeId: item.mitarbeiter_id,
    filename: item.filename,
    mimeType: item.mimetype,
    fileSize: item.filesize,
    sha256: item.sha256,
    note: item.notiz,
    createdAt: item.erstellt_am,
    createdByEmail: item.erstellt_von,
    createdByName: item.erstellt_von_name,
  };
}

@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(MobileApiConfigService);

  list(options?: { objectId?: number; page?: number; pageSize?: number }) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    let params = new HttpParams();
    if (options?.objectId) params = params.set('objectId', String(options.objectId));
    if (options?.page) params = params.set('page', String(options.page));
    if (options?.pageSize) params = params.set('pageSize', String(options.pageSize));

    return this.http
      .get<PaginatedResponse<EvidenceListItemApi>>(`${baseUrl}/api/nachweise`, { params })
      .pipe(map((r) => ({ ...r, data: r.data.map(mapEvidence) })));
  }

  upload(params: { objectId: number; note?: string; photo: Blob; filename: string }) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    const form = new FormData();
    form.append('photo', params.photo, params.filename);
    form.append('objectId', String(params.objectId));
    if (params.note?.trim()) form.append('note', params.note.trim());

    return this.http.post<EvidenceListItemApi>(`${baseUrl}/api/nachweise/upload`, form).pipe(map(mapEvidence));
  }
}

