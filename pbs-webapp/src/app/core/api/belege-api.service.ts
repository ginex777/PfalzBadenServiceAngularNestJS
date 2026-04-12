import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Beleg } from '../models';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class BelegeApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = inject(API_BASE_URL);

  laden(jahr?: number): Observable<Beleg[]> {
    const params = jahr ? new HttpParams().set('jahr', jahr) : undefined;
    return this.http.get<Beleg[]>(`${this.basis}/belege`, { params });
  }
  einzelnLaden(id: number): Observable<Beleg> {
    return this.http.get<Beleg>(`${this.basis}/belege/${id}`);
  }
  fuerBuchungLaden(buchungId: number): Observable<Beleg[]> {
    return this.http.get<Beleg[]>(`${this.basis}/belege/buchhaltung/${buchungId}`);
  }
  hochladen(formData: FormData): Observable<Beleg> {
    return this.http.post<Beleg>(`${this.basis}/belege/upload`, formData);
  }
  notizAktualisieren(id: number, notiz: string): Observable<Beleg> {
    return this.http.patch<Beleg>(`${this.basis}/belege/${id}/notiz`, { notiz });
  }
  loeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/belege/${id}`);
  }
  downloadUrl(id: number, inline = false): string {
    return `${this.basis}/belege/${id}/download${inline ? '?inline=1' : ''}`;
  }
}
