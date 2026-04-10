import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Objekt } from '../../../../core/models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-objekt-liste',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  templateUrl: './objekt-liste.component.html',
  styleUrl: './objekt-liste.component.scss',
})
export class ObjektListeComponent {
  readonly objekte = input.required<Objekt[]>();
  readonly aktuellesObjekt = input<Objekt | null>(null);

  readonly auswaehlen = output<Objekt>();
  readonly bearbeiten = output<Objekt>();
  readonly loeschen = output<number>();
  readonly neuAnlegen = output<void>();

  protected adresseFormatieren(obj: Objekt): string {
    return [obj.strasse, obj.plz, obj.ort].filter(v => !!v).join(' ');
  }
}
