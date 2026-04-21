import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Mitarbeiter, MitarbeiterStunden } from '../../core/models';

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
  private readonly api = inject(ApiService);

  alleLaden(): Observable<Mitarbeiter[]> {
    return this.api.loadEmployees();
  }
  erstellen(daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.api.createEmployee(daten);
  }
  aktualisieren(id: number, daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.api.updateEmployee(id, daten);
  }
  loeschen(id: number): Observable<void> {
    return this.api.deleteEmployee(id);
  }

  stundenLaden(mitarbeiterId: number): Observable<MitarbeiterStunden[]> {
    return this.api.loadEmployeeHours(mitarbeiterId);
  }
  stundenErstellen(
    mitarbeiterId: number,
    daten: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.api.createEmployeeHours(mitarbeiterId, daten);
  }
  stundenAktualisieren(
    stundenId: number,
    daten: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.api.updateEmployeeHours(stundenId, daten);
  }
  stundenLoeschen(stundenId: number): Observable<void> {
    return this.api.deleteEmployeeHours(stundenId);
  }

  // Mobile Stempeluhr
  clockIn(mitarbeiterId: number, notiz?: string): Observable<Stempel> {
    return this.api.clockIn(mitarbeiterId, { notiz });
  }
  clockOut(mitarbeiterId: number): Observable<Stempel> {
    return this.api.clockOut(mitarbeiterId);
  }
  loadTimeTracking(mitarbeiterId: number): Observable<Stempel[]> {
    return this.api.loadTimeTracking(mitarbeiterId);
  }

  // Stundenabrechnung als PDF (serverseitig mit Handlebars)
  async abrechnungPdfOeffnen(mitarbeiterId: number): Promise<void> {
    const response = await firstValueFrom(this.api.mitarbeiterAbcreateInvoicePdf(mitarbeiterId));
    window.open(response.url, '_blank');
  }
}
