import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Kunde, Objekt } from '../../core/models';

export interface ObjectsInitialData {
  objects: Objekt[];
  customers: Kunde[];
}

@Injectable({ providedIn: 'root' })
export class ObjectsService {
  private readonly api = inject(ApiService);

  loadInitialData(): Observable<ObjectsInitialData> {
    return forkJoin({
      objects: this.api.loadObjects(),
      customers: this.api.loadCustomers(),
    });
  }

  loadObjects(): Observable<Objekt[]> {
    return this.api.loadObjects();
  }

  createObject(payload: Partial<Objekt>): Observable<Objekt> {
    return this.api.createObject(payload);
  }

  updateObject(id: number, payload: Partial<Objekt>): Observable<Objekt> {
    return this.api.updateObject(id, payload);
  }

  deactivateObject(id: number): Observable<void> {
    return this.api.deleteObject(id);
  }
}
