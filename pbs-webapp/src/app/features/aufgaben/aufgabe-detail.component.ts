import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal, input, output, computed } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { BrowserService } from '../../core/services/browser.service';
import { TasksService } from './aufgaben.service';
import { AufgabenStatusBadgeComponent } from './aufgaben-status-badge.component';
import { AufgabenTypBadgeComponent } from './aufgaben-typ-badge.component';
import { TaskListItemApi, TaskStatus, TASK_STATUS_LABELS } from './aufgaben.models';

@Component({
  selector: 'app-aufgabe-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, AufgabenTypBadgeComponent, AufgabenStatusBadgeComponent],
  templateUrl: './aufgabe-detail.component.html',
  styleUrl: './aufgabe-detail.component.scss',
})
export class AufgabeDetailComponent {
  private readonly service = inject(TasksService);
  private readonly toast = inject(ToastService);
  private readonly browser = inject(BrowserService);

  readonly task = input.required<TaskListItemApi>();
  readonly canEdit = input.required<boolean>();

  readonly close = output<void>();
  readonly taskUpdated = output<TaskListItemApi>();

  protected readonly isSaving = signal(false);
  protected readonly editedStatus = signal<TaskStatus>('OFFEN');

  protected readonly statusOptions = computed(() =>
    (Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => ({
      status,
      label: TASK_STATUS_LABELS[status],
    })),
  );

  protected readonly person = computed(() => {
    const t = this.task();
    return t.employeeName ?? t.userEmail ?? '–';
  });

  protected readonly hasPhoto = computed(() => {
    const url = this.task().photoUrl;
    return Boolean(url && url.trim());
  });

  protected readonly hasComment = computed(() => {
    const comment = this.task().comment;
    return Boolean(comment && comment.trim());
  });

  constructor() {
    effect(() => {
      this.editedStatus.set(this.task().status);
    });
  }

  protected onStatusChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    this.editedStatus.set(target.value as TaskStatus);
  }

  protected saveStatus(): void {
    if (!this.canEdit()) return;
    const t = this.task();
    const nextStatus = this.editedStatus();
    if (nextStatus === t.status) return;

    this.isSaving.set(true);
    this.service.update(t.id, { status: nextStatus }).subscribe({
      next: (updated) => {
        this.toast.success('Status gespeichert.');
        this.isSaving.set(false);
        this.taskUpdated.emit(updated);
      },
      error: () => {
        this.toast.error('Status konnte nicht gespeichert werden.');
        this.isSaving.set(false);
        this.editedStatus.set(t.status);
      },
    });
  }

  protected openPhoto(): void {
    const url = this.task().photoUrl;
    if (!url) return;
    this.browser.openUrl(url);
  }

  protected formatDuration(minutes: number | null): string {
    if (minutes == null) return '–';
    const total = Math.max(0, Math.round(minutes));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h <= 0) return `${m}m`;
    if (m <= 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
}
