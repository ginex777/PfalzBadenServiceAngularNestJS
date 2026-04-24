export type TaskType =
  | 'MUELL'
  | 'CHECKLISTE'
  | 'REINIGUNG'
  | 'KONTROLLE'
  | 'REPARATUR'
  | 'ZEITERFASSUNG'
  | 'SONSTIGES';

export type TaskStatus =
  | 'OFFEN'
  | 'IN_BEARBEITUNG'
  | 'ERLEDIGT'
  | 'UEBERFAELLIG'
  | 'GEPRUEFT'
  | 'ABGELEHNT';

export interface TaskListItemApi {
  id: number;
  title: string;
  type: TaskType;
  status: TaskStatus;
  objectId: number;
  objectName: string;
  customerId: number | null;
  customerName: string | null;
  userId: number | null;
  userEmail: string | null;
  employeeId: number | null;
  employeeName: string | null;
  dueAt: string | null;
  completedAt: string | null;
  durationMinutes: number | null;
  comment: string | null;
  photoUrl: string | null;
  source: {
    muellplanId: number | null;
    checklistSubmissionId: number | null;
    timeEntryId: number | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskListQuery {
  page: number;
  pageSize: number;
  q?: string;
  objectId?: number;
  customerId?: number;
  employeeId?: number;
  userId?: number;
  type?: readonly TaskType[];
  status?: readonly TaskStatus[];
  createdFrom?: string;
  createdTo?: string;
  dueFrom?: string;
  dueTo?: string;
}

export interface TaskUpdatePayload {
  title?: string;
  type?: TaskType;
  status?: TaskStatus;
  objectId?: number;
  customerId?: number | null;
  employeeId?: number | null;
  userId?: number | null;
  dueAt?: string | null;
  completedAt?: string | null;
  durationMinutes?: number | null;
  comment?: string | null;
  photoUrl?: string | null;
}

export interface TaskFilterState {
  q: string;
  customerId: number | null;
  objectId: number | null;
  employeeId: number | null;
  userId: number | null;
  type: readonly TaskType[];
  status: readonly TaskStatus[];
  createdFrom: string;
  createdTo: string;
  dueFrom: string;
  dueTo: string;
}

export const DEFAULT_TASK_FILTERS: TaskFilterState = {
  q: '',
  customerId: null,
  objectId: null,
  employeeId: null,
  userId: null,
  type: [],
  status: [],
  createdFrom: '',
  createdTo: '',
  dueFrom: '',
  dueTo: '',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  MUELL: 'Müll',
  CHECKLISTE: 'Checkliste',
  REINIGUNG: 'Reinigung',
  KONTROLLE: 'Kontrolle',
  REPARATUR: 'Reparatur',
  ZEITERFASSUNG: 'Zeiterfassung',
  SONSTIGES: 'Sonstiges',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  OFFEN: 'Offen',
  IN_BEARBEITUNG: 'In Bearbeitung',
  ERLEDIGT: 'Erledigt',
  UEBERFAELLIG: 'Überfällig',
  GEPRUEFT: 'Geprüft',
  ABGELEHNT: 'Abgelehnt',
};

