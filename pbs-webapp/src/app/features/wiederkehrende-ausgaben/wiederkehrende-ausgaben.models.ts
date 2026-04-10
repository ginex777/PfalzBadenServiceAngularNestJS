import { WiederkehrendeAusgabe } from '../../core/models';

export interface WiederkehrendeAusgabeFormularDaten {
  name: string;
  kategorie: string;
  brutto: number;
  mwst: number;
  abzug: number;
  belegnr: string;
  aktiv: boolean;
}

export const LEERES_FORMULAR: WiederkehrendeAusgabeFormularDaten = {
  name: '', kategorie: 'Betriebsausgabe', brutto: 0, mwst: 19, abzug: 100, belegnr: '', aktiv: true,
};
