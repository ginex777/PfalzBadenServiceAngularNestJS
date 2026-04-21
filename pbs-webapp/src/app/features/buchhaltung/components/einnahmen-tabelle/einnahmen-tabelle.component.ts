import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BuchhaltungZeile } from '../../buchhaltung.models';
import {
  waehrungFormatieren,
  nettoBerechnen,
  steuerBerechnen,
} from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-einnahmen-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './einnahmen-tabelle.component.html',
  styleUrl: './einnahmen-tabelle.component.scss',
})
export class EinnahmenTabelleComponent {
  readonly zeilen = input.required<BuchhaltungZeile[]>();
  readonly istGesperrt = input<boolean>(false);

  readonly zeileHinzufuegen = output<void>();
  readonly zeileEntfernen = output<string>();
  readonly zeileKopieren = output<string>();
  readonly zeileAktualisieren = output<{
    tempId: string;
    aenderungen: Partial<BuchhaltungZeile>;
  }>();
  readonly belegOeffnen = output<string>();

  protected readonly mwstOptionen = [0, 7, 19];
  protected suchbegriff = '';

  protected gefilterteZeilen(): BuchhaltungZeile[] {
    const q = this.suchbegriff.toLowerCase();
    if (!q) return this.zeilen();
    return this.zeilen().filter(
      (z) =>
        (z.name ?? '').toLowerCase().includes(q) ||
        (z.renr ?? '').toLowerCase().includes(q) ||
        (z.datum ?? '').includes(q),
    );
  }

  protected nettoBerechnen(brutto: number, mwst: number): string {
    return waehrungFormatieren(nettoBerechnen(brutto, mwst));
  }

  protected ustBerechnen(brutto: number, mwst: number): string {
    return waehrungFormatieren(steuerBerechnen(brutto, mwst));
  }

  protected gesamtEinnahmenNetto(): number {
    return this.zeilen().reduce((s, z) => s + nettoBerechnen(z.brutto, z.mwst), 0);
  }

  protected gesamtUst(): number {
    return this.zeilen().reduce((s, z) => s + steuerBerechnen(z.brutto, z.mwst), 0);
  }

  protected gesamtBrutto(): number {
    return this.zeilen().reduce((s, z) => s + (z.brutto || 0), 0);
  }

  protected formatieren(wert: number): string {
    return waehrungFormatieren(wert);
  }

  protected feldAktualisieren(
    tempId: string,
    feld: keyof BuchhaltungZeile,
    wert: string | number,
  ): void {
    this.zeileAktualisieren.emit({
      tempId,
      aenderungen: { [feld]: wert } as Partial<BuchhaltungZeile>,
    });
  }

  protected bruttoAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.zeileAktualisieren.emit({ tempId, aenderungen: { brutto: Math.max(0, wert) } });
  }

  protected mwstAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLSelectElement).value);
    this.zeileAktualisieren.emit({ tempId, aenderungen: { mwst: wert } });
  }

  protected textfeldAktualisieren(
    tempId: string,
    feld: keyof BuchhaltungZeile,
    event: Event,
  ): void {
    const wert = (event.target as HTMLInputElement).value;
    this.zeileAktualisieren.emit({
      tempId,
      aenderungen: { [feld]: wert } as Partial<BuchhaltungZeile>,
    });
  }

  protected hinzufuegenKlicken(): void {
    this.zeileHinzufuegen.emit();
  }

  protected entfernenKlicken(tempId: string): void {
    this.zeileEntfernen.emit(tempId);
  }

  protected kopierenKlicken(tempId: string): void {
    this.zeileKopieren.emit(tempId);
  }

  protected belegKlicken(tempId: string): void {
    this.belegOeffnen.emit(tempId);
  }
}
