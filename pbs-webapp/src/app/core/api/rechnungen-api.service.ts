import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rechnung, Mahnung } from '../models';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class RechnungenApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = inject(API_BASE_URL);

  laden(): Observable<Rechnung[]> {
    return this.http.get<Rechnung[]>(`${this.basis}/rechnungen`);
  }
  erstellen(daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.http.post<Rechnung>(`${this.basis}/rechnungen`, daten);
  }
  aktualisieren(id: number, daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.http.put<Rechnung>(`${this.basis}/rechnungen/${id}`, daten);
  }
  loeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/rechnungen/${id}`);
  }
  mahnungenLaden(rechnungId: number): Observable<Mahnung[]> {
    return this.http.get<Mahnung[]>(`${this.basis}/mahnungen/${rechnungId}`);
  }
  mahnungErstellen(daten: Partial<Mahnung>): Observable<Mahnung> {
    return this.http.post<Mahnung>(`${this.basis}/mahnungen`, daten);
  }
  mahnungLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/mahnungen/${id}`);
  }
  pdfErstellen(rechnungId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/rechnung`, { rechnung_id: rechnungId });
  }
}
