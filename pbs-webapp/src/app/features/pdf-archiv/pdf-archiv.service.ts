import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { BrowserService } from '../../core/services/browser.service';
import { PaginatedResponse, PdfArchiveEntry } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PdfArchivService {
  private readonly api = inject(ApiService);
  private readonly browser = inject(BrowserService);

  seiteLaden(query: {
    page: number;
    pageSize: number;
    q?: string;
    typ?: string;
  }): Observable<PaginatedResponse<PdfArchiveEntry>> {
    return this.api.loadPdfArchivePage(query);
  }

  eintragLoeschen(id: number): Observable<void> {
    return this.api.deletePdfArchiveEntry(id);
  }

  alleLoeschen(): Observable<{ ok: boolean; deleted: number }> {
    return this.api.deleteAllPdfArchive();
  }

  pdfOeffnen(id: number): Promise<void> {
    return this.browser.blobOeffnen(`/api/pdf/archiv/${id}/regenerate`);
  }
}
