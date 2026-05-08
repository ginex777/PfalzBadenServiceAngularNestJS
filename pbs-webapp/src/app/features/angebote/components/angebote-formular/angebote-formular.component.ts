import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  linkedSignal,
  computed,
  signal,
} from '@angular/core';
import type { SchemaPathTree } from '@angular/forms/signals';
import { form, required, applyEach } from '@angular/forms/signals';
import type { Angebot, Kunde, RechnungPosition } from '../../../../core/models';
import type { AngebotFormularDaten } from '../../angebote.models';
import { waehrungFormatieren } from '../../../../core/utils/format.utils';

function positionSchema(p: SchemaPathTree<RechnungPosition>): void {
  required(p.bez, { message: 'Bezeichnung erforderlich' });
}

@Component({
  selector: 'app-angebote-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './angebote-formular.component.html',
  styleUrl: './angebote-formular.component.scss',
})
export class AngeboteFormularComponent {
  readonly formData = input.required<AngebotFormularDaten>();
  readonly customers = input<Kunde[]>([]);
  readonly editedQuote = input<Angebot | null>(null);
  readonly saving = input<boolean>(false);
  readonly netTotal = input<number>(0);
  readonly grossTotal = input<number>(0);
  readonly vatAmount = input<number>(0);

  readonly saveRequested = output<void>();
  readonly preview = output<void>();
  readonly cancelRequested = output<void>();
  readonly addLineItem = output<void>();
  readonly removeLineItem = output<number>();
  readonly copyLineItem = output<number>();
  readonly updateLineItem = output<{ index: number; position: RechnungPosition }>();
  readonly updateField = output<{ field: keyof AngebotFormularDaten; value: unknown }>();
  readonly selectCustomer = output<number>();
  readonly saveAsCustomer = output<void>();

  protected readonly formModel = linkedSignal(() => this.formData());
  protected readonly touched = signal<Record<string, boolean>>({});

  protected readonly quoteForm = form(this.formModel, (schema) => {
    required(schema.empf, { message: 'Empfänger erforderlich' });
    required(schema.nr, { message: 'Angebots-Nr. erforderlich' });
    applyEach(schema.positionen, positionSchema);
  });

  protected readonly istFormularGueltig = computed(() => {
    const daten = this.formData();
    return !!(
      daten.empf?.trim() &&
      daten.nr?.trim() &&
      daten.positionen.every((p) => p.bez?.trim() && p.gesamtpreis > 0)
    );
  });

  protected readonly waehrungFormatieren = waehrungFormatieren;

  protected beruehren(feld: string): void {
    this.touched.update((b) => ({ ...b, [feld]: true }));
  }

  protected onFeldChange(feld: keyof AngebotFormularDaten, event: Event): void {
    const wert = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.updateField.emit({ field: feld, value: wert });
  }

  protected onKundeChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (id) this.selectCustomer.emit(id);
  }

  protected onPositionBezChange(index: number, event: Event): void {
    const pos = { ...this.formData().positionen[index] };
    pos.bez = (event.target as HTMLTextAreaElement).value;
    this.updateLineItem.emit({ index, position: pos });
  }

  protected onPositionStundenChange(index: number, event: Event): void {
    const pos = { ...this.formData().positionen[index] };
    pos.stunden = (event.target as HTMLInputElement).value;
    this.updateLineItem.emit({ index, position: pos });
  }

  protected onPositionEinzelpreisChange(index: number, event: Event): void {
    const pos = { ...this.formData().positionen[index] };
    const val = parseFloat((event.target as HTMLInputElement).value);
    pos.einzelpreis = isNaN(val) ? undefined : val;
    this.updateLineItem.emit({ index, position: pos });
  }

  protected onPositionGesamtpreisChange(index: number, event: Event): void {
    const pos = { ...this.formData().positionen[index] };
    pos.gesamtpreis = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.updateLineItem.emit({ index, position: pos });
  }

  protected autoCalc(index: number): void {
    const pos = { ...this.formData().positionen[index] };
    const stunden = parseFloat(String(pos.stunden));
    if (!isNaN(stunden) && stunden > 0 && pos.einzelpreis && pos.einzelpreis > 0) {
      pos.gesamtpreis = Math.round(stunden * pos.einzelpreis * 100) / 100;
      this.updateLineItem.emit({ index, position: pos });
    }
  }
}
