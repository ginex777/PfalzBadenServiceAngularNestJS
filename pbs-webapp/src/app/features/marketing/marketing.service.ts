import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { MarketingKontakt, Kunde } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MarketingService {
  private readonly api = inject(ApiService);

  allesDatenLaden(): Observable<{ kontakte: MarketingKontakt[]; kunden: Kunde[] }> {
    return new Observable((observer) => {
      forkJoin({
        kontakte: this.api.loadMarketingContacts(),
        kunden: this.api.loadCustomers(),
      }).subscribe({
        next: (data) => {
          observer.next(data);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  kontaktErstellen(daten: Partial<MarketingKontakt>): Observable<MarketingKontakt> {
    return this.api.createMarketingContact(daten);
  }

  kontaktAktualisieren(id: number, daten: Partial<MarketingKontakt>): Observable<MarketingKontakt> {
    return this.api.updateMarketingContact(id, daten);
  }

  kontaktLoeschen(id: number): Observable<void> {
    return this.api.deleteMarketingContact(id);
  }

  createCustomer(daten: Partial<Kunde>): Observable<Kunde> {
    return this.api.createCustomer(daten);
  }
}
