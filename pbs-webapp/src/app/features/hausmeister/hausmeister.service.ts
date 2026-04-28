import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, firstValueFrom } from 'rxjs';
import { HausmeisterEinsatz, Mitarbeiter, Kunde, MitarbeiterStunden } from '../../core/models';
import {
  CustomersApiClient,
  EmployeesApiClient,
  HausmeisterApiClient,
  PdfApiClient,
} from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class HausmeisterService {
  private readonly hausmeisterApi = inject(HausmeisterApiClient);
  private readonly employeesApi = inject(EmployeesApiClient);
  private readonly customersApi = inject(CustomersApiClient);
  private readonly pdfApi = inject(PdfApiClient);

  allesDatenLaden(): Observable<{
    einsaetze: HausmeisterEinsatz[];
    mitarbeiter: Mitarbeiter[];
    kunden: Kunde[];
  }> {
    return forkJoin({
      einsaetze: this.hausmeisterApi.loadServiceAssignments(),
      mitarbeiter: this.employeesApi.loadEmployees(),
      kunden: this.customersApi.loadCustomers(),
    });
  }

  einsatzErstellen(daten: Partial<HausmeisterEinsatz>): Observable<HausmeisterEinsatz> {
    return this.hausmeisterApi.createServiceAssignment(daten);
  }

  einsatzAktualisieren(
    id: number,
    daten: Partial<HausmeisterEinsatz>,
  ): Observable<HausmeisterEinsatz> {
    return this.hausmeisterApi.updateServiceAssignment(id, daten);
  }

  einsatzLoeschen(id: number): Observable<void> {
    return this.hausmeisterApi.deleteServiceAssignment(id);
  }

  mitarbeiterStundenEintragen(
    mitarbeiterId: number,
    daten: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.employeesApi.createEmployeeHours(mitarbeiterId, daten);
  }

  // Einzelner Einsatz als PDF
  async einsatzPdfOeffnen(einsatzId: number): Promise<void> {
    const response = await firstValueFrom(this.pdfApi.createServiceAssignmentPdf(einsatzId));
    window.open(response.url, '_blank');
  }

  // Monatsnachweis als PDF (optional gefiltert nach Mitarbeiter)
  async monatsnachweisPdfOeffnen(monat: string, mitarbeiterName?: string): Promise<void> {
    const response = await firstValueFrom(
      this.pdfApi.createServiceMonthlyReportPdf(monat, mitarbeiterName),
    );
    window.open(response.url, '_blank');
  }
}
