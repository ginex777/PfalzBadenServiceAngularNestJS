import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MonatsDaten } from '../../buchhaltung.models';
import { waehrungFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-monats-ergebnis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './monats-ergebnis.component.html',
  styleUrl: './monats-ergebnis.component.scss',
})
export class MonatsErgebnisComponent {
  readonly result = input.required<MonatsDaten>();
  readonly monthName = input.required<string>();

  protected formatieren(wert: number): string {
    return waehrungFormatieren(wert);
  }

  protected zahllastLabel(): string {
    return this.result().zahllast < 0 ? 'Zahllast (Erstattung)' : 'Zahllast (an FA)';
  }

  protected zahllastKlasse(): string {
    return this.result().zahllast >= 0 ? 'wert--verlust' : 'wert--gewinn';
  }

  protected gewinnKlasse(): string {
    return this.result().gewinn >= 0 ? 'wert--gewinn' : 'wert--verlust';
  }
}
