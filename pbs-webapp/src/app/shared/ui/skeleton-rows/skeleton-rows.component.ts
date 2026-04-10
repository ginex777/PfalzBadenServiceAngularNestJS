import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-rows',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-list" aria-busy="true" aria-label="Wird geladen…">
      @for (_ of rows(); track $index) {
        <div class="skeleton-row">
          <div class="skeleton skeleton-cell skeleton-cell--wide"></div>
          <div class="skeleton skeleton-cell skeleton-cell--med"></div>
          <div class="skeleton skeleton-cell skeleton-cell--narrow"></div>
          <div class="skeleton skeleton-cell skeleton-cell--narrow"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-list { padding: 4px 0; }
    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--gray-100);
    }
    .skeleton-row:last-child { border-bottom: none; }
    .skeleton-cell {
      height: 14px;
      border-radius: var(--radius-xs);
      flex-shrink: 0;
    }
    .skeleton-cell--wide   { flex: 3; max-width: 240px; }
    .skeleton-cell--med    { flex: 2; max-width: 160px; }
    .skeleton-cell--narrow { flex: 1; max-width: 80px; }
  `],
})
export class SkeletonRowsComponent {
  readonly anzahl = input(5);
  protected rows() { return Array(this.anzahl()); }
}
