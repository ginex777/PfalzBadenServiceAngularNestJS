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
  readonly data = input.required<HausmeisterFormularDaten>();
  readonly employees = input<Mitarbeiter[]>([]);
  readonly customers = input<Kunde[]>([]);
  readonly editedAssignment = input<HausmeisterEinsatz | null>(null);
  readonly totalHours = input<number>(0);

  readonly saveRequested = output<{ withPdf: boolean; syncStunden: boolean }>();
  readonly cancelRequested = output<void>();
  readonly selectEmployee = output<string>();
  readonly selectCustomer = output<string>();
  readonly addActivity = output<void>();
  readonly removeActivity = output<number>();
  readonly updateActivity = output<{ index: number; activity: Taetigkeit }>();
  readonly updateField = output<{ field: 'datum' | 'notiz'; value: string }>();

  protected readonly syncStunden = signal(false);
  protected readonly formModell = linkedSignal(() => this.data());

  protected readonly einsatzForm = form(this.formModell, (schema) => {
    required(schema.mitarbeiter_name, { message: 'Mitarbeiter erforderlich' });
    required(schema.datum, { message: 'Datum erforderlich' });
  });

  protected syncStundenGeaendert(event: Event): void {
    this.syncStunden.set((event.target as HTMLInputElement).checked);
  }

  protected mitarbeiterGeaendert(event: Event): void {
    this.selectEmployee.emit((event.target as HTMLSelectElement).value);
  }

  protected kundeGeaendert(event: Event): void {
    this.selectCustomer.emit((event.target as HTMLSelectElement).value);
  }

  protected notizGeaendert(event: Event): void {
    this.updateField.emit({
      field: 'notiz',
      value: (event.target as HTMLTextAreaElement).value,
    });
  }

  protected taetigkeitBeschreibungGeaendert(index: number, event: Event): void {
    const t = { ...this.data().taetigkeiten[index] };
    t.beschreibung = (event.target as HTMLInputElement).value;
    this.updateActivity.emit({ index, activity: t });
  }

  protected taetigkeitStundenGeaendert(index: number, event: Event): void {
    const t = { ...this.data().taetigkeiten[index] };
    t.stunden = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.updateActivity.emit({ index, activity: t });
  }
}
