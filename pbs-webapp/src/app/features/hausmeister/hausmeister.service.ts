import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { HausmeisterEinsatz, Mitarbeiter, Kunde, MitarbeiterStunden } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class HausmeisterService {
  private readonly api = inject(ApiService);

  allesDatenLaden(): Observable<{ einsaetze: HausmeisterEinsatz[]; mitarbeiter: Mitarbeiter[]; kunden: Kunde[] }> {
    return forkJoin({
      einsaetze: this.api.hausmeisterEinsaetzeLaden(),
      mitarbeiter: this.api.mitarbeiterLaden(),
      kunden: this.api.kundenLaden(),
    });
  }

  einsatzErstellen(daten: Partial<HausmeisterEinsatz>): Observable<HausmeisterEinsatz> {
    return this.api.hausmeisterEinsatzErstellen(daten);
  }

  einsatzAktualisieren(id: number, daten: Partial<HausmeisterEinsatz>): Observable<HausmeisterEinsatz> {
    return this.api.hausmeisterEinsatzAktualisieren(id, daten);
  }

  einsatzLoeschen(id: number): Observable<void> {
    return this.api.hausmeisterEinsatzLoeschen(id);
  }

  mitarbeiterStundenEintragen(mitarbeiterId: number, daten: Partial<MitarbeiterStunden>): Observable<MitarbeiterStunden> {
    return this.api.mitarbeiterStundenErstellen(mitarbeiterId, daten);
  }

  // Einzelner Einsatz als PDF
  async einsatzPdfOeffnen(einsatzId: number): Promise<void> {
    const response = await firstValueFrom(this.api.hausmeisterEinsatzPdfErstellen(einsatzId));
    window.open(response.url, '_blank');
  }

  // Monatsnachweis als PDF (optional gefiltert nach Mitarbeiter)
  async monatsnachweisPdfOeffnen(monat: string, mitarbeiterName?: string): Promise<void> {
    const response = await firstValueFrom(this.api.hausmeisterMonatsnachweisPdfErstellen(monat, mitarbeiterName));
    window.open(response.url, '_blank');
  }
}
