import { ChangeDetectionStrategy, Component, input, output, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, form, required, min } from '@angular/forms/signals';
import type { Mitarbeiter, MitarbeiterStunden } from '../../../../core/models';
import type {
  StundenFormularDaten,
  StundenStatistik} from '../../mitarbeiter.models';
import {
  ZUSCHLAG_OPTIONEN,
} from '../../mitarbeiter.models';
import { datumFormatieren, waehrungFormatieren } from '../../../../core/utils/format.utils';
import { SkeletonRowsComponent } from '../../../../shared/ui/skeleton-rows/skeleton-rows.component';

interface Stempel {
  id: number;
  mitarbeiter_id: number;
  start: string;
  stop?: string | null;
  dauer_minuten?: number | null;
  notiz?: string | null;
  created_at?: string;
}

@Component({
  selector: 'app-stunden-erfassung',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, SkeletonRowsComponent],
  templateUrl: './stunden-erfassung.component.html',
  styleUrl: './stunden-erfassung.component.scss',
})
export class StundenErfassungComponent {
  readonly employee = input.required<Mitarbeiter>();
  readonly hours = input.required<MitarbeiterStunden[]>();
  readonly hoursLoading = input<boolean>(false);
  readonly formData = input.required<StundenFormularDaten>();
  readonly payrollPreview = input<{ grundlohn: number; zuschlag: number; gesamt: number }>({
    grundlohn: 0,
    zuschlag: 0,
    gesamt: 0,
  });
  readonly statistik = input.required<StundenStatistik>();
  readonly timeClockEntries = input<Stempel[]>([]);
  readonly timeClockLoading = input<boolean>(false);

  readonly back = output<void>();
  readonly add = output<void>();
  readonly togglePaid = output<{ id: number; paid: boolean }>();
  readonly delete = output<number>();
  readonly fieldChanged = output<{ field: keyof StundenFormularDaten; value: string | number }>();
  readonly generatePdf = output<void>();
  readonly convertTimeClockEntry = output<Stempel>();

  protected readonly zuschlagOptionen = ZUSCHLAG_OPTIONEN;
  protected readonly datumFormatieren = datumFormatieren;
  protected readonly waehrungFormatieren = waehrungFormatieren;

  protected readonly formModell = linkedSignal(() => this.formData());

  protected readonly hoursForm = form(this.formModell, (schema) => {
    required(schema.datum, { message: 'Datum erforderlich' });
    min(schema.stunden, 0.5, { message: 'Mindestens 0.5 Stunden' });
  });

  protected bezahltGeaendert(id: number, event: Event): void {
    this.togglePaid.emit({ id, paid: (event.target as HTMLInputElement).checked });
  }

  protected onFeld(field: keyof StundenFormularDaten, event: Event): void {
    const el = event.target as HTMLInputElement | HTMLSelectElement;
    const value =
      field === 'stunden' || field === 'lohnSatz' || field === 'zuschlagProzent'
        ? parseFloat(el.value) || 0
        : el.value;
    this.fieldChanged.emit({ field, value });
  }

  protected zeitFormatieren(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
