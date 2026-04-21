import { ChangeDetectionStrategy, Component, OnInit, inject, linkedSignal } from '@angular/core';
import { form, required, applyEach, SchemaPathTree } from '@angular/forms/signals';
import { WiederkehrendeRechnungenFacade } from './wiederkehrende-rechnungen.facade';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { RechnungPosition } from '../../core/models';
import { datumFormatieren, waehrungFormatieren } from '../../core/utils/format.utils';

function positionSchema(p: SchemaPathTree<RechnungPosition>): void {
  required(p.bez, { message: 'Bezeichnung erforderlich' });
}

@Component({
  selector: 'app-wiederkehrende-rechnungen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmModalComponent, PageTitleComponent, EmptyStateComponent],
  templateUrl: './wiederkehrende-rechnungen.component.html',
  styleUrl: './wiederkehrende-rechnungen.component.scss',
})
export class WiederkehrendeRechnungenComponent implements OnInit {
  protected readonly facade = inject(WiederkehrendeRechnungenFacade);

  protected readonly wrModell = linkedSignal(() => this.facade.formularDaten());

  protected readonly wrForm = form(this.wrModell, (schema) => {
    required(schema.titel, { message: 'Titel erforderlich' });
    required(schema.intervall, { message: 'Intervall erforderlich' });
    applyEach(schema.positionen, positionSchema);
  });

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected titelGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('titel', (event.target as HTMLInputElement).value);
  }

  protected kundeGeaendert(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.facade.formularFeldAktualisieren('kunden_id', id ? +id : (undefined as never));
  }

  protected intervallGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('intervall', (event.target as HTMLSelectElement).value);
  }

  protected aktivGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren(
      'aktiv',
      (event.target as HTMLInputElement).checked as never,
    );
  }

  protected aktivToggleGeaendert(id: number, event: Event): void {
    this.facade.aktivToggle(id, (event.target as HTMLInputElement).checked);
  }

  protected fmt(n: number): string {
    return waehrungFormatieren(n);
  }
  protected fmtDatum(s: string | undefined): string {
    return datumFormatieren(s);
  }

  protected positionBezGeaendert(index: number, event: Event): void {
    const pos = { ...this.facade.formularDaten().positionen[index] };
    pos.bez = (event.target as HTMLTextAreaElement).value;
    this.facade.positionAktualisieren(index, pos);
  }

  protected positionGesamtpreisGeaendert(index: number, event: Event): void {
    const pos = { ...this.facade.formularDaten().positionen[index] };
    pos.gesamtpreis = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.facade.positionAktualisieren(index, pos);
  }
}
