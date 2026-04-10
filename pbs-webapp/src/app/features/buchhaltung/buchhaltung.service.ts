// ============================================================
// Buchhaltung — HTTP-Service (nur API-Calls, keine Logik)
// ============================================================

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  BuchhaltungEintrag,
  BuchhaltungJahr,
  VstPaid,
  GesperrterMonat,
  WiederkehrendeAusgabe,
  Beleg,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class BuchhaltungService {
  private readonly api = inject(ApiService);

  jahresDateLaden(jahr: number): Observable<BuchhaltungJahr> {
    return this.api.buchhaltungLaden(jahr);
  }

  batchSpeichern(
    jahr: number,
    monat: number,
    zeilen: Partial<BuchhaltungEintrag>[]
  ): Observable<BuchhaltungEintrag[]> {
    return this.api.buchhaltungBatchSpeichern(jahr, monat, zeilen);
  }

  eintragLoeschen(id: number): Observable<void> {
    return this.api.buchhaltungEintragLoeschen(id);
  }

  vstLaden(jahr: number): Observable<VstPaid[]> {
    return this.api.vstLaden(jahr);
  }

  vstSpeichern(daten: Partial<VstPaid>): Observable<VstPaid> {
    return this.api.vstSpeichern(daten);
  }

  gesperrteMonateLaden(jahr: number): Observable<GesperrterMonat[]> {
    return this.api.gesperrteMonateLaden(jahr);
  }

  monatSperren(jahr: number, monat: number): Observable<GesperrterMonat> {
    return this.api.monatSperren(jahr, monat);
  }

  monatEntsperren(jahr: number, monat: number): Observable<void> {
    return this.api.monatEntsperren(jahr, monat);
  }

  wiederkehrendeAusgabenLaden(): Observable<WiederkehrendeAusgabe[]> {
    return this.api.wiederkehrendeAusgabenLaden();
  }

  belegeFuerBuchungLaden(buchungId: number): Observable<Beleg[]> {
    return this.api.belegeFuerBuchungLaden(buchungId);
  }

  belegHochladen(formData: FormData): Observable<Beleg> {
    return this.api.belegHochladen(formData);
  }

  belegDownloadUrl(id: number, inline = false): string {
    return this.api.belegDownloadUrl(id, inline);
  }
}
