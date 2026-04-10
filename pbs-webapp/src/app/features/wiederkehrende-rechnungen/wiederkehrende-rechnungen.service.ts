import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { WiederkehrendeRechnung, Kunde } from '../../core/models';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WiederkehrendeRechnungenService {
  private readonly api = inject(ApiService);

  allesDatenLaden(): Observable<{ rechnungen: WiederkehrendeRechnung[]; kunden: Kunde[] }> {
    return new Observable(observer => {
      forkJoin({
        rechnungen: this.api.wiederkehrendeRechnungenLaden(),
        kunden: this.api.kundenLaden(),
      }).subscribe({ next: d => { observer.next(d); observer.complete(); }, error: e => observer.error(e) });
    });
  }

  erstellen(daten: Partial<WiederkehrendeRechnung>): Observable<WiederkehrendeRechnung> {
    return this.api.wiederkehrendeRechnungErstellen(daten);
  }

  aktualisieren(id: number, daten: Partial<WiederkehrendeRechnung>): Observable<WiederkehrendeRechnung> {
    return this.api.wiederkehrendeRechnungAktualisieren(id, daten);
  }

  loeschen(id: number): Observable<void> {
    return this.api.wiederkehrendeRechnungLoeschen(id);
  }
}
