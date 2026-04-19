import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ApiService, DatevVorschauAntwort } from '../../core/api/api.service';
import { FirmaSettings } from '../../core/models';

export type { DatevVorschauAntwort };

@Injectable({ providedIn: 'root' })
export class DatevService {
  private readonly api = inject(ApiService);

  validierenUndVorschauLaden(jahr: number, monat: number): Observable<{ validierung: DatevVorschauAntwort; vorschau: DatevVorschauAntwort }> {
    return forkJoin({
      validierung: this.api.datevValidieren(jahr, monat),
      vorschau: this.api.datevVorschauLaden(jahr, monat),
    });
  }

  firmaLaden(): Observable<FirmaSettings> { return this.api.einstellungenLaden('firma'); }

  exportUrl(jahr: number, monat: number): string { return this.api.datevExportUrl(jahr, monat); }
  excelUrl(jahr: number, monat: number): string { return this.api.datevExcelUrl(jahr, monat); }
}
