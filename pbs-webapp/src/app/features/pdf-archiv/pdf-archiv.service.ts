import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PdfArchiveEntry } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PdfArchivService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  alleLaden(): Observable<PdfArchiveEntry[]> { return this.api.pdfArchivLaden(); }

  eintragLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`/api/pdf/archiv/${id}`);
  }

  alleLoeschen(): Observable<{ ok: boolean; deleted: number }> {
    return this.http.delete<{ ok: boolean; deleted: number }>('/api/pdf/archiv/cleanup');
  }
}
