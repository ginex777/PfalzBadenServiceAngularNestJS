export interface EuerZeile {
  zeile: string;
  label: string;
  betrag: number | null;
  fett?: boolean;
  eingerueckt?: boolean;
  sektionskopf?: boolean;
}

export interface EuerErgebnis {
  einnahmen: { inc0: number; inc7: number; inc19: number; summe: number };
  ausgaben: { zeilen: Array<{ zeile: string; label: string; betrag: number }>; summe: number };
  gewinn: number;
  ust: { ust7: number; ust19: number; vstGesamt: number; zahllast: number };
}

export const EUER_AUSGABEN_ZEILEN: Array<{
  zeile: string;
  label: string;
  keys: string[];
  abzugFaktor?: number;
}> = [
  { zeile: '22', label: 'Waren, Roh- und Hilfsstoffe', keys: ['material', 'waren', 'roh'] },
  { zeile: '23', label: 'Bezogene Leistungen', keys: ['leistung', 'fremd', 'subunternehmer'] },
  { zeile: '46', label: 'Löhne und Gehälter', keys: ['lohn', 'gehalt'] },
  { zeile: '48', label: 'Miete und Pacht', keys: ['miete', 'pacht', 'raum', 'büro'] },
  { zeile: '50', label: 'Telefon, Internet', keys: ['telefon', 'internet', 'kommunikation'] },
  {
    zeile: '52',
    label: 'Bürobedarf, Porto',
    keys: ['büromaterial', 'bürobedarf', 'porto', 'büro'],
  },
  { zeile: '54', label: 'Kfz-Kosten', keys: ['kfz', 'pkw', 'fahrzeug', 'auto'] },
  { zeile: '56', label: 'Reisekosten', keys: ['reise', 'fahrt'] },
  {
    zeile: '58',
    label: 'Bewirtungskosten (70 % abzugsfähig)',
    keys: ['bewirtung'],
    abzugFaktor: 0.7,
  },
  { zeile: '60', label: 'Werbung, Marketing', keys: ['werbung', 'marketing'] },
  { zeile: '62', label: 'Versicherungen', keys: ['versicherung'] },
  { zeile: '64', label: 'Sonstige Betriebsausgaben', keys: [] },
];
