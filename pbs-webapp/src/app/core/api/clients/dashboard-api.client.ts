import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

export interface DashboardYearlyStats {
  year: number;
  upToMonth: number;
  revenueNet: number;
  expensesNet: number;
  profitNet: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadYearlyStats(year: number): Observable<DashboardYearlyStats> {
    return this.http.get<DashboardYearlyStats>(`${this.baseUrl}/dashboard/yearly-stats?year=${year}`);
  }
}
