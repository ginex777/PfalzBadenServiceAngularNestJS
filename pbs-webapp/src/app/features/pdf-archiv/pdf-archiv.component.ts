import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PdfArchivFacade } from './pdf-archiv.facade';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { PdfArchivFilter, PDF_TYP_LABELS } from './pdf-archiv.models';
import { datumFormatieren } from '../../core/utils/format.utils';

@Component({
  selector: 'app-pdf-archiv',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent, EmptyStateComponent, SkeletonRowsComponent],
  templateUrl: './pdf-archiv.component.html',
  styleUrl: './pdf-archiv.component.scss',
})
export class PdfArchivComponent implements OnInit {
  protected readonly facade = inject(PdfArchivFacade);
  private readonly route = inject(ActivatedRoute);
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
    this.facade.ladeDaten();
    // Support deep-link query params: ?typ=hausmeister&empf=Max
    this.route.queryParams.subscribe((params) => {
      if (params['typ']) this.facade.filterSetzen(params['typ'] as PdfArchivFilter);
      if (params['empf']) this.facade.suchbegriffAktualisieren(params['empf']);
    });
  }

  protected filterSelectGeaendert(event: Event): void {
    this.facade.filterSetzen((event.target as HTMLSelectElement).value as PdfArchivFilter);
  }

  protected suchbegriffGeaendert(event: Event): void {
    this.facade.suchbegriffAktualisieren((event.target as HTMLInputElement).value);
  }
}
