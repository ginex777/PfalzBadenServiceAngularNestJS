import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MONATE } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-monats-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './monats-tabs.component.html',
  styleUrl: './monats-tabs.component.scss',
})
export class MonatsTabsComponent {
  readonly aktuellerMonat = input.required<number>();
  readonly ansichtsModus = input.required<'monat' | 'jahresuebersicht'>();
  readonly gesperrteMonateSet = input.required<Set<number>>();
  readonly monatHatDaten = input.required<(monat: number) => boolean>();

  readonly monthSelected = output<number>();
  readonly yearViewSelected = output<void>();

  protected readonly monate = MONATE;

  protected monatKurzname(index: number): string {
    return MONATE[index].substring(0, 3);
  }

  protected istGesperrt(monat: number): boolean {
    return this.gesperrteMonateSet().has(monat);
  }

  protected tabKlasse(monat: number): string {
    const aktiv = this.ansichtsModus() === 'monat' && this.aktuellerMonat() === monat;
    const hatDaten = this.monatHatDaten()(monat);
    if (aktiv) return 'tab tab--aktiv';
    if (hatDaten) return 'tab tab--hat-daten';
    return 'tab';
  }

  protected uebersichtKlasse(): string {
    return this.ansichtsModus() === 'jahresuebersicht' ? 'tab tab--aktiv' : 'tab';
  }

  protected monatWaehlen(monat: number): void {
    this.monthSelected.emit(monat);
  }

  protected jahresansichtWaehlen(): void {
    this.yearViewSelected.emit();
  }
}
