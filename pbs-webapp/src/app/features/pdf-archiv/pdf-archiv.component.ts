import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PdfArchivFacade } from './pdf-archiv.facade';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { PaginierungComponent } from '../../shared/ui/paginierung/paginierung.component';
import { PdfArchivFilter, PDF_TYP_LABELS } from './pdf-archiv.models';
import { datumFormatieren } from '../../core/utils/format.utils';

@Component({
  selector: 'app-pdf-archiv',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent, EmptyStateComponent, SkeletonRowsComponent, PaginierungComponent],
  templateUrl: './pdf-archiv.component.html',
  styleUrl: './pdf-archiv.component.scss',
})
export class PdfArchivComponent implements OnInit {
  protected readonly facade = inject(PdfArchivFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly typLabels = PDF_TYP_LABELS;
  protected readonly datumFormatieren = datumFormatieren;

  protected readonly filterOptionen: { id: PdfArchivFilter; label: string }[] = [
    { id: 'alle', label: 'Alle' },
    { id: 'rechnung', label: 'Rechnungen' },
    { id: 'angebot', label: 'Angebote' },
    { id: 'euer', label: 'EÜR' },
    { id: 'muellplan', label: 'Müllplan' },
    { id: 'hausmeister', label: 'Hausmeister' },
  ];

  ngOnInit(): void {
    // Deep-link support: ?typ=hausmeister&q=Max (legacy: ?empf=Max)
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? Number(params['page']) : 1;
      const pageSize = params['pageSize'] ? Number(params['pageSize']) : 25;
      const q = (params['q'] ?? params['empf'] ?? '') as string;
      const typ = (params['typ'] ?? 'alle') as PdfArchivFilter;
      this.facade.applyQuery({
        page: Number.isFinite(page) ? page : 1,
        pageSize: Number.isFinite(pageSize) ? pageSize : 25,
        q,
        typ,
      });
    });
  }

  protected onFilterChange(event: Event): void {
    const typ = (event.target as HTMLSelectElement).value as PdfArchivFilter;
    this.router.navigate([], {
      queryParams: { typ: typ === 'alle' ? null : typ, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected onSearchTermChange(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.router.navigate([], {
      queryParams: { q: q || null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  protected onPageSizeChange(pageSize: number): void {
    this.router.navigate([], {
      queryParams: { pageSize, page: 1 },
      queryParamsHandling: 'merge',
    });
  }
}
