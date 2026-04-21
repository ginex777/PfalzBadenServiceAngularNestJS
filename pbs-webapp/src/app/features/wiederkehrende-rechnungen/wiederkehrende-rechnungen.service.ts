import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { WiederkehrendeRechnung, Kunde } from '../../core/models';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WiederkehrendeRechnungenService {
  private readonly api = inject(ApiService);

  allesDatenLaden(): Observable<{ rechnungen: WiederkehrendeRechnung[]; kunden: Kunde[] }> {
    return new Observable((observer) => {
      forkJoin({
        rechnungen: this.api.loadRecurringInvoices(),
        kunden: this.api.loadCustomers(),
      }).subscribe({
        next: (d) => {
          observer.next(d);
          observer.complete();
        },
        error: (e) => observer.error(e),
      });
    });
  }

  erstellen(daten: Partial<WiederkehrendeRechnung>): Observable<WiederkehrendeRechnung> {
    return this.api.createRecurringInvoice(daten);
  }

  aktualisieren(
    id: number,
    daten: Partial<WiederkehrendeRechnung>,
  ): Observable<WiederkehrendeRechnung> {
    return this.api.updateRecurringInvoice(id, daten);
  }

  loeschen(id: number): Observable<void> {
    return this.api.deleteRecurringInvoice(id);
  }
}
