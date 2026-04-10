import { Objekt, MuellplanTermin } from '../../core/models';

export interface TerminAnzeige extends MuellplanTermin {
  diffTage: number;
  status: 'erledigt' | 'heute' | 'morgen' | 'bald' | 'verpasst' | 'zukunft';
  abholungAnzeige: string;
  rausstellen: string;
}

export interface MuellplanFormularDaten {
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  notiz: string;
  kunden_id: number | null;
}

export interface TerminFormularDaten {
  muellart: string;
  farbe: string;
  abholung: string;
}

export interface VorlageFormularDaten {
  name: string;
  jahr: number;
  text: string;
}

export const LEERES_OBJEKT_FORMULAR: MuellplanFormularDaten = {
  name: '', strasse: '', plz: '', ort: '', notiz: '', kunden_id: null,
};

export const LEERER_TERMIN: TerminFormularDaten = {
  muellart: '', farbe: '#6366f1', abholung: '',
};

export const LEERE_VORLAGE: VorlageFormularDaten = {
  name: '', jahr: new Date().getFullYear(), text: '',
};

export const MUELL_FARBEN: Record<string, { name: string; farbe: string }> = {
  'biotonne': { name: 'Bioabfall', farbe: '#16a34a' },
  'bioabfall': { name: 'Bioabfall', farbe: '#16a34a' },
  'bio': { name: 'Bioabfall', farbe: '#16a34a' },
  'restmüll': { name: 'Restmüll', farbe: '#6b7280' },
  'resttonne': { name: 'Restmüll', farbe: '#6b7280' },
  'rest': { name: 'Restmüll', farbe: '#6b7280' },
  'gelber sack': { name: 'Gelber Sack', farbe: '#d97706' },
  'gelb': { name: 'Gelber Sack', farbe: '#d97706' },
  'papier': { name: 'Papier', farbe: '#2563eb' },
  'papiertonne': { name: 'Papier', farbe: '#2563eb' },
  'grünschnitt': { name: 'Grünschnitt', farbe: '#65a30d' },
  'grünabfall': { name: 'Grünschnitt', farbe: '#65a30d' },
  'grün': { name: 'Grünschnitt', farbe: '#65a30d' },
  'sperrabfall': { name: 'Sperrabfall', farbe: '#7c3aed' },
  'sperrmüll': { name: 'Sperrabfall', farbe: '#7c3aed' },
  'sperr': { name: 'Sperrabfall', farbe: '#7c3aed' },
  'tannenbaum': { name: 'Tannenbaum', farbe: '#16a34a' },
  'sonderabfall': { name: 'Sonderabfall', farbe: '#7c3aed' },
};
