import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { WiederkehrendeAusgabe } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class WiederkehrendeAusgabenService {
  private readonly api = inject(ApiService);
  alleLaden(): Observable<WiederkehrendeAusgabe[]> { return this.api.wiederkehrendeAusgabenLaden(); }
  erstellen(daten: Partial<WiederkehrendeAusgabe>): Observable<WiederkehrendeAusgabe> { return this.api.wiederkehrendeAusgabeErstellen(daten); }
  aktualisieren(id: number, daten: Partial<WiederkehrendeAusgabe>): Observable<WiederkehrendeAusgabe> { return this.api.wiederkehrendeAusgabeAktualisieren(id, daten); }
  loeschen(id: number): Observable<void> { return this.api.wiederkehrendeAusgabeLoeschen(id); }
}
