import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { TaskType} from './aufgaben.models';
import { TASK_TYPE_LABELS } from './aufgaben.models';

type BadgeTone = 'neutral' | 'warning' | 'info' | 'success' | 'danger';

const TYPE_TONE: Record<TaskType, BadgeTone> = {
  MUELL: 'warning',
  CHECKLISTE: 'info',
  REINIGUNG: 'success',
  KONTROLLE: 'info',
  REPARATUR: 'danger',
  ZEITERFASSUNG: 'neutral',
  SONSTIGES: 'neutral',
};

@Component({
  selector: 'app-aufgaben-typ-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="type-badge type-badge--{{ tone() }}">
      {{ label() }}
    </span>
  `,
  styles: [
    `
      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        border: 1px solid var(--border-strong);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        background: var(--surface);
        color: var(--gray-700);
        white-space: nowrap;
      }
      .type-badge--neutral {
        border-color: rgba(148, 163, 184, 0.55);
        background: rgba(148, 163, 184, 0.12);
        color: var(--gray-700);
      }
      .type-badge--info {
        border-color: rgba(59, 130, 246, 0.45);
        background: rgba(59, 130, 246, 0.12);
        color: rgb(29, 78, 216);
      }
      .type-badge--warning {
        border-color: rgba(245, 158, 11, 0.45);
        background: rgba(245, 158, 11, 0.14);
        color: rgb(146, 64, 14);
      }
      .type-badge--success {
        border-color: rgba(16, 185, 129, 0.45);
        background: rgba(16, 185, 129, 0.12);
        color: rgb(4, 120, 87);
      }
      .type-badge--danger {
        border-color: rgba(239, 68, 68, 0.45);
        background: rgba(239, 68, 68, 0.12);
        color: rgb(153, 27, 27);
      }
    `,
  ],
})
export class AufgabenTypBadgeComponent {
  readonly type = input.required<TaskType>();

  protected readonly label = computed(() => TASK_TYPE_LABELS[this.type()]);
  protected readonly tone = computed(() => TYPE_TONE[this.type()]);
}
