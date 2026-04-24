import { Component, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
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
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { MobileAuthService } from '../../core/auth.service';
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
  protected readonly context = inject(ObjectContextService);
  private readonly evidence = inject(EvidenceService);

  protected readonly selectedObjectId = this.context.selectedObjectId;
  protected readonly note = signal('');
  protected readonly previewDataUrl = signal<string | null>(null);
  protected readonly isUploading = signal(false);

  protected readonly canUpload = computed(() => {
    return !!this.previewDataUrl() && !!this.context.selectedObjectId() && !this.isUploading();
  });

  protected readonly toastMessage = signal('');
  protected readonly toastColor = signal<'success' | 'danger' | 'medium'>('medium');
  protected readonly toastOpen = signal(false);

  ionViewWillEnter(): void {
    this.context.ensureObjectsLoaded();
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  protected async takePhoto(): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      if (!image.base64String) return;
      const mimeType = `image/${image.format ?? 'jpeg'}`;
      this.previewDataUrl.set(`data:${mimeType};base64,${image.base64String}`);
    } catch {
      this.showToast('Kamera-Zugriff verweigert oder abgebrochen.', 'danger');
    }
  }

  protected async pickFromGallery(): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      if (!image.base64String) return;
      const mimeType = `image/${image.format ?? 'jpeg'}`;
      this.previewDataUrl.set(`data:${mimeType};base64,${image.base64String}`);
    } catch {
      this.showToast('Galerie-Zugriff verweigert oder abgebrochen.', 'danger');
    }
  }

  protected upload(): void {
    const dataUrl = this.previewDataUrl();
    const objectId = this.context.selectedObjectId();
    if (!dataUrl || !objectId) return;

    this.isUploading.set(true);

    const mimeType = dataUrl.slice(5).split(';')[0] || 'image/jpeg';
    const blob = base64ToBlob(dataUrl, mimeType);
    const fileExtension = mimeType.split('/')[1] ?? 'jpg';
    const filename = `nachweis_${Date.now()}.${fileExtension}`;

    this.evidence.upload({ objectId, note: this.note(), photo: blob, filename }).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.previewDataUrl.set(null);
        this.note.set('');
        this.showToast('Nachweis erfolgreich hochgeladen!', 'success');
      },
      error: (error: { error?: { message?: string } }) => {
        this.isUploading.set(false);
        this.showToast(
          error?.error?.message ?? 'Upload fehlgeschlagen. Bitte erneut versuchen.',
          'danger',
        );
      },
    });
  }

  protected discard(): void {
    this.previewDataUrl.set(null);
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
}
