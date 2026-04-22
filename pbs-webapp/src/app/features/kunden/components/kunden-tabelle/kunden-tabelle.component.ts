import { ChangeDetectionStrategy, Component, input, output, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Kunde } from '../../../../core/models';
import { KundeUmsatz } from '../../kunden.models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../../../shared/ui/skeleton-rows/skeleton-rows.component';
import { waehrungFormatieren } from '../../../../core/utils/format.utils';
import { RoleAllowedDirective } from '../../../../core/directives/role-allowed.directive';

@Component({
  selector: 'app-kunden-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, RoleAllowedDirective, RouterLink, SkeletonRowsComponent],
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

  protected readonly sortSpalte = signal<keyof Kunde>('name');
  protected readonly sortAufsteigend = signal(true);

  protected readonly sortierteKunden = computed(() => {
    const col = this.sortSpalte();
    const asc = this.sortAufsteigend();
    return [...this.kunden()].sort((a, b) => {
      const va = String(a[col] ?? '');
      const vb = String(b[col] ?? '');
      return asc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  });

  protected toggleSort(col: keyof Kunde): void {
    if (this.sortSpalte() === col) {
      this.sortAufsteigend.update((v) => !v);
    } else {
      this.sortSpalte.set(col);
      this.sortAufsteigend.set(true);
    }
  }

  protected umsatzFuerKunde(kundeId: number): KundeUmsatz | undefined {
    return this.umsaetze().find((u) => u.kundeId === kundeId);
  }

  protected hatVerknuepfteDokumente(kundeId: number): boolean {
    const u = this.umsatzFuerKunde(kundeId);
    return u ? u.rechnungenAnzahl + u.angeboteAnzahl > 0 : false;
  }
}
