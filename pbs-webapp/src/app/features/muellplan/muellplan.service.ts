import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Objekt, MuellplanTermin, MuellplanVorlage, Kunde } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MuellplanService {
  private readonly api = inject(ApiService);

  allesDatenLaden(): Observable<{ objekte: Objekt[]; vorlagen: MuellplanVorlage[]; kunden: Kunde[] }> {
    return new Observable(observer => {
      forkJoin({
        objekte: this.api.objekteLaden(),
        vorlagen: this.api.muellplanVorlagenLaden(),
        kunden: this.api.kundenLaden(),
      }).subscribe({ next: d => { observer.next(d); observer.complete(); }, error: e => observer.error(e) });
    });
  }

  termineLaden(objektId: number): Observable<MuellplanTermin[]> { return this.api.muellplanLaden(objektId); }
  anstehendeTermineLaden(): Observable<MuellplanTermin[]> { return this.api.muellplanAnstehendeTermineLaden(5); }

  objektErstellen(daten: Partial<Objekt>): Observable<Objekt> { return this.api.objektErstellen(daten); }
  objektAktualisieren(id: number, daten: Partial<Objekt>): Observable<Objekt> { return this.api.objektAktualisieren(id, daten); }
  objektLoeschen(id: number): Observable<void> { return this.api.objektLoeschen(id); }

  terminErstellen(daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> { return this.api.muellplanTerminErstellen(daten); }
  terminAktualisieren(id: number, daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> { return this.api.muellplanTerminAktualisieren(id, daten); }
  terminLoeschen(id: number): Observable<void> { return this.api.muellplanTerminLoeschen(id); }

  vorlageErstellen(daten: Partial<MuellplanVorlage>): Observable<MuellplanVorlage> { return this.api.muellplanVorlageErstellen(daten); }
  vorlageLoeschen(id: number): Observable<void> { return this.api.muellplanVorlageLoeschen(id); }
  vorlagePdfHochladen(id: number, file: File): Observable<{ ok: boolean; pdf_name: string }> { return this.api.muellplanVorlagePdfHochladen(id, file); }
  vorlagePdfUrl(id: number): string { return this.api.muellplanVorlagePdfUrl(id); }

  pdfErstellen(objektId: number): Observable<void> { return this.api.muellplanObjektPdfErstellen(objektId); }

  termineKopieren(vonObjektId: number, zuObjektId: number): Observable<void> {
    return this.api.muellplanTermineKopieren(vonObjektId, zuObjektId);
  }

  async monatsabschlussPdfOeffnen(objektId: number): Promise<void> {
    // Use the existing muellplan PDF endpoint for the current object
    const monat = new Date().toISOString().slice(0, 7);
    const response = await fetch(`/api/pdf/muellplan/${objektId}?monat=${monat}`, { method: 'POST' });
    if (response.ok) {
      const data = await response.json() as { url?: string };
      if (data.url) window.open(data.url, '_blank');
    }
  }
}
