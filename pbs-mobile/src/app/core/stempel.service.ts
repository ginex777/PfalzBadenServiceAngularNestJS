import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import { MobileApiConfigService } from './api-config.service';

export interface StampEntryApi {
  id: number;
  mitarbeiter_id: number;
  objekt_id?: number | null;
  start: string;
  stop: string | null;
  dauer_minuten: number | null;
  notiz: string | null;
}

export interface StampEntry {
  id: number;
  employeeId: number;
  objectId: number | null;
  start: string;
  stop: string | null;
  durationMinutes: number | null;
  note: string | null;
}

@Injectable({ providedIn: 'root' })
export class StempelService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(MobileApiConfigService);

  start(employeeId: number, objectId: number, note?: string): Observable<StampEntry> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http
      .post<StampEntryApi>(`${baseUrl}/api/mitarbeiter/${employeeId}/stempel/start`, {
        objektId: objectId,
        notiz: note ?? null,
      })
      .pipe(map(mapStampEntry));
  }

  stop(employeeId: number): Observable<StampEntry> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http
      .post<StampEntryApi>(`${baseUrl}/api/mitarbeiter/${employeeId}/stempel/stop`, {})
      .pipe(map(mapStampEntry));
  }

  getTimeEntries(employeeId: number): Observable<StampEntry[]> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http
      .get<StampEntryApi[]>(`${baseUrl}/api/mitarbeiter/${employeeId}/zeiterfassung`)
      .pipe(map((entries) => entries.map(mapStampEntry)));
  }

  getActiveStamp(employeeId: number): Observable<StampEntry | null> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http
      .get<StampEntryApi | null>(`${baseUrl}/api/mitarbeiter/${employeeId}/stempel/aktiv`)
      .pipe(map((entry) => (entry ? mapStampEntry(entry) : null)));
  }
}

export function mapStampEntry(entry: StampEntryApi): StampEntry {
  return {
    id: entry.id,
    employeeId: entry.mitarbeiter_id,
    objectId: entry.objekt_id ?? null,
    start: entry.start,
    stop: entry.stop,
    durationMinutes: entry.dauer_minuten,
    note: entry.notiz,
  };
}
