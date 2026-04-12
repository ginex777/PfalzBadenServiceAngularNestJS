// ============================================================
// Buchhaltung — Smart Container Component
// ============================================================

import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BuchhaltungFacade } from './buchhaltung.facade';
import { BuchhaltungService } from './buchhaltung.service';
import { BuchhaltungZeile } from './buchhaltung.models';
import { MonatsTabsComponent } from './components/monats-tabs/monats-tabs.component';
import { EinnahmenTabelleComponent } from './components/einnahmen-tabelle/einnahmen-tabelle.component';
import { AusgabenTabelleComponent } from './components/ausgaben-tabelle/ausgaben-tabelle.component';
import { MonatsErgebnisComponent } from './components/monats-ergebnis/monats-ergebnis.component';
import { JahresUebersichtComponent } from './components/jahres-uebersicht/jahres-uebersicht.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { MONATE } from '../../core/utils/format.utils';
import { Beleg } from '../../core/models';
import { MAX_BELEG_BYTES } from '../../core/constants';

interface BelegModalState {
  offen: boolean;
  zeile: BuchhaltungZeile | null;
  typ: 'inc' | 'exp';
  laedt: boolean;
  hochladen: boolean;
  beleg: Beleg | null;
}

@Component({
  selector: 'app-buchhaltung',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MonatsTabsComponent,
    EinnahmenTabelleComponent,
    AusgabenTabelleComponent,
    MonatsErgebnisComponent,
    JahresUebersichtComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './buchhaltung.component.html',
  styleUrl: './buchhaltung.component.scss',
})
export class BuchhaltungComponent implements OnInit {
  protected readonly facade = inject(BuchhaltungFacade);
  private readonly service = inject(BuchhaltungService);

  hatUngespeicherteAenderungen(): boolean {
    return this.facade.speicherStatus().dirty;
  }

  protected readonly belegModal = signal<BelegModalState>({
    offen: false, zeile: null, typ: 'exp',
    laedt: false, hochladen: false, beleg: null,
  });

