import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { getApiErrorMessage } from '../../../../core/api-error';
import { SkeletonRowsComponent } from '../../../../shared/ui/skeleton-rows/skeleton-rows.component';
import { ChecklistenFacade } from '../../checklisten.facade';
import type { ChecklistField, ChecklistTemplate } from '../../checklisten.service';
import { ChecklistenService } from '../../checklisten.service';

type ChecklistFieldType = ChecklistField['type'];

interface EditableTemplate {
  id: number | null;
  name: string;
  description: string;
  kategorie: string;
  isActive: boolean;
  fields: EditableField[];
  assignedObjectIds: number[];
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

@Component({
  selector: 'app-checklisten-template-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SkeletonRowsComponent],
  templateUrl: './checklisten-template-editor.component.html',
})
export class ChecklistenTemplateEditorComponent implements OnInit {
  protected readonly facade = inject(ChecklistenFacade);
  private readonly service = inject(ChecklistenService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly adminTemplates = signal<ChecklistTemplate[]>([]);
  protected readonly adminTemplatesLoading = signal(false);
  protected readonly adminTemplatesError = signal<string | null>(null);
  protected readonly editing = signal<EditableTemplate | null>(null);
  protected readonly saving = signal(false);

  ngOnInit(): void {
    this.loadAdminTemplates();
  }

  protected loadAdminTemplates(): void {
    this.adminTemplatesLoading.set(true);
    this.adminTemplatesError.set(null);
    this.service
      .loadTemplatesPage({ page: 1, pageSize: 200 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.adminTemplatesLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.adminTemplates.set(res.data);
          if (!this.editing()) {
            const first = res.data.at(0) ?? null;
            if (first) this.startEdit(first);
          }
        },
        error: (err: unknown) => {
          this.adminTemplatesError.set(
            getApiErrorMessage(err) ?? 'Templates konnten nicht geladen werden.',
          );
        },
      });
  }

  protected startCreate(): void {
    this.editing.set({
      id: null,
      name: '',
      description: '',
      kategorie: '',
      isActive: true,
      fields: [
        {
          fieldId: '',
          label: '',
          type: 'boolean',
          required: false,
          helperText: '',
          optionsText: '',
        },
      ],
      assignedObjectIds: [],
    });
  }

  protected startEdit(t: ChecklistTemplate): void {
    this.editing.set({
      id: t.id,
      name: t.name,
      description: t.description ?? '',
      kategorie: t.kategorie ?? '',
      isActive: t.isActive,
      fields: (t.fields ?? []).map(toEditableField),
      assignedObjectIds: t.assignedObjectIds ?? [],
    });
  }

  protected toggleObjectAssignment(objectId: number): void {
    const current = this.editing();
    if (!current) return;
    const ids = current.assignedObjectIds;
    const next = ids.includes(objectId) ? ids.filter((id) => id !== objectId) : [...ids, objectId];
    this.editing.set({ ...current, assignedObjectIds: next });
  }

  protected addField(): void {
    const current = this.editing();
    if (!current) return;
    this.editing.set({
      ...current,
      fields: [
        ...current.fields,
        {
          fieldId: '',
          label: '',
          type: 'boolean',
          required: false,
          helperText: '',
          optionsText: '',
        },
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
      kategorie: current.kategorie.trim() || undefined,
      isActive: current.isActive,
      fields,
    };

    const assignObjects = (templateId: number) => {
      this.service
        .assignObjectsToTemplate(templateId, current.assignedObjectIds)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    };

    const done = () => {
      this.saving.set(false);
      this.loadAdminTemplates();
    };

    if (current.id == null) {
      this.service
        .createTemplate(request)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(done),
        )
        .subscribe({
          next: (created) => {
            assignObjects(created.id);
            this.startEdit(created);
          },
          error: (err: unknown) => {
            this.adminTemplatesError.set(getApiErrorMessage(err) ?? 'Speichern fehlgeschlagen.');
          },
        });
      return;
    }

    this.service
      .updateTemplate(current.id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(done),
      )
      .subscribe({
        next: (updated) => {
          assignObjects(updated.id);
          this.startEdit(updated);
        },
        error: (err: unknown) => {
          this.adminTemplatesError.set(getApiErrorMessage(err) ?? 'Speichern fehlgeschlagen.');
        },
      });
  }
}
