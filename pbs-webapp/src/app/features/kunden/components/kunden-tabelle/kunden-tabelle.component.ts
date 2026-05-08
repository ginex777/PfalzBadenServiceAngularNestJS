import { ChangeDetectionStrategy, Component, input, output, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Kunde } from '../../../../core/models';
import type { KundeUmsatz } from '../../kunden.models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../../../shared/ui/skeleton-rows/skeleton-rows.component';
import { waehrungFormatieren } from '../../../../core/utils/format.utils';
import { RoleAllowedDirective } from '../../../../core/directives/role-allowed.directive';
import { OverflowMenuComponent } from '../../../../shared/ui/overflow-menu/overflow-menu.component';

@Component({
  selector: 'app-kunden-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    RoleAllowedDirective,
    RouterLink,
    SkeletonRowsComponent,
    OverflowMenuComponent,
  ],
  templateUrl: './kunden-tabelle.component.html',
  styleUrl: './kunden-tabelle.component.scss',
})
export class KundenTabelleComponent {
  readonly customers = input.required<Kunde[]>();
  readonly revenues = input<KundeUmsatz[]>([]);
  readonly loading = input<boolean>(false);
  readonly searchTerm = input<string>('');

  readonly editRequested = output<Kunde>();
  readonly deleteRequested = output<number>();
  readonly createInvoiceRequested = output<Kunde>();
  readonly createQuoteRequested = output<Kunde>();
  readonly openItemsRequested = output<number>();
  readonly createRequested = output<void>();

  protected readonly waehrungFormatieren = waehrungFormatieren;

  protected readonly sortSpalte = signal<keyof Kunde>('name');
  protected readonly sortAufsteigend = signal(true);

  protected readonly sortierteKunden = computed(() => {
    const col = this.sortSpalte();
    const asc = this.sortAufsteigend();
    return [...this.customers()].sort((a, b) => {
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
    return this.revenues().find((u) => u.kundeId === kundeId);
  }

  protected hatVerknuepfteDokumente(kundeId: number): boolean {
    const u = this.umsatzFuerKunde(kundeId);
    return u ? u.rechnungenAnzahl + u.angeboteAnzahl > 0 : false;
  }
}
