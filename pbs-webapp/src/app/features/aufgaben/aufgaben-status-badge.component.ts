import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { TaskStatus} from './aufgaben.models';
import { TASK_STATUS_LABELS } from './aufgaben.models';

type BadgeTone = 'neutral' | 'warning' | 'info' | 'success' | 'danger';

const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  OFFEN: 'warning',
  IN_BEARBEITUNG: 'info',
  ERLEDIGT: 'success',
  UEBERFAELLIG: 'danger',
  GEPRUEFT: 'success',
  ABGELEHNT: 'danger',
};

@Component({
  selector: 'app-aufgaben-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="status-badge status-badge--{{ tone() }}">{{ label() }}</span>`,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        border: 1px solid var(--border-strong);
        font-size: 0.75rem;
        font-weight: 600;
        background: var(--surface);
        white-space: nowrap;
      }
      .status-badge--neutral {
        border-color: rgba(148, 163, 184, 0.55);
        background: rgba(148, 163, 184, 0.12);
        color: var(--gray-700);
      }
      .status-badge--info {
        border-color: rgba(59, 130, 246, 0.45);
        background: rgba(59, 130, 246, 0.12);
        color: rgb(29, 78, 216);
      }
      .status-badge--warning {
        border-color: rgba(245, 158, 11, 0.45);
        background: rgba(245, 158, 11, 0.14);
        color: rgb(146, 64, 14);
      }
      .status-badge--success {
        border-color: rgba(16, 185, 129, 0.45);
        background: rgba(16, 185, 129, 0.12);
        color: rgb(4, 120, 87);
      }
      .status-badge--danger {
        border-color: rgba(239, 68, 68, 0.45);
        background: rgba(239, 68, 68, 0.12);
        color: rgb(153, 27, 27);
      }
    `,
  ],
})
export class AufgabenStatusBadgeComponent {
  readonly status = input.required<TaskStatus>();

  protected readonly label = computed(() => TASK_STATUS_LABELS[this.status()]);
  protected readonly tone = computed(() => STATUS_TONE[this.status()]);
}
