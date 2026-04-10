import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BuchhaltungZeile } from '../../buchhaltung.models';
import { waehrungFormatieren, nettoBerechnen, steuerBerechnen, KATEGORIEN } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-ausgaben-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ausgaben-tabelle.component.html',
  styleUrl: './ausgaben-tabelle.component.scss',
})
export class AusgabenTabelleComponent {
  readonly zeilen = input.required<BuchhaltungZeile[]>();
  readonly istGesperrt = input<boolean>(false);

  readonly zeileHinzufuegen = output<void>();
  readonly zeileEntfernen = output<string>();
  readonly zeileKopieren = output<string>();
  readonly zeileAktualisieren = output<{ tempId: string; aenderungen: Partial<BuchhaltungZeile> }>();
  readonly kategorieAktualisieren = output<{ tempId: string; kategorie: string }>();
  readonly wiederkehrendeKostenAnwenden = output<void>();
  readonly belegOeffnen = output<string>();

  protected readonly mwstOptionen = [0, 7, 19];
  protected readonly kategorienListe = Object.keys(KATEGORIEN);
  protected suchbegriff = '';

  protected gefilterteZeilen(): BuchhaltungZeile[] {
    const q = this.suchbegriff.toLowerCase();
    if (!q) return this.zeilen();
    return this.zeilen().filter(z =>
      (z.name ?? '').toLowerCase().includes(q) ||
      (z.kategorie ?? '').toLowerCase().includes(q) ||
      (z.belegnr ?? '').toLowerCase().includes(q) ||
      (z.datum ?? '').includes(q)
    );
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
    return this.zeilen().reduce((s, z) => {
      const netto = nettoBerechnen(z.brutto, z.mwst);
      return s + netto * ((z.abzug ?? 100) / 100);
    }, 0);
  }

  protected gesamtVorsteuer(): number {
    return this.zeilen().reduce((s, z) => {
      const ust = steuerBerechnen(z.brutto, z.mwst);
      return s + ust * ((z.abzug ?? 100) / 100);
    }, 0);
  }

  protected gesamtBrutto(): number {
    return this.zeilen().reduce((s, z) => s + (z.brutto || 0), 0);
  }

  protected formatieren(wert: number): string {
    return waehrungFormatieren(wert);
  }

  protected kategorieFehlend(zeile: BuchhaltungZeile): boolean {
    return !zeile.kategorie || zeile.kategorie === '';
  }

  protected kategorieGeaendert(tempId: string, event: Event): void {
    const wert = (event.target as HTMLSelectElement).value;
    this.kategorieAktualisieren.emit({ tempId, kategorie: wert });
  }

  protected bruttoAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.zeileAktualisieren.emit({ tempId, aenderungen: { brutto: Math.max(0, wert) } });
  }

  protected mwstAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLSelectElement).value);
    this.zeileAktualisieren.emit({ tempId, aenderungen: { mwst: wert } });
  }

  protected abzugAktualisieren(tempId: string, event: Event): void {
    const wert = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.zeileAktualisieren.emit({ tempId, aenderungen: { abzug: Math.min(100, Math.max(0, wert)) } });
  }

  protected textfeldAktualisieren(tempId: string, feld: keyof BuchhaltungZeile, event: Event): void {
    const wert = (event.target as HTMLInputElement).value;
    this.zeileAktualisieren.emit({ tempId, aenderungen: { [feld]: wert } as Partial<BuchhaltungZeile> });
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

  protected wiederkehrendeKlicken(): void {
    this.wiederkehrendeKostenAnwenden.emit();
  }
}
