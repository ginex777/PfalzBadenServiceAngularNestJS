import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  computed,
  inject,
} from '@angular/core';
import { ToastService } from '../../../../core/services/toast.service';
import { BrowserService } from '../../../../core/services/browser.service';
import type { Rechnung } from '../../../../core/models';
import type { RechnungFilter } from '../../rechnungen.models';
import type {
  StatusBadgeTyp} from '../../../../shared/ui/status-badge/status-badge.component';
import {
  StatusBadgeComponent
} from '../../../../shared/ui/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../../../shared/ui/confirm-modal/confirm-modal.component';
import { waehrungFormatieren, datumFormatieren, MONATE } from '../../../../core/utils/format.utils';
import { MS_PER_DAY } from '../../../../core/constants';
import { RoleAllowedDirective } from '../../../../core/directives/role-allowed.directive';
import { OverflowMenuComponent } from '../../../../shared/ui/overflow-menu/overflow-menu.component';

@Component({
  selector: 'app-rechnungen-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, EmptyStateComponent, ConfirmModalComponent, RoleAllowedDirective, OverflowMenuComponent],
  templateUrl: './rechnungen-tabelle.component.html',
  styleUrl: './rechnungen-tabelle.component.scss',
})
export class RechnungenTabelleComponent {
  readonly invoices = input.required<Rechnung[]>();
  readonly loading = input<boolean>(false);
  readonly activeFilter = input<RechnungFilter>('alle');

  readonly editRequested = output<Rechnung>();
  readonly deleteRequested = output<number>();
  readonly markPaid = output<Rechnung>();
  readonly generatePdf = output<Rechnung>();
  readonly filterChange = output<RechnungFilter>();
  readonly copyRequested = output<Rechnung>();
  readonly reminder = output<Rechnung>();
  readonly bulkDelete = output<number[]>();
  readonly bulkMarkPaid = output<Rechnung[]>();

  private readonly toast = inject(ToastService);
  private readonly browser = inject(BrowserService);

  protected readonly waehrungFormatieren = waehrungFormatieren;
  protected readonly datumFormatieren = datumFormatieren;

  protected readonly MONATE = MONATE;
  protected readonly monatFilter = signal('');
  protected readonly sortSpalte = signal<keyof Rechnung>('datum');
  protected readonly sortAufsteigend = signal(false);
  protected readonly ausgewaehlt = signal<Set<number>>(new Set());
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly pendingBulkDelete = signal<number[]>([]);

  protected readonly alleAusgewaehlt = computed(() => {
    const liste = this.sortierteListe();
    return liste.length > 0 && liste.every((r) => r.id != null && this.ausgewaehlt().has(r.id));
  });

  protected readonly sortierteListe = computed(() => {
    const col = this.sortSpalte();
    const asc = this.sortAufsteigend();
    const mf = this.monatFilter();

    let liste = [...this.invoices()];
    if (mf !== '') {
      const m = parseInt(mf);
      liste = liste.filter((r) => r.datum && new Date(r.datum).getMonth() === m);
    }

    return liste.sort((a, b) => {
      const va = String(a[col] ?? '');
      const vb = String(b[col] ?? '');
      return asc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  });

  protected toggleSort(col: keyof Rechnung): void {
    if (this.sortSpalte() === col) {
      this.sortAufsteigend.update((v) => !v);
    } else {
      this.sortSpalte.set(col);
      this.sortAufsteigend.set(true);
    }
  }

  protected onFilterSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as RechnungFilter;
    this.filterChange.emit(val);
  }

  protected monatGeaendert(event: Event): void {
    this.monatFilter.set((event.target as HTMLSelectElement).value);
  }

  protected suchbegriffLeeren(): void {
    this.monatFilter.set('');
    this.filterChange.emit('alle');
  }

  protected auswahlToggle(id: number): void {
    this.ausgewaehlt.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected alleToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const ids = this.sortierteListe()
        .map((r) => r.id)
        .filter((id): id is number => id != null);
      this.ausgewaehlt.set(new Set(ids));
    } else {
      this.ausgewaehlt.set(new Set());
    }
  }

  protected loeschenBestaetigen(id: number): void {
    this.pendingDeleteId.set(id);
  }

  protected loeschenBestaetigt(): void {
    const id = this.pendingDeleteId();
    if (id !== null) {
      this.deleteRequested.emit(id);
    }
    this.pendingDeleteId.set(null);
  }

  protected onBulkLoeschen(): void {
    const ids = [...this.ausgewaehlt()];
    if (ids.length === 0) return;
    this.pendingBulkDelete.set(ids);
  }

  protected bulkLoeschenBestaetigt(): void {
    this.bulkDelete.emit(this.pendingBulkDelete());
    this.pendingBulkDelete.set([]);
    this.ausgewaehlt.set(new Set());
  }

  protected onBulkAlsGezahlt(): void {
    const rechnungen = this.sortierteListe().filter(
      (r) => r.id != null && this.ausgewaehlt().has(r.id) && !r.bezahlt,
    );
    if (rechnungen.length === 0) {
      this.toast.info('Alle gewählten Rechnungen sind bereits bezahlt.');
      return;
    }
    this.bulkMarkPaid.emit(rechnungen);
    this.ausgewaehlt.set(new Set());
  }

  protected auswahlLeeren(): void {
    this.ausgewaehlt.set(new Set());
  }

  protected onBulkCsvExport(): void {
    const rechnungen = this.sortierteListe().filter(
      (r) => r.id != null && this.ausgewaehlt().has(r.id),
    );
    const zeilen = [
      'Nr;Empfänger;Datum;Betrag;Status',
      ...rechnungen.map(
        (r) =>
          `${r.nr};"${r.empf}";${r.datum ?? ''};${r.brutto ?? 0};${r.bezahlt ? 'Bezahlt' : 'Offen'}`,
      ),
    ];
    this.browser.downloadCsv(zeilen.join('\n'), 'rechnungen-export.csv');
    this.toast.success(`${rechnungen.length} Rechnungen exportiert`);
    this.ausgewaehlt.set(new Set());
  }

  protected istUeberfaellig(rechnung: Rechnung): boolean {
    if (rechnung.bezahlt || !rechnung.frist) return false;
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    return new Date(rechnung.frist) < heute;
  }

  protected tageUeberfaellig(rechnung: Rechnung): number {
    if (!rechnung.frist) return 0;
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const frist = new Date(rechnung.frist);
    return Math.floor((heute.getTime() - frist.getTime()) / MS_PER_DAY);
  }

  protected statusTyp(rechnung: Rechnung): StatusBadgeTyp {
    if (rechnung.bezahlt) return 'bezahlt';
    if (this.istUeberfaellig(rechnung)) return 'ueberfaellig';
    return 'offen';
  }
}
