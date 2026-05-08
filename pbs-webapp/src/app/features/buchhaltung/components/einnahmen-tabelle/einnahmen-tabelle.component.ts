import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { BuchhaltungZeile } from '../../buchhaltung.models';
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
  readonly rows = input.required<BuchhaltungZeile[]>();
  readonly isLocked = input<boolean>(false);

  readonly addRow = output<void>();
  readonly removeRow = output<string>();
  readonly copyRow = output<string>();
  readonly updateRow = output<{
    tempId: string;
    aenderungen: Partial<BuchhaltungZeile>;
  }>();
  readonly openReceipt = output<string>();

  protected readonly mwstOptionen = [0, 7, 19];
  protected suchbegriff = '';

  protected suchbegriffGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.suchbegriff = target.value;
  }

  protected gefilterterows(): BuchhaltungZeile[] {
    const q = this.suchbegriff.toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(
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
    return this.rows().reduce((s, z) => s + nettoBerechnen(z.brutto, z.mwst), 0);
  }

  protected gesamtUst(): number {
    return this.rows().reduce((s, z) => s + steuerBerechnen(z.brutto, z.mwst), 0);
  }

  protected gesamtBrutto(): number {
    return this.rows().reduce((s, z) => s + (z.brutto || 0), 0);
  }

  protected formatieren(wert: number): string {
    return waehrungFormatieren(wert);
  }

  protected feldAktualisieren(
    tempId: string,
    feld: keyof BuchhaltungZeile,
    wert: string | number,
  ): void {
    this.updateRow.emit({
      tempId,
      aenderungen: { [feld]: wert } as Partial<BuchhaltungZeile>,
    });
  }

  protected bruttoAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.updateRow.emit({ tempId, aenderungen: { brutto: Math.max(0, wert) } });
  }

  protected mwstAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLSelectElement).value);
    this.updateRow.emit({ tempId, aenderungen: { mwst: wert } });
  }

  protected textfeldAktualisieren(
    tempId: string,
    feld: keyof BuchhaltungZeile,
    event: Event,
  ): void {
    const wert = (event.target as HTMLInputElement).value;
    this.updateRow.emit({
      tempId,
      aenderungen: { [feld]: wert } as Partial<BuchhaltungZeile>,
    });
  }

  protected hinzufuegenKlicken(): void {
    this.addRow.emit();
  }

  protected entfernenKlicken(tempId: string): void {
    this.removeRow.emit(tempId);
  }

  protected kopierenKlicken(tempId: string): void {
    this.copyRow.emit(tempId);
  }

  protected belegKlicken(tempId: string): void {
    this.openReceipt.emit(tempId);
  }
}
