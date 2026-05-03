import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Rechnung } from '../../../../core/models';
import { waehrungFormatieren, datumFormatieren } from '../../../../core/utils/format.utils';
import { MS_PER_DAY } from '../../../../core/constants';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';

@Component({
  selector: 'app-zahlungs-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent],
  templateUrl: './zahlungs-tracker.component.html',
  styleUrl: './zahlungs-tracker.component.scss',
})
export class ZahlungsTrackerComponent {
  readonly rechnungen = input.required<Rechnung[]>();
  readonly bezahltDatum = input<string>('');
  readonly bezahltKandidat = input<Rechnung | null>(null);

  readonly alsGezahltBestaetigen = output<void>();
  readonly alsGezahltAbbrechen = output<void>();
  readonly bezahltDatumAendern = output<string>();

  protected readonly waehrungFormatieren = waehrungFormatieren;
  protected readonly datumFormatieren = datumFormatieren;

  protected istUeberfaellig(rechnung: Rechnung): boolean {
    if (rechnung.bezahlt || !rechnung.frist) return false;
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    return new Date(rechnung.frist) < heute;
  }

  protected tageUeberfaellig(rechnung: Rechnung): number {
    if (!rechnung.frist) return 0;
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    return Math.floor((heute.getTime() - new Date(rechnung.frist).getTime()) / MS_PER_DAY);
  }

  protected tageBisZahlung(rechnung: Rechnung): number {
    if (!rechnung.frist) return 0;
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    return Math.floor((new Date(rechnung.frist).getTime() - heute.getTime()) / MS_PER_DAY);
  }

  protected onDatumChange(event: Event): void {
    this.bezahltDatumAendern.emit((event.target as HTMLInputElement).value);
  }

  protected offeneRechnungen(): Rechnung[] {
    return this.rechnungen().filter((r) => !r.bezahlt);
  }

  protected ueberfaelligeRechnungen(): Rechnung[] {
    return this.rechnungen().filter((r) => this.istUeberfaellig(r));
  }

  protected offenerBetrag(): number {
    return this.offeneRechnungen().reduce((s, r) => s + (r.brutto ?? 0), 0);
  }
}
