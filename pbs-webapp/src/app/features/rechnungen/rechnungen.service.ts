import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  Rechnung,
  Kunde,
  FirmaSettings,
  RechnungPosition,
  Mahnung,
  AuditLogEntry,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class RechnungenService {
  private readonly api = inject(ApiService);

  rechnungenUndKundenLaden(): Observable<{ rechnungen: Rechnung[]; kunden: Kunde[] }> {
    return forkJoin({ rechnungen: this.api.loadInvoices(), kunden: this.api.loadCustomers() });
  }

  firmaEinstellungenLaden(): Observable<FirmaSettings> {
    return this.api.loadSettings('firma');
  }

  createInvoice(daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.api.createInvoice(daten);
  }

  updateInvoice(id: number, daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.api.updateInvoice(id, daten);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.api.deleteInvoice(id);
  }

  // PDF wird jetzt serverseitig mit Handlebars generiert — kein HTML vom Frontend
  async pdfOeffnen(rechnung: Rechnung, _firma: FirmaSettings): Promise<void> {
    const response = await firstValueFrom(this.api.createInvoicePdf(rechnung.id));
    window.open(response.url, '_blank');
  }

  loadReminders(rechnungId: number): Observable<Mahnung[]> {
    return this.api.loadReminders(rechnungId);
  }

  createReminder(daten: Partial<Mahnung>): Observable<Mahnung> {
    return this.api.createReminder(daten);
  }

  deleteReminder(id: number): Observable<void> {
    return this.api.deleteReminder(id);
  }

  auditEintraegeLaden(rechnungId: number): Observable<AuditLogEntry[]> {
    return this.api.loadAuditLogForRecord('rechnungen', rechnungId);
  }

  nettoSummeBerechnen(positionen: RechnungPosition[]): number {
    return positionen.reduce((s, p) => s + (parseFloat(String(p.gesamtpreis)) || 0), 0);
  }

  bruttoBerechnen(positionen: RechnungPosition[], mwstSatz: number = 19): number {
    const netto = this.nettoSummeBerechnen(positionen);
    return netto * (1 + mwstSatz / 100);
  }
}
