import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import { MobileApiConfigService } from './api-config.service';

export interface WastePickupApi {
  id: number;
  objekt_id: number;
  muellart: string;
  farbe: string;
  abholung: string;
  erledigt: boolean;
  isToday: boolean;
  isDue: boolean;
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
  objectId: number;
  wasteType: string;
  color: string;
  pickupDate: string;
  isDone: boolean;
  isToday: boolean;
  isDue: boolean;
}

export interface UpcomingWastePickup extends WastePickup {
  objectName?: string;
}

@Injectable({ providedIn: 'root' })
export class WastePlanService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(MobileApiConfigService);

  getPickupsForObject(objectId: number): Observable<WastePickup[]> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http
      .get<WastePickupApi[]>(`${baseUrl}/api/muellplan/${objectId}`)
      .pipe(map((pickups) => pickups.map(mapWastePickup)));
  }

  getUpcoming(limit = 5): Observable<UpcomingWastePickup[]> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    const params = new HttpParams().set('limit', String(limit));
    return this.http
      .get<WastePickupApi[]>(`${baseUrl}/api/muellplan-upcoming`, { params })
      .pipe(map((pickups) => pickups.map(mapUpcomingWastePickup)));
  }

  markPickupDone(id: number, comment?: string): Observable<WastePickup> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http
      .patch<WastePickupApi>(`${baseUrl}/api/muellplan/${id}/erledigen`, { kommentar: comment })
      .pipe(map(mapWastePickup));
  }
}

export function mapWastePickup(pickup: WastePickupApi): WastePickup {
  return {
    id: pickup.id,
    objectId: pickup.objekt_id,
    wasteType: pickup.muellart,
    color: pickup.farbe,
    pickupDate: pickup.abholung,
    isDone: pickup.erledigt,
    isToday: pickup.isToday ?? false,
    isDue: pickup.isDue ?? false,
  };
}

export function mapUpcomingWastePickup(pickup: WastePickupApi): UpcomingWastePickup {
  return {
    ...mapWastePickup(pickup),
    objectName: pickup.objekt_name,
  };
}
