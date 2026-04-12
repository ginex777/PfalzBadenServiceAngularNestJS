import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BuchhaltungEintrag, BuchhaltungJahr, VstPaid, GesperrterMonat } from '../models';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class BuchhaltungApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = inject(API_BASE_URL);

  laden(jahr: number): Observable<BuchhaltungJahr> {
    return this.http.get<BuchhaltungJahr>(`${this.basis}/buchhaltung/${jahr}`);
  }
  eintragErstellen(daten: Partial<BuchhaltungEintrag>): Observable<BuchhaltungEintrag> {
    return this.http.post<BuchhaltungEintrag>(`${this.basis}/buchhaltung`, daten);
  }
  batchSpeichern(jahr: number, monat: number, zeilen: Partial<BuchhaltungEintrag>[]): Observable<BuchhaltungEintrag[]> {
    return this.http.post<BuchhaltungEintrag[]>(`${this.basis}/buchhaltung/batch`, { jahr, monat, rows: zeilen });
  }
  eintragAktualisieren(id: number, daten: Partial<BuchhaltungEintrag>): Observable<BuchhaltungEintrag> {
    return this.http.put<BuchhaltungEintrag>(`${this.basis}/buchhaltung/${id}`, daten);
  }
  eintragLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/buchhaltung/${id}`);
  }
  vstLaden(jahr: number): Observable<VstPaid[]> {
    return this.http.get<VstPaid[]>(`${this.basis}/vst/${jahr}`);
  }
  vstSpeichern(daten: Partial<VstPaid>): Observable<VstPaid> {
    return this.http.post<VstPaid>(`${this.basis}/vst`, daten);
  }
  gesperrteMonateLaden(jahr: number): Observable<GesperrterMonat[]> {
    return this.http.get<GesperrterMonat[]>(`${this.basis}/gesperrte-monate/${jahr}`);
  }
  monatSperren(jahr: number, monat: number): Observable<GesperrterMonat> {
    return this.http.post<GesperrterMonat>(`${this.basis}/gesperrte-monate`, { jahr, monat });
  }
  monatEntsperren(jahr: number, monat: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/gesperrte-monate/${jahr}/${monat}`);
  }
}
