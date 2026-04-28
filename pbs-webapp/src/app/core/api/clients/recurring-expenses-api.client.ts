import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponse, WiederkehrendeAusgabe } from '../../models';

@Injectable({ providedIn: 'root' })
export class RecurringExpensesApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadRecurringExpenses(): Observable<WiederkehrendeAusgabe[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<WiederkehrendeAusgabe>>(`${this.baseUrl}/wiederkehrend`, { params })
      .pipe(map((r) => r.data));
  }

  createRecurringExpense(data: Partial<WiederkehrendeAusgabe>): Observable<WiederkehrendeAusgabe> {
    return this.http.post<WiederkehrendeAusgabe>(`${this.baseUrl}/wiederkehrend`, data);
  }

  updateRecurringExpense(
    id: number,
    data: Partial<WiederkehrendeAusgabe>,
  ): Observable<WiederkehrendeAusgabe> {
    return this.http.put<WiederkehrendeAusgabe>(`${this.baseUrl}/wiederkehrend/${id}`, data);
  }

  deleteRecurringExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/wiederkehrend/${id}`);
  }
}

