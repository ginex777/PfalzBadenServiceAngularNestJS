import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  AccountingYearSummary,
  BuchhaltungEintrag,
  BuchhaltungJahr,
  GesperrterMonat,
  VstPaid,
} from '../../models';

@Injectable({ providedIn: 'root' })
export class AccountingApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadAccounting(year: number): Observable<BuchhaltungJahr> {
    return this.http.get<BuchhaltungJahr>(`${this.baseUrl}/buchhaltung/${year}`);
  }

  loadAccountingSummary(year: number): Observable<AccountingYearSummary> {
    return this.http.get<AccountingYearSummary>(`${this.baseUrl}/buchhaltung/${year}/summary`);
  }

  createAccountingEntry(data: Partial<BuchhaltungEintrag>): Observable<BuchhaltungEintrag> {
    return this.http.post<BuchhaltungEintrag>(`${this.baseUrl}/buchhaltung`, data);
  }

  saveAccountingBatch(
    year: number,
    month: number,
    rows: Array<Partial<BuchhaltungEintrag>>,
  ): Observable<BuchhaltungEintrag[]> {
    return this.http.post<BuchhaltungEintrag[]>(`${this.baseUrl}/buchhaltung/batch`, {
      jahr: year,
      monat: month,
      rows,
    });
  }

  updateAccountingEntry(id: number, data: Partial<BuchhaltungEintrag>): Observable<BuchhaltungEintrag> {
    return this.http.put<BuchhaltungEintrag>(`${this.baseUrl}/buchhaltung/${id}`, data);
  }

  deleteAccountingEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/buchhaltung/${id}`);
  }

  loadVst(year: number): Observable<VstPaid[]> {
    return this.http.get<VstPaid[]>(`${this.baseUrl}/vst/${year}`);
  }

  saveVst(data: Partial<VstPaid>): Observable<VstPaid> {
    return this.http.post<VstPaid>(`${this.baseUrl}/vst`, data);
  }

  loadLockedMonths(year: number): Observable<GesperrterMonat[]> {
    return this.http.get<GesperrterMonat[]>(`${this.baseUrl}/gesperrte-monate/${year}`);
  }

  lockMonth(year: number, month: number): Observable<GesperrterMonat> {
    return this.http.post<GesperrterMonat>(`${this.baseUrl}/gesperrte-monate`, {
      jahr: year,
      monat: month,
    });
  }

  unlockMonth(year: number, month: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/gesperrte-monate/${year}/${month}`);
  }
}
