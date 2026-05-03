import { Injectable, inject } from '@angular/core';
import type { Observable} from 'rxjs';
import { forkJoin } from 'rxjs';
import type { Kunde, Objekt } from '../../core/models';
import { CustomersApiClient, ObjectsApiClient } from '../../core/api/clients';

export interface ObjectsInitialData {
  objects: Objekt[];
  customers: Kunde[];
}

@Injectable({ providedIn: 'root' })
export class ObjectsService {
  private readonly objectsApi = inject(ObjectsApiClient);
  private readonly customersApi = inject(CustomersApiClient);

  loadInitialData(): Observable<ObjectsInitialData> {
    return forkJoin({
      objects: this.objectsApi.loadObjects(),
      customers: this.customersApi.loadCustomers(),
    });
  }

  loadObjects(): Observable<Objekt[]> {
    return this.objectsApi.loadObjects();
  }

  createObject(payload: Partial<Objekt>): Observable<Objekt> {
    return this.objectsApi.createObject(payload);
  }

  updateObject(id: number, payload: Partial<Objekt>): Observable<Objekt> {
    return this.objectsApi.updateObject(id, payload);
  }

  deactivateObject(id: number): Observable<void> {
    return this.objectsApi.deleteObject(id);
  }
}
