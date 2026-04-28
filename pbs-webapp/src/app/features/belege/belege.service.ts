import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Beleg } from '../../core/models';
import { ReceiptsApiClient } from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class BelegeService {
  private readonly receiptsApi = inject(ReceiptsApiClient);

  alleLaden(jahr?: number): Observable<Beleg[]> {
    return this.receiptsApi.loadReceipts(jahr);
  }
  hochladen(formData: FormData): Observable<Beleg> {
    return this.receiptsApi.uploadReceipt(formData);
  }
  notizAktualisieren(id: number, notiz: string): Observable<Beleg> {
    return this.receiptsApi.updateReceiptNote(id, notiz);
  }
  loeschen(id: number): Observable<void> {
    return this.receiptsApi.deleteReceipt(id);
  }
  downloadUrl(id: number, inline = false): string {
    return this.receiptsApi.getReceiptDownloadUrl(id, inline);
  }
}
