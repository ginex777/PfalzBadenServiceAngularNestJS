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
  readonly formularDaten = input.required<RechnungFormularDaten>();
  readonly kunden = input<Kunde[]>([]);
  readonly bearbeiteteRechnung = input<Rechnung | null>(null);
  readonly speichert = input<boolean>(false);
  readonly netto = input<number>(0);
  readonly brutto = input<number>(0);
  readonly mwstBetrag = input<number>(0);

  readonly speichern = output<void>();
  readonly abbrechen = output<void>();
  readonly positionHinzufuegen = output<void>();
  readonly positionEntfernen = output<number>();
  readonly positionKopieren = output<number>();
  readonly positionAktualisieren = output<{ index: number; position: RechnungPosition }>();
  readonly feldAktualisieren = output<{ feld: keyof RechnungFormularDaten; wert: unknown }>();
  readonly kundeAuswaehlen = output<number>();
  readonly vorschau = output<void>();
  readonly wiederkehrendSpeichern = output<{ intervall: string }>();

  protected readonly formModell = linkedSignal(() => this.formularDaten());
  protected readonly wiederkehrendAktiv = signal(false);
  protected readonly wiederkehrendIntervall = signal('monatlich');
  protected readonly eingabeModus = signal<'netto' | 'brutto'>('netto');
  protected readonly beruehrt = signal<Record<string, boolean>>({});

  protected readonly rechnungForm = form(this.formModell, (schema) => {
    required(schema.empf, { message: 'Empfänger erforderlich' });
    required(schema.nr, { message: 'Rechnungs-Nr. erforderlich' });
    applyEach(schema.positionen, positionSchema);
  });

  protected readonly istFormularGueltig = computed(() => {
    const daten = this.formularDaten();
    return !!(
      daten.empf?.trim() &&
      daten.nr?.trim() &&
      daten.positionen.every((p) => p.bez?.trim() && p.gesamtpreis > 0)
    );
  });

  readonly istGesperrt = computed(() => {
    const rechnung = this.bearbeiteteRechnung();
    return rechnung?.bezahlt === true;
  });

  protected readonly waehrungFormatieren = waehrungFormatieren;

  protected beruehren(feld: string): void {
    this.beruehrt.update((b) => ({ ...b, [feld]: true }));
  }

  protected onFeldChange(feld: keyof RechnungFormularDaten, event: Event): void {
    const wert = (event.target as HTMLInputElement).value;
    this.feldAktualisieren.emit({ feld, wert });
  }

  protected onSelectChange(feld: keyof RechnungFormularDaten, event: Event): void {
    const wert = (event.target as HTMLSelectElement).value;
    this.feldAktualisieren.emit({
      feld,
      wert: feld === 'zahlungsziel' || feld === 'mwst_satz' ? Number(wert) : wert,
    });
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
    const eingabe = parseFloat((event.target as HTMLInputElement).value) || 0;
    if (this.eingabeModus() === 'brutto') {
      const mwst = this.formularDaten().mwst_satz ?? 19;
      pos.gesamtpreis = Math.round((eingabe / (1 + mwst / 100)) * 100) / 100;
    } else {
      pos.gesamtpreis = eingabe;
    }
    this.positionAktualisieren.emit({ index, position: pos });
  }

  protected gesamtpreisAnzeige(gesamtpreis: number): number {
    if (this.eingabeModus() === 'brutto') {
      const mwst = this.formularDaten().mwst_satz ?? 19;
      return Math.round(gesamtpreis * (1 + mwst / 100) * 100) / 100;
    }
    return gesamtpreis;
  }

  // Auto-calc: stunden * einzelpreis → gesamtpreis
  protected autoCalc(index: number): void {
    const pos = { ...this.formularDaten().positionen[index] };
    const stunden = parseFloat(String(pos.stunden));
    if (!isNaN(stunden) && stunden > 0 && pos.einzelpreis && pos.einzelpreis > 0) {
      pos.gesamtpreis = Math.round(stunden * pos.einzelpreis * 100) / 100;
      this.positionAktualisieren.emit({ index, position: pos });
    }
  }

  protected wiederkehrendGeaendert(event: Event): void {
    this.wiederkehrendAktiv.set((event.target as HTMLInputElement).checked);
    if ((event.target as HTMLInputElement).checked) {
      this.wiederkehrendSpeichern.emit({ intervall: this.wiederkehrendIntervall() });
    }
  }

  protected intervallGeaendert(event: Event): void {
    this.wiederkehrendIntervall.set((event.target as HTMLSelectElement).value);
  }
}
