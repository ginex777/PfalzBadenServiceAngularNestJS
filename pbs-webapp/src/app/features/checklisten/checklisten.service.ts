import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Objekt, PaginatedResponse } from '../../core/models';
import type {
  ChecklistFieldApi,
  ChecklistSubmissionDetailApi,
  ChecklistSubmissionListItemApi,
  ChecklistTemplateApi,
} from '../../core/api/api.contract';
import { ChecklistsApiClient, ObjectsApiClient } from '../../core/api/clients';

export type ChecklistField = ChecklistFieldApi;
export type ChecklistTemplate = ChecklistTemplateApi;
export type ChecklistSubmissionListItem = ChecklistSubmissionListItemApi;
export type ChecklistSubmissionDetail = ChecklistSubmissionDetailApi;

@Injectable({ providedIn: 'root' })
export class ChecklistenService {
  private readonly objectsApi = inject(ObjectsApiClient);
  private readonly checklistsApi = inject(ChecklistsApiClient);

  loadObjectsAll(): Observable<Objekt[]> {
    return this.objectsApi.loadObjects();
  }

  loadTemplatesAll(): Observable<ChecklistTemplate[]> {
    return this.checklistsApi.loadChecklistTemplatesAll();
  }

  loadTemplatesPage(query: {
    page: number;
    pageSize: number;
    q?: string;
  }): Observable<PaginatedResponse<ChecklistTemplate>> {
    return this.checklistsApi.loadChecklistTemplatesPage(query);
  }

  createTemplate(payload: {
    name: string;
    description?: string;
    fields: ChecklistField[];
    isActive?: boolean;
  }): Observable<ChecklistTemplate> {
    return this.checklistsApi.createChecklistTemplate(payload);
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
    return this.checklistsApi.updateChecklistTemplate(id, payload);
  }

  assignObjectsToTemplate(templateId: number, objektIds: number[]): Observable<{ ok: boolean }> {
    return this.checklistsApi.assignChecklistTemplateObjects(templateId, objektIds);
  }

  loadTemplatesForObject(objektId: number): Observable<ChecklistTemplate[]> {
    return this.checklistsApi.loadChecklistTemplatesForObject(objektId);
  }

  loadSubmissionsPage(query: {
    page: number;
    pageSize: number;
    objectId?: number;
    templateId?: number;
  }): Observable<PaginatedResponse<ChecklistSubmissionListItem>> {
    return this.checklistsApi.loadChecklistSubmissionsPage(query);
  }

  loadSubmission(id: number): Observable<ChecklistSubmissionDetail> {
    return this.checklistsApi.loadChecklistSubmission(id);
  }

  createSubmissionPdf(submissionId: number): Observable<{ token: string; url: string }> {
    return this.checklistsApi.createChecklistSubmissionPdf(submissionId);
  }
}
