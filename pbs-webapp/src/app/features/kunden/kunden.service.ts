import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/api/api.service';
import { Kunde, Rechnung, Angebot } from '../../core/models';
import { KundeUmsatz } from './kunden.models';

export interface KundenLadeErgebnis {
  kunden: Kunde[];
  umsaetze: KundeUmsatz[];
  rechnungen: Rechnung[];
}

@Injectable({ providedIn: 'root' })
export class KundenService {
  private readonly api = inject(ApiService);

  allesDatenLaden(): Observable<KundenLadeErgebnis> {
    return forkJoin({
      kunden: this.api.kundenLaden(),
      rechnungen: this.api.rechnungenLaden(),
      angebote: this.api.angeboteLaden(),
    }).pipe(
      map(({ kunden, rechnungen, angebote }) => {
        const umsaetze = kunden.map(k => {
          const kundenRe = rechnungen.filter(r => r.kunden_id === k.id || r.empf === k.name);
          const kundenAng = angebote.filter(a => a.kunden_id === k.id || a.empf === k.name);
          return {
            kundeId: k.id,
            rechnungenAnzahl: kundenRe.length,
            angeboteAnzahl: kundenAng.length,
            umsatzBezahlt: kundenRe.filter(r => r.bezahlt).reduce((s, r) => s + (r.brutto ?? 0), 0),
          };
        });
        return { kunden, umsaetze, rechnungen };
      })
    );
  }

  kundeErstellen(daten: Partial<Kunde>): Observable<Kunde> {
    return this.api.kundeErstellen(daten);
  }

  kundeAktualisieren(id: number, daten: Partial<Kunde>): Observable<Kunde> {
    return this.api.kundeAktualisieren(id, daten);
  }

  kundeLoeschen(id: number): Observable<void> {
    return this.api.kundeLoeschen(id);
  }
}
