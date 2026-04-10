import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Rechnung } from '../../../../core/models';
import { RechnungFilter } from '../../rechnungen.models';
import { StatusBadgeComponent, StatusBadgeTyp } from '../../../../shared/ui/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { waehrungFormatieren, datumFormatieren, MONATE } from '../../../../core/utils/format.utils';
import { MS_PER_DAY } from '../../../../core/constants';

@Component({
  selector: 'app-rechnungen-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, EmptyStateComponent],
  templateUrl: './rechnungen-tabelle.component.html',
  styleUrl: './rechnungen-tabelle.component.scss',
})
export class RechnungenTabelleComponent {
  readonly rechnungen = input.required<Rechnung[]>();
  readonly laedt = input<boolean>(false);
  readonly aktiverFilter = input<RechnungFilter>('alle');

  readonly bearbeiten = output<Rechnung>();
  readonly loeschen = output<number>();
  readonly alsGezahlt = output<Rechnung>();
  readonly pdfGenerieren = output<Rechnung>();
  readonly filterAendern = output<RechnungFilter>();
  readonly kopieren = output<Rechnung>();
  readonly mahnung = output<Rechnung>();

  protected readonly waehrungFormatieren = waehrungFormatieren;
  protected readonly datumFormatieren = datumFormatieren;

  protected readonly MONATE = MONATE;
  protected monatFilter = '';
  protected suchbegriffLokal = '';

  protected gefilterteRechnungen(): Rechnung[] {
    let liste = this.rechnungen();
    if (this.monatFilter !== '') {
      const m = parseInt(this.monatFilter);
      liste = liste.filter(r => r.datum && new Date(r.datum).getMonth() === m);
    }
    return liste;
  }

  protected onFilterSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as RechnungFilter;
    this.filterAendern.emit(val);
  }

  protected monatGeaendert(event: Event): void {
    this.monatFilter = (event.target as HTMLSelectElement).value;
  }

  protected suchbegriffLeeren(): void {
    this.monatFilter = '';
    this.filterAendern.emit('alle');
  }

  protected istUeberfaellig(rechnung: Rechnung): boolean {
    if (rechnung.bezahlt || !rechnung.frist) return false;
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    return new Date(rechnung.frist) < heute;
  }

  protected tageUeberfaellig(rechnung: Rechnung): number {
    if (!rechnung.frist) return 0;
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    const frist = new Date(rechnung.frist);
    return Math.floor((heute.getTime() - frist.getTime()) / MS_PER_DAY);
  }

  protected statusTyp(rechnung: Rechnung): StatusBadgeTyp {
    if (rechnung.bezahlt) return 'bezahlt';
    if (this.istUeberfaellig(rechnung)) return 'ueberfaellig';
    return 'offen';
  }
}
