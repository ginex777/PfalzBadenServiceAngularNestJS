import { RechnungPosition, WiederkehrendeRechnung } from '../../core/models';

export interface WrFormularDaten {
  kunden_id: number | null;
  titel: string;
  intervall: string;
  aktiv: boolean;
  positionen: RechnungPosition[];
}

export const LEERES_WR_FORMULAR: WrFormularDaten = {
  kunden_id: null,
  titel: '',
  intervall: 'monatlich',
  aktiv: true,
  positionen: [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
};

export const INTERVALL_OPTIONEN = [
  { wert: 'monatlich', label: 'Monatlich' },
  { wert: 'quartalsweise', label: 'Quartalsweise' },
  { wert: 'halbjaehrlich', label: 'Halbjährlich' },
  { wert: 'jaehrlich', label: 'Jährlich' },
];
