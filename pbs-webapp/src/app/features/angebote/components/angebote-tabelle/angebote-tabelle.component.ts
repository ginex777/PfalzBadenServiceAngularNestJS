import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Angebot } from '../../../../core/models';
import { AngebotFilter } from '../../angebote.models';
import { StatusBadgeComponent, StatusBadgeTyp } from '../../../../shared/ui/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { waehrungFormatieren, datumFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-angebote-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, EmptyStateComponent],
  templateUrl: './angebote-tabelle.component.html',
  styleUrl: './angebote-tabelle.component.scss',
})
export class AngeboteTabelleComponent {
  readonly angebote = input.required<Angebot[]>();
  readonly laedt = input<boolean>(false);
  readonly aktiverFilter = input<AngebotFilter>('alle');

  readonly bearbeiten = output<Angebot>();
  readonly loeschen = output<number>();
  readonly statusSetzen = output<{ id: number; status: 'angenommen' | 'abgelehnt' | 'gesendet' }>();
  readonly pdfGenerieren = output<Angebot>();
  readonly zuRechnungKonvertieren = output<Angebot>();
  readonly filterAendern = output<AngebotFilter>();
  readonly kopieren = output<Angebot>();

  protected readonly waehrungFormatieren = waehrungFormatieren;
  protected readonly datumFormatieren = datumFormatieren;
  protected readonly MONATE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  protected monatFilter = '';

  protected gefilterteAngebote(): Angebot[] {
    if (this.monatFilter === '') return this.angebote();
    const m = parseInt(this.monatFilter);
    return this.angebote().filter(a => a.datum && new Date(a.datum).getMonth() === m);
  }

  protected onFilterSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as AngebotFilter;
    this.filterAendern.emit(val);
  }

  protected monatGeaendert(event: Event): void {
    this.monatFilter = (event.target as HTMLSelectElement).value;
  }

  protected filterLeeren(): void {
    this.monatFilter = '';
    this.filterAendern.emit('alle');
  }

  protected onStatusChange(angebot: Angebot, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    if (!status) return;
    (event.target as HTMLSelectElement).value = '';
    if (status === 'offen') {
      this.statusSetzen.emit({ id: angebot.id, status: 'gesendet' }); // reset via gesendet=false
      return;
    }
    this.statusSetzen.emit({ id: angebot.id, status: status as 'angenommen' | 'abgelehnt' | 'gesendet' });
  }

  protected istAbgelaufen(angebot: Angebot): boolean {
    if (!angebot.gueltig_bis || angebot.angenommen || angebot.abgelehnt) return false;
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    return new Date(angebot.gueltig_bis) < heute;
  }

  protected statusTyp(angebot: Angebot): StatusBadgeTyp {
    if (angebot.angenommen) return 'angenommen';
    if (angebot.abgelehnt) return 'abgelehnt';
    if (angebot.gesendet) return 'gesendet';
    return 'offen';
  }
}
