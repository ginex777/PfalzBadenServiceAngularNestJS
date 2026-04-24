import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { MobileApiConfigService } from './api-config.service';

export type ObjectStatus = 'AKTIV' | 'INAKTIV' | (string & {});

export interface ObjectListItemApi {
  id: number;
  name: string;
  strasse: string | null;
  hausnummer: string | null;
  plz: string | null;
  ort: string | null;
  status: string;
  kunden_name: string | null;
}

export interface ObjectListItem {
  id: number;
  name: string;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  status: ObjectStatus;
  customerName: string | null;
}

function mapObject(row: ObjectListItemApi): ObjectListItem {
  return {
    id: row.id,
    name: row.name,
    street: row.strasse,
    houseNumber: row.hausnummer,
    postalCode: row.plz,
    city: row.ort,
    status: row.status as ObjectStatus,
    customerName: row.kunden_name,
  };
}

@Injectable({ providedIn: 'root' })
export class ObjectsService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(MobileApiConfigService);

  getAll() {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http
      .get<ObjectListItemApi[]>(`${baseUrl}/api/objekte/all`)
      .pipe(map((rows) => rows.map(mapObject)));
  }
}

