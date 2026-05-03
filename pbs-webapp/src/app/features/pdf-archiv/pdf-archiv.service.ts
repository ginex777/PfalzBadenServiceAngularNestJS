import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { BrowserService } from '../../core/services/browser.service';
import type { PaginatedResponse, PdfArchiveEntry } from '../../core/models';
import { PdfArchiveApiClient } from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class PdfArchivService {
  private readonly pdfArchiveApi = inject(PdfArchiveApiClient);
  private readonly browser = inject(BrowserService);

  seiteLaden(query: {
    page: number;
    pageSize: number;
    q?: string;
    typ?: string;
  }): Observable<PaginatedResponse<PdfArchiveEntry>> {
    return this.pdfArchiveApi.loadPdfArchivePage(query);
  }

  eintragLoeschen(id: number): Observable<void> {
    return this.pdfArchiveApi.deletePdfArchiveEntry(id);
  }

  alleLoeschen(): Observable<{ ok: boolean; deleted: number }> {
    return this.pdfArchiveApi.deleteAllPdfArchive();
  }

  pdfOeffnen(id: number): Promise<void> {
    return this.browser.blobOeffnen(`/api/pdf/archiv/${id}/regenerate`);
  }
}
