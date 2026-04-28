export interface BenutzerNeuDaten {
  email: string;
  password: string;
  rolle: string;
  vorname: string;
  nachname: string;
}

export interface BenutzerBearbeitenDaten {
  vorname: string;
  nachname: string;
  rolle: string;
}

export const LEERER_BENUTZER: BenutzerNeuDaten = {
  email: '',
  password: '',
  rolle: 'readonly',
  vorname: '',
  nachname: '',
};

export const LEERES_BEARBEITEN_FORMULAR: BenutzerBearbeitenDaten = {
  vorname: '',
  nachname: '',
  rolle: 'readonly',
};

export const ROLLEN_OPTIONEN = [
  { wert: 'admin', label: 'Admin' },
  { wert: 'mitarbeiter', label: 'Mitarbeiter' },
  { wert: 'readonly', label: 'Nur Lesen' },
];
