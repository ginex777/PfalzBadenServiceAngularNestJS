import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Angebot } from '../models';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class AngeboteApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = inject(API_BASE_URL);

  laden(): Observable<Angebot[]> {
    return this.http.get<Angebot[]>(`${this.basis}/angebote`);
  }
  erstellen(daten: Partial<Angebot>): Observable<Angebot> {
    return this.http.post<Angebot>(`${this.basis}/angebote`, daten);
  }
  aktualisieren(id: number, daten: Partial<Angebot>): Observable<Angebot> {
    return this.http.put<Angebot>(`${this.basis}/angebote/${id}`, daten);
  }
  loeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/angebote/${id}`);
  }
  pdfErstellen(angebotId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/angebot`, { angebot_id: angebotId });
  }
}
