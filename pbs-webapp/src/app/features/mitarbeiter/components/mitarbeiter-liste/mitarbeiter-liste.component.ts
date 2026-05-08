import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Mitarbeiter } from '../../../../core/models';
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
  readonly employees = input.required<Mitarbeiter[]>();
  readonly loading = input<boolean>(false);

  readonly edit = output<Mitarbeiter>();
  readonly delete = output<number>();
  readonly openHours = output<number>();
  readonly toggleActive = output<{ id: number; active: boolean }>();

  protected aktivGeaendert(id: number, event: Event): void {
    this.toggleActive.emit({ id, active: (event.target as HTMLInputElement).checked });
  }

  protected fmt(n: number): string {
    return `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })  } €`;
  }
}
