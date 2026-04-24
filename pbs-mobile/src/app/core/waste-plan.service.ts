import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MobileApiConfigService } from './api-config.service';

export interface UpcomingWastePickup {
  id: number;
  objekt_id: number;
  muellart: string;
  farbe: string;
  abholung: string;
  erledigt: boolean;
  objekt_name?: string;
}

export interface WasteObject {
  id: number;
  name: string;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
}

export interface WastePickup {
  id: number;
  objekt_id: number;
  muellart: string;
  farbe: string;
  abholung: string;
  erledigt: boolean;
}

@Injectable({ providedIn: 'root' })
export class WastePlanService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(MobileApiConfigService);

  getPickupsForObject(objectId: number) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http.get<WastePickup[]>(`${baseUrl}/api/muellplan/${objectId}`);
  }

  getUpcoming(limit = 5) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<UpcomingWastePickup[]>(`${baseUrl}/api/muellplan-upcoming`, { params });
  }
}
