// ============================================================
// Buchhaltung — HTTP-Service (nur API-Calls, keine Logik)
// ============================================================

import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  BuchhaltungEintrag,
  BuchhaltungJahr,
  VstPaid,
  GesperrterMonat,
  WiederkehrendeAusgabe,
  Beleg,
  AccountingYearSummary,
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

  jahresZusammenfassungLaden(jahr: number): Observable<AccountingYearSummary> {
    return this.accountingApi.loadAccountingSummary(jahr);
  }

  batchSpeichern(
    jahr: number,
    monat: number,
    zeilen: Array<Partial<BuchhaltungEintrag>>,
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
