import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Angebot, Kunde, FirmaSettings, RechnungPosition } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class AngeboteService {
  private readonly api = inject(ApiService);

  angeboteUndKundenLaden(): Observable<{ angebote: Angebot[]; kunden: Kunde[] }> {
    return forkJoin({ angebote: this.api.angeboteLaden(), kunden: this.api.kundenLaden() });
  }

  firmaEinstellungenLaden(): Observable<FirmaSettings> {
    return this.api.einstellungenLaden('firma');
  }

  angebotErstellen(daten: Partial<Angebot>): Observable<Angebot> {
    return this.api.angebotErstellen(daten);
  }

  angebotAktualisieren(id: number, daten: Partial<Angebot>): Observable<Angebot> {
    return this.api.angebotAktualisieren(id, daten);
  }

  angebotLoeschen(id: number): Observable<void> {
    return this.api.angebotLoeschen(id);
  }

  kundeErstellen(daten: { name: string; strasse?: string; ort?: string; email?: string }): Observable<import('../../core/models').Kunde> {
    return this.api.kundeErstellen(daten);
  }

  // PDF wird jetzt serverseitig mit Handlebars generiert — kein HTML vom Frontend
  async pdfOeffnen(angebot: Angebot, _firma: FirmaSettings): Promise<void> {
    const response = await firstValueFrom(this.api.angebotPdfErstellen(angebot.id));
    window.open(response.url, '_blank');
  }

  nettoBerechnen(positionen: RechnungPosition[]): number {
    return positionen.reduce((s, p) => s + (parseFloat(String(p.gesamtpreis)) || 0), 0);
  }

  bruttoBerechnen(positionen: RechnungPosition[]): number {
    const netto = this.nettoBerechnen(positionen);
    return netto + netto * 0.19;
  }
}
