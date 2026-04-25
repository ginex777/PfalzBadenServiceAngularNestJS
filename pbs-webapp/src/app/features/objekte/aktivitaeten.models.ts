export type TaskType = 'MUELL' | 'CHECKLISTE' | 'REINIGUNG' | 'KONTROLLE' | 'REPARATUR' | 'ZEITERFASSUNG' | 'SONSTIGES';

export interface AktivitaetItem {
  id: number;
  type: TaskType;
  title: string;
  zeitpunkt: Date | string;
  userId: number | null;
  userEmail: string | null;
  employeeId: number | null;
  employeeName: string | null;
  comment: string | null;
  photoUrl: string | null;
  durationMinutes: number | null;
  createdAt: Date | string;
}

export interface AktivitaetenListResponse {
  data: AktivitaetItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AktivitaetenFilterState {
  type?: string;
  userId?: number | null;
  employeeId?: number | null;
  createdFrom?: string | null;
  createdTo?: string | null;
}

export const DEFAULT_AKTIVITAETEN_FILTER: AktivitaetenFilterState = {
  type: undefined,
  userId: null,
  employeeId: null,
  createdFrom: null,
  createdTo: null,
};

export type DropdownOption = { id: number; name: string };

export const AKTIVITAET_TYPE_LABELS: Record<TaskType, string> = {
  MUELL: 'Müll',
  CHECKLISTE: 'Checkliste',
  REINIGUNG: 'Reinigung',
  KONTROLLE: 'Kontrolle',
  REPARATUR: 'Reparatur',
  ZEITERFASSUNG: 'Zeiterfassung',
  SONSTIGES: 'Sonstiges',
};
