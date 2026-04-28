// ============================================================
// Buchhaltung — HTTP-Service (nur API-Calls, keine Logik)
// ============================================================

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BuchhaltungEintrag,
  BuchhaltungJahr,
  VstPaid,
  GesperrterMonat,
  WiederkehrendeAusgabe,
  Beleg,
} from '../../core/models';
import {
  AccountingApiClient,
  ReceiptsApiClient,
  RecurringExpensesApiClient,
} from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class BuchhaltungService {
  private readonly accountingApi = inject(AccountingApiClient);
  private readonly recurringExpensesApi = inject(RecurringExpensesApiClient);
  private readonly receiptsApi = inject(ReceiptsApiClient);

  jahresDateLaden(jahr: number): Observable<BuchhaltungJahr> {
    return this.accountingApi.loadAccounting(jahr);
  }

  batchSpeichern(
    jahr: number,
    monat: number,
    zeilen: Partial<BuchhaltungEintrag>[],
  ): Observable<BuchhaltungEintrag[]> {
    return this.accountingApi.saveAccountingBatch(jahr, monat, zeilen);
  }

  eintragLoeschen(id: number): Observable<void> {
    return this.accountingApi.deleteAccountingEntry(id);
  }

  loadVst(jahr: number): Observable<VstPaid[]> {
    return this.accountingApi.loadVst(jahr);
  }

  saveVst(daten: Partial<VstPaid>): Observable<VstPaid> {
    return this.accountingApi.saveVst(daten);
  }

  loadLockedMonths(jahr: number): Observable<GesperrterMonat[]> {
    return this.accountingApi.loadLockedMonths(jahr);
  }

  lockMonth(jahr: number, monat: number): Observable<GesperrterMonat> {
    return this.accountingApi.lockMonth(jahr, monat);
  }

  unlockMonth(jahr: number, monat: number): Observable<void> {
    return this.accountingApi.unlockMonth(jahr, monat);
  }

  loadRecurringExpenses(): Observable<WiederkehrendeAusgabe[]> {
    return this.recurringExpensesApi.loadRecurringExpenses();
  }

  loadReceiptsForEntry(buchungId: number): Observable<Beleg[]> {
    return this.receiptsApi.loadReceiptsForEntry(buchungId);
  }

  uploadReceipt(formData: FormData): Observable<Beleg> {
    return this.receiptsApi.uploadReceipt(formData);
  }

  getReceiptDownloadUrl(id: number, inline = false): string {
    return this.receiptsApi.getReceiptDownloadUrl(id, inline);
  }
}
