import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { environment } from '../../../environments/environment';

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
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonButton],
  templateUrl: './foto-upload.page.html',
  styleUrl: './foto-upload.page.scss',
})
export class FotoUploadPage {
  private readonly http = inject(HttpClient);

  preview = signal<string | null>(null);
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      this.preview.set(`data:image/jpeg;base64,${image.base64String}`);
      this.successMessage.set('');
      this.errorMessage.set('');
    } catch {
      this.errorMessage.set('Kamera-Zugriff verweigert oder abgebrochen.');
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
      this.successMessage.set('');
      this.errorMessage.set('');
    } catch {
      this.errorMessage.set('Galerie-Zugriff verweigert oder abgebrochen.');
    }
  }

  upload() {
    const b64 = this.preview();
    if (!b64) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const blob = base64ToBlob(b64);
    const form = new FormData();
    form.append('file', blob, `beleg_${Date.now()}.jpg`);

    this.http.post(`${environment.apiBase}/api/belege/upload`, form).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.preview.set(null);
        this.successMessage.set('Beleg erfolgreich hochgeladen!');
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Upload fehlgeschlagen. Bitte erneut versuchen.');
      },
    });
  }

  discard() {
    this.preview.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
