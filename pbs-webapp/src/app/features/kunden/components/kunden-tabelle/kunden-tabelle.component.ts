import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Kunde } from '../../../../core/models';
import { KundeUmsatz } from '../../kunden.models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../../../shared/ui/skeleton-rows/skeleton-rows.component';
import { waehrungFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-kunden-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, RouterLink, SkeletonRowsComponent],
  templateUrl: './kunden-tabelle.component.html',
  styleUrl: './kunden-tabelle.component.scss',
})
export class KundenTabelleComponent {
  readonly kunden = input.required<Kunde[]>();
  readonly umsaetze = input<KundeUmsatz[]>([]);
  readonly laedt = input<boolean>(false);
  readonly suchbegriff = input<string>('');

  readonly bearbeiten = output<Kunde>();
  readonly loeschen = output<number>();
  readonly rechnung = output<Kunde>();
  readonly angebot = output<Kunde>();
  readonly offenePosten = output<number>();
  readonly neuAnlegen = output<void>();

  protected readonly waehrungFormatieren = waehrungFormatieren;

  protected umsatzFuerKunde(kundeId: number): KundeUmsatz | undefined {
    return this.umsaetze().find(u => u.kundeId === kundeId);
  }

  protected hatVerknuepfteDokumente(kundeId: number): boolean {
    const u = this.umsatzFuerKunde(kundeId);
    return u ? (u.rechnungenAnzahl + u.angeboteAnzahl) > 0 : false;
  }
}
