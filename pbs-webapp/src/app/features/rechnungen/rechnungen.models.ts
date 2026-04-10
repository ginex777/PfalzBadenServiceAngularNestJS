// ============================================================
// Rechnungen — Feature-spezifische Modelle
// ============================================================

import { RechnungPosition } from '../../core/models';

export type RechnungFilter = 'alle' | 'offen' | 'bezahlt' | 'ueberfaellig';

export interface RechnungFormularDaten {
  nr: string;
  empf: string;
  str: string;
  ort: string;
  email: string;
  datum: string;
  leistungsdatum: string;
  zahlungsziel: number;
  titel: string;
  positionen: RechnungPosition[];
  mwst_satz: number;
  kunden_id?: number;
}

export interface RechnungPrefill {
  empf?: string;
  str?: string;
  ort?: string;
  email?: string;
  kunden_id?: number;
}

export interface AngebotKonvertierungsDaten {
  empf?: string;
  str?: string;
  ort?: string;
  positionen?: RechnungPosition[];
  titel?: string;
  kunden_id?: number;
}

export interface WiederkehrendPrefill {
  empf?: string;
  str?: string;
  ort?: string;
  email?: string;
  kunden_id?: number;
  titel?: string;
  positionen?: RechnungPosition[];
}

export interface RechnungStatistik {
  offen: number;
  bezahltMonat: number;
  ueberfaellig: number;
  gesamtumsatz: number;
}

export const LEERES_RECHNUNGS_FORMULAR: RechnungFormularDaten = {
  nr: '',
  empf: '',
  str: '',
  ort: '',
  email: '',
  datum: '',
  leistungsdatum: '',
  zahlungsziel: 14,
  titel: '',
  positionen: [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
  mwst_satz: 19,
  kunden_id: undefined,
};
