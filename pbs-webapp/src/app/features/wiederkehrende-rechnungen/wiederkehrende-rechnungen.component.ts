import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { WiederkehrendeRechnungenFacade } from './wiederkehrende-rechnungen.facade';
import { WrFormularComponent } from './components/wr-formular/wr-formular.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { WrFormularDaten } from './wiederkehrende-rechnungen.models';
import { datumFormatieren, waehrungFormatieren } from '../../core/utils/format.utils';

@Component({
  selector: 'app-wiederkehrende-rechnungen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WrFormularComponent, ConfirmModalComponent, PageTitleComponent, EmptyStateComponent],
  templateUrl: './wiederkehrende-rechnungen.component.html',
  styleUrl: './wiederkehrende-rechnungen.component.scss',
})
export class WiederkehrendeRechnungenComponent implements OnInit {
  protected readonly facade = inject(WiederkehrendeRechnungenFacade);

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected speichern(daten: WrFormularDaten): void {
    this.facade.speichern(daten);
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
}
