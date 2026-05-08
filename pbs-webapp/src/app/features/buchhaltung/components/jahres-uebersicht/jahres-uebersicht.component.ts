import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { QuartalsDaten, VstQuartal } from '../../buchhaltung.models';
import { waehrungFormatieren, datumFormatieren } from '../../../../core/utils/format.utils';

interface JahresMonatsDaten {
  monat: number;
  name: string;
  einnahmenNetto: number;
  einnahmenUst: number;
  ausgabenNetto: number;
  vorsteuer: number;
  zahllast: number;
  gewinn: number;
}

@Component({
  selector: 'app-jahres-uebersicht',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './jahres-uebersicht.component.html',
  styleUrl: './jahres-uebersicht.component.scss',
})
export class JahresUebersichtComponent {
  readonly jahr = input.required<number>();
  readonly quartalsDaten = input.required<QuartalsDaten[]>();
  readonly jahresMonatsDaten = input.required<JahresMonatsDaten[]>();
  readonly vstQuartale = input.required<VstQuartal[]>();

  readonly markVatPaid = output<string>();
  readonly resetVatPayment = output<string>();

  protected formatieren(wert: number): string {
    return waehrungFormatieren(wert);
  }

  protected datumFormatieren(datum: string): string {
    return datumFormatieren(datum);
  }

  protected zahllastKlasse(zahllast: number): string {
    return zahllast >= 0 ? 'zahl--verlust' : 'zahl--gewinn';
  }

  protected gewinnKlasse(gewinn: number): string {
    return gewinn >= 0 ? 'zahl--gewinn' : 'zahl--verlust';
  }

  protected hatDaten(zeile: JahresMonatsDaten): boolean {
    return zeile.einnahmenNetto > 0 || zeile.ausgabenNetto > 0;
  }

  protected quartalGesamtEinnahmen(): number {
    return this.quartalsDaten().reduce((s, q) => s + q.einnahmenNetto, 0);
  }
  protected quartalGesamtUst(): number {
    return this.quartalsDaten().reduce((s, q) => s + q.einnahmenUst, 0);
  }
  protected quartalGesamtAusgaben(): number {
    return this.quartalsDaten().reduce((s, q) => s + q.ausgabenNetto, 0);
  }
  protected quartalGesamtVorsteuer(): number {
    return this.quartalsDaten().reduce((s, q) => s + q.vorsteuer, 0);
  }
  protected quartalGesamtZahllast(): number {
    return this.quartalsDaten().reduce((s, q) => s + q.zahllast, 0);
  }
  protected quartalGesamtGewinn(): number {
    return this.quartalsDaten().reduce((s, q) => s + q.gewinn, 0);
  }

  protected jahresGesamtEinnahmen(): number {
    return this.jahresMonatsDaten().reduce((s, m) => s + m.einnahmenNetto, 0);
  }
  protected jahresGesamtUst(): number {
    return this.jahresMonatsDaten().reduce((s, m) => s + m.einnahmenUst, 0);
  }
  protected jahresGesamtAusgaben(): number {
    return this.jahresMonatsDaten().reduce((s, m) => s + m.ausgabenNetto, 0);
  }
  protected jahresGesamtVorsteuer(): number {
    return this.jahresMonatsDaten().reduce((s, m) => s + m.vorsteuer, 0);
  }
  protected jahresGesamtZahllast(): number {
    return this.jahresMonatsDaten().reduce((s, m) => s + m.zahllast, 0);
  }
  protected jahresGesamtGewinn(): number {
    return this.jahresMonatsDaten().reduce((s, m) => s + m.gewinn, 0);
  }

  protected vstToggle(quartal: VstQuartal): void {
    if (quartal.bezahlt) {
      this.resetVatPayment.emit(quartal.schluessel);
    } else {
      this.markVatPaid.emit(quartal.schluessel);
    }
  }
}
