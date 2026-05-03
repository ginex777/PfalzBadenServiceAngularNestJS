import { Component, DestroyRef, computed, effect, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MobileAuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/api-error';
import { ObjectContextService } from '../../core/object-context.service';
import { EvidenceService } from '../../core/evidence.service';
import { PhotoCaptureService, isCameraCancel } from '../../core/photo-capture.service';
import { ObjektKontextComponent } from '../../shared/ui/objekt-kontext/objekt-kontext.component';

@Component({
  selector: 'app-foto-upload',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonTextarea,
    IonSpinner,
    IonToast,
    ObjektKontextComponent,
  ],
  templateUrl: './foto-upload.page.html',
  styleUrl: './foto-upload.page.scss',
})
export class FotoUploadPage {
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly context = inject(ObjectContextService);
  private readonly evidence = inject(EvidenceService);
  private readonly photoCapture = inject(PhotoCaptureService);

  protected readonly selectedObjectId = this.context.selectedObjectId;
  protected readonly note = signal('');
  protected readonly previewDataUrl = signal<string | null>(null);
  protected readonly previewBlob = signal<Blob | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly uploadFailed = signal(false);

  protected readonly canUpload = computed(() => {
    return !!this.previewDataUrl() && !!this.context.selectedObjectId() && !this.isUploading();
  });

  protected readonly toastMessage = signal('');
  protected readonly toastColor = signal<'success' | 'danger' | 'medium'>('medium');
  protected readonly toastOpen = signal(false);

  private readonly _sessionResetEffect = effect(() => {
    this.auth.sessionResetVersion();
    this.resetPageState();
  });

  ionViewWillEnter(): void {
    this.context.ensureObjectsLoaded();
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  protected async takePhoto(): Promise<void> {
    try {
      const result = await this.photoCapture.captureFromCamera();
      if (!result) return;
      this.previewDataUrl.set(result.dataUrl);
      this.previewBlob.set(result.blob);
      this.uploadFailed.set(false);
    } catch (err) {
      if (!isCameraCancel(err)) {
        this.showToast('Kamera-Zugriff verweigert.', 'danger');
      }
    }
  }

  protected async pickFromGallery(): Promise<void> {
    try {
      const result = await this.photoCapture.pickFromGallery();
      if (!result) return;
      this.previewDataUrl.set(result.dataUrl);
      this.previewBlob.set(result.blob);
      this.uploadFailed.set(false);
    } catch (err) {
      if (!isCameraCancel(err)) {
        this.showToast('Galerie-Zugriff verweigert.', 'danger');
      }
    }
  }

  protected upload(): void {
    const blob = this.previewBlob();
    const dataUrl = this.previewDataUrl();
    const objectId = this.context.selectedObjectId();
    if (!blob || !dataUrl || !objectId) return;

    this.isUploading.set(true);
    this.uploadFailed.set(false);

    const mimeType = dataUrl.slice(5).split(';')[0] || 'image/jpeg';
    const fileExtension = mimeType.split('/')[1] ?? 'jpg';
    const filename = `nachweis_${Date.now()}.${fileExtension}`;

    this.evidence.upload({ objectId, note: this.note(), photo: blob, filename }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.previewDataUrl.set(null);
        this.previewBlob.set(null);
        this.note.set('');
        this.uploadFailed.set(false);
        this.showToast('Nachweis erfolgreich hochgeladen!', 'success');
      },
      error: (error: unknown) => {
        this.isUploading.set(false);
        this.uploadFailed.set(true);
        this.showToast(
          getApiErrorMessage(error) ?? 'Upload fehlgeschlagen. Bitte erneut versuchen.',
          'danger',
        );
      },
    });
  }

  protected discard(): void {
    this.previewDataUrl.set(null);
    this.previewBlob.set(null);
    this.uploadFailed.set(false);
    this.showToast('Vorschau verworfen.', 'medium');
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  protected onNoteChanged(ev: CustomEvent<{ value?: string | null }>): void {
    this.note.set(ev.detail.value ?? '');
  }

  private showToast(message: string, color: 'success' | 'danger' | 'medium'): void {
    this.toastMessage.set(message);
    this.toastColor.set(color);
    this.toastOpen.set(true);
  }

  private resetPageState(): void {
    this.note.set('');
    this.previewDataUrl.set(null);
    this.previewBlob.set(null);
    this.isUploading.set(false);
    this.uploadFailed.set(false);
    this.toastMessage.set('');
    this.toastColor.set('medium');
    this.toastOpen.set(false);
  }
}
