import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { Objekt } from '../../models';

@Injectable({ providedIn: 'root' })
export class ObjectsApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadObjects(): Observable<Objekt[]> {
    return this.http.get<Objekt[]>(`${this.baseUrl}/objekte/all`);
  }

  createObject(data: Partial<Objekt>): Observable<Objekt> {
    return this.http.post<Objekt>(`${this.baseUrl}/objekte`, data);
  }

  updateObject(id: number, data: Partial<Objekt>): Observable<Objekt> {
    return this.http.put<Objekt>(`${this.baseUrl}/objekte/${id}`, data);
  }

  deleteObject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/objekte/${id}`);
  }
}
