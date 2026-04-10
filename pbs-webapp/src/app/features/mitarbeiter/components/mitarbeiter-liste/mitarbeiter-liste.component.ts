import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Mitarbeiter } from '../../../../core/models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../../../shared/ui/skeleton-rows/skeleton-rows.component';

@Component({
  selector: 'app-mitarbeiter-liste',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, SkeletonRowsComponent],
  templateUrl: './mitarbeiter-liste.component.html',
  styleUrl: './mitarbeiter-liste.component.scss',
})
export class MitarbeiterListeComponent {
  readonly mitarbeiter = input.required<Mitarbeiter[]>();
  readonly laedt = input<boolean>(false);

  readonly bearbeiten = output<Mitarbeiter>();
  readonly loeschen = output<number>();
  readonly stundenOeffnen = output<number>();
  readonly aktivToggle = output<{ id: number; aktiv: boolean }>();

  protected aktivGeaendert(id: number, event: Event): void {
    this.aktivToggle.emit({ id, aktiv: (event.target as HTMLInputElement).checked });
  }

  protected fmt(n: number): string {
    return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
}
