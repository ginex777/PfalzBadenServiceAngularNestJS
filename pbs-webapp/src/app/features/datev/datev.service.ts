import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ApiService, DatevVorschauAntwort } from '../../core/api/api.service';
import { FirmaSettings } from '../../core/models';

export type { DatevVorschauAntwort };

@Injectable({ providedIn: 'root' })
export class DatevService {
  private readonly api = inject(ApiService);

  validierenUndVorschauLaden(
    jahr: number,
    monat: number,
  ): Observable<{ validierung: DatevVorschauAntwort; vorschau: DatevVorschauAntwort }> {
    return forkJoin({
      validierung: this.api.validateDatev(jahr, monat),
      vorschau: this.api.loadDatevPreview(jahr, monat),
    });
  }

  firmaLaden(): Observable<FirmaSettings> {
    return this.api.loadSettings('firma');
  }

  exportUrl(jahr: number, monat: number): string {
    return this.api.getDatevExportUrl(jahr, monat);
  }
  excelUrl(jahr: number, monat: number): string {
    return this.api.getDatevExcelUrl(jahr, monat);
  }
}
