// ============================================================
// Müllplan — Termin-Kalender (Dumb Component)
// ============================================================

import { ChangeDetectionStrategy, Component, input, output, computed, signal } from '@angular/core';
import type { Objekt, MuellplanVorlage } from '../../../../core/models';
import type { TerminAnzeige } from '../../muellplan.models';
import { datumFormatieren } from '../../../../core/utils/format.utils';
import { MONATE } from '../../../../core/utils/format.utils';
import type { TaskListItemApi } from '../../../aufgaben/aufgaben.models';

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
  readonly object = input.required<Objekt>();
  readonly terms = input.required<TerminAnzeige[]>();
  readonly nextTerms = input<TerminAnzeige[]>([]);
  readonly activeTemplate = input<MuellplanVorlage | null>(null);
  readonly monthFilter = input<number | null>(null);
  readonly hidePast = input<boolean>(false);
  readonly hasActiveFilter = input<boolean>(false);
  readonly erledigungsHistorie = input<TaskListItemApi[]>([]);

  protected readonly aktiverTab = signal<'termine' | 'historie'>('termine');

  readonly addTerm = output<void>();
  readonly termDoneChange = output<{ id: number; done: boolean }>();
  readonly deleteTerm = output<number>();
  readonly createPdf = output<void>();
  readonly applyTemplate = output<void>();
  readonly openFilter = output<void>();
  readonly monthFilterChange = output<number | null>();
  readonly hidePastChange = output<boolean>();

  protected readonly monate = MONATE;

  protected readonly monatsGruppen = computed((): MonatsGruppe[] => {
    const byMonth: Record<number, MonatsGruppe> = {};
    for (const t of this.terms()) {
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
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    const val = target.value;
    this.monthFilterChange.emit(val === '' ? null : parseInt(val));
  }

  protected onHidePastChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.hidePastChange.emit(target.checked);
  }

  protected onTermDoneChange(id: number, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.termDoneChange.emit({ id, done: target.checked });
  }
}
