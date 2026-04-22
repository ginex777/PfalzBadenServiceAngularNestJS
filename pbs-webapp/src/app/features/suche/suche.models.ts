import { Rechnung, Angebot, Kunde, HausmeisterEinsatz } from '../../core/models';

export type SucheKategorie =
  | 'alle'
  | 'rechnungen'
  | 'angebote'
  | 'kunden'
  | 'hausmeister';

export interface SucheErgebnis {
  rechnungen: Rechnung[];
  angebote: Angebot[];
  kunden: Kunde[];
  hausmeister: HausmeisterEinsatz[];
}

export interface SucheFormularDaten {
  suchbegriff: string;
}
