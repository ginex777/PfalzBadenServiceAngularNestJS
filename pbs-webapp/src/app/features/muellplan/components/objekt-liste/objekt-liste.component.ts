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
  readonly objects = input.required<Objekt[]>();
  readonly currentObject = input<Objekt | null>(null);

  readonly selectObject = output<Objekt>();

  protected adresseFormatieren(obj: Objekt): string {
    return [obj.strasse, obj.plz, obj.ort].filter((v) => !!v).join(' ');
  }
}
