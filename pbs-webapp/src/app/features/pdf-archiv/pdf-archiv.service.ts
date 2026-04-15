import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { BrowserService } from '../../core/services/browser.service';
import { PdfArchiveEntry } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PdfArchivService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly browser = inject(BrowserService);

  alleLaden(): Observable<PdfArchiveEntry[]> { return this.api.pdfArchivLaden(); }

  eintragLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`/api/pdf/archiv/${id}`);
  }

  alleLoeschen(): Observable<{ ok: boolean; deleted: number }> {
    return this.http.delete<{ ok: boolean; deleted: number }>('/api/pdf/archiv/cleanup');
  }

  pdfOeffnen(id: number): Promise<void> {
    return this.browser.blobOeffnen(`/api/pdf/archiv/${id}/regenerate`);
  }
}
