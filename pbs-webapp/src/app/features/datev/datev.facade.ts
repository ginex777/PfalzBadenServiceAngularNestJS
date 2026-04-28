import { Injectable, inject, signal, computed } from '@angular/core';
import { DatevService } from './datev.service';
import { BrowserService } from '../../core/services/browser.service';
import { ToastService } from '../../core/services/toast.service';
import { FirmaSettings } from '../../core/models';
import {
  DatevZeitraumTyp,
  DatevVorschauZeile,
  DatevValidierungsMeldung,
  QUARTAL_MONATE,
  QUARTAL_LABELS,
} from './datev.models';
import { MONATE } from '../../core/utils/format.utils';

@Injectable({ providedIn: 'root' })
export class DatevFacade {
  private readonly service = inject(DatevService);
  private readonly browser = inject(BrowserService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly aktuellesJahr = signal(new Date().getFullYear());
  readonly zeitraumTyp = signal<DatevZeitraumTyp>('year');
  readonly aktiverMonat = signal(new Date().getMonth());
  readonly vorschauZeilen = signal<DatevVorschauZeile[]>([]);
  readonly meldungen = signal<DatevValidierungsMeldung[]>([]);
  readonly firma = signal<FirmaSettings>({});
  readonly exportBereit = signal(false);
  readonly stats = signal<{
    totalInc: number;
    totalExp: number;
    sumIncNetto: number;
    sumExpNetto: number;
    zahllast: number;
  } | null>(null);

  readonly verfuegbareJahre = computed(() => {
    const j = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => j - 3 + i);
  });

  readonly zeitraumLabel = computed(() => {
    const j = this.aktuellesJahr();
    const typ = this.zeitraumTyp();
    if (typ === 'year') return `Gesamtjahr ${j}`;
    if (typ === 'month') return `${MONATE[this.aktiverMonat()]} ${j}`;
    return `${QUARTAL_LABELS[typ]} ${j}`;
  });

  readonly apiParameter = computed(() => {
    const typ = this.zeitraumTyp();
    if (typ === 'month') return { jahr: this.aktuellesJahr(), monat: this.aktiverMonat() };
    return { jahr: this.aktuellesJahr(), monat: -1 };
  });

  ladeDaten(): void {
    this.laedt.set(true);
    this.exportBereit.set(false);
    const { jahr, monat } = this.apiParameter();
    this.service.validierenUndVorschauLaden(jahr, monat).subscribe({
      next: ({ validierung, vorschau }) => {
        this.meldungen.set(validierung.warnings ?? []);
        let zeilen: DatevVorschauZeile[] = vorschau.rows ?? [];
        const typ = this.zeitraumTyp();
        if (typ in QUARTAL_MONATE) {
          const qm = new Set(QUARTAL_MONATE[typ]);
          zeilen = zeilen.filter((r) => r.datum && qm.has(new Date(r.datum).getMonth()));
        }
        this.vorschauZeilen.set(zeilen);
        this.stats.set(vorschau.stats ?? null);
        this.exportBereit.set(zeilen.length > 0);
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Daten konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
    this.service.firmaLaden().subscribe({ next: (f) => this.firma.set(f), error: () => {} });
  }

  zeitraumTypSetzen(typ: DatevZeitraumTyp): void {
    this.zeitraumTyp.set(typ);
    this.ladeDaten();
  }

  jahrSetzen(jahr: number): void {
    this.aktuellesJahr.set(jahr);
    this.ladeDaten();
  }
  monatSetzen(monat: number): void {
    this.aktiverMonat.set(monat);
    this.ladeDaten();
  }

  csvExportieren(): void {
    const { jahr, monat } = this.apiParameter();
    this.browser
      .blobOeffnen(this.service.exportUrl(jahr, monat))
      .catch(() => this.toast.error('CSV-Export fehlgeschlagen.'));
  }

  excelExportieren(): void {
    const { jahr, monat } = this.apiParameter();
    this.browser
      .blobOeffnen(this.service.excelUrl(jahr, monat))
      .catch(() => this.toast.error('Excel-Export fehlgeschlagen.'));
  }
}
