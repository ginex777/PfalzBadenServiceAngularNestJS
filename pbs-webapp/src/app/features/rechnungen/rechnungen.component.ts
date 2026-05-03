import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RechnungenFacade } from './rechnungen.facade';
import { RechnungenTabelleComponent } from './components/rechnungen-tabelle/rechnungen-tabelle.component';
import { RechnungenFormularComponent } from './components/rechnungen-formular/rechnungen-formular.component';
import { ZahlungsTrackerComponent } from './components/zahlungs-tracker/zahlungs-tracker.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { SearchToolbarComponent } from '../../shared/ui/search-toolbar/search-toolbar.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import type { Rechnung, RechnungPosition } from '../../core/models';
import type { RechnungFilter, RechnungFormularDaten } from './rechnungen.models';
import { waehrungFormatieren } from '../../core/utils/format.utils';
import { ConfirmService } from '../../shared/services/confirm.service';
import { BrowserService } from '../../core/services/browser.service';

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
    ModalComponent,
    PageTitleComponent,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './rechnungen.component.html',
  styleUrl: './rechnungen.component.scss',
})
export class RechnungenComponent {
  protected readonly facade = inject(RechnungenFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmService);
  private readonly browser = inject(BrowserService);
  protected readonly waehrungFormatieren = waehrungFormatieren;
  private urlId: number | null = null;

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (params['id']) this.urlId = parseInt(params['id']);
    });

    // When loading completes and we have a URL id, open the matching record
    effect(() => {
      if (!this.facade.laedt() && this.urlId !== null) {
        const rechnung = this.facade.rechnungen().find((r) => r.id === this.urlId);
        if (rechnung) {
          this.facade.bearbeitungStarten(rechnung);
          this.urlId = null;
        }
      }
    });

    this.facade.ladeDaten();
  }

  protected onNeueRechnung(): void {
    this.facade.bearbeitungAbbrechen();
    this.facade.drawerOeffnen();
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
    this.facade.mahnungFormularFeld(
      feld,
      feld === 'betrag_gebuehr' || feld === 'stufe' ? parseFloat(val) || 0 : val,
    );
  }

  protected onOutlookOeffnen(): void {
    const r = this.facade.sendModalRechnung();
    if (!r) return;
    const mailto = `mailto:${r.email}?subject=${this.facade.sendBetreff()}&body=${encodeURIComponent(this.facade.sendText())}`;
    this.browser.openUrl(mailto);
  }

  protected onTextKopieren(): void {
    navigator.clipboard.writeText(this.facade.sendText()).catch(() => {});
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
      event.wert as RechnungFormularDaten[typeof event.feld],
    );
  }

  protected onKundeAuswaehlen(kundeId: number): void {
    this.facade.kundeAuswaehlen(kundeId);
  }

  protected async onBulkLoeschen(ids: number[]): Promise<void> {
    const ok = await this.confirm.confirm({
      message: `${ids.length} Rechnungen unwiderruflich löschen?`,
    });
    if (!ok) return;
    ids.forEach((id) => this.facade.loeschenSofort(id));
  }

  protected onBulkAlsGezahlt(rechnungen: Rechnung[]): void {
    rechnungen.forEach((r) => this.facade.alsGezahltMarkierenStarten(r));
  }

  hatUngespeicherteAenderungen(): boolean {
    return this.facade.formularGeaendert();
  }
}
