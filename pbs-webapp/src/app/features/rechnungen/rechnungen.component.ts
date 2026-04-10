import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RechnungenFacade } from './rechnungen.facade';
import { RechnungenTabelleComponent } from './components/rechnungen-tabelle/rechnungen-tabelle.component';
import { RechnungenFormularComponent } from './components/rechnungen-formular/rechnungen-formular.component';
import { ZahlungsTrackerComponent } from './components/zahlungs-tracker/zahlungs-tracker.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { SearchToolbarComponent } from '../../shared/ui/search-toolbar/search-toolbar.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { Rechnung, RechnungPosition } from '../../core/models';
import { RechnungFilter, RechnungFormularDaten } from './rechnungen.models';
import { waehrungFormatieren } from '../../core/utils/format.utils';

@Component({
  selector: 'app-rechnungen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RechnungenTabelleComponent,
    RechnungenFormularComponent,
    ZahlungsTrackerComponent,
    StatCardComponent,
    SearchToolbarComponent,
    ConfirmModalComponent,
    PageTitleComponent,
    DecimalPipe,
  ],
  templateUrl: './rechnungen.component.html',
  styleUrl: './rechnungen.component.scss',
})
export class RechnungenComponent {
  protected readonly facade = inject(RechnungenFacade);
  private readonly route = inject(ActivatedRoute);
  protected readonly waehrungFormatieren = waehrungFormatieren;
  private urlId: number | null = null;

  constructor() {
    this.route.queryParams
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        if (params['id']) this.urlId = parseInt(params['id']);
      });

    // When loading completes and we have a URL id, open the matching record
    effect(() => {
      if (!this.facade.laedt() && this.urlId !== null) {
        const rechnung = this.facade.rechnungen().find(r => r.id === this.urlId);
        if (rechnung) {
          this.facade.bearbeitungStarten(rechnung);
          this.urlId = null;
        }
      }
    });

    this.facade.ladeDaten();
  }

  protected onBearbeiten(rechnung: Rechnung): void {
    this.facade.bearbeitungStarten(rechnung);
  }

  protected onLoeschen(id: number): void {
    this.facade.loeschenBestaetigen(id);
  }

  protected onAlsGezahlt(rechnung: Rechnung): void {
    this.facade.alsGezahltMarkierenStarten(rechnung);
  }

  protected onPdfGenerieren(rechnung: Rechnung): void {
    this.facade.pdfGenerieren(rechnung);
  }

  protected onVorschau(): void {
    this.facade.vorschauGenerieren();
  }

  protected onKopieren(rechnung: Rechnung): void {
    this.facade.rechnungKopieren(rechnung);
  }

  protected onMahnung(rechnung: Rechnung): void {
    this.facade.mahnungenOeffnen(rechnung);
  }

  protected onMahnungFeld(feld: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.facade.mahnungFormularFeld(feld, feld === 'betrag_gebuehr' || feld === 'stufe' ? parseFloat(val) || 0 : val);
  }

  protected sendBetreff(): string {
    const r = this.facade.sendModalRechnung();
    if (!r) return '';
    return encodeURIComponent(`Rechnung ${r.nr}`);
  }

  protected sendText(): string {
    const r = this.facade.sendModalRechnung();
    const f = this.facade.firma();
    if (!r) return '';
    return `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unsere Rechnung ${r.nr} vom ${r.datum ?? ''} über ${r.brutto?.toFixed(2) ?? '0.00'} EUR.\n\nBitte überweisen Sie den Betrag bis zum ${r.frist ?? ''} auf unser Konto.\n\nMit freundlichen Grüßen\n ${f.firma ?? ''}`;
  }

  protected outlookOeffnen(): void {
    const r = this.facade.sendModalRechnung();
    if (!r) return;
    const mailto = `mailto:${r.email}?subject=${this.sendBetreff()}&body=${encodeURIComponent(this.sendText())}`;
    window.open(mailto, '_blank');
  }

  protected textKopieren(): void {
    navigator.clipboard.writeText(this.sendText()).catch(() => {});
  }

  protected onFilterAendern(filter: RechnungFilter): void {
    this.facade.filterSetzen(filter);
  }

  protected onSpeichern(): void {
    this.facade.speichern();
  }

  protected onAbbrechen(): void {
    this.facade.bearbeitungAbbrechen();
  }

  protected onPositionHinzufuegen(): void {
    this.facade.positionHinzufuegen();
  }

  protected onPositionEntfernen(index: number): void {
    this.facade.positionEntfernen(index);
  }

  protected onPositionAktualisieren(event: { index: number; position: RechnungPosition }): void {
    this.facade.positionAktualisieren(event.index, event.position);
  }

  protected onFeldAktualisieren(event: { feld: keyof RechnungFormularDaten; wert: unknown }): void {
    this.facade.formularFeldAktualisieren(
      event.feld,
      event.wert as RechnungFormularDaten[typeof event.feld]
    );
  }

  protected onKundeAuswaehlen(kundeId: number): void {
    this.facade.kundeAuswaehlen(kundeId);
  }
}
