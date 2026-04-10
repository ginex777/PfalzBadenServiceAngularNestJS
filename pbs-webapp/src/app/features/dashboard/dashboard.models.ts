// ============================================================
// Dashboard — Feature-spezifische Modelle
// ============================================================

export interface DashboardStats {
  jahresEinnahmen: number;
  jahresAusgaben: number;
  gewinn: number;
  offeneRechnungenAnzahl: number;
  offeneRechnungenSumme: number;
  ueberfaelligeRechnungenAnzahl: number;
  ueberfaelligeRechnungenSumme: number;
  offeneAngeboteAnzahl: number;
  offeneAngeboteSumme: number;
}

export interface DashboardRechnungZeile {
  id: number;
  nr: string;
  empf: string;
  brutto: number;
  frist: string | undefined;
  tageUeberfaellig: number | null;
  tageVerbleibend: number | null;
  ueberfaellig: boolean;
}

export interface DashboardAngebotZeile {
  id: number;
  nr: string;
  empf: string;
  brutto: number;
  gueltigBis: string | undefined;
  tageVerbleibend: number | null;
  abgelaufen: boolean;
}

export interface AktivitaetZeile {
  typ: 'Rechnung' | 'Angebot';
  nr: string;
  name: string;
  betrag: number;
  datum: string | undefined;
  status: string;
  statusKlasse: 'text-success' | 'text-danger' | 'text-warning';
  routerLink: string;
}

export interface MonatsvergleichZeile {
  monatIndex: number;
  monatName: string;
  einnahmen: number;
  ausgaben: number;
  gewinn: number;
  balkenEinnahmen: number;
  balkenAusgaben: number;
}
