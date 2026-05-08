import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { BuchhaltungZeile } from '../../buchhaltung.models';
import {
  waehrungFormatieren,
  nettoBerechnen,
  steuerBerechnen,
  KATEGORIEN,
} from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-ausgaben-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ausgaben-tabelle.component.html',
  styleUrl: './ausgaben-tabelle.component.scss',
})
export class AusgabenTabelleComponent {
  readonly rows = input.required<BuchhaltungZeile[]>();
  readonly isLocked = input<boolean>(false);

  readonly addRow = output<void>();
  readonly removeRow = output<string>();
  readonly copyRow = output<string>();
  readonly updateRow = output<{
    tempId: string;
    aenderungen: Partial<BuchhaltungZeile>;
  }>();
  readonly updateCategory = output<{ tempId: string; category: string }>();
  readonly applyRecurringCosts = output<void>();
  readonly openReceipt = output<string>();

  protected readonly mwstOptionen = [0, 7, 19];
  protected readonly kategorienListe = Object.keys(KATEGORIEN);
  protected suchbegriff = '';
  protected kategorieFilter = '';

  protected suchbegriffGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.suchbegriff = target.value;
  }

  protected verwendeteKategorien(): string[] {
    const alle = this.rows()
      .map((z) => z.kategorie ?? '')
      .filter(Boolean);
    return [...new Set(alle)].sort();
  }

  protected gefilterterows(): BuchhaltungZeile[] {
    const q = this.suchbegriff.toLowerCase();
    const kf = this.kategorieFilter;
    return this.rows().filter((z) => {
      if (kf && z.kategorie !== kf) return false;
      if (!q) return true;
      return (
        (z.name ?? '').toLowerCase().includes(q) ||
        (z.kategorie ?? '').toLowerCase().includes(q) ||
        (z.belegnr ?? '').toLowerCase().includes(q) ||
        (z.datum ?? '').includes(q)
      );
    });
  }

  protected kategorieChipKlicken(kat: string): void {
    this.kategorieFilter = this.kategorieFilter === kat ? '' : kat;
  }

  protected kategorieAnzahl(kat: string): number {
    return this.rows().filter((z) => z.kategorie === kat).length;
  }

  protected nettoBerechnen(brutto: number, mwst: number, abzug: number): string {
    const netto = nettoBerechnen(brutto, mwst);
    return waehrungFormatieren(netto * (abzug / 100));
  }

  protected vorsteuerBerechnen(brutto: number, mwst: number, abzug: number): string {
    const ust = steuerBerechnen(brutto, mwst);
    return waehrungFormatieren(ust * (abzug / 100));
  }

  protected gesamtAusgabenNetto(): number {
    return this.rows().reduce((s, z) => {
      const netto = nettoBerechnen(z.brutto, z.mwst);
      return s + netto * ((z.abzug ?? 100) / 100);
    }, 0);
  }

  protected gesamtVorsteuer(): number {
    return this.rows().reduce((s, z) => {
      const ust = steuerBerechnen(z.brutto, z.mwst);
      return s + ust * ((z.abzug ?? 100) / 100);
    }, 0);
  }

  protected gesamtBrutto(): number {
    return this.rows().reduce((s, z) => s + (z.brutto || 0), 0);
  }

  protected formatieren(wert: number): string {
    return waehrungFormatieren(wert);
  }

  protected kategorieFehlend(zeile: BuchhaltungZeile): boolean {
    return !zeile.kategorie || zeile.kategorie === '';
  }

  protected kategorieGeaendert(tempId: string, event: Event): void {
    const wert = (event.target as HTMLSelectElement).value;
    this.updateCategory.emit({ tempId, category: wert });
  }

  protected bruttoAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.updateRow.emit({ tempId, aenderungen: { brutto: Math.max(0, wert) } });
  }

  protected mwstAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLSelectElement).value);
    this.updateRow.emit({ tempId, aenderungen: { mwst: wert } });
  }

  protected abzugAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.updateRow.emit({
      tempId,
      aenderungen: { abzug: Math.min(100, Math.max(0, wert)) },
    });
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

  protected wiederkehrendeKlicken(): void {
    this.applyRecurringCosts.emit();
  }
}
