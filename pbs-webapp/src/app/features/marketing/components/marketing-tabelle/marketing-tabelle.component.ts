import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MarketingKontakt } from '../../../../core/models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../../../shared/ui/skeleton-rows/skeleton-rows.component';
import { STATUS_LABELS } from '../../marketing.models';
import { datumFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-marketing-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, SkeletonRowsComponent],
  templateUrl: './marketing-tabelle.component.html',
  styleUrl: './marketing-tabelle.component.scss',
})
export class MarketingTabelleComponent {
  readonly kontakte = input.required<MarketingKontakt[]>();
  readonly laedt = input<boolean>(false);

  readonly bearbeiten = output<MarketingKontakt>();
  readonly loeschen = output<number>();
  readonly statusSetzen = output<MarketingKontakt>();
  readonly zuKunde = output<MarketingKontakt>();
  readonly senden = output<MarketingKontakt>();

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly datumFormatieren = datumFormatieren;

  protected statusKlasse(status: MarketingKontakt['status']): string {
    const map: Record<MarketingKontakt['status'], string> = {
      neu: 'badge--gray',
      gesendet: 'badge--blue',
      interesse: 'badge--green',
      'kein-interesse': 'badge--red',
      angebot: 'badge--purple',
    };
    return map[status] ?? 'badge--gray';
  }
}
