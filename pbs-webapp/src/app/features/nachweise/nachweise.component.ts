import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { NachweiseFacade } from './nachweise.facade';

@Component({
  selector: 'app-nachweise',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent, SkeletonRowsComponent, EmptyStateComponent, DatePipe],
  templateUrl: './nachweise.component.html',
  styleUrl: './nachweise.component.scss',
})
export class NachweiseComponent implements OnInit {
  protected readonly facade = inject(NachweiseFacade);

  protected readonly objectLabelById = computed(() => {
    const map = new Map<number, string>();
    for (const o of this.facade.objects()) {
      map.set(o.id, o.name);
    }
    return map;
  });

  ngOnInit(): void {
    this.facade.loadInitial();
  }

  protected onObjectChanged(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const raw = target.value.trim();
    if (!raw) {
      this.facade.setObjectFilter(null);
      return;
    }
    const parsed = Number(raw);
    this.facade.setObjectFilter(Number.isFinite(parsed) ? parsed : null);
  }

  protected objectLabel(objectId: number): string {
    return this.objectLabelById().get(objectId) ?? `Objekt #${objectId}`;
  }

  protected reload(): void {
    this.facade.reload();
  }

  protected loadMore(): void {
    this.facade.loadNextPage();
  }
}
