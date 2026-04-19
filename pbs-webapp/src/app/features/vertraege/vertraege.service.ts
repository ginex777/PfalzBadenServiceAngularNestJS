import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Kunde, Vertrag } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class VertraegeService {
  private readonly api = inject(ApiService);

  kundenLaden(): Observable<Kunde[]> { return this.api.kundenLaden(); }
  vertraegeLaden(kundenId?: number): Observable<Vertrag[]> { return this.api.vertraegeLaden(kundenId); }
  vertragErstellen(daten: Partial<Vertrag>): Observable<Vertrag> { return this.api.vertragErstellen(daten); }
  vertragAktualisieren(id: number, daten: Partial<Vertrag>): Observable<Vertrag> { return this.api.vertragAktualisieren(id, daten); }
  vertragLoeschen(id: number): Observable<void> { return this.api.vertragLoeschen(id); }
  vertragPdfErstellen(id: number): Observable<{ token: string; url: string }> { return this.api.vertragPdfErstellen(id); }
}
