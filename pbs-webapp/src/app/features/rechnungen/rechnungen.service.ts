import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Rechnung, Kunde, FirmaSettings, RechnungPosition, Mahnung, AuditLogEntry } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class RechnungenService {
  private readonly api = inject(ApiService);

  rechnungenUndKundenLaden(): Observable<{ rechnungen: Rechnung[]; kunden: Kunde[] }> {
    return forkJoin({ rechnungen: this.api.rechnungenLaden(), kunden: this.api.kundenLaden() });
  }

  firmaEinstellungenLaden(): Observable<FirmaSettings> {
    return this.api.einstellungenLaden('firma');
  }

  rechnungErstellen(daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.api.rechnungErstellen(daten);
  }

  rechnungAktualisieren(id: number, daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.api.rechnungAktualisieren(id, daten);
  }

  rechnungLoeschen(id: number): Observable<void> {
    return this.api.rechnungLoeschen(id);
  }

  // PDF wird jetzt serverseitig mit Handlebars generiert — kein HTML vom Frontend
  async pdfOeffnen(rechnung: Rechnung, _firma: FirmaSettings): Promise<void> {
    const response = await firstValueFrom(this.api.rechnungPdfErstellen(rechnung.id));
    window.open(response.url, '_blank');
  }

  mahnungenLaden(rechnungId: number): Observable<Mahnung[]> {
    return this.api.mahnungenLaden(rechnungId);
  }

  mahnungErstellen(daten: Partial<Mahnung>): Observable<Mahnung> {
    return this.api.mahnungErstellen(daten);
  }

  mahnungLoeschen(id: number): Observable<void> {
    return this.api.mahnungLoeschen(id);
  }

  auditEintraegeLaden(rechnungId: number): Observable<AuditLogEntry[]> {
    return this.api.auditLogFuerDatensatzLaden('rechnungen', rechnungId);
  }

  nettoSummeBerechnen(positionen: RechnungPosition[]): number {
    return positionen.reduce((s, p) => s + (parseFloat(String(p.gesamtpreis)) || 0), 0);
  }

  bruttoBerechnen(positionen: RechnungPosition[], mwstSatz: number = 19): number {
    const netto = this.nettoSummeBerechnen(positionen);
    return netto * (1 + mwstSatz / 100);
  }
}
