import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Kunde, Rechnung } from '../../core/models';
import { CustomersApiClient, InvoicesApiClient, OffersApiClient } from '../../core/api/clients';
import { KundeUmsatz } from './kunden.models';

export interface KundenLadeErgebnis {
  kunden: Kunde[];
  umsaetze: KundeUmsatz[];
  rechnungen: Rechnung[];
}

@Injectable({ providedIn: 'root' })
export class KundenService {
  private readonly customersApi = inject(CustomersApiClient);
  private readonly invoicesApi = inject(InvoicesApiClient);
  private readonly offersApi = inject(OffersApiClient);

  allesDatenLaden(): Observable<KundenLadeErgebnis> {
    return forkJoin({
      kunden: this.customersApi.loadCustomers(),
      rechnungen: this.invoicesApi.loadInvoices(),
      angebote: this.offersApi.loadOffers(),
    }).pipe(
      map(({ kunden, rechnungen, angebote }) => {
        const umsaetze = kunden.map((k) => {
          const kundenRe = rechnungen.filter((r) => r.kunden_id === k.id || r.empf === k.name);
          const kundenAng = angebote.filter((a) => a.kunden_id === k.id || a.empf === k.name);
          return {
            kundeId: k.id,
            rechnungenAnzahl: kundenRe.length,
            angeboteAnzahl: kundenAng.length,
            umsatzBezahlt: kundenRe
              .filter((r) => r.bezahlt)
              .reduce((s, r) => s + (r.brutto ?? 0), 0),
          };
        });
        return { kunden, umsaetze, rechnungen };
      }),
    );
  }

  createCustomer(daten: Partial<Kunde>): Observable<Kunde> {
    return this.customersApi.createCustomer(daten);
  }

  updateCustomer(id: number, daten: Partial<Kunde>): Observable<Kunde> {
    return this.customersApi.updateCustomer(id, daten);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.customersApi.deleteCustomer(id);
  }
}
