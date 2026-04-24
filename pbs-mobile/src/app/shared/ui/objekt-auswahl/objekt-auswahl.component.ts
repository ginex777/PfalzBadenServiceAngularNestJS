import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { WasteObject } from '../../../core/waste-plan.service';

function readUnknownValue(event: Event): unknown {
  if (!(event instanceof CustomEvent)) return undefined;
  const detail: unknown = event.detail;
  if (!detail || typeof detail !== 'object') return undefined;
  if (!('value' in detail)) return undefined;
  return (detail as { value: unknown }).value;
}

@Component({
  selector: 'app-objekt-auswahl',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonLabel, IonSelect, IonSelectOption],
  templateUrl: './objekt-auswahl.component.html',
  styleUrl: './objekt-auswahl.component.scss',
})
export class ObjektAuswahlComponent {
  readonly objects = input<WasteObject[]>([]);
  readonly selectedObjectId = input<number | null>(null);
  readonly disabled = input(false);
  readonly label = input('Objekt');
  readonly placeholder = input('Objekt auswÃ¤hlen');

  readonly selectedObjectIdChange = output<number | null>();

  protected readonly isEmpty = computed(() => this.objects().length === 0);

  protected onChanged(event: Event): void {
    const value = readUnknownValue(event);
    const parsed = typeof value === 'string' ? Number(value) : value;
    const objectId = typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
    this.selectedObjectIdChange.emit(objectId);
  }
}

