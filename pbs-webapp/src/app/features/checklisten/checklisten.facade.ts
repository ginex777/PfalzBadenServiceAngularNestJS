import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Objekt } from '../../core/models';
import {
  ChecklistSubmissionDetail,
  ChecklistSubmissionListItem,
  ChecklistTemplate,
  ChecklistenService,
} from './checklisten.service';

@Injectable({ providedIn: 'root' })
export class ChecklistenFacade {
  private readonly service = inject(ChecklistenService);

  readonly objects = signal<Objekt[]>([]);
  readonly objectsLoading = signal(false);

  readonly templates = signal<ChecklistTemplate[]>([]);
  readonly templatesLoading = signal(false);

  readonly selectedObjectId = signal<number | null>(null);
  readonly selectedTemplateId = signal<number | null>(null);

  readonly submissions = signal<ChecklistSubmissionListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(100);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly hasMore = computed(() => this.submissions().length < this.total());

  readonly selectedSubmissionId = signal<number | null>(null);
  readonly selectedSubmission = signal<ChecklistSubmissionDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  loadInitial(): void {
    this.loadObjects();
    this.loadTemplates();
    this.reload();
  }

  reload(): void {
    this.page.set(1);
    this.submissions.set([]);
    this.total.set(0);
    this.loadPage(1);
  }

  loadNextPage(): void {
    if (!this.hasMore() || this.loading()) return;
    this.loadPage(this.page() + 1);
  }

  setObjectFilter(objectId: number | null): void {
    this.selectedObjectId.set(objectId);
    this.reload();
  }

  setTemplateFilter(templateId: number | null): void {
    this.selectedTemplateId.set(templateId);
    this.reload();
  }

  selectSubmission(id: number | null): void {
    this.selectedSubmissionId.set(id);
    this.selectedSubmission.set(null);
    this.detailError.set(null);
    if (id == null) return;

    this.detailLoading.set(true);
    this.service
      .loadSubmission(id)
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next: (row) => {
          this.selectedSubmission.set(row);
        },
        error: (err: { error?: { message?: string } }) => {
          this.detailError.set(err?.error?.message ?? 'Submission konnte nicht geladen werden.');
        },
      });
  }

  createPdf(submissionId: number, onUrl: (url: string) => void): void {
    this.service.createSubmissionPdf(submissionId).subscribe({
      next: (res) => onUrl(res.url),
      error: () => {
        // surface as detail error (keeps UI simple)
        this.detailError.set('PDF konnte nicht erstellt werden.');
      },
    });
  }

  private loadObjects(): void {
    this.objectsLoading.set(true);
    this.service
      .loadObjectsAll()
      .pipe(finalize(() => this.objectsLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.objects.set(rows);
          if (this.selectedObjectId() == null && rows.length > 0) {
            this.selectedObjectId.set(rows[0]!.id);
          }
        },
        error: () => {
          this.objects.set([]);
        },
      });
  }

  private loadTemplates(): void {
    this.templatesLoading.set(true);
    this.service
      .loadTemplatesAll()
      .pipe(finalize(() => this.templatesLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.templates.set(rows);
        },
        error: () => {
          this.templates.set([]);
        },
      });
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.service
      .loadSubmissionsPage({
        page,
        pageSize: this.pageSize(),
        objectId: this.selectedObjectId() ?? undefined,
        templateId: this.selectedTemplateId() ?? undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.page.set(res.page);
          this.pageSize.set(res.pageSize);
          this.total.set(res.total);
          this.submissions.update((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        },
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage.set(err?.error?.message ?? 'Checklisten konnten nicht geladen werden.');
        },
      });
  }
}

