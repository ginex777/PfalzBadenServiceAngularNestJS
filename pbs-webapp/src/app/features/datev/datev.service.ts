import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { FirmaSettings } from '../../core/models';
import { DatevApiClient, SettingsApiClient } from '../../core/api/clients';
import { DatevVorschauAntwort } from '../../core/api/api.contract';

export type { DatevVorschauAntwort };

@Injectable({ providedIn: 'root' })
export class DatevService {
  private readonly datevApi = inject(DatevApiClient);
  private readonly settingsApi = inject(SettingsApiClient);

  validierenUndVorschauLaden(
    jahr: number,
    monat: number,
  ): Observable<{ validierung: DatevVorschauAntwort; vorschau: DatevVorschauAntwort }> {
    return forkJoin({
      validierung: this.datevApi.validateDatev(jahr, monat),
      vorschau: this.datevApi.loadDatevPreview(jahr, monat),
    });
  }

  firmaLaden(): Observable<FirmaSettings> {
    return this.settingsApi.loadSettings('firma');
  }

  exportUrl(jahr: number, monat: number): string {
    return this.datevApi.getDatevExportUrl(jahr, monat);
  }
  excelUrl(jahr: number, monat: number): string {
    return this.datevApi.getDatevExcelUrl(jahr, monat);
  }
}
