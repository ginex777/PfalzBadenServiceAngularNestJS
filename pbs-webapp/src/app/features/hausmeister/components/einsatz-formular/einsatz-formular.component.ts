import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  linkedSignal,
} from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import type { HausmeisterEinsatz, Mitarbeiter, Kunde, Taetigkeit } from '../../../../core/models';
import type { HausmeisterFormularDaten } from '../../hausmeister.models';

@Component({
  selector: 'app-einsatz-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './einsatz-formular.component.html',
  styleUrl: './einsatz-formular.component.scss',
})
export class EinsatzFormularComponent {
  readonly daten = input.required<HausmeisterFormularDaten>();
  readonly mitarbeiter = input<Mitarbeiter[]>([]);
  readonly kunden = input<Kunde[]>([]);
  readonly bearbeiteterEinsatz = input<HausmeisterEinsatz | null>(null);
  readonly stundenGesamt = input<number>(0);

  readonly speichern = output<{ withPdf: boolean; syncStunden: boolean }>();
  readonly abbrechen = output<void>();
  readonly mitarbeiterAuswaehlen = output<string>();
  readonly kundeAuswaehlen = output<string>();
  readonly taetigkeitHinzufuegen = output<void>();
  readonly taetigkeitEntfernen = output<number>();
  readonly taetigkeitAktualisieren = output<{ index: number; taetigkeit: Taetigkeit }>();
  readonly feldAktualisieren = output<{ feld: 'datum' | 'notiz'; wert: string }>();

  protected readonly syncStunden = signal(false);
  protected readonly formModell = linkedSignal(() => this.daten());

  protected readonly einsatzForm = form(this.formModell, (schema) => {
    required(schema.mitarbeiter_name, { message: 'Mitarbeiter erforderlich' });
    required(schema.datum, { message: 'Datum erforderlich' });
  });

  protected syncStundenGeaendert(event: Event): void {
    this.syncStunden.set((event.target as HTMLInputElement).checked);
  }

  protected mitarbeiterGeaendert(event: Event): void {
    this.mitarbeiterAuswaehlen.emit((event.target as HTMLSelectElement).value);
  }

  protected kundeGeaendert(event: Event): void {
    this.kundeAuswaehlen.emit((event.target as HTMLSelectElement).value);
  }

  protected notizGeaendert(event: Event): void {
    this.feldAktualisieren.emit({
      feld: 'notiz',
      wert: (event.target as HTMLTextAreaElement).value,
    });
  }

  protected taetigkeitBeschreibungGeaendert(index: number, event: Event): void {
    const t = { ...this.daten().taetigkeiten[index] };
    t.beschreibung = (event.target as HTMLInputElement).value;
    this.taetigkeitAktualisieren.emit({ index, taetigkeit: t });
  }

  protected taetigkeitStundenGeaendert(index: number, event: Event): void {
    const t = { ...this.daten().taetigkeiten[index] };
    t.stunden = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.taetigkeitAktualisieren.emit({ index, taetigkeit: t });
  }
}
