import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { WiederkehrendeAusgabe } from '../../core/models';
import { RecurringExpensesApiClient } from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class WiederkehrendeAusgabenService {
  private readonly recurringExpensesApi = inject(RecurringExpensesApiClient);
  alleLaden(): Observable<WiederkehrendeAusgabe[]> {
    return this.recurringExpensesApi.loadRecurringExpenses();
  }
  erstellen(daten: Partial<WiederkehrendeAusgabe>): Observable<WiederkehrendeAusgabe> {
    return this.recurringExpensesApi.createRecurringExpense(daten);
  }
  aktualisieren(
    id: number,
    daten: Partial<WiederkehrendeAusgabe>,
  ): Observable<WiederkehrendeAusgabe> {
    return this.recurringExpensesApi.updateRecurringExpense(id, daten);
  }
  loeschen(id: number): Observable<void> {
    return this.recurringExpensesApi.deleteRecurringExpense(id);
  }
}
