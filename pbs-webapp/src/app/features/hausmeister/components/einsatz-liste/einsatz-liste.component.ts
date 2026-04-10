import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HausmeisterEinsatz } from '../../../../core/models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { datumFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-einsatz-liste',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  templateUrl: './einsatz-liste.component.html',
  styleUrl: './einsatz-liste.component.scss',
})
export class EinsatzListeComponent {
  readonly einsaetze = input.required<HausmeisterEinsatz[]>();

  readonly bearbeiten = output<HausmeisterEinsatz>();
  readonly loeschen = output<number>();
  readonly pdfGenerieren = output<HausmeisterEinsatz>();

  protected readonly datumFormatieren = datumFormatieren;
}
