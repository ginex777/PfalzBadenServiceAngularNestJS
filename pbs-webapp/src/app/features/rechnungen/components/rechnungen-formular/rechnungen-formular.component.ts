import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  linkedSignal,
  signal,
  computed,
} from '@angular/core';
import type { SchemaPathTree } from '@angular/forms/signals';
import { form, required, applyEach } from '@angular/forms/signals';
import type { Rechnung, Kunde, RechnungPosition } from '../../../../core/models';
import type { RechnungFormularDaten } from '../../rechnungen.models';
import { waehrungFormatieren } from '../../../../core/utils/format.utils';

function positionSchema(p: SchemaPathTree<RechnungPosition>): void {
  required(p.bez, { message: 'Bezeichnung erforderlich' });
}

@Component({
  selector: 'app-rechnungen-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './rechnungen-formular.component.html',
  styleUrl: './rechnungen-formular.component.scss',
})
export class RechnungenFormularComponent {
  readonly formData = input.required<RechnungFormularDaten>();
  readonly customers = input<Kunde[]>([]);
  readonly editedInvoice = input<Rechnung | null>(null);
  readonly saving = input<boolean>(false);
  readonly netTotal = input<number>(0);
  readonly grossTotal = input<number>(0);
  readonly vatAmount = input<number>(0);

  readonly saveRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly addLineItem = output<void>();
  readonly removeLineItem = output<number>();
  readonly copyLineItem = output<number>();
  readonly updateLineItem = output<{ index: number; position: RechnungPosition }>();
  readonly updateField = output<{ field: keyof RechnungFormularDaten; value: unknown }>();
  readonly selectCustomer = output<number>();
  readonly preview = output<void>();
  readonly saveRecurring = output<{ interval: string }>();

  protected readonly formModel = linkedSignal(() => this.formData());
  protected readonly wiederkehrendAktiv = signal(false);
  protected readonly wiederkehrendIntervall = signal('monatlich');
  protected readonly eingabeModus = signal<'netto' | 'brutto'>('netto');
  protected readonly touched = signal<Record<string, boolean>>({});

  protected readonly invoiceForm = form(this.formModel, (schema) => {
    required(schema.empf, { message: 'Empfänger erforderlich' });
    required(schema.nr, { message: 'Rechnungs-Nr. erforderlich' });
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

  readonly istGesperrt = computed(() => {
    const rechnung = this.editedInvoice();
    return rechnung?.bezahlt === true;
  });

  protected readonly waehrungFormatieren = waehrungFormatieren;

  protected beruehren(feld: string): void {
    this.touched.update((b) => ({ ...b, [feld]: true }));
  }

  protected onFeldChange(feld: keyof RechnungFormularDaten, event: Event): void {
    const wert = (event.target as HTMLInputElement).value;
    this.updateField.emit({ field: feld, value: wert });
  }

  protected onSelectChange(feld: keyof RechnungFormularDaten, event: Event): void {
    const wert = (event.target as HTMLSelectElement).value;
    this.updateField.emit({
      field: feld,
      value: feld === 'zahlungsziel' || feld === 'mwst_satz' ? Number(wert) : wert,
    });
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
    const eingabe = parseFloat((event.target as HTMLInputElement).value) || 0;
    if (this.eingabeModus() === 'brutto') {
      const mwst = this.formData().mwst_satz ?? 19;
      pos.gesamtpreis = Math.round((eingabe / (1 + mwst / 100)) * 100) / 100;
    } else {
      pos.gesamtpreis = eingabe;
    }
    this.updateLineItem.emit({ index, position: pos });
  }

  protected gesamtpreisAnzeige(gesamtpreis: number): number {
    if (this.eingabeModus() === 'brutto') {
      const mwst = this.formData().mwst_satz ?? 19;
      return Math.round(gesamtpreis * (1 + mwst / 100) * 100) / 100;
    }
    return gesamtpreis;
  }

  // Auto-calc: stunden * einzelpreis → gesamtpreis
  protected autoCalc(index: number): void {
    const pos = { ...this.formData().positionen[index] };
    const stunden = parseFloat(String(pos.stunden));
    if (!isNaN(stunden) && stunden > 0 && pos.einzelpreis && pos.einzelpreis > 0) {
      pos.gesamtpreis = Math.round(stunden * pos.einzelpreis * 100) / 100;
      this.updateLineItem.emit({ index, position: pos });
    }
  }

  protected wiederkehrendGeaendert(event: Event): void {
    this.wiederkehrendAktiv.set((event.target as HTMLInputElement).checked);
    if ((event.target as HTMLInputElement).checked) {
      this.saveRecurring.emit({ interval: this.wiederkehrendIntervall() });
    }
  }

  protected intervallGeaendert(event: Event): void {
    this.wiederkehrendIntervall.set((event.target as HTMLSelectElement).value);
  }
}
