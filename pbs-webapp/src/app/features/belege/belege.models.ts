import { Beleg } from '../../core/models';

export type BelegeFilter = 'alle' | 'beleg' | 'rechnung' | 'quittung' | 'sonstiges';

export const BELEG_TYP_LABELS: Record<Beleg['typ'], string> = {
  beleg: 'Beleg',
  rechnung: 'Rechnung',
  quittung: 'Quittung',
  sonstiges: 'Sonstiges',
};

export interface NotizFormularDaten {
  notiz: string;
}
