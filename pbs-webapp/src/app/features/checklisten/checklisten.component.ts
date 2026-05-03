import type {
  OnInit} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AuthService } from '../../core/services/auth.service';
import { ChecklistenFacade } from './checklisten.facade';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { BrowserService } from '../../core/services/browser.service';
import { ChecklistenTemplateEditorComponent } from './components/template-editor/checklisten-template-editor.component';

export interface DetailItem {
  label: string;
  value: string;
  evidenceId?: number;
}

function mapTemplateSnapshotItems(
  snapshot: unknown,
  answers: unknown,
): DetailItem[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const fieldsRaw = (snapshot as { fields?: unknown }).fields;
  const fields = Array.isArray(fieldsRaw)
    ? (fieldsRaw as Array<{ fieldId?: unknown; label?: unknown; type?: unknown }>)
    : [];

  const answersArr = Array.isArray(answers)
    ? (answers as Array<{ fieldId?: unknown; value?: unknown }>)
    : [];
  const answerByFieldId = new Map<string, unknown>();
  for (const a of answersArr) {
    const fieldId = typeof a.fieldId === 'string' ? a.fieldId : '';
    if (!fieldId) continue;
    answerByFieldId.set(fieldId, a.value);
  }

  return fields.map((f) => {
    const fieldId = typeof f.fieldId === 'string' ? f.fieldId : '';
    const label = typeof f.label === 'string' ? f.label : fieldId || 'Feld';
    const type = typeof f.type === 'string' ? f.type : undefined;
    const raw = answerByFieldId.get(fieldId);

    if (type === 'foto' && typeof raw === 'string' && raw.trim()) {
      const id = Number(raw.trim());
      return { label, value: 'Foto ansehen', evidenceId: Number.isFinite(id) ? id : undefined };
    }

    let value: string;
    if (raw === null || raw === undefined) value = '—';
    else if (typeof raw === 'boolean') value = raw ? 'Ja' : 'Nein';
    else if (typeof raw === 'number') value = Number.isFinite(raw) ? String(raw) : '—';
    else if (typeof raw === 'string') value = raw.trim() || '—';
    else value = '—';

    return { label, value };
  });
}

@Component({
  selector: 'app-checklisten',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent, SkeletonRowsComponent, EmptyStateComponent, DatePipe, ModalComponent, ChecklistenTemplateEditorComponent],
  templateUrl: './checklisten.component.html',
  styleUrl: './checklisten.component.scss',
})
export class ChecklistenComponent implements OnInit {
  protected readonly facade = inject(ChecklistenFacade);
  private readonly auth = inject(AuthService);
  private readonly browser = inject(BrowserService);

  protected readonly isAdmin = computed(() => this.auth.currentUser()?.rolle === 'admin');

  protected readonly detailItems = computed(() => {
    const row = this.facade.selectedSubmission();
    if (!row) return [];
    return mapTemplateSnapshotItems(row.templateSnapshot, row.answers);
  });

  protected evidenceUrl(id: number): string {
    return `/api/nachweise/${id}/download?inline=1`;
  }

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

  protected onTemplateFilterChanged(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const raw = target.value.trim();
    if (!raw) {
      this.facade.setTemplateFilter(null);
      return;
    }
    const parsed = Number(raw);
    this.facade.setTemplateFilter(Number.isFinite(parsed) ? parsed : null);
  }

  protected reload(): void {
    this.facade.reload();
  }

  protected loadMore(): void {
    this.facade.loadNextPage();
  }

  protected selectSubmission(id: number): void {
    this.facade.selectSubmission(id);
  }

  protected clearSelection(): void {
    this.facade.selectSubmission(null);
  }

  protected openPdf(submissionId: number): void {
    this.facade.createPdf(submissionId, (url) => this.browser.openUrl(url));
  }
}
