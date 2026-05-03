import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { WiederkehrendeRechnung, Kunde } from '../../core/models';
import { forkJoin } from 'rxjs';
import { CustomersApiClient, RecurringInvoicesApiClient } from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class WiederkehrendeRechnungenService {
  private readonly customersApi = inject(CustomersApiClient);
  private readonly recurringInvoicesApi = inject(RecurringInvoicesApiClient);

  allesDatenLaden(): Observable<{ rechnungen: WiederkehrendeRechnung[]; kunden: Kunde[] }> {
    return new Observable((observer) => {
      forkJoin({
        rechnungen: this.recurringInvoicesApi.loadRecurringInvoices(),
        kunden: this.customersApi.loadCustomers(),
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
    return this.recurringInvoicesApi.createRecurringInvoice(daten);
  }

  aktualisieren(
    id: number,
    daten: Partial<WiederkehrendeRechnung>,
  ): Observable<WiederkehrendeRechnung> {
    return this.recurringInvoicesApi.updateRecurringInvoice(id, daten);
  }

  loeschen(id: number): Observable<void> {
    return this.recurringInvoicesApi.deleteRecurringInvoice(id);
  }
}
