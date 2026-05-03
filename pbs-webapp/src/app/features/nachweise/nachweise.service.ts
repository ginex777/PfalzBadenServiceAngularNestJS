import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Objekt, PaginatedResponse } from '../../core/models';
import { EvidenceApiClient, ObjectsApiClient } from '../../core/api/clients';

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
export class NachweiseService {
  private readonly objectsApi = inject(ObjectsApiClient);
  private readonly evidenceApi = inject(EvidenceApiClient);

  loadObjectsAll(): Observable<Objekt[]> {
    return this.objectsApi.loadObjects();
  }

  loadEvidencePage(query: {
    page: number;
    pageSize: number;
    objectId?: number;
  }): Observable<PaginatedResponse<EvidenceListItem>> {
    return this.evidenceApi.loadEvidencePage(query).pipe(
      map((r: PaginatedResponse<EvidenceListItemApi>) => ({
        ...r,
        data: r.data.map(mapEvidence),
      })),
    );
  }

  getEvidenceDownloadUrl(id: number, inline = false): string {
    return this.evidenceApi.getEvidenceDownloadUrl(id, inline);
  }

  uploadEvidence(objectId: number, file: File, note?: string): Observable<EvidenceListItem> {
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('objectId', String(objectId));
    if (note?.trim()) fd.append('note', note.trim());
    return this.evidenceApi.uploadEvidence(fd).pipe(map(mapEvidence));
  }
}
