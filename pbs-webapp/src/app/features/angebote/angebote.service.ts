import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, firstValueFrom } from 'rxjs';
import { Angebot, Kunde, FirmaSettings, RechnungPosition } from '../../core/models';
import {
  CustomersApiClient,
  OffersApiClient,
  PdfApiClient,
  SettingsApiClient,
} from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class AngeboteService {
  private readonly offersApi = inject(OffersApiClient);
  private readonly customersApi = inject(CustomersApiClient);
  private readonly settingsApi = inject(SettingsApiClient);
  private readonly pdfApi = inject(PdfApiClient);

  angeboteUndKundenLaden(): Observable<{ angebote: Angebot[]; kunden: Kunde[] }> {
    return forkJoin({ angebote: this.offersApi.loadOffers(), kunden: this.customersApi.loadCustomers() });
  }

  firmaEinstellungenLaden(): Observable<FirmaSettings> {
    return this.settingsApi.loadSettings('firma');
  }

  createOffer(daten: Partial<Angebot>): Observable<Angebot> {
    return this.offersApi.createOffer(daten);
  }

  updateOffer(id: number, daten: Partial<Angebot>): Observable<Angebot> {
    return this.offersApi.updateOffer(id, daten);
  }

  deleteOffer(id: number): Observable<void> {
    return this.offersApi.deleteOffer(id);
  }

  createCustomer(daten: {
    name: string;
    strasse?: string;
    ort?: string;
    email?: string;
  }): Observable<import('../../core/models').Kunde> {
    return this.customersApi.createCustomer(daten);
  }

  // PDF wird jetzt serverseitig mit Handlebars generiert — kein HTML vom Frontend
  async pdfOeffnen(angebot: Angebot, _firma: FirmaSettings): Promise<void> {
    const response = await firstValueFrom(this.pdfApi.createOfferPdf(angebot.id));
    window.open(response.url, '_blank');
  }

  nettoBerechnen(positionen: RechnungPosition[]): number {
    return positionen.reduce((s, p) => s + (parseFloat(String(p.gesamtpreis)) || 0), 0);
  }

  bruttoBerechnen(positionen: RechnungPosition[]): number {
    const netto = this.nettoBerechnen(positionen);
    return netto + netto * 0.19;
  }
}
