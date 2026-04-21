import { MarketingKontakt } from '../../core/models';

export type MarketingStatusFilter =
  | ''
  | 'neu'
  | 'gesendet'
  | 'interesse'
  | 'kein-interesse'
  | 'angebot';

export interface MarketingStatistik {
  neu: number;
  gesendet: number;
  interesse: number;
  keinInteresse: number;
  angebot: number;
}

export interface CsvImportZeile {
  name: string;
  email: string;
  person: string;
  tel: string;
  strasse: string;
  ort: string;
  notiz: string;
  istDuplikat: boolean;
}

export interface MarketingFormularDaten {
  name: string;
  person: string;
  email: string;
  tel: string;
  strasse: string;
  ort: string;
  notiz: string;
  status: MarketingKontakt['status'];
  status_notiz: string;
  datum: string;
}

export const LEERES_MARKETING_FORMULAR: MarketingFormularDaten = {
  name: '',
  person: '',
  email: '',
  tel: '',
  strasse: '',
  ort: '',
  notiz: '',
  status: 'neu',
  status_notiz: '',
  datum: '',
};

export const STATUS_LABELS: Record<MarketingKontakt['status'], string> = {
  neu: 'Neu',
  gesendet: 'Gesendet',
  interesse: 'Interesse',
  'kein-interesse': 'Kein Interesse',
  angebot: 'Angebot erstellt',
};
