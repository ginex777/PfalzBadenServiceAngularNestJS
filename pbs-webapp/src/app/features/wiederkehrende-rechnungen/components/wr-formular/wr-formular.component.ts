import type {
  OnChanges,
  SimpleChanges} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import type { SchemaPathTree} from '@angular/forms/signals';
import { FormField, applyEach, form, required } from '@angular/forms/signals';
import type { Kunde, RechnungPosition, WiederkehrendeRechnung } from '../../../../core/models';
import type {
  WrFormularDaten} from '../../wiederkehrende-rechnungen.models';
import {
  INTERVALL_OPTIONEN,
  LEERES_WR_FORMULAR
} from '../../wiederkehrende-rechnungen.models';
import { waehrungFormatieren } from '../../../../core/utils/format.utils';

function positionSchema(p: SchemaPathTree<RechnungPosition>): void {
  required(p.bez, { message: 'Bezeichnung erforderlich' });
}

@Component({
  selector: 'app-wr-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './wr-formular.component.html',
})
export class WrFormularComponent implements OnChanges {
  readonly editedInvoice = input<WiederkehrendeRechnung | null>(null);
  readonly customers = input.required<Kunde[]>();
  readonly saved = output<WrFormularDaten>();
  readonly cancelled = output<void>();

  protected readonly formModell = signal<WrFormularDaten>({ ...LEERES_WR_FORMULAR });

  protected readonly wrForm = form(this.formModell, (schema) => {
    required(schema.titel, { message: 'Titel erforderlich' });
    required(schema.intervall, { message: 'Intervall erforderlich' });
    applyEach(schema.positionen, positionSchema);
  });

  protected readonly brutto = computed(() =>
    this.formModell().positionen.reduce((s, p) => s + (p.gesamtpreis || 0), 0),
  );

  protected readonly istGueltig = computed(() => !!this.formModell().titel?.trim());

  protected readonly intervallOptionen = INTERVALL_OPTIONEN;

  protected kundenIdGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    const value = target.value;
    this.formModell.update((f) => ({ ...f, kunden_id: value ? parseInt(value) : null }));
  }

  protected intervallGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    this.formModell.update((f) => ({ ...f, intervall: target.value }));
  }

  protected aktivGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.formModell.update((f) => ({ ...f, aktiv: target.checked }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editedInvoice']) {
      const wr = this.editedInvoice();
      this.formModell.set(
        wr
          ? {
              kunden_id: wr.kunden_id ?? null,
              titel: wr.titel,
              intervall: wr.intervall,
              aktiv: wr.aktiv,
              positionen: wr.positionen?.length
                ? wr.positionen
                : [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
            }
          : { ...LEERES_WR_FORMULAR },
      );
    }
  }

  protected positionHinzufuegen(): void {
    this.formModell.update((d) => ({
      ...d,
      positionen: [...d.positionen, { bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
    }));
  }

  protected positionEntfernen(index: number): void {
    this.formModell.update((d) => ({
      ...d,
      positionen: d.positionen.filter((_, i) => i !== index),
    }));
  }

  protected positionBezGeaendert(index: number, event: Event): void {
    const pos = { ...this.formModell().positionen[index] };
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;

    pos.bez = target.value;
    this.formModell.update((d) => {
      const positionen = [...d.positionen];
      positionen[index] = pos;
      return { ...d, positionen };
    });
  }

  protected positionGesamtpreisGeaendert(index: number, event: Event): void {
    const pos = { ...this.formModell().positionen[index] };
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    pos.gesamtpreis = parseFloat(target.value) || 0;
    this.formModell.update((d) => {
      const positionen = [...d.positionen];
      positionen[index] = pos;
      return { ...d, positionen };
    });
  }

  protected fmt(n: number): string {
    return waehrungFormatieren(n);
  }

  protected speichern(): void {
    if (!this.istGueltig()) return;
    this.saved.emit({ ...this.formModell() });
  }

  protected abbrechen(): void {
    this.formModell.set({ ...LEERES_WR_FORMULAR });
    this.cancelled.emit();
  }
}
