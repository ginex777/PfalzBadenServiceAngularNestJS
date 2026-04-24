import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MobileRueckmeldungenFacade } from './mobile-rueckmeldungen.facade';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';

@Component({
  selector: 'app-mobile-rueckmeldungen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    PageTitleComponent,
    EmptyStateComponent,
    SkeletonRowsComponent,
  ],
  templateUrl: './mobile-rueckmeldungen.component.html',
  styleUrl: './mobile-rueckmeldungen.component.scss',
})
export class MobileRueckmeldungenComponent implements OnInit {
  protected readonly facade = inject(MobileRueckmeldungenFacade);

  ngOnInit(): void {
    this.facade.loadInitial();
  }

  protected reload(): void {
    this.facade.reload();
  }

  protected loadMore(): void {
    this.facade.loadNextPage();
  }

  protected onObjectChanged(e: Event): void {
    const value = (e.target as HTMLSelectElement).value;
    const objectId = value ? Number(value) : null;
    this.facade.setObjectFilter(Number.isFinite(objectId) ? objectId : null);
  }

  protected onKindChanged(e: Event): void {
    const value = (e.target as HTMLSelectElement).value;
    if (value === 'ALL' || value === 'EVIDENCE' || value === 'CHECKLIST') {
      this.facade.setKindFilter(value);
    }
  }
}
