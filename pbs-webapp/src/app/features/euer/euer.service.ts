import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { BuchhaltungJahr, FirmaSettings } from '../../core/models';
import { EuerErgebnis } from './euer.models';

@Injectable({ providedIn: 'root' })
export class EuerService {
  private readonly api = inject(ApiService);

  loadAccounting(jahr: number): Observable<BuchhaltungJahr> {
    return this.api.loadAccounting(jahr);
  }
  firmaLaden(): Observable<FirmaSettings> {
    return this.api.loadSettings('firma');
  }

  // PDF wird serverseitig mit Handlebars generiert — nur Daten senden
  pdfErstellen(jahr: number, ergebnis: EuerErgebnis): Observable<{ token: string; url: string }> {
    return this.api.createEuerPdf(jahr, ergebnis as unknown as Record<string, unknown>);
  }
}
