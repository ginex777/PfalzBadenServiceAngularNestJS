// ============================================================
// Angebote — Feature-spezifische Modelle
// ============================================================

import type { RechnungPosition } from '../../core/models';

export type AngebotFilter = 'alle' | 'offen' | 'angenommen' | 'abgelehnt' | 'gesendet';
export type AngebotStatus = 'offen' | 'angenommen' | 'abgelehnt' | 'gesendet';

export interface AngebotFormularDaten {
  nr: string;
  empf: string;
  str: string;
  ort: string;
  email: string;
  datum: string;
  gueltig_bis: string;
  titel: string;
  positionen: RechnungPosition[];
  mwst_satz: number;
  zusatz: string;
  kunden_id?: number;
}

export interface AngebotPrefill {
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

export const LEERES_ANGEBOTS_FORMULAR: AngebotFormularDaten = {
  nr: '',
  empf: '',
  str: '',
  ort: '',
  email: '',
  datum: '',
  gueltig_bis: '',
  titel: '',
  positionen: [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
  mwst_satz: 19,
  zusatz: '',
  kunden_id: undefined,
};
