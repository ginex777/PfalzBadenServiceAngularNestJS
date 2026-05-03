import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Kunde } from '../../../../core/models';
import type { ObjectFormData } from '../../objekte.models';

@Component({
  selector: 'app-objekt-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './objekt-formular.component.html',
  styleUrl: './objekt-formular.component.scss',
})
export class ObjektFormularComponent {
  readonly value = input.required<ObjectFormData>();
  readonly customers = input.required<readonly Kunde[]>();
  readonly disabled = input<boolean>(false);
  readonly valueChange = output<ObjectFormData>();

  protected update<K extends keyof ObjectFormData>(key: K, next: ObjectFormData[K]): void {
    this.valueChange.emit({ ...this.value(), [key]: next });
  }

  protected onText(key: keyof ObjectFormData, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    this.update(key, target.value as ObjectFormData[typeof key]);
  }

  protected onSelect(key: keyof ObjectFormData, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    this.update(key, target.value as ObjectFormData[typeof key]);
  }
}
