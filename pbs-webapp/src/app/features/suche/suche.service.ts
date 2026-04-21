import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { SucheErgebnis } from './suche.models';

@Injectable({ providedIn: 'root' })
export class SucheService {
  private readonly api = inject(ApiService);

  alleLaden(): Observable<SucheErgebnis> {
    return new Observable((observer) => {
      forkJoin({
        rechnungen: this.api.loadInvoices(),
        angebote: this.api.loadOffers(),
        kunden: this.api.loadCustomers(),
        marketing: this.api.loadMarketingContacts(),
        hausmeister: this.api.loadServiceAssignments(),
      }).subscribe({
        next: (d) => {
          observer.next(d);
          observer.complete();
        },
        error: (e) => observer.error(e),
      });
    });
  }
}
