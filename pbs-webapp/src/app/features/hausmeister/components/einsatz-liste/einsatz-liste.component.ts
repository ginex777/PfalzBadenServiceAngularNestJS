import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { HausmeisterEinsatz } from '../../../../core/models';
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
  readonly assignments = input.required<HausmeisterEinsatz[]>();

  readonly editRequested = output<HausmeisterEinsatz>();
  readonly deleteRequested = output<number>();
  readonly generatePdf = output<HausmeisterEinsatz>();

  protected readonly datumFormatieren = datumFormatieren;
}
