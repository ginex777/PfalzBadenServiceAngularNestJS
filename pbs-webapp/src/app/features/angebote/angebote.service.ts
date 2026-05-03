import { Injectable, inject } from '@angular/core';
import type { Observable} from 'rxjs';
import { forkJoin, firstValueFrom } from 'rxjs';
import type { Angebot, Kunde, FirmaSettings, RechnungPosition } from '../../core/models';
import {
  CustomersApiClient,
  OffersApiClient,
  PdfApiClient,
  SettingsApiClient,
} from '../../core/api/clients';
import { BrowserService } from '../../core/services/browser.service';

@Injectable({ providedIn: 'root' })
export class AngeboteService {
  private readonly offersApi = inject(OffersApiClient);
  private readonly customersApi = inject(CustomersApiClient);
  private readonly settingsApi = inject(SettingsApiClient);
  private readonly pdfApi = inject(PdfApiClient);
  private readonly browser = inject(BrowserService);

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
    this.browser.openUrl(response.url);
  }

  nettoBerechnen(positionen: RechnungPosition[]): number {
    return positionen.reduce((s, p) => s + (parseFloat(String(p.gesamtpreis)) || 0), 0);
  }

  bruttoBerechnen(positionen: RechnungPosition[], mwstSatz: number): number {
    const netto = this.nettoBerechnen(positionen);
    return netto * (1 + mwstSatz / 100);
  }
}
