export interface MitarbeiterFormularDaten {
  name: string;
  rolle: string;
  stundenlohn: number;
  email: string;
  tel: string;
  notiz: string;
  aktiv: boolean;
}

export interface StundenFormularDaten {
  datum: string;
  stunden: number;
  lohnSatz: number;
  zuschlagProzent: number;
  ort: string;
  beschreibung: string;
}

export interface StundenStatistik {
  gesamtStunden: number;
  grundlohn: number;
  zuschlaege: number;
  gesamtLohn: number;
  bezahlt: number;
  offen: number;
}

export const LEERES_MITARBEITER_FORMULAR: MitarbeiterFormularDaten = {
  name: '',
  rolle: '',
  stundenlohn: 0,
  email: '',
  tel: '',
  notiz: '',
  aktiv: true,
};

export const LEERES_STUNDEN_FORMULAR: StundenFormularDaten = {
  datum: '',
  stunden: 0,
  lohnSatz: 0,
  zuschlagProzent: 0,
  ort: '',
  beschreibung: '',
};

export const ZUSCHLAG_OPTIONEN = [
  { wert: 0, label: 'Kein Zuschlag' },
  { wert: 25, label: '25 % Zuschlag' },
  { wert: 50, label: '50 % Zuschlag' },
  { wert: 75, label: '75 % Zuschlag' },
  { wert: 100, label: '100 % Zuschlag' },
];
