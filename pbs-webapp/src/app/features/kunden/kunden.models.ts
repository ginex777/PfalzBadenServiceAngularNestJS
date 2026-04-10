// ============================================================
// Kunden — Feature-spezifische Modelle
// ============================================================

export interface KundenFormularDaten {
  name: string;
  strasse: string;
  ort: string;
  tel: string;
  email: string;
  notiz: string;
}

export interface KundeUmsatz {
  kundeId: number;
  rechnungenAnzahl: number;
  angeboteAnzahl: number;
  umsatzBezahlt: number;
}

export interface OffenePostenDaten {
  kundeId: number;
  kundeName: string;
  offenSaldo: number;
  offeneAnzahl: number;
  umsatzBezahlt: number;
  ueberfaelligeAnzahl: number;
  ueberfaelligeSumme: number;
  rechnungen: OffenePostenRechnung[];
}

export interface OffenePostenRechnung {
  id: number;
  nr: string;
  titel: string;
  datum: string | undefined;
  brutto: number;
  bezahlt: boolean;
  ueberfaellig: boolean;
  frist: string | undefined;
  bezahlt_am: string | undefined;
}

export const LEERES_FORMULAR: KundenFormularDaten = {
  name: '', strasse: '', ort: '', tel: '', email: '', notiz: '',
};
