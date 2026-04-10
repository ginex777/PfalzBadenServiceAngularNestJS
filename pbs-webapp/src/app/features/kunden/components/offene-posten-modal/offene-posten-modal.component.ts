import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { OffenePostenDaten } from '../../kunden.models';
import { waehrungFormatieren, datumFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-offene-posten-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './offene-posten-modal.component.html',
  styleUrl: './offene-posten-modal.component.scss',
})
export class OffenePostenModalComponent {
  readonly daten = input.required<OffenePostenDaten>();

  readonly geschlossen = output<void>();
  readonly neueRechnung = output<number>();
  readonly sammelMahnung = output<number>();

  protected readonly waehrungFormatieren = waehrungFormatieren;
  protected readonly datumFormatieren = datumFormatieren;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.geschlossen.emit();
  }

  protected schliessen(): void {
    this.geschlossen.emit();
  }

  protected rechnungErstellen(): void {
    this.neueRechnung.emit(this.daten().kundeId);
    this.geschlossen.emit();
  }

  protected sammelMahnungSenden(): void {
    this.sammelMahnung.emit(this.daten().kundeId);
    this.geschlossen.emit();
  }

  protected rechnungStatusText(bezahlt: boolean, ueberfaellig: boolean): string {
    if (bezahlt) return 'Bezahlt';
    if (ueberfaellig) return 'Überfällig';
    return 'Offen';
  }

  protected rechnungStatusKlasse(bezahlt: boolean, ueberfaellig: boolean): string {
    if (bezahlt) return 'status-bezahlt';
    if (ueberfaellig) return 'status-ueberfaellig';
    return 'status-offen';
  }
}
