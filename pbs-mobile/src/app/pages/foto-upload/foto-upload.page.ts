import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { environment } from '../../../environments/environment';
import { MobileAuthService } from '../../core/auth.service';

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
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonCard, IonCardContent, IonToast],
  templateUrl: './foto-upload.page.html',
  styleUrl: './foto-upload.page.scss',
})
export class FotoUploadPage {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);

  preview = signal<string | null>(null);
  isLoading = signal(false);
  toastMessage = signal('');
  toastColor = signal<'success' | 'danger' | 'medium'>('medium');
  toastOpen = signal(false);

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      this.preview.set(`data:image/jpeg;base64,${image.base64String}`);
    } catch {
      this.showToast('Kamera-Zugriff verweigert oder abgebrochen.', 'danger');
    }
  }

  async pickFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      this.preview.set(`data:image/jpeg;base64,${image.base64String}`);
    } catch {
      this.showToast('Galerie-Zugriff verweigert oder abgebrochen.', 'danger');
    }
  }

  upload() {
    const b64 = this.preview();
    if (!b64) return;

    this.isLoading.set(true);

    const blob = base64ToBlob(b64);
    const form = new FormData();
    form.append('file', blob, `beleg_${Date.now()}.jpg`);

    this.http.post(`${environment.apiBase}/api/belege/upload`, form).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.preview.set(null);
        this.showToast('Beleg erfolgreich hochgeladen!', 'success');
      },
      error: (error: { error?: { message?: string } }) => {
        this.isLoading.set(false);
        this.showToast(
          error?.error?.message ?? 'Upload fehlgeschlagen. Bitte erneut versuchen.',
          'danger',
        );
      },
    });
  }

  discard() {
    this.preview.set(null);
    this.showToast('Vorschau verworfen.', 'medium');
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  private showToast(message: string, color: 'success' | 'danger' | 'medium'): void {
    this.toastMessage.set(message);
    this.toastColor.set(color);
    this.toastOpen.set(true);
  }
}
