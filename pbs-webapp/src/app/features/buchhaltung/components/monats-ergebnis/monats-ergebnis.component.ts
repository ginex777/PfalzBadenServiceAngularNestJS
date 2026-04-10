import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MonatsDaten } from '../../buchhaltung.models';
import { waehrungFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-monats-ergebnis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './monats-ergebnis.component.html',
  styleUrl: './monats-ergebnis.component.scss',
})
export class MonatsErgebnisComponent {
  readonly ergebnis = input.required<MonatsDaten>();
  readonly monatName = input.required<string>();

  protected formatieren(wert: number): string {
    return waehrungFormatieren(wert);
  }

  protected zahllastLabel(): string {
    return this.ergebnis().zahllast < 0 ? 'Zahllast (Erstattung)' : 'Zahllast (an FA)';
  }

  protected zahllastKlasse(): string {
    return this.ergebnis().zahllast >= 0 ? 'wert--verlust' : 'wert--gewinn';
  }

  protected gewinnKlasse(): string {
    return this.ergebnis().gewinn >= 0 ? 'wert--gewinn' : 'wert--verlust';
  }
}
