import { ChangeDetectionStrategy, Component, input, output, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, form, required, min } from '@angular/forms/signals';
import { Mitarbeiter, MitarbeiterStunden } from '../../../../core/models';
import { StundenFormularDaten, StundenStatistik, ZUSCHLAG_OPTIONEN } from '../../mitarbeiter.models';
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
  readonly mitarbeiter = input.required<Mitarbeiter>();
  readonly stunden = input.required<MitarbeiterStunden[]>();
  readonly stundenLaedt = input<boolean>(false);
  readonly formularDaten = input.required<StundenFormularDaten>();
  readonly lohnVorschau = input<{ grundlohn: number; zuschlag: number; gesamt: number }>({ grundlohn: 0, zuschlag: 0, gesamt: 0 });
  readonly statistik = input.required<StundenStatistik>();
  readonly stempelEintraege = input<Stempel[]>([]);
  readonly stempelLaedt = input<boolean>(false);

  readonly zurueck = output<void>();
  readonly eintragen = output<void>();
  readonly bezahltToggle = output<{ id: number; bezahlt: boolean }>();
  readonly loeschen = output<number>();
  readonly feldGeaendert = output<{ feld: keyof StundenFormularDaten; wert: string | number }>();
  readonly pdfGenerieren = output<void>();
  readonly stempelZuStundenKonvertieren = output<Stempel>();

  protected readonly zuschlagOptionen = ZUSCHLAG_OPTIONEN;
  protected readonly datumFormatieren = datumFormatieren;
  protected readonly waehrungFormatieren = waehrungFormatieren;

  protected readonly formModell = linkedSignal(() => this.formularDaten());

  protected readonly stundenForm = form(this.formModell, (schema) => {
    required(schema.datum, { message: 'Datum erforderlich' });
    min(schema.stunden, 0.5, { message: 'Mindestens 0.5 Stunden' });
  });

  protected bezahltGeaendert(id: number, event: Event): void {
    this.bezahltToggle.emit({ id, bezahlt: (event.target as HTMLInputElement).checked });
  }

  protected onFeld(feld: keyof StundenFormularDaten, event: Event): void {
    const el = event.target as HTMLInputElement | HTMLSelectElement;
    const wert = (feld === 'stunden' || feld === 'lohnSatz' || feld === 'zuschlagProzent')
      ? parseFloat(el.value) || 0
      : el.value;
    this.feldGeaendert.emit({ feld, wert });
  }

  protected zeitFormatieren(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}