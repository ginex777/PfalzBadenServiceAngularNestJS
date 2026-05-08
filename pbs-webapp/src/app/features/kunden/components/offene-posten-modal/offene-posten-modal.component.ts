import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { OffenePostenDaten } from '../../kunden.models';
import { waehrungFormatieren, datumFormatieren } from '../../../../core/utils/format.utils';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';

@Component({
  selector: 'app-offene-posten-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent],
  templateUrl: './offene-posten-modal.component.html',
  styleUrl: './offene-posten-modal.component.scss',
})
export class OffenePostenModalComponent {
  readonly data = input.required<OffenePostenDaten>();

  readonly closed = output<void>();
  readonly newInvoice = output<number>();
  readonly bulkReminder = output<number>();

  protected readonly waehrungFormatieren = waehrungFormatieren;
  protected readonly datumFormatieren = datumFormatieren;

  protected schliessen(): void {
    this.closed.emit();
  }

  protected createInvoice(): void {
    this.newInvoice.emit(this.data().kundeId);
    this.closed.emit();
  }

  protected bulkReminderSenden(): void {
    this.bulkReminder.emit(this.data().kundeId);
    this.closed.emit();
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
