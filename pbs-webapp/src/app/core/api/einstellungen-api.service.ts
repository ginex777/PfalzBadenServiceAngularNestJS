import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FirmaSettings, SettingsKey } from '../models';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class EinstellungenApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = inject(API_BASE_URL);

  laden(schluessel: SettingsKey): Observable<FirmaSettings> {
    return this.http.get<FirmaSettings>(`${this.basis}/settings/${schluessel}`);
  }
  speichern(schluessel: SettingsKey, daten: Partial<FirmaSettings>): Observable<FirmaSettings> {
    return this.http.post<FirmaSettings>(`${this.basis}/settings/${schluessel}`, daten);
  }
}
