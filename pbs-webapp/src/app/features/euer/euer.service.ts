import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BuchhaltungJahr, FirmaSettings } from '../../core/models';
import { EuerErgebnis } from './euer.models';
import { AccountingApiClient, PdfApiClient, SettingsApiClient } from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class EuerService {
  private readonly accountingApi = inject(AccountingApiClient);
  private readonly settingsApi = inject(SettingsApiClient);
  private readonly pdfApi = inject(PdfApiClient);

  loadAccounting(jahr: number): Observable<BuchhaltungJahr> {
    return this.accountingApi.loadAccounting(jahr);
  }
  firmaLaden(): Observable<FirmaSettings> {
    return this.settingsApi.loadSettings('firma');
  }

  // PDF wird serverseitig mit Handlebars generiert — nur Daten senden
  pdfErstellen(jahr: number, ergebnis: EuerErgebnis): Observable<{ token: string; url: string }> {
    return this.pdfApi.createEuerPdf(jahr, ergebnis);
  }
}
