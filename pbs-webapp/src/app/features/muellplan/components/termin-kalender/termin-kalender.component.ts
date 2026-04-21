// ============================================================
// Müllplan — Termin-Kalender (Dumb Component)
// ============================================================

import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { Objekt, MuellplanVorlage } from '../../../../core/models';
import { TerminAnzeige } from '../../muellplan.models';
import { datumFormatieren } from '../../../../core/utils/format.utils';
import { MONATE } from '../../../../core/utils/format.utils';

interface MonatsGruppe {
  label: string;
  key: number;
  termine: TerminAnzeige[];
}

@Component({
  selector: 'app-termin-kalender',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './termin-kalender.component.html',
  styleUrl: './termin-kalender.component.scss',
})
export class TerminKalenderComponent {
  readonly objekt = input.required<Objekt>();
  readonly termine = input.required<TerminAnzeige[]>();
  readonly naechsteTermine = input<TerminAnzeige[]>([]);
  readonly aktiveVorlage = input<MuellplanVorlage | null>(null);
  readonly monatFilter = input<number | null>(null);
  readonly vergangeneAusblenden = input<boolean>(false);
  readonly hatAktivenFilter = input<boolean>(false);

  readonly terminHinzufuegen = output<void>();
  readonly terminErledigt = output<{ id: number; erledigt: boolean }>();
  readonly terminLoeschen = output<number>();
  readonly bearbeiten = output<void>();
  readonly loeschen = output<void>();
  readonly pdfErstellen = output<void>();
  readonly vorlageAnwenden = output<void>();
  readonly filterOeffnen = output<void>();
  readonly monatFilterAendern = output<number | null>();
  readonly vergangeneToggle = output<boolean>();

  protected readonly monate = MONATE;

  protected readonly monatsGruppen = computed((): MonatsGruppe[] => {
    const byMonth: Record<number, MonatsGruppe> = {};
    for (const t of this.termine()) {
      const [y, m] = t.abholung.split('-').map(Number);
      const key = y * 100 + m;
      if (!byMonth[key]) {
        byMonth[key] = { label: `${MONATE[m - 1]} ${y}`, key, termine: [] };
      }
      byMonth[key].termine.push(t);
    }
    return Object.values(byMonth).sort((a, b) => a.key - b.key);
  });

  protected adresseFormatieren(obj: Objekt): string {
    return [obj.strasse, obj.plz, obj.ort].filter(Boolean).join(', ');
  }

  protected datumFormatieren(d: string): string {
    return datumFormatieren(d);
  }

  protected statusLabel(t: TerminAnzeige): string {
    switch (t.status) {
      case 'erledigt':
        return 'Erledigt';
      case 'heute':
        return 'Heute!';
      case 'morgen':
        return 'Morgen';
      case 'bald':
        return `In ${t.diffTage} Tagen`;
      case 'verpasst':
        return 'Verpasst';
      default:
        return `In ${t.diffTage} Tagen`;
    }
  }

  protected naechsterLabel(t: TerminAnzeige): string {
    if (t.diffTage === 0) return 'Heute rausstellen!';
    if (t.diffTage === 1) return 'Morgen rausstellen';
    return `In ${t.diffTage} Tagen`;
  }

  protected erledigtAenderbar(t: TerminAnzeige): boolean {
    return t.erledigt || t.diffTage <= 0;
  }

  protected onMonatFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.monatFilterAendern.emit(val === '' ? null : parseInt(val));
  }
}
