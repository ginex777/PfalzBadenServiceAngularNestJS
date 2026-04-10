import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { FirmaSettings } from '../../core/models';
import { DatevVorschauAntwort } from './datev.models';

@Injectable({ providedIn: 'root' })
export class DatevService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  validierenUndVorschauLaden(jahr: number, monat: number): Observable<{ validierung: DatevVorschauAntwort; vorschau: DatevVorschauAntwort }> {
    const params = new HttpParams().set('jahr', jahr).set('monat', monat);
    return new Observable(observer => {
      forkJoin({
        validierung: this.http.get<DatevVorschauAntwort>(`/api/datev/validate`, { params }),
        vorschau: this.http.get<DatevVorschauAntwort>(`/api/datev/preview`, { params }),
      }).subscribe({ next: d => { observer.next(d); observer.complete(); }, error: e => observer.error(e) });
    });
  }

  firmaLaden(): Observable<FirmaSettings> { return this.api.einstellungenLaden('firma'); }

  exportUrl(jahr: number, monat: number): string { return this.api.datevExportUrl(jahr, monat); }
  excelUrl(jahr: number, monat: number): string { return this.api.datevExcelUrl(jahr, monat); }
}
