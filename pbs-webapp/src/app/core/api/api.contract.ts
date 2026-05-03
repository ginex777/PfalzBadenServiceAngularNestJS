import type { SettingsKey } from '../models';

export interface DatevValidierungsMeldung {
  typ: 'error' | 'warning';
  msg: string;
}

export interface DatevVorschauZeile {
  datum: string;
  typ: 'inc' | 'exp';
  name: string;
  belegnr?: string;
  brutto: number;
  mwst: number;
  netto: number;
  ust: number;
  konto: string;
  shKz: string;
}

export interface DatevVorschauAntwort {
  rows: DatevVorschauZeile[];
  stats?: {
    totalInc: number;
    totalExp: number;
    sumIncNetto: number;
    sumExpNetto: number;
    zahllast: number;
  };
  warnings?: DatevValidierungsMeldung[];
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
}

export interface UserEintrag {
  id: string;
  email: string;
  rolle: string;
  vorname: string | null;
  nachname: string | null;
  aktiv: boolean;
  created_at: string;
}

export interface UserAnlegenPayload {
  email: string;
  password: string;
  rolle: 'admin' | 'readonly' | 'mitarbeiter';
  vorname?: string;
  nachname?: string;
}

export interface UserAktualisierenPayload {
  vorname?: string;
  nachname?: string;
  rolle?: string;
}

export interface ChecklistFieldApi {
  fieldId: string;
  label: string;
  type: 'boolean' | 'text' | 'number' | 'select' | 'foto' | 'kommentar';
  helperText?: string;
  required?: boolean;
  options?: string[];
}

export interface ChecklistTemplateApi {
  id: number;
  name: string;
  description: string | null;
  kategorie: string | null;
  version: number;
  isActive: boolean;
  fields: ChecklistFieldApi[];
  assignedObjectIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSubmissionListItemApi {
  id: number;
  submittedAt: string;
  object: { id: number; name: string };
  template: { id: number; name: string; version: number };
  employee: { id: number; name: string } | null;
  createdByEmail: string;
  createdByName: string | null;
  note: string | null;
}

export interface ChecklistSubmissionDetailApi extends ChecklistSubmissionListItemApi {
  templateSnapshot: unknown;
  answers: unknown;
}

export type MobileFeedbackKindApi = 'EVIDENCE' | 'CHECKLIST';

export interface MobileFeedbackItemApi {
  kind: MobileFeedbackKindApi;
  id: number;
  createdAt: string;
  objectId: number;
  objectName: string;
  title: string;
  subtitle: string | null;
  link: string;
  createdByEmail: string | null;
  createdByName: string | null;
}

export interface SettingsValueApi {
  key: SettingsKey;
  value: unknown;
}

