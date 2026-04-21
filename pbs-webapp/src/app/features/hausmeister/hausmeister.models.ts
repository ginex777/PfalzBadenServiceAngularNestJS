import { Taetigkeit } from '../../core/models';

export interface HausmeisterFormularDaten {
  mitarbeiter_id: number | null;
  mitarbeiter_name: string;
  kunden_id: number | null;
  kunden_name: string;
  datum: string;
  taetigkeiten: Taetigkeit[];
  notiz: string;
}

export const LEERES_EINSATZ_FORMULAR: HausmeisterFormularDaten = {
  mitarbeiter_id: null,
  mitarbeiter_name: '',
  kunden_id: null,
  kunden_name: '',
  datum: '',
  taetigkeiten: [{ beschreibung: '', stunden: 0 }],
  notiz: '',
};

export type HausmeisterFilter = 'alle' | 'offen' | 'abgeschlossen';
