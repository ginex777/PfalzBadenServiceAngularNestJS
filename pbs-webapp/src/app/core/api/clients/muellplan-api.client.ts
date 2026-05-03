import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { MuellplanTermin, MuellplanVorlage, PaginatedResponse } from '../../models';
import type { TaskListItemApi } from '../../../features/aufgaben/aufgaben.models';

@Injectable({ providedIn: 'root' })
export class MuellplanApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadGarbagePlan(objectId: number): Observable<MuellplanTermin[]> {
    return this.http.get<MuellplanTermin[]>(`${this.baseUrl}/muellplan/${objectId}`);
  }

  loadUpcomingGarbageTerms(limit = 5): Observable<MuellplanTermin[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<MuellplanTermin[]>(`${this.baseUrl}/muellplan-upcoming`, { params });
  }

  createGarbageTerm(data: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.http.post<MuellplanTermin>(`${this.baseUrl}/muellplan`, data);
  }

  updateGarbageTerm(id: number, data: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.http.put<MuellplanTermin>(`${this.baseUrl}/muellplan/${id}`, data);
  }

  deleteGarbageTerm(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/muellplan/${id}`);
  }

  loadGarbageTemplates(): Observable<MuellplanVorlage[]> {
    return this.http.get<MuellplanVorlage[]>(`${this.baseUrl}/muellplan-vorlagen/all`);
  }

  createGarbageTemplate(data: Partial<MuellplanVorlage>): Observable<MuellplanVorlage> {
    return this.http.post<MuellplanVorlage>(`${this.baseUrl}/muellplan-vorlagen`, data);
  }

  deleteGarbageTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/muellplan-vorlagen/${id}`);
  }

  uploadGarbageTemplatePdf(
    id: number,
    file: File,
  ): Observable<{ ok: boolean; pdf_name: string }> {
    const formData = new FormData();
    formData.append('pdf', file, file.name);
    return this.http.post<{ ok: boolean; pdf_name: string }>(
      `${this.baseUrl}/muellplan-vorlagen/${id}/pdf`,
      formData,
    );
  }

  getGarbageTemplatePdfUrl(id: number): string {
    return `${this.baseUrl}/muellplan-vorlagen/${id}/pdf`;
  }

  createObjectGarbagePdf(objectId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/muellplan-pdf/${objectId}`, {});
  }

  copyGarbageTerms(fromObjectId: number, toObjectId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/muellplan/copy`, {
      from_objekt_id: fromObjectId,
      to_objekt_id: toObjectId,
    });
  }

  markGarbageTermDone(id: number, comment?: string): Observable<MuellplanTermin> {
    return this.http.patch<MuellplanTermin>(`${this.baseUrl}/muellplan/${id}/erledigen`, {
      kommentar: comment,
    });
  }

  loadGarbageCompletionHistory(
    objectId: number,
  ): Observable<PaginatedResponse<TaskListItemApi>> {
    const params = new HttpParams()
      .set('objectId', String(objectId))
      .set('type', 'MUELL')
      .set('status', 'ERLEDIGT')
      .set('page', '1')
      .set('pageSize', '50');
    return this.http.get<PaginatedResponse<TaskListItemApi>>(`${this.baseUrl}/aufgaben`, { params });
  }

  async createMonthlyClosurePdf(objectId: number, monthIso: string): Promise<{ url?: string }> {
    const response = await fetch(`${this.baseUrl}/muellplan-pdf/${objectId}?monat=${monthIso}`, {
      method: 'POST',
    });
    if (!response.ok) return {};
    return (await response.json()) as { url?: string };
  }
}
