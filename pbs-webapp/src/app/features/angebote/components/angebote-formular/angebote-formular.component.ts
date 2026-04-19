import { ChangeDetectionStrategy, Component, input, output, linkedSignal, computed, signal } from '@angular/core';
import { form, required, applyEach, SchemaPathTree } from '@angular/forms/signals';
import { Angebot, Kunde, RechnungPosition } from '../../../../core/models';
import { AngebotFormularDaten } from '../../angebote.models';
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
  readonly formularDaten = input.required<AngebotFormularDaten>();
  readonly kunden = input<Kunde[]>([]);
  readonly bearbeitetesAngebot = input<Angebot | null>(null);
  readonly speichert = input<boolean>(false);
  readonly netto = input<number>(0);
  readonly brutto = input<number>(0);
  readonly mwstBetrag = input<number>(0);

  readonly speichern = output<void>();
  readonly vorschau = output<void>();
  readonly abbrechen = output<void>();
  readonly positionHinzufuegen = output<void>();
  readonly positionEntfernen = output<number>();
  readonly positionKopieren = output<number>();
  readonly positionAktualisieren = output<{ index: number; position: RechnungPosition }>();
  readonly feldAktualisieren = output<{ feld: keyof AngebotFormularDaten; wert: unknown }>();
  readonly kundeAuswaehlen = output<number>();
  readonly alsKundeSpeichern = output<void>();

  protected readonly formModell = linkedSignal(() => this.formularDaten());
  protected readonly beruehrt = signal<Record<string, boolean>>({});

  protected readonly angebotForm = form(this.formModell, (schema) => {
    required(schema.empf, { message: 'Empfänger erforderlich' });
    required(schema.nr, { message: 'Angebots-Nr. erforderlich' });
    applyEach(schema.positionen, positionSchema);
  });

  protected readonly istFormularGueltig = computed(() => {
    const daten = this.formularDaten();
    return !!(daten.empf?.trim() && daten.nr?.trim() && 
             daten.positionen.every(p => p.bez?.trim() && p.gesamtpreis > 0));
  });

  protected readonly waehrungFormatieren = waehrungFormatieren;

  protected beruehren(feld: string): void {
    this.beruehrt.update(b => ({ ...b, [feld]: true }));
  }

  protected onFeldChange(feld: keyof AngebotFormularDaten, event: Event): void {
    const wert = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.feldAktualisieren.emit({ feld, wert });
  }

  protected onKundeChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (id) this.kundeAuswaehlen.emit(id);
  }

  protected onPositionBezChange(index: number, event: Event): void {
    const pos = { ...this.formularDaten().positionen[index] };
    pos.bez = (event.target as HTMLTextAreaElement).value;
    this.positionAktualisieren.emit({ index, position: pos });
  }

  protected onPositionStundenChange(index: number, event: Event): void {
    const pos = { ...this.formularDaten().positionen[index] };
    pos.stunden = (event.target as HTMLInputElement).value;
    this.positionAktualisieren.emit({ index, position: pos });
  }

  protected onPositionEinzelpreisChange(index: number, event: Event): void {
    const pos = { ...this.formularDaten().positionen[index] };
    const val = parseFloat((event.target as HTMLInputElement).value);
    pos.einzelpreis = isNaN(val) ? undefined : val;
    this.positionAktualisieren.emit({ index, position: pos });
  }

  protected onPositionGesamtpreisChange(index: number, event: Event): void {
    const pos = { ...this.formularDaten().positionen[index] };
    pos.gesamtpreis = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.positionAktualisieren.emit({ index, position: pos });
  }

  protected autoCalc(index: number): void {
    const pos = { ...this.formularDaten().positionen[index] };
    const stunden = parseFloat(String(pos.stunden));
    if (!isNaN(stunden) && stunden > 0 && pos.einzelpreis && pos.einzelpreis > 0) {
      pos.gesamtpreis = Math.round(stunden * pos.einzelpreis * 100) / 100;
      this.positionAktualisieren.emit({ index, position: pos });
    }
  }
}
