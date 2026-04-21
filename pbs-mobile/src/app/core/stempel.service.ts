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

  start(employeeId: number, note?: string) {
    return this.http.post<StempelEintrag>(
      `${API_BASE}/api/mitarbeiter/${employeeId}/stempel/start`,
      { notiz: note ?? null },
    );
  }

  stop(employeeId: number) {
    return this.http.post<StempelEintrag>(
      `${API_BASE}/api/mitarbeiter/${employeeId}/stempel/stop`,
      {},
    );
  }

  getTimeEntries(employeeId: number) {
    return this.http.get<StempelEintrag[]>(
      `${API_BASE}/api/mitarbeiter/${employeeId}/zeiterfassung`,
    );
  }
}
