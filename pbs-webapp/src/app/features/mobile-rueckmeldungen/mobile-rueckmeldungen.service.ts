import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import {
  ApiService,
  MobileFeedbackItemApi,
  MobileFeedbackKindApi,
} from '../../core/api/api.service';
import { PaginatedResponse } from '../../core/models';

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
  private readonly api = inject(ApiService);

  loadObjectsAll() {
    return this.api.loadObjects();
  }

  loadFeedbackPage(query: { page: number; pageSize: number; objectId?: number }) {
    return this.api.loadMobileFeedbackPage(query).pipe(
      map((r: PaginatedResponse<MobileFeedbackItemApi>) => ({
        ...r,
        data: r.data.map(mapItem),
      })),
    );
  }
}
