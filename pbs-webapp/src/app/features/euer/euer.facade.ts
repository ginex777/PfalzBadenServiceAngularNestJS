import { Injectable, inject, signal, computed } from '@angular/core';
import { EuerService } from './euer.service';
import type { BuchhaltungJahr, FirmaSettings } from '../../core/models';
import type { EuerErgebnis} from './euer.models';
import { EUER_AUSGABEN_ZEILEN } from './euer.models';
import { BrowserService } from '../../core/services/browser.service';
import { ToastService } from '../../core/services/toast.service';

@Injectable({ providedIn: 'root' })
export class EuerFacade {
  private readonly service = inject(EuerService);
  private readonly browser = inject(BrowserService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly aktuellesJahr = signal(new Date().getFullYear());
  readonly buchhaltungDaten = signal<BuchhaltungJahr>({});
  readonly firma = signal<FirmaSettings>({});

  readonly verfuegbareJahre = computed(() => {
    const j = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => j - 3 + i);
  });

  readonly ergebnis = computed<EuerErgebnis>(() => {
    const daten = this.buchhaltungDaten();
    const alleZeilen: Array<{
      typ: string;
      brutto: number;
      mwst: number;
      abzug: number;
      kategorie?: string;
    }> = [];
    Object.values(daten).forEach((monat) => {
      (monat.inc || []).forEach((r) =>
        alleZeilen.push({
          typ: 'inc',
          brutto: r.brutto,
          mwst: r.mwst ?? 19,
          abzug: r.abzug ?? 100,
          kategorie: r.kategorie,
        }),
      );
      (monat.exp || []).forEach((r) =>
        alleZeilen.push({
          typ: 'exp',
          brutto: r.brutto,
          mwst: r.mwst ?? 19,
          abzug: r.abzug ?? 100,
          kategorie: r.kategorie,
        }),
      );
    });

    let inc0 = 0,
      inc7 = 0,
      inc19 = 0,
      ust7 = 0,
      ust19 = 0,
      vstGesamt = 0;
    const ausgabenByZeile: Record<string, number> = {};
    EUER_AUSGABEN_ZEILEN.forEach((z) => {
      ausgabenByZeile[z.zeile] = 0;
    });

    alleZeilen
      .filter((r) => r.typ === 'inc')
      .forEach((r) => {
        const netto = r.brutto / (1 + r.mwst / 100);
        const ust = r.brutto - netto;
        if (r.mwst === 0) inc0 += netto;
        else if (r.mwst === 7) {
          inc7 += netto;
          ust7 += ust;
        } else {
          inc19 += netto;
          ust19 += ust;
        }
      });

    alleZeilen
      .filter((r) => r.typ === 'exp')
      .forEach((r) => {
        const netto = r.brutto / (1 + r.mwst / 100);
        const ust = r.brutto - netto;
        const abzug = (r.abzug ?? 100) / 100;
        vstGesamt += ust * abzug;
        const z = this.zeileZuordnen(r.kategorie);
        const faktor = z.abzugFaktor !== undefined ? z.abzugFaktor : 1;
        ausgabenByZeile[z.zeile] = (ausgabenByZeile[z.zeile] || 0) + netto * abzug * faktor;
      });

    const sumInc = inc0 + inc7 + inc19;
    const sumExp = Object.values(ausgabenByZeile).reduce((a, b) => a + b, 0);
    const zahllast = ust7 + ust19 - vstGesamt;

    return {
      einnahmen: { inc0, inc7, inc19, summe: sumInc },
      ausgaben: {
        zeilen: EUER_AUSGABEN_ZEILEN.map((z) => ({
          zeile: z.zeile,
          label: z.label,
          betrag: ausgabenByZeile[z.zeile] || 0,
        })),
        summe: sumExp,
      },
      gewinn: sumInc - sumExp,
      ust: { ust7, ust19, vstGesamt, zahllast },
    };
  });

  private zeileZuordnen(kategorie?: string): (typeof EUER_AUSGABEN_ZEILEN)[0] {
    const k = (kategorie || '').toLowerCase();
    for (const z of EUER_AUSGABEN_ZEILEN) {
      if (z.keys.length > 0 && z.keys.some((key) => k.includes(key))) return z;
    }
    return EUER_AUSGABEN_ZEILEN[EUER_AUSGABEN_ZEILEN.length - 1];
  }

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.loadAccounting(this.aktuellesJahr()).subscribe({
      next: (daten) => {
        this.buchhaltungDaten.set(daten);
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Daten konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
    this.service.firmaLaden().subscribe({ next: (f) => this.firma.set(f), error: () => {} });
  }

  jahrWechseln(jahr: number): void {
    this.aktuellesJahr.set(jahr);
    this.ladeDaten();
  }

  pdfExportieren(): void {
    const e = this.ergebnis();
    this.service.pdfErstellen(this.aktuellesJahr(), e).subscribe({
      next: (r) => {
        if (r.url) this.browser.blobOeffnen(r.url);
      },
      error: () => this.toast.error('PDF konnte nicht erstellt werden.'),
    });
  }
}
