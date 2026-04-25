import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { MobileAuthService } from '../../core/auth.service';
import { ChecklistField, ChecklistService, ChecklistTemplate } from '../../core/checklist.service';
import { ObjectContextService } from '../../core/object-context.service';
import { EvidenceService } from '../../core/evidence.service';
import { ObjektKontextComponent } from '../../shared/ui/objekt-kontext/objekt-kontext.component';

function base64ToBlob(dataUrl: string, mimeType = 'image/jpeg'): Blob {
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i += 1) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

type AnswerValue = string | number | boolean | null;

@Component({
  selector: 'app-checklisten',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonBadge,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
    IonInput,
    IonToggle,
    IonToast,
    ObjektKontextComponent,
  ],
  templateUrl: './checklisten.page.html',
  styleUrl: './checklisten.page.scss',
})
export class ChecklistenPage implements OnInit {
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);
  protected readonly context = inject(ObjectContextService);
  private readonly checklist = inject(ChecklistService);
  private readonly evidence = inject(EvidenceService);

  readonly templates = signal<ChecklistTemplate[]>([]);
  readonly selectedObjectId = this.context.selectedObjectId;
  readonly selectedTemplateId = signal<number | null>(null);
  readonly note = signal('');

  readonly templatesLoading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly answers = signal<Record<string, AnswerValue>>({});
  readonly photoUploading = signal<Record<string, boolean>>({});
  readonly photoErrors = signal<Record<string, string | null>>({});

  private readonly lastLoadedObjectId = signal<number | null>(null);
  private readonly _templateEffect = effect(() => {
    const objectId = this.selectedObjectId();
    if (objectId == null) {
      this.lastLoadedObjectId.set(null);
      this.templates.set([]);
      return;
    }
    if (this.lastLoadedObjectId() === objectId) return;
    this.lastLoadedObjectId.set(objectId);
    this.loadTemplatesForObject(objectId);
  });

  readonly selectedTemplate = computed(() => {
    const id = this.selectedTemplateId();
    if (id == null) return null;
    return this.templates().find((t) => t.id === id) ?? null;
  });

  readonly fields = computed<ChecklistField[]>(() => this.selectedTemplate()?.fields ?? []);

  readonly canSubmit = computed(() => {
    const uploading = this.photoUploading();
    const anyUploading = Object.values(uploading).some((v) => v);
    return !!this.selectedObjectId() && !!this.selectedTemplateId() && !this.submitting() && !anyUploading;
  });

  readonly toastOpen = signal(false);
  readonly toastMessage = signal('');
  readonly toastTone = signal<'success' | 'error' | 'info'>('info');

  ngOnInit(): void {
    this.context.ensureObjectsLoaded();
  }

  ionViewWillEnter(): void {
    const objectId = this.selectedObjectId();
    if (objectId) {
      this.loadTemplatesForObject(objectId);
    }
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  protected reload(): void {
    const objectId = this.selectedObjectId();
    if (objectId) {
      this.loadTemplatesForObject(objectId);
    }
  }

  private loadTemplatesForObject(objectId: number): void {
    this.errorMessage.set(null);
    this.templatesLoading.set(true);
    this.checklist.getTemplatesForObject(objectId).subscribe({
      next: (templates) => {
        this.templates.set(templates);
        if (this.selectedTemplateId() == null) {
          this.selectedTemplateId.set(templates.at(0)?.id ?? null);
          this.resetAnswers();
        }
        this.templatesLoading.set(false);
      },
      error: () => {
        this.templatesLoading.set(false);
        this.errorMessage.set('Checklisten konnten nicht geladen werden.');
      },
    });
  }

  protected onTemplateChanged(value: unknown): void {
    const parsed = typeof value === 'number' ? value : value != null ? Number(value) : NaN;
    this.selectedTemplateId.set(Number.isFinite(parsed) ? parsed : null);
    this.resetAnswers();
  }

  protected setTextAnswer(fieldId: string, value: string): void {
    this.answers.update((prev) => ({ ...prev, [fieldId]: value }));
  }

  protected setNumberAnswer(fieldId: string, value: string): void {
    const parsed = Number(value);
    this.answers.update((prev) => ({
      ...prev,
      [fieldId]: Number.isFinite(parsed) ? parsed : null,
    }));
  }

  protected setBooleanAnswer(fieldId: string, value: boolean): void {
    this.answers.update((prev) => ({ ...prev, [fieldId]: value }));
  }

  protected setSelectAnswer(fieldId: string, value: unknown): void {
    const selected = typeof value === 'string' ? value : value != null ? String(value) : '';
    this.answers.update((prev) => ({ ...prev, [fieldId]: selected.trim() ? selected.trim() : null }));
  }

  protected fieldValue(fieldId: string): AnswerValue {
    return this.answers()[fieldId] ?? null;
  }

  protected async uploadFoto(fieldId: string): Promise<void> {
    const objectId = this.selectedObjectId();
    if (!objectId) {
      this.setToast('error', 'Bitte zuerst ein Objekt auswählen.');
      return;
    }

    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        quality: 80,
      });

      if (!photo.dataUrl) return;

      const blob = base64ToBlob(photo.dataUrl);
      const filename = `checklist-${Date.now()}.jpg`;

      this.photoUploading.update((p) => ({ ...p, [fieldId]: true }));

      this.evidence.upload({ objectId, photo: blob, filename }).subscribe({
        next: (ev) => {
          this.answers.update((prev) => ({ ...prev, [fieldId]: String(ev.id) }));
          this.photoUploading.update((p) => ({ ...p, [fieldId]: false }));
          this.setToast('success', 'Foto gespeichert.');
        },
        error: () => {
          this.photoUploading.update((p) => ({ ...p, [fieldId]: false }));
          this.setToast('error', 'Foto-Upload fehlgeschlagen.');
        },
      });
    } catch {
      // user cancelled camera
    }
  }

  protected onNoteInput(ev: CustomEvent<{ value?: string | null }>): void {
    this.note.set(ev.detail.value ?? '');
  }

  protected onTextAnswerInput(
    fieldId: string,
    ev: CustomEvent<{ value?: string | null }>,
  ): void {
    this.setTextAnswer(fieldId, ev.detail.value ?? '');
  }

  protected onNumberAnswerInput(
    fieldId: string,
    ev: CustomEvent<{ value?: string | null }>,
  ): void {
    this.setNumberAnswer(fieldId, ev.detail.value ?? '');
  }

  protected submit(): void {
    const objectId = this.selectedObjectId();
    const template = this.selectedTemplate();
    if (!objectId || !template) {
      this.setToast('error', 'Bitte Objekt und Checkliste auswaehlen.');
      return;
    }

    const note = this.note().trim();
    const answers = template.fields.map((f) => ({
      fieldId: f.fieldId,
      value: this.fieldValue(f.fieldId),
    }));

    this.submitting.set(true);
    this.checklist
      .submitChecklist({
        objectId,
        templateId: template.id,
        note: note ? note : undefined,
        answers,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.setToast('success', 'Checkliste gespeichert.');
          this.note.set('');
          this.resetAnswers();
        },
        error: (error: { error?: { message?: string } }) => {
          this.submitting.set(false);
          this.setToast('error', error?.error?.message ?? 'Senden fehlgeschlagen.');
        },
      });
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  protected toastColor(): 'success' | 'danger' | 'medium' {
    if (this.toastTone() === 'success') return 'success';
    if (this.toastTone() === 'error') return 'danger';
    return 'medium';
  }

  private setToast(tone: 'success' | 'error' | 'info', message: string): void {
    this.toastTone.set(tone);
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }

  private resetAnswers(): void {
    const next: Record<string, AnswerValue> = {};
    for (const field of this.fields()) {
      if (field.type === 'boolean') next[field.fieldId] = false;
      else next[field.fieldId] = null;
    }
    this.answers.set(next);
    this.photoUploading.set({});
  }
}
