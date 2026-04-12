import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from './auth.service';

export interface StempelEintrag {
  id: number;
  mitarbeiter_id: number;
  start: string;
  stop: string | null;
  dauer_minuten: number | null;
  notiz: string | null;
}

@Injectable({ providedIn: 'root' })
export class StempelService {
  private readonly http = inject(HttpClient);

  start(mitarbeiterId: number, notiz?: string) {
    return this.http.post<StempelEintrag>(
      `${API_BASE}/api/mitarbeiter/${mitarbeiterId}/stempel/start`,
      { notiz: notiz ?? null },
    );
  }

  stop(mitarbeiterId: number) {
    return this.http.post<StempelEintrag>(
      `${API_BASE}/api/mitarbeiter/${mitarbeiterId}/stempel/stop`,
      {},
    );
  }

  zeiterfassung(mitarbeiterId: number) {
    return this.http.get<StempelEintrag[]>(
      `${API_BASE}/api/mitarbeiter/${mitarbeiterId}/zeiterfassung`,
    );
  }
}
