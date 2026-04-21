import { Rechnung, Angebot, Kunde, MarketingKontakt, HausmeisterEinsatz } from '../../core/models';

export type SucheKategorie =
  | 'alle'
  | 'rechnungen'
  | 'angebote'
  | 'kunden'
  | 'marketing'
  | 'hausmeister';

export interface SucheErgebnis {
  rechnungen: Rechnung[];
  angebote: Angebot[];
  kunden: Kunde[];
  marketing: MarketingKontakt[];
  hausmeister: HausmeisterEinsatz[];
}

export interface SucheFormularDaten {
  suchbegriff: string;
}
