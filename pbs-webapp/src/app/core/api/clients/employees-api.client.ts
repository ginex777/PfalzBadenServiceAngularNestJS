import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Mitarbeiter,
  MitarbeiterStunden,
  PaginatedResponse,
} from '../../models';

interface TimeTrackingEntryApi {
  id: number;
  mitarbeiter_id: number;
  start: string;
  stop?: string | null;
  dauer_minuten?: number | null;
  notiz?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeesApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadEmployees(): Observable<Mitarbeiter[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<Mitarbeiter>>(`${this.baseUrl}/mitarbeiter`, { params })
      .pipe(map((r) => r.data));
  }

  createEmployee(data: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.http.post<Mitarbeiter>(`${this.baseUrl}/mitarbeiter`, data);
  }

  updateEmployee(id: number, data: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.http.put<Mitarbeiter>(`${this.baseUrl}/mitarbeiter/${id}`, data);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/mitarbeiter/${id}`);
  }

  loadEmployeeHours(employeeId: number): Observable<MitarbeiterStunden[]> {
    return this.http.get<MitarbeiterStunden[]>(
      `${this.baseUrl}/mitarbeiter/${employeeId}/stunden`,
    );
  }

  createEmployeeHours(
    employeeId: number,
    data: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.http.post<MitarbeiterStunden>(
      `${this.baseUrl}/mitarbeiter/${employeeId}/stunden`,
      data,
    );
  }

  updateEmployeeHours(
    hoursId: number,
    data: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.http.put<MitarbeiterStunden>(
      `${this.baseUrl}/mitarbeiter/stunden/${hoursId}`,
      data,
    );
  }

  deleteEmployeeHours(hoursId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/mitarbeiter/stunden/${hoursId}`);
  }

  clockIn(employeeId: number, data: { notiz?: string }): Observable<TimeTrackingEntryApi> {
    return this.http.post<TimeTrackingEntryApi>(
      `${this.baseUrl}/mitarbeiter/${employeeId}/stempel/start`,
      data,
    );
  }

  clockOut(employeeId: number): Observable<TimeTrackingEntryApi> {
    return this.http.post<TimeTrackingEntryApi>(
      `${this.baseUrl}/mitarbeiter/${employeeId}/stempel/stop`,
      {},
    );
  }

  loadTimeTracking(employeeId: number): Observable<TimeTrackingEntryApi[]> {
    return this.http.get<TimeTrackingEntryApi[]>(
      `${this.baseUrl}/mitarbeiter/${employeeId}/zeiterfassung`,
    );
  }
}

