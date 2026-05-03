import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import { MobileApiConfigService } from './api-config.service';
import { mapStampEntry, type StampEntry, type StampEntryApi } from './stempel.service';
import {
  mapUpcomingWastePickup,
  type UpcomingWastePickup,
  type WastePickupApi,
} from './waste-plan.service';

export type MobileDashboardSummaryScope = 'selected-object' | 'accessible-objects';
export type ActiveStampStatus = 'active' | 'inactive';

export interface MobileDashboardSummary {
  scope: MobileDashboardSummaryScope;
  objectId: number | null;
  today: string;
  openPointsCount: number;
  activeStamp: StampEntry | null;
  activeStampStatus: ActiveStampStatus;
  todayEntries: StampEntry[];
  totalTrackedMinutes: number;
  upcomingPickups: UpcomingWastePickup[];
}

interface MobileDashboardSummaryApi {
  scope: MobileDashboardSummaryScope;
  objectId: number | null;
  today: string;
  openPointsCount: number;
  activeStamp: StampEntryApi | null;
  activeStampStatus: ActiveStampStatus;
  todayEntries: StampEntryApi[];
  totalTrackedMinutes: number;
  upcomingPickups: WastePickupApi[];
}

@Injectable({ providedIn: 'root' })
export class MobileSummaryService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(MobileApiConfigService);

  getDashboardSummary(
    options: { objectId?: number | null; limit?: number } = {},
  ): Observable<MobileDashboardSummary> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    let params = new HttpParams();
    if (options.objectId != null) {
      params = params.set('objectId', String(options.objectId));
    }
    if (options.limit != null) {
      params = params.set('limit', String(options.limit));
    }
    return this.http
      .get<MobileDashboardSummaryApi>(`${baseUrl}/api/mobile/dashboard-summary`, { params })
      .pipe(map(mapDashboardSummary));
  }
}

function mapDashboardSummary(summary: MobileDashboardSummaryApi): MobileDashboardSummary {
  return {
    ...summary,
    activeStamp: summary.activeStamp ? mapStampEntry(summary.activeStamp) : null,
    todayEntries: summary.todayEntries.map(mapStampEntry),
    upcomingPickups: summary.upcomingPickups.map(mapUpcomingWastePickup),
  };
}
