import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MobileApiConfigService } from './api-config.service';

export type ChecklistFieldType = 'boolean' | 'text' | 'number' | 'select' | 'foto' | 'kommentar';

export interface ChecklistField {
  fieldId: string;
  label: string;
  type: ChecklistFieldType;
  helperText?: string;
  required?: boolean;
  options?: string[];
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  fields: ChecklistField[];
}

export interface CreateChecklistSubmissionRequest {
  templateId: number;
  objectId: number;
  note?: string;
  answers: { fieldId: string; value?: string | number | boolean | null }[];
}

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(MobileApiConfigService);

  getTemplatesAll() {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http.get<ChecklistTemplate[]>(`${baseUrl}/api/checklisten/templates/all`);
  }

  getTemplatesForObject(objectId: number) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http.get<ChecklistTemplate[]>(`${baseUrl}/api/checklisten/templates/for-object/${objectId}`);
  }

  submitChecklist(request: CreateChecklistSubmissionRequest) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http.post<{ id: number }>(`${baseUrl}/api/checklisten/submissions`, request);
  }
}

