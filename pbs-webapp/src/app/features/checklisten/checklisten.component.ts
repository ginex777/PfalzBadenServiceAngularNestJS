import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AuthService } from '../../core/services/auth.service';
import { ChecklistenFacade } from './checklisten.facade';
import { ChecklistField, ChecklistTemplate, ChecklistenService } from './checklisten.service';

type ChecklistFieldType = ChecklistField['type'];

interface EditableTemplate {
  id: number | null;
  name: string;
  description: string;
  isActive: boolean;
  fields: EditableField[];
}

interface EditableField {
  fieldId: string;
  label: string;
  type: ChecklistFieldType;
  required: boolean;
  helperText: string;
  optionsText: string;
}

function toEditableField(field: ChecklistField): EditableField {
  return {
    fieldId: field.fieldId,
    label: field.label,
    type: field.type,
    required: field.required ?? false,
    helperText: field.helperText ?? '',
    optionsText: (field.options ?? []).join('\n'),
  };
}

function fromEditableField(field: EditableField): ChecklistField {
  const options =
    field.type === 'select'
      ? field.optionsText
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : undefined;
  return {
    fieldId: field.fieldId.trim(),
    label: field.label.trim(),
    type: field.type,
    required: field.required,
    helperText: field.helperText.trim() || undefined,
    options: options && options.length ? options : undefined,
  };
}

function mapTemplateSnapshotItems(snapshot: unknown, answers: unknown): { label: string; value: string }[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const fieldsRaw = (snapshot as { fields?: unknown }).fields;
  const fields = Array.isArray(fieldsRaw) ? (fieldsRaw as Array<{ fieldId?: unknown; label?: unknown }>) : [];

  const answersArr = Array.isArray(answers) ? (answers as Array<{ fieldId?: unknown; value?: unknown }>) : [];
  const answerByFieldId = new Map<string, unknown>();
  for (const a of answersArr) {
    const fieldId = typeof a.fieldId === 'string' ? a.fieldId : '';
    if (!fieldId) continue;
    answerByFieldId.set(fieldId, a.value);
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—';
    if (typeof value === 'string') return value.trim() || '—';
    return '—';
  };

  return fields.map((f) => {
    const fieldId = typeof f.fieldId === 'string' ? f.fieldId : '';
    const label = typeof f.label === 'string' ? f.label : fieldId || 'Feld';
    return { label, value: formatValue(answerByFieldId.get(fieldId)) };
  });
}

@Component({
  selector: 'app-checklisten',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent, SkeletonRowsComponent, EmptyStateComponent, DatePipe, FormsModule],
  templateUrl: './checklisten.component.html',
  styleUrl: './checklisten.component.scss',
})
export class ChecklistenComponent implements OnInit {
  protected readonly facade = inject(ChecklistenFacade);
  private readonly auth = inject(AuthService);
  private readonly service = inject(ChecklistenService);

  protected readonly isAdmin = computed(() => this.auth.currentUser()?.rolle === 'admin');

  protected readonly detailItems = computed(() => {
    const row = this.facade.selectedSubmission();
    if (!row) return [];
    return mapTemplateSnapshotItems(row.templateSnapshot, row.answers);
  });

  // Admin template editor (minimal MVP)
  protected readonly adminTemplates = signal<ChecklistTemplate[]>([]);
  protected readonly adminTemplatesLoading = signal(false);
  protected readonly adminTemplatesError = signal<string | null>(null);
  protected readonly editing = signal<EditableTemplate | null>(null);
  protected readonly saving = signal(false);

  ngOnInit(): void {
    this.facade.loadInitial();
    if (this.isAdmin()) this.loadAdminTemplates();
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
    this.facade.createPdf(submissionId, (url) => window.open(url, '_blank', 'noopener,noreferrer'));
  }

  // ── Admin template editor ───────────────────────────────────────────────────
  protected loadAdminTemplates(): void {
    this.adminTemplatesLoading.set(true);
    this.adminTemplatesError.set(null);
    this.service
      .loadTemplatesPage({ page: 1, pageSize: 200 })
      .pipe(finalize(() => this.adminTemplatesLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.adminTemplates.set(res.data);
          if (!this.editing()) {
            const first = res.data.at(0) ?? null;
            if (first) this.startEdit(first);
          }
        },
        error: (err: { error?: { message?: string } }) => {
          this.adminTemplatesError.set(err?.error?.message ?? 'Templates konnten nicht geladen werden.');
        },
      });
  }

  protected startCreate(): void {
    this.editing.set({
      id: null,
      name: '',
      description: '',
      isActive: true,
      fields: [{ fieldId: '', label: '', type: 'boolean', required: false, helperText: '', optionsText: '' }],
    });
  }

  protected startEdit(t: ChecklistTemplate): void {
    this.editing.set({
      id: t.id,
      name: t.name,
      description: t.description ?? '',
      isActive: t.isActive,
      fields: (t.fields ?? []).map(toEditableField),
    });
  }

  protected addField(): void {
    const current = this.editing();
    if (!current) return;
    this.editing.set({
      ...current,
      fields: [
        ...current.fields,
        { fieldId: '', label: '', type: 'boolean', required: false, helperText: '', optionsText: '' },
      ],
    });
  }

  protected removeField(index: number): void {
    const current = this.editing();
    if (!current) return;
    if (current.fields.length <= 1) return;
    this.editing.set({
      ...current,
      fields: current.fields.filter((_, i) => i !== index),
    });
  }

  protected saveTemplate(): void {
    const current = this.editing();
    if (!current) return;

    const fields = current.fields.map(fromEditableField).filter((f) => f.fieldId && f.label);
    if (!current.name.trim()) {
      this.adminTemplatesError.set('Name ist erforderlich.');
      return;
    }
    if (fields.length === 0) {
      this.adminTemplatesError.set('Mindestens ein Feld ist erforderlich.');
      return;
    }

    this.saving.set(true);
    this.adminTemplatesError.set(null);

    const request = {
      name: current.name.trim(),
      description: current.description.trim() || undefined,
      isActive: current.isActive,
      fields,
    };

    const done = () => {
      this.saving.set(false);
      this.loadAdminTemplates();
    };

    if (current.id == null) {
      this.service
        .createTemplate(request)
        .pipe(finalize(done))
        .subscribe({
          next: (created) => {
            this.startEdit(created);
          },
          error: (err: { error?: { message?: string } }) => {
            this.adminTemplatesError.set(err?.error?.message ?? 'Speichern fehlgeschlagen.');
          },
        });
      return;
    }

    this.service
      .updateTemplate(current.id, request)
      .pipe(finalize(done))
      .subscribe({
        next: (updated) => {
          this.startEdit(updated);
        },
        error: (err: { error?: { message?: string } }) => {
          this.adminTemplatesError.set(err?.error?.message ?? 'Speichern fehlgeschlagen.');
        },
      });
  }
}

