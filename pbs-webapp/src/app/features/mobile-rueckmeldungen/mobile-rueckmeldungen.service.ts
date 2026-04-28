import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { PaginatedResponse } from '../../core/models';
import { MobileFeedbackKindApi, MobileFeedbackItemApi } from '../../core/api/api.contract';
import { MobileFeedbackApiClient, ObjectsApiClient } from '../../core/api/clients';

export type MobileFeedbackKind = MobileFeedbackKindApi;

export interface MobileFeedbackItem {
  kind: MobileFeedbackKind;
  id: number;
  createdAt: string;
  objectId: number;
  objectName: string;
  title: string;
  subtitle: string | null;
  link: string;
  createdByEmail: string | null;
  createdByName: string | null;
}

function mapItem(item: MobileFeedbackItemApi): MobileFeedbackItem {
  return item;
}

@Injectable({ providedIn: 'root' })
export class MobileRueckmeldungenService {
  private readonly objectsApi = inject(ObjectsApiClient);
  private readonly mobileFeedbackApi = inject(MobileFeedbackApiClient);

  loadObjectsAll() {
    return this.objectsApi.loadObjects();
  }

  loadFeedbackPage(query: { page: number; pageSize: number; objectId?: number }) {
    return this.mobileFeedbackApi.loadMobileFeedbackPage(query).pipe(
      map((r: PaginatedResponse<MobileFeedbackItemApi>) => ({
        ...r,
        data: r.data.map(mapItem),
      })),
    );
  }
}
