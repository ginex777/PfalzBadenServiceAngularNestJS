import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, firstValueFrom } from 'rxjs';
import {
  Rechnung,
  Kunde,
  FirmaSettings,
  RechnungPosition,
  Mahnung,
  AuditLogEntry,
} from '../../core/models';
import {
  AuditLogApiClient,
  CustomersApiClient,
  InvoicesApiClient,
  PdfApiClient,
  RemindersApiClient,
  SettingsApiClient,
} from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class RechnungenService {
  private readonly invoicesApi = inject(InvoicesApiClient);
  private readonly customersApi = inject(CustomersApiClient);
  private readonly settingsApi = inject(SettingsApiClient);
  private readonly pdfApi = inject(PdfApiClient);
  private readonly remindersApi = inject(RemindersApiClient);
  private readonly auditLogApi = inject(AuditLogApiClient);

  rechnungenUndKundenLaden(): Observable<{ rechnungen: Rechnung[]; kunden: Kunde[] }> {
    return forkJoin({
      rechnungen: this.invoicesApi.loadInvoices(),
      kunden: this.customersApi.loadCustomers(),
    });
  }

  firmaEinstellungenLaden(): Observable<FirmaSettings> {
    return this.settingsApi.loadSettings('firma');
  }

  createInvoice(daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.invoicesApi.createInvoice(daten);
  }

  updateInvoice(id: number, daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.invoicesApi.updateInvoice(id, daten);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.invoicesApi.deleteInvoice(id);
  }

  // PDF wird jetzt serverseitig mit Handlebars generiert — kein HTML vom Frontend
  async pdfOeffnen(rechnung: Rechnung, _firma: FirmaSettings): Promise<void> {
    const response = await firstValueFrom(this.pdfApi.createInvoicePdf(rechnung.id));
    window.open(response.url, '_blank');
  }

  loadReminders(rechnungId: number): Observable<Mahnung[]> {
    return this.remindersApi.loadReminders(rechnungId);
  }

  createReminder(daten: Partial<Mahnung>): Observable<Mahnung> {
    return this.remindersApi.createReminder(daten);
  }

  deleteReminder(id: number): Observable<void> {
    return this.remindersApi.deleteReminder(id);
  }

  auditEintraegeLaden(rechnungId: number): Observable<AuditLogEntry[]> {
    return this.auditLogApi.loadAuditLogForRecord('rechnungen', rechnungId);
  }

  nettoSummeBerechnen(positionen: RechnungPosition[]): number {
    return positionen.reduce((s, p) => s + (parseFloat(String(p.gesamtpreis)) || 0), 0);
  }

  bruttoBerechnen(positionen: RechnungPosition[], mwstSatz: number = 19): number {
    const netto = this.nettoSummeBerechnen(positionen);
    return netto * (1 + mwstSatz / 100);
  }
}
