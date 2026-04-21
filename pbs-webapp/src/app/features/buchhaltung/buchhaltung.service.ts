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
    return this.api.loadAccounting(jahr);
  }

  batchSpeichern(
    jahr: number,
    monat: number,
    zeilen: Partial<BuchhaltungEintrag>[],
  ): Observable<BuchhaltungEintrag[]> {
    return this.api.saveAccountingBatch(jahr, monat, zeilen);
  }

  eintragLoeschen(id: number): Observable<void> {
    return this.api.deleteAccountingEntry(id);
  }

  loadVst(jahr: number): Observable<VstPaid[]> {
    return this.api.loadVst(jahr);
  }

  saveVst(daten: Partial<VstPaid>): Observable<VstPaid> {
    return this.api.saveVst(daten);
  }

  loadLockedMonths(jahr: number): Observable<GesperrterMonat[]> {
    return this.api.loadLockedMonths(jahr);
  }

  lockMonth(jahr: number, monat: number): Observable<GesperrterMonat> {
    return this.api.lockMonth(jahr, monat);
  }

  unlockMonth(jahr: number, monat: number): Observable<void> {
    return this.api.unlockMonth(jahr, monat);
  }

  loadRecurringExpenses(): Observable<WiederkehrendeAusgabe[]> {
    return this.api.loadRecurringExpenses();
  }

  loadReceiptsForEntry(buchungId: number): Observable<Beleg[]> {
    return this.api.loadReceiptsForEntry(buchungId);
  }

  uploadReceipt(formData: FormData): Observable<Beleg> {
    return this.api.uploadReceipt(formData);
  }

  getReceiptDownloadUrl(id: number, inline = false): string {
    return this.api.getReceiptDownloadUrl(id, inline);
  }
}
