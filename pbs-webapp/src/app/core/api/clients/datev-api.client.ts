import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { DatevVorschauAntwort } from '../api.contract';

@Injectable({ providedIn: 'root' })
export class DatevApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  validateDatev(year: number, month: number): Observable<DatevVorschauAntwort> {
    const params = new HttpParams().set('jahr', String(year)).set('monat', String(month));
    return this.http.get<DatevVorschauAntwort>(`${this.baseUrl}/datev/validate`, { params });
  }

  loadDatevPreview(year: number, month: number): Observable<DatevVorschauAntwort> {
    const params = new HttpParams().set('jahr', String(year)).set('monat', String(month));
    return this.http.get<DatevVorschauAntwort>(`${this.baseUrl}/datev/preview`, { params });
  }

  getDatevExportUrl(year: number, month: number): string {
    return `${this.baseUrl}/datev/export?jahr=${year}&monat=${month}`;
  }

  getDatevExcelUrl(year: number, month: number): string {
    return `${this.baseUrl}/datev/excel?jahr=${year}&monat=${month}`;
  }
}

