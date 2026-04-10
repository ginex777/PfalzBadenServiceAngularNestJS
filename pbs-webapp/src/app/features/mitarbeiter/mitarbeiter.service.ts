import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Mitarbeiter, MitarbeiterStunden } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MitarbeiterService {
  private readonly api = inject(ApiService);

  alleLaden(): Observable<Mitarbeiter[]> { return this.api.mitarbeiterLaden(); }
  erstellen(daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> { return this.api.mitarbeiterErstellen(daten); }
  aktualisieren(id: number, daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> { return this.api.mitarbeiterAktualisieren(id, daten); }
  loeschen(id: number): Observable<void> { return this.api.mitarbeiterLoeschen(id); }

  stundenLaden(mitarbeiterId: number): Observable<MitarbeiterStunden[]> { return this.api.mitarbeiterStundenLaden(mitarbeiterId); }
  stundenErstellen(mitarbeiterId: number, daten: Partial<MitarbeiterStunden>): Observable<MitarbeiterStunden> { return this.api.mitarbeiterStundenErstellen(mitarbeiterId, daten); }
  stundenAktualisieren(stundenId: number, daten: Partial<MitarbeiterStunden>): Observable<MitarbeiterStunden> { return this.api.mitarbeiterStundenAktualisieren(stundenId, daten); }
  stundenLoeschen(stundenId: number): Observable<void> { return this.api.mitarbeiterStundenLoeschen(stundenId); }

  // Stundenabrechnung als PDF (serverseitig mit Handlebars)
  async abrechnungPdfOeffnen(mitarbeiterId: number): Promise<void> {
    const response = await firstValueFrom(this.api.mitarbeiterAbrechnungPdfErstellen(mitarbeiterId));
    window.open(response.url, '_blank');
  }
}
