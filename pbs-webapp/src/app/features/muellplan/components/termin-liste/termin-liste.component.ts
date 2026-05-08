import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MuellplanTermin } from '../../../../core/models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { datumFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-termin-liste',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  templateUrl: './termin-liste.component.html',
  styleUrl: './termin-liste.component.scss',
})
export class TerminListeComponent {
  readonly terms = input.required<MuellplanTermin[]>();

  readonly edit = output<MuellplanTermin>();
  readonly delete = output<number>();
  readonly toggleDone = output<MuellplanTermin>();

  protected readonly datumFormatieren = datumFormatieren;

  protected istUeberfaellig(termin: MuellplanTermin): boolean {
    if (termin.erledigt) return false;
    return new Date(termin.abholung) < new Date();
  }
}
