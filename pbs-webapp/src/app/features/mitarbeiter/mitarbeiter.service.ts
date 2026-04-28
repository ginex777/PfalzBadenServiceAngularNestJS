import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Mitarbeiter, MitarbeiterStunden } from '../../core/models';
import { EmployeesApiClient, PdfApiClient } from '../../core/api/clients';

interface Stempel {
  id: number;
  mitarbeiter_id: number;
  start: string;
  stop?: string | null;
  dauer_minuten?: number | null;
  notiz?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class MitarbeiterService {
  private readonly employeesApi = inject(EmployeesApiClient);
  private readonly pdfApi = inject(PdfApiClient);

  alleLaden(): Observable<Mitarbeiter[]> {
    return this.employeesApi.loadEmployees();
  }
  erstellen(daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.employeesApi.createEmployee(daten);
  }
  aktualisieren(id: number, daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.employeesApi.updateEmployee(id, daten);
  }
  loeschen(id: number): Observable<void> {
    return this.employeesApi.deleteEmployee(id);
  }

  stundenLaden(mitarbeiterId: number): Observable<MitarbeiterStunden[]> {
    return this.employeesApi.loadEmployeeHours(mitarbeiterId);
  }
  stundenErstellen(
    mitarbeiterId: number,
    daten: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.employeesApi.createEmployeeHours(mitarbeiterId, daten);
  }
  stundenAktualisieren(
    stundenId: number,
    daten: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.employeesApi.updateEmployeeHours(stundenId, daten);
  }
  stundenLoeschen(stundenId: number): Observable<void> {
    return this.employeesApi.deleteEmployeeHours(stundenId);
  }

  // Mobile Stempeluhr
  clockIn(mitarbeiterId: number, notiz?: string): Observable<Stempel> {
    return this.employeesApi.clockIn(mitarbeiterId, { notiz });
  }
  clockOut(mitarbeiterId: number): Observable<Stempel> {
    return this.employeesApi.clockOut(mitarbeiterId);
  }
  loadTimeTracking(mitarbeiterId: number): Observable<Stempel[]> {
    return this.employeesApi.loadTimeTracking(mitarbeiterId);
  }

  // Stundenabrechnung als PDF (serverseitig mit Handlebars)
  async abrechnungPdfOeffnen(mitarbeiterId: number): Promise<void> {
    const response = await firstValueFrom(this.pdfApi.createEmployeeStatementPdf(mitarbeiterId));
    window.open(response.url, '_blank');
  }
}
