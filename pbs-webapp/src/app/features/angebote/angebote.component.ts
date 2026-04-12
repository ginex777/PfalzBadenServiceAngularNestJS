import { ChangeDetectionStrategy, Component, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngeboteFacade } from './angebote.facade';
import { AngeboteTabelleComponent } from './components/angebote-tabelle/angebote-tabelle.component';
import { AngeboteFormularComponent } from './components/angebote-formular/angebote-formular.component';
import { SearchToolbarComponent } from '../../shared/ui/search-toolbar/search-toolbar.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { Angebot, RechnungPosition } from '../../core/models';
import { AngebotFilter, AngebotFormularDaten } from './angebote.models';

@Component({
  selector: 'app-angebote',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AngeboteTabelleComponent,
    AngeboteFormularComponent,
    SearchToolbarComponent,
    ConfirmModalComponent,
    PageTitleComponent,
  ],
  templateUrl: './angebote.component.html',
  styleUrl: './angebote.component.scss',
})
export class AngeboteComponent implements OnInit {
  protected readonly facade = inject(AngeboteFacade);

  hatUngespeicherteAenderungen(): boolean {
    const d = this.facade.formularDaten();
    return !!(d.empf?.trim() || d.titel?.trim() || d.positionen.some(p => p.bez?.trim()));
  }
  private readonly route = inject(ActivatedRoute);
  private urlId: number | null = null;

  constructor() {
    effect(() => {
      if (!this.facade.laedt() && this.urlId !== null) {
        const angebot = this.facade.angebote().find(a => a.id === this.urlId);
        if (angebot) {
          this.facade.bearbeitungStarten(angebot);
          this.urlId = null;
        }
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) this.urlId = parseInt(params['id']);
    });
    this.facade.ladeDaten();
  }

  protected onBearbeiten(angebot: Angebot): void {
    this.facade.bearbeitungStarten(angebot);
  }

  protected onLoeschen(id: number): void {
    this.facade.loeschenBestaetigen(id);
  }

  protected onStatusSetzen(event: { id: number; status: 'angenommen' | 'abgelehnt' | 'gesendet' }): void {
    this.facade.statusSetzen(event.id, event.status);
  }

  protected onPdfGenerieren(angebot: Angebot): void {
    this.facade.pdfGenerieren(angebot);
  }

  protected onVorschau(): void {
    this.facade.vorschauGenerieren();
  }

  protected onKopieren(angebot: Angebot): void {
    this.facade.angebotKopieren(angebot);
  }

  protected onAlsKundeSpeichern(): void {
    this.facade.empfaengerAlsKundeSpeichern();
  }

  protected onPositionKopieren(index: number): void {
    this.facade.positionKopieren(index);
  }

  protected onZuRechnungKonvertieren(angebot: Angebot): void {
    this.facade.zuRechnungKonvertieren(angebot);
  }

  protected onFilterAendern(filter: AngebotFilter): void {
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

  protected onFeldAktualisieren(event: { feld: keyof AngebotFormularDaten; wert: unknown }): void {
    this.facade.formularFeldAktualisieren(
      event.feld,
      event.wert as AngebotFormularDaten[typeof event.feld]
    );
  }

  protected onKundeAuswaehlen(kundeId: number): void {
    this.facade.kundeAuswaehlen(kundeId);
  }

  protected sendBetreff(): string {
    const a = this.facade.sendModal()?.angebot;
    return a ? `Angebot ${a.nr}` : '';
  }

  protected sendText(): string {
    const d = this.facade.sendModal();
    if (!d) return '';
    const { angebot: a } = d;
    return `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unser Angebot ${a.nr} vom ${a.datum ?? ''} über ${a.brutto?.toFixed(2) ?? '0.00'} EUR.\n\nDas Angebot ist gültig bis: ${a.gueltig_bis ?? '–'}.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen`;
  }

  protected outlookOeffnen(): void {
    const d = this.facade.sendModal();
    if (!d) return;
    const mailto = `mailto:${d.email}?subject=${encodeURIComponent(this.sendBetreff())}&body=${encodeURIComponent(this.sendText())}`;
    window.open(mailto, '_blank');
  }

  protected textKopieren(): void {
    navigator.clipboard.writeText(this.sendText()).catch(() => {});
  }
}
