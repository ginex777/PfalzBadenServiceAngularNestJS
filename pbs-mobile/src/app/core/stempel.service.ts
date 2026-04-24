import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MobileApiConfigService } from './api-config.service';

export interface StempelEintrag {
  id: number;
  mitarbeiter_id: number;
  objekt_id?: number | null;
  start: string;
  stop: string | null;
  dauer_minuten: number | null;
  notiz: string | null;
}

@Injectable({ providedIn: 'root' })
export class StempelService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(MobileApiConfigService);

  start(employeeId: number, objectId: number, note?: string) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http.post<StempelEintrag>(
      `${baseUrl}/api/mitarbeiter/${employeeId}/stempel/start`,
      { objektId: objectId, notiz: note ?? null },
    );
  }

  stop(employeeId: number) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http.post<StempelEintrag>(
      `${baseUrl}/api/mitarbeiter/${employeeId}/stempel/stop`,
      {},
    );
  }

  getTimeEntries(employeeId: number) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http.get<StempelEintrag[]>(
      `${baseUrl}/api/mitarbeiter/${employeeId}/zeiterfassung`,
    );
  }
}
