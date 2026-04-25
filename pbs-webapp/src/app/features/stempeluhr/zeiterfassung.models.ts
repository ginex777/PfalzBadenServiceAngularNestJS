export interface ZeiterfassungEintrag {
  id: number;
  mitarbeiterId: number;
  mitarbeiterName: string;
  objektId: number | null;
  objektName: string | null;
  kundeId: number | null;
  kundeName: string | null;
  start: string;
  stop: string | null;
  dauerMinuten: number | null;
  notiz: string | null;
}

export interface ZeiterfassungListResponse {
  data: ZeiterfassungEintrag[];
  total: number;
  totalDurationMinutes: number;
}

export interface ZeiterfassungFilterState {
  mitarbeiterId: number | null;
  objektId: number | null;
  kundenId: number | null;
  von: string | null;
  bis: string | null;
}

export const DEFAULT_ZEITERFASSUNG_FILTER: ZeiterfassungFilterState = {
  mitarbeiterId: null,
  objektId: null,
  kundenId: null,
  von: null,
  bis: null,
};

export interface DropdownOption {
  id: number;
  name: string;
}
