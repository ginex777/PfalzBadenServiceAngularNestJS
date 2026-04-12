import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Kunde } from '../models';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class KundenApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = inject(API_BASE_URL);

  laden(): Observable<Kunde[]> {
    return this.http.get<Kunde[]>(`${this.basis}/kunden`);
  }
  erstellen(daten: Partial<Kunde>): Observable<Kunde> {
    return this.http.post<Kunde>(`${this.basis}/kunden`, daten);
  }
  aktualisieren(id: number, daten: Partial<Kunde>): Observable<Kunde> {
    return this.http.put<Kunde>(`${this.basis}/kunden/${id}`, daten);
  }
  loeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/kunden/${id}`);
  }
}
