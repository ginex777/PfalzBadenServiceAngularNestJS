import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { KundenFacade } from './kunden.facade';
import { KundenTabelleComponent } from './components/kunden-tabelle/kunden-tabelle.component';
import { KundenFormularComponent } from './components/kunden-formular/kunden-formular.component';
import { OffenePostenModalComponent } from './components/offene-posten-modal/offene-posten-modal.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { SearchToolbarComponent } from '../../shared/ui/search-toolbar/search-toolbar.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { Kunde } from '../../core/models';
import { KundenFormularDaten } from './kunden.models';

@Component({
  selector: 'app-kunden',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KundenTabelleComponent,
    KundenFormularComponent,
    OffenePostenModalComponent,
    ConfirmModalComponent,
    SearchToolbarComponent,
    PageTitleComponent,
  ],
  templateUrl: './kunden.component.html',
  styleUrl: './kunden.component.scss',
})
export class KundenComponent implements OnInit {
  protected readonly facade = inject(KundenFacade);

  hatUngespeicherteAenderungen(): boolean {
    return this.facade.bearbeiteterKunde() !== null;
  }

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected speichern(daten: KundenFormularDaten): void {
    this.facade.speichern(daten);
  }

  protected bearbeitungStarten(kunde: Kunde): void {
    this.facade.bearbeitungStarten(kunde);
  }

  protected bearbeitungAbbrechen(): void {
    this.facade.bearbeitungAbbrechen();
  }

  protected loeschenBestaetigen(id: number): void {
    this.facade.loeschenBestaetigen(id);
  }

  protected loeschenAusfuehren(): void {
    this.facade.loeschenAusfuehren();
  }

  protected loeschenAbbrechen(): void {
    this.facade.loeschenAbbrechen();
  }

  protected offenePostenAnzeigen(kundeId: number): void {
    this.facade.offenePostenAnzeigen(kundeId);
  }

  protected zuRechnungNavigieren(kunde: Kunde): void {
    this.facade.zuRechnungNavigieren(kunde);
  }

  protected zuAngebotNavigieren(kunde: Kunde): void {
    this.facade.zuAngebotNavigieren(kunde);
  }

  protected offenePostenRechnungNavigieren(kundeId: number): void {
    const kunde = this.facade.kunden().find((k) => k.id === kundeId);
    if (kunde) this.facade.zuRechnungNavigieren(kunde);
    this.facade.offenePostenSchliessen();
  }

  protected mahnungKopieren(): void {
    navigator.clipboard.writeText(this.facade.sammelMahnungText()).catch(() => {});
  }
}
