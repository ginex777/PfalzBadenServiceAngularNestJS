import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormField, form, required, min } from '@angular/forms/signals';
import { WiederkehrendeAusgabenFacade } from './wiederkehrende-ausgaben.facade';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { WiederkehrendeAusgabe } from '../../core/models';
import { WiederkehrendeAusgabeFormularDaten, LEERES_FORMULAR } from './wiederkehrende-ausgaben.models';
import { waehrungFormatieren, KATEGORIEN } from '../../core/utils/format.utils';

@Component({
  selector: 'app-wiederkehrende-ausgaben',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, ConfirmModalComponent, PageTitleComponent, EmptyStateComponent],
  templateUrl: './wiederkehrende-ausgaben.component.html',
  styleUrl: './wiederkehrende-ausgaben.component.scss',
})
export class WiederkehrendeAusgabenComponent implements OnInit {
  protected readonly facade = inject(WiederkehrendeAusgabenFacade);

  protected readonly ausgabeModell = signal<WiederkehrendeAusgabeFormularDaten>({ ...LEERES_FORMULAR });

  protected readonly ausgabeForm = form(this.ausgabeModell, (schema) => {
    required(schema.name, { message: 'Name erforderlich' });
    required(schema.kategorie, { message: 'Kategorie erforderlich' });
    min(schema.brutto, 0.01, { message: 'Betrag muss größer 0 sein' });
  });

  protected readonly kategorien = Object.keys(KATEGORIEN);

  ngOnInit(): void { this.facade.ladeDaten(); }

  protected formularOeffnen(ausgabe?: WiederkehrendeAusgabe): void {
    if (ausgabe) {
      this.ausgabeModell.set({
        name: ausgabe.name, kategorie: ausgabe.kategorie, brutto: ausgabe.brutto,
        mwst: ausgabe.mwst, abzug: ausgabe.abzug, belegnr: ausgabe.belegnr ?? '', aktiv: ausgabe.aktiv,
      });
    } else {
      this.ausgabeModell.set({ ...LEERES_FORMULAR });
    }
    this.facade.formularOeffnen(ausgabe);
  }

  protected speichern(): void {
    if (this.ausgabeForm().invalid()) return;
    const daten = this.ausgabeModell();
    this.facade.formularDaten.set(daten);
    this.facade.speichern();
  }

  protected formularSchliessen(): void {
    this.ausgabeModell.set({ ...LEERES_FORMULAR });
    this.facade.formularSchliessen();
  }

  protected kategorieGeaendert(event: Event): void {
    const kategorie = (event.target as HTMLSelectElement).value;
    const abzug = KATEGORIEN[kategorie] ?? 100;
    this.ausgabeModell.update(d => ({ ...d, kategorie, abzug }));
    this.facade.kategorieGeaendert(kategorie);
  }

  protected mwstGeaendert(event: Event): void {
    const mwst = +(event.target as HTMLSelectElement).value;
    this.ausgabeModell.update(d => ({ ...d, mwst }));
  }

  protected suchbegriffGeaendert(event: Event): void {
    this.facade.suchbegriff.set((event.target as HTMLInputElement).value);
  }

  protected aktivToggle(id: number, event: Event): void {
    this.facade.aktivToggle(id, (event.target as HTMLInputElement).checked);
  }

  protected fmt(n: number): string { return waehrungFormatieren(n); }
  protected nettoBerechnen(a: WiederkehrendeAusgabe): number { return a.brutto / (1 + a.mwst / 100); }
  protected vstBerechnen(a: WiederkehrendeAusgabe): number {
    return (a.brutto - a.brutto / (1 + a.mwst / 100)) * (a.abzug / 100);
  }
}
