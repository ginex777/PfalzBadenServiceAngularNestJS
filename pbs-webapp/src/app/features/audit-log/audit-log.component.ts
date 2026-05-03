import type { OnInit} from '@angular/core';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuditLogFacade } from './audit-log.facade';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { PaginierungComponent } from '../../shared/ui/paginierung/paginierung.component';
import type { AuditAktion} from './audit-log.models';
import { AKTION_LABELS, AKTION_KLASSEN, TABELLEN_LABELS } from './audit-log.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent, EmptyStateComponent, SkeletonRowsComponent, PaginierungComponent],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit {
  protected readonly facade = inject(AuditLogFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly aktionLabels = AKTION_LABELS;
  protected readonly aktionKlassen = AKTION_KLASSEN;
  protected readonly tabellenLabels = TABELLEN_LABELS;

  protected readonly aktionOptionen: Array<{ id: AuditAktion; label: string }> = [
    { id: 'alle', label: 'Alle Aktionen' },
    { id: 'CREATE', label: 'Erstellt' },
    { id: 'UPDATE', label: 'Geändert' },
    { id: 'DELETE', label: 'Gelöscht' },
  ];

  ngOnInit(): void {
    this.facade.init();
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const page = params['page'] ? Number(params['page']) : 1;
      const pageSize = params['pageSize'] ? Number(params['pageSize']) : 25;
      const q = (params['q'] ?? '') as string;
      const aktion = (params['aktion'] ?? 'alle') as AuditAktion;
      const tabelle = (params['tabelle'] ?? '') as string;
      this.facade.applyQuery({
        page: Number.isFinite(page) ? page : 1,
        pageSize: Number.isFinite(pageSize) ? pageSize : 25,
        q,
        aktion,
        tabelle,
      });
    });
  }

  protected onSearchTermChange(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.router.navigate([], {
      queryParams: { q: q || null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected onActionChange(event: Event): void {
    const aktion = (event.target as HTMLSelectElement).value as AuditAktion;
    this.router.navigate([], {
      queryParams: { aktion: aktion === 'alle' ? null : aktion, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected onTableChange(event: Event): void {
    const tabelle = (event.target as HTMLSelectElement).value;
    this.router.navigate([], {
      queryParams: { tabelle: tabelle || null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected onPageChange(page: number): void {
    this.router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });
  }

  protected onPageSizeChange(pageSize: number): void {
    this.router.navigate([], { queryParams: { pageSize, page: 1 }, queryParamsHandling: 'merge' });
  }

  protected zeitstempelFormatieren(ts: string): string {
    return new Date(ts).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  protected tabelleLabel(tabelle: string): string {
    return this.tabellenLabels[tabelle] ?? tabelle;
  }

  protected wertKuerzen(wert: unknown): string {
    if (wert == null) return '–';
    const s = typeof wert === 'string' ? wert : JSON.stringify(wert);
    try {
      const obj = JSON.parse(s);
      return JSON.stringify(obj, null, 0).slice(0, 120) + (s.length > 120 ? '…' : '');
    } catch {
      return s.slice(0, 120);
    }
  }
}
