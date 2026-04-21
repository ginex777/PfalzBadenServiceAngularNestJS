import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Objekt, MuellplanTermin, MuellplanVorlage, Kunde } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MuellplanService {
  private readonly api = inject(ApiService);

  allesDatenLaden(): Observable<{
    objekte: Objekt[];
    vorlagen: MuellplanVorlage[];
    kunden: Kunde[];
  }> {
    return new Observable((observer) => {
      forkJoin({
        objekte: this.api.loadObjects(),
        vorlagen: this.api.loadGarbageTemplates(),
        kunden: this.api.loadCustomers(),
      }).subscribe({
        next: (d) => {
          observer.next(d);
          observer.complete();
        },
        error: (e) => observer.error(e),
      });
    });
  }

  termineLaden(objektId: number): Observable<MuellplanTermin[]> {
    return this.api.loadGarbagePlan(objektId);
  }
  anstehendeTermineLaden(): Observable<MuellplanTermin[]> {
    return this.api.loadUpcomingGarbageTerms(5);
  }

  createObject(daten: Partial<Objekt>): Observable<Objekt> {
    return this.api.createObject(daten);
  }
  updateObject(id: number, daten: Partial<Objekt>): Observable<Objekt> {
    return this.api.updateObject(id, daten);
  }
  deleteObject(id: number): Observable<void> {
    return this.api.deleteObject(id);
  }

  terminErstellen(daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.api.createGarbageTerm(daten);
  }
  terminAktualisieren(id: number, daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.api.updateGarbageTerm(id, daten);
  }
  terminLoeschen(id: number): Observable<void> {
    return this.api.deleteGarbageTerm(id);
  }

  vorlageErstellen(daten: Partial<MuellplanVorlage>): Observable<MuellplanVorlage> {
    return this.api.createGarbageTemplate(daten);
  }
  vorlageLoeschen(id: number): Observable<void> {
    return this.api.deleteGarbageTemplate(id);
  }
  vorlagePdfHochladen(id: number, file: File): Observable<{ ok: boolean; pdf_name: string }> {
    return this.api.uploadGarbageTemplatePdf(id, file);
  }
  vorlagePdfUrl(id: number): string {
    return this.api.getGarbageTemplatePdfUrl(id);
  }

  pdfErstellen(objektId: number): Observable<void> {
    return this.api.createObjectGarbagePdf(objektId);
  }

  termineKopieren(vonObjektId: number, zuObjektId: number): Observable<void> {
    return this.api.copyGarbageTerms(vonObjektId, zuObjektId);
  }

  async monatsabschlussPdfOeffnen(objektId: number): Promise<void> {
    // Use the existing muellplan PDF endpoint for the current object
    const monat = new Date().toISOString().slice(0, 7);
    const response = await fetch(`/api/pdf/muellplan/${objektId}?monat=${monat}`, {
      method: 'POST',
    });
    if (response.ok) {
      const data = (await response.json()) as { url?: string };
      if (data.url) window.open(data.url, '_blank');
    }
  }
}
