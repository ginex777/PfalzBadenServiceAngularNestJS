import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import type { Objekt, MuellplanTermin, MuellplanVorlage, PaginatedResponse } from '../../core/models';
import type { TaskListItemApi } from '../aufgaben/aufgaben.models';
import { MuellplanApiClient, ObjectsApiClient } from '../../core/api/clients';
import { BrowserService } from '../../core/services/browser.service';

@Injectable({ providedIn: 'root' })
export class MuellplanService {
  private readonly objectsApi = inject(ObjectsApiClient);
  private readonly muellplanApi = inject(MuellplanApiClient);
  private readonly browser = inject(BrowserService);

  allesDatenLaden(): Observable<{
    objekte: Objekt[];
    vorlagen: MuellplanVorlage[];
  }> {
    return new Observable((observer) => {
      forkJoin({
        objekte: this.objectsApi.loadObjects(),
        vorlagen: this.muellplanApi.loadGarbageTemplates(),
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
    return this.muellplanApi.loadGarbagePlan(objektId);
  }
  anstehendeTermineLaden(): Observable<MuellplanTermin[]> {
    return this.muellplanApi.loadUpcomingGarbageTerms(5);
  }

  updateObject(id: number, daten: Partial<Objekt>): Observable<Objekt> {
    return this.objectsApi.updateObject(id, daten);
  }

  terminErstellen(daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.muellplanApi.createGarbageTerm(daten);
  }
  terminAktualisieren(id: number, daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.muellplanApi.updateGarbageTerm(id, daten);
  }
  terminLoeschen(id: number): Observable<void> {
    return this.muellplanApi.deleteGarbageTerm(id);
  }

  vorlageErstellen(daten: Partial<MuellplanVorlage>): Observable<MuellplanVorlage> {
    return this.muellplanApi.createGarbageTemplate(daten);
  }
  vorlageLoeschen(id: number): Observable<void> {
    return this.muellplanApi.deleteGarbageTemplate(id);
  }
  vorlagePdfHochladen(id: number, file: File): Observable<{ ok: boolean; pdf_name: string }> {
    return this.muellplanApi.uploadGarbageTemplatePdf(id, file);
  }
  vorlagePdfUrl(id: number): string {
    return this.muellplanApi.getGarbageTemplatePdfUrl(id);
  }

  pdfErstellen(objektId: number): Observable<void> {
    return this.muellplanApi.createObjectGarbagePdf(objektId);
  }

  termineKopieren(vonObjektId: number, zuObjektId: number): Observable<void> {
    return this.muellplanApi.copyGarbageTerms(vonObjektId, zuObjektId);
  }

  markTerminDone(id: number, comment?: string): Observable<MuellplanTermin> {
    return this.muellplanApi.markGarbageTermDone(id, comment);
  }

  loadCompletionHistory(objectId: number): Observable<PaginatedResponse<TaskListItemApi>> {
    return this.muellplanApi.loadGarbageCompletionHistory(objectId);
  }

  async monatsabschlussPdfOeffnen(objektId: number): Promise<void> {
    const monat = new Date().toISOString().slice(0, 7);
    const data = await this.muellplanApi.createMonthlyClosurePdf(objektId, monat);
    if (data.url) this.browser.openUrl(data.url);
  }
}
