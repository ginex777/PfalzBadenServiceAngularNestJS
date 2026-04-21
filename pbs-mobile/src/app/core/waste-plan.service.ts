import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE } from './auth.service';

export interface UpcomingWastePickup {
  id: number;
  objekt_id: number;
  muellart: string;
  farbe: string;
  abholung: string;
  erledigt: boolean;
  objekt_name?: string;
}

@Injectable({ providedIn: 'root' })
export class WastePlanService {
  private readonly http = inject(HttpClient);

  getUpcoming(limit = 5) {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<UpcomingWastePickup[]>(`${API_BASE}/api/muellplan-upcoming`, { params });
  }
}
