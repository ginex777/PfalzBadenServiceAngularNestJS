import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { PaginatedResponse } from '../../models';
import type {
  ChecklistFieldApi,
  ChecklistSubmissionDetailApi,
  ChecklistSubmissionListItemApi,
  ChecklistTemplateApi,
} from '../api.contract';

@Injectable({ providedIn: 'root' })
export class ChecklistsApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadChecklistTemplatesAll(): Observable<ChecklistTemplateApi[]> {
    return this.http.get<ChecklistTemplateApi[]>(`${this.baseUrl}/checklisten/templates/all`);
  }

  loadChecklistTemplatesPage(query: {
    page: number;
    pageSize: number;
    q?: string;
  }): Observable<PaginatedResponse<ChecklistTemplateApi>> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));
    if (query.q) params = params.set('q', query.q);
    return this.http.get<PaginatedResponse<ChecklistTemplateApi>>(
      `${this.baseUrl}/checklisten/templates`,
      { params },
    );
  }

  createChecklistTemplate(payload: {
    name: string;
    description?: string;
    fields: ChecklistFieldApi[];
    isActive?: boolean;
  }): Observable<ChecklistTemplateApi> {
    return this.http.post<ChecklistTemplateApi>(`${this.baseUrl}/checklisten/templates`, payload);
  }

  updateChecklistTemplate(
    id: number,
    payload: Partial<{
      name: string;
      description: string;
      kategorie: string;
      isActive: boolean;
      fields: ChecklistFieldApi[];
    }>,
  ): Observable<ChecklistTemplateApi> {
    return this.http.put<ChecklistTemplateApi>(
      `${this.baseUrl}/checklisten/templates/${id}`,
      payload,
    );
  }

  assignChecklistTemplateObjects(
    templateId: number,
    objectIds: number[],
  ): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(
      `${this.baseUrl}/checklisten/templates/${templateId}/objekte`,
      { objektIds: objectIds },
    );
  }

  loadChecklistTemplatesForObject(objectId: number): Observable<ChecklistTemplateApi[]> {
    return this.http.get<ChecklistTemplateApi[]>(
      `${this.baseUrl}/checklisten/templates/for-object/${objectId}`,
    );
  }

  loadChecklistSubmissionsPage(query: {
    page: number;
    pageSize: number;
    objectId?: number;
    templateId?: number;
  }): Observable<PaginatedResponse<ChecklistSubmissionListItemApi>> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));
    if (query.objectId) params = params.set('objectId', String(query.objectId));
    if (query.templateId) params = params.set('templateId', String(query.templateId));
    return this.http.get<PaginatedResponse<ChecklistSubmissionListItemApi>>(
      `${this.baseUrl}/checklisten/submissions`,
      { params },
    );
  }

  loadChecklistSubmission(id: number): Observable<ChecklistSubmissionDetailApi> {
    return this.http.get<ChecklistSubmissionDetailApi>(
      `${this.baseUrl}/checklisten/submissions/${id}`,
    );
  }

  createChecklistSubmissionPdf(submissionId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(
      `${this.baseUrl}/pdf/checkliste/submission`,
      {
        submission_id: submissionId,
      },
    );
  }
}