  protected readonly verfuegbareJahre = computed(() => {
    const aktuell = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => aktuell - 3 + i);
  });

  protected readonly aktuellerMonatName = computed(() => {
    const monat = this.facade.aktuellerMonat();
    return MONATE[monat] + ' ' + this.facade.aktuellesJahr();
  });

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  protected monatWechseln(monat: number): void {
    this.facade.monatWechseln(monat);
  }

  protected jahresansichtUmschalten(): void {
    this.facade.jahresansichtUmschalten();
  }

  protected jahrWechseln(event: Event): void {
    const jahr = parseInt((event.target as HTMLSelectElement).value, 10);
    this.facade.jahrWechseln(jahr);
  }

  // ── Speichern mit Belegnummer-Prüfung ────────────────────────────────────
  protected readonly belegnummerWarnungSichtbar = signal(false);

  protected batchSpeichern(): void {
    const ausgaben = this.facade.aktuelleAusgaben();
    const ohneNummer = ausgaben.filter(z => !z.belegnr?.trim());
    if (ohneNummer.length > 0) {
      this.belegnummerWarnungSichtbar.set(true);
      return;
    }
    this.facade.batchSpeichern();
  }

  protected belegnummerWarnungBestaetigen(): void {
    this.belegnummerWarnungSichtbar.set(false);
    this.facade.batchSpeichern();
  }

  protected belegnummerWarnungAbbrechen(): void {
    this.belegnummerWarnungSichtbar.set(false);
  }

  // ── Monat sperren/entsperren ──────────────────────────────────────────────
  protected monatSperren(): void {
    this.facade.monatSperren();
  }

  protected monatEntsperren(): void {
    this.facade.monatEntsperren();
  }

  protected monatLeeren(): void {
    this.facade.monatLeeren();
  }

  // ── Export ────────────────────────────────────────────────────────────────
  protected pdfExportieren(): void {
    window.open('/api/pdf/archiv', '_blank');
  }

  protected excelExportieren(): void {
    const monat = this.facade.ansichtsModus() === 'monat' ? this.facade.aktuellerMonat() : -1;
    window.open(`/api/datev/excel?jahr=${this.facade.aktuellesJahr()}&monat=${monat}`, '_blank');
  }

  protected jahresabschlussExportieren(): void {
    window.open(`/api/datev/excel?jahr=${this.facade.aktuellesJahr()}&monat=-1`, '_blank');
  }

  // ── Einnahmen ─────────────────────────────────────────────────────────────
  protected einnahmeZeileHinzufuegen(): void {
    this.facade.einnahmeZeileHinzufuegen();
  }

  protected einnahmeZeileEntfernen(tempId: string): void {
    this.facade.einnahmeZeileEntfernen(tempId);
  }

  protected einnahmeZeileKopieren(tempId: string): void {
    this.facade.zeileKopieren('inc', tempId);
  }

  protected einnahmeZeileAktualisieren(event: { tempId: string; aenderungen: Partial<BuchhaltungZeile> }): void {
    this.facade.einnahmeZeileAktualisieren(event.tempId, event.aenderungen);
  }

  // ── Ausgaben ──────────────────────────────────────────────────────────────
  protected ausgabeZeileHinzufuegen(): void {
    this.facade.ausgabeZeileHinzufuegen();
  }

  protected ausgabeZeileEntfernen(tempId: string): void {
    this.facade.ausgabeZeileEntfernen(tempId);
  }

  protected ausgabeZeileKopieren(tempId: string): void {
    this.facade.zeileKopieren('exp', tempId);
  }

  protected ausgabeZeileAktualisieren(event: { tempId: string; aenderungen: Partial<BuchhaltungZeile> }): void {
    this.facade.ausgabeZeileAktualisieren(event.tempId, event.aenderungen);
  }

  protected kategorieAktualisieren(event: { tempId: string; kategorie: string }): void {
    this.facade.kategorieAktualisieren(event.tempId, event.kategorie);
  }

  protected wiederkehrendeKostenAnwenden(): void {
    this.facade.wiederkehrendeKostenAnwenden();
  }

  // ── VST ───────────────────────────────────────────────────────────────────
  protected vstAlsGezahltMarkieren(schluessel: string): void {
    this.facade.vstAlsGezahltMarkieren(schluessel);
  }

  protected vstZahlungZuruecksetzen(schluessel: string): void {
    this.facade.vstZahlungZuruecksetzen(schluessel);
  }

  // ── Bestätigungs-Dialog ───────────────────────────────────────────────────
  protected dialogBestaetigen(): void {
    this.facade.bestaetigenDialog()?.aktion();
  }

  protected dialogAbbrechen(): void {
    this.facade.dialogAbbrechen();
  }

  // ── Beleg-Modal ───────────────────────────────────────────────────────────
  protected belegModalOeffnen(event: { typ: 'inc' | 'exp'; tempId: string }): void {
    const zeilen = event.typ === 'inc'
      ? this.facade.aktuelleEinnahmen()
      : this.facade.aktuelleAusgaben();
    const zeile = zeilen.find((z) => z._tempId === event.tempId);
    if (!zeile) return;

    if (!zeile.id) {
      this.facade.batchSpeichern().then(() => {
        const aktualisiert = (event.typ === 'inc'
          ? this.facade.aktuelleEinnahmen()
          : this.facade.aktuelleAusgaben()
        ).find((z) => z._tempId === event.tempId);
        if (aktualisiert) this._belegModalAnzeigen(aktualisiert, event.typ);
      });
      return;
    }
    this._belegModalAnzeigen(zeile, event.typ);
  }

  private _belegModalAnzeigen(zeile: BuchhaltungZeile, typ: 'inc' | 'exp'): void {
    this.belegModal.set({ offen: true, zeile, typ, laedt: false, hochladen: false, beleg: null });

    if (zeile.beleg_id) {
      this.belegModal.update(s => ({ ...s, laedt: true }));
      this.service.belegeFuerBuchungLaden(zeile.id!).subscribe({
        next: (belege) => this.belegModal.update(s => ({ ...s, beleg: belege[0] ?? null, laedt: false })),
        error: () => this.belegModal.update(s => ({ ...s, laedt: false })),
      });
    }
  }

  protected belegModalSchliessen(): void {
    this.belegModal.update(s => ({ ...s, offen: false, zeile: null, beleg: null }));
  }

  protected belegDateiHochladen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const zeile = this.belegModal().zeile;
    if (!input.files?.length || !zeile?.id) return;

    const datei = input.files[0];
    if (datei.size > MAX_BELEG_BYTES) return;

    const fd = new FormData();
    fd.append('beleg', datei);
    fd.append('buchhaltung_id', String(zeile.id));
    fd.append('typ', 'beleg');

    this.belegModal.update(s => ({ ...s, hochladen: true }));
    this.service.belegHochladen(fd).subscribe({
      next: (beleg) => {
        this.belegModal.update(s => ({ ...s, beleg, hochladen: false }));
        if (this.belegModal().typ === 'inc') {
          this.facade.einnahmeZeileAktualisieren(zeile._tempId, { beleg_id: beleg.id });
        } else {
          this.facade.ausgabeZeileAktualisieren(zeile._tempId, { beleg_id: beleg.id });
        }
      },
      error: () => this.belegModal.update(s => ({ ...s, hochladen: false })),
    });
  }

  protected belegDownloadUrl(id: number, inline = false): string {
    return this.service.belegDownloadUrl(id, inline);
  }

  protected einnahmeBelegOeffnen(tempId: string): void {
    this.belegModalOeffnen({ typ: 'inc', tempId });
  }

  protected ausgabeBelegOeffnen(tempId: string): void {
    this.belegModalOeffnen({ typ: 'exp', tempId });
  }
}


  