// ============================================================
// Buchhaltung — Feature-spezifische Modelle
// ============================================================

import { BuchhaltungEintrag } from '../../core/models';

/** Berechnete Monatsdaten für Anzeige und Zusammenfassung */
export interface MonatsDaten {
  einnahmenNetto: number;
  einnahmenUst: number;
  ausgabenNetto: number;
  vorsteuer: number;
  zahllast: number;
  gewinn: number;
}

/** Berechnete Quartalsdaten */
export interface QuartalsDaten {
  label: string;
  monate: number[];
  einnahmenNetto: number;
  einnahmenUst: number;
  ausgabenNetto: number;
  vorsteuer: number;
  zahllast: number;
  gewinn: number;
}

/** ELSTER-Kennzahlen für USt-Voranmeldung */
export interface ElsterDaten {
  kz81: number; // Netto 19%
  kz83: number; // USt 19%
  kz86: number; // Netto 7%
  kz85: number; // USt 7%
  kz66: number; // Vorsteuer
}

/** VST-Quartalseintrag für Anzeige */
export interface VstQuartal {
  schluessel: string; // 'q0' .. 'q3'
  label: string;
  monate: number[];
  elster: ElsterDaten;
  zahllast: number;
  bezahlt: boolean;
  datum: string;
  offen: number;
}

/** Lokale Zeile (in-memory, vor dem Speichern ohne id) */
export type BuchhaltungZeile = Omit<BuchhaltungEintrag, 'id' | 'jahr' | 'monat'> & {
  id?: number;
  _tempId: string; // für @for track
};

/** Ansichtsmodus */
export type AnsichtsModus = 'monat' | 'jahresuebersicht';

/** Dirty-State für ungespeicherte Änderungen */
export interface SpeicherStatus {
  dirty: boolean;
  speichernLaeuft: boolean;
}
