import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiService,
  ChecklistFieldApi,
  ChecklistSubmissionDetailApi,
  ChecklistSubmissionListItemApi,
  ChecklistTemplateApi,
} from '../../core/api/api.service';
import { Objekt, PaginatedResponse } from '../../core/models';

export type ChecklistField = ChecklistFieldApi;
export type ChecklistTemplate = ChecklistTemplateApi;
export type ChecklistSubmissionListItem = ChecklistSubmissionListItemApi;
export type ChecklistSubmissionDetail = ChecklistSubmissionDetailApi;

@Injectable({ providedIn: 'root' })
export class ChecklistenService {
  private readonly api = inject(ApiService);

  loadObjectsAll(): Observable<Objekt[]> {
    return this.api.loadObjects();
  }

  loadTemplatesAll(): Observable<ChecklistTemplate[]> {
    return this.api.loadChecklistTemplatesAll();
  }

  loadTemplatesPage(query: {
    page: number;
    pageSize: number;
    q?: string;
  }): Observable<PaginatedResponse<ChecklistTemplate>> {
    return this.api.loadChecklistTemplatesPage(query);
  }

  createTemplate(payload: {
    name: string;
    description?: string;
    fields: ChecklistField[];
    isActive?: boolean;
  }): Observable<ChecklistTemplate> {
    return this.api.createChecklistTemplate(payload);
  }

  updateTemplate(
    id: number,
    payload: Partial<{
      name: string;
      description: string;
      kategorie: string;
      fields: ChecklistField[];
      isActive: boolean;
    }>,
  ): Observable<ChecklistTemplate> {
    return this.api.updateChecklistTemplate(id, payload);
  }

  assignObjectsToTemplate(templateId: number, objektIds: number[]): Observable<{ ok: boolean }> {
    return this.api.assignChecklistTemplateObjects(templateId, objektIds);
  }

  loadTemplatesForObject(objektId: number): Observable<ChecklistTemplate[]> {
    return this.api.loadChecklistTemplatesForObject(objektId);
  }

  loadSubmissionsPage(query: {
    page: number;
    pageSize: number;
    objectId?: number;
    templateId?: number;
  }): Observable<PaginatedResponse<ChecklistSubmissionListItem>> {
    return this.api.loadChecklistSubmissionsPage(query);
  }

  loadSubmission(id: number): Observable<ChecklistSubmissionDetail> {
    return this.api.loadChecklistSubmission(id);
  }

  createSubmissionPdf(submissionId: number): Observable<{ token: string; url: string }> {
    return this.api.createChecklistSubmissionPdf(submissionId);
  }
}
