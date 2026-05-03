import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { FirmaSettings, SettingsKey } from '../../models';

@Injectable({ providedIn: 'root' })
export class SettingsApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadSettings(key: SettingsKey): Observable<FirmaSettings> {
    return this.http.get<FirmaSettings>(`${this.baseUrl}/settings/${key}`);
  }

  saveSettings(key: SettingsKey, data: Partial<FirmaSettings>): Observable<FirmaSettings> {
    return this.http.post<FirmaSettings>(`${this.baseUrl}/settings/${key}`, data);
  }
}

