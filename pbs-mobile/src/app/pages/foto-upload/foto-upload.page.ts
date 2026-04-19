import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { environment } from '../../../environments/environment';


function base64ToBlob(dataUrl: string, mimeType = 'image/jpeg'): Blob {
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mimeType });
}

@Component({
  selector: 'app-foto-upload',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './foto-upload.page.html',
  styleUrl: './foto-upload.page.scss',
})
export class FotoUploadPage {
  private readonly http = inject(HttpClient);

  vorschau = signal<string | null>(null);
  laedt = signal(false);
  meldung = signal('');
  fehler = signal('');

  async fotoAufnehmen() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      this.vorschau.set(`data:image/jpeg;base64,${image.base64String}`);
      this.meldung.set('');
      this.fehler.set('');
    } catch (e) {
      this.fehler.set('Kamera-Zugriff verweigert oder abgebrochen.');
    }
  }

  async fotoAusGalerie() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      this.vorschau.set(`data:image/jpeg;base64,${image.base64String}`);
      this.meldung.set('');
      this.fehler.set('');
    } catch (e) {
      this.fehler.set('Galerie-Zugriff verweigert oder abgebrochen.');
    }
  }

  hochladen() {
    const b64 = this.vorschau();
    if (!b64) return;
    this.laedt.set(true);
    this.fehler.set('');

    const blob = base64ToBlob(b64);
    const form = new FormData();
    form.append('file', blob, `beleg_${Date.now()}.jpg`);

    this.http.post(`${environment.apiBase}/api/belege/upload`, form).subscribe({
      next: () => {
        this.laedt.set(false);
        this.vorschau.set(null);
        this.meldung.set('Beleg erfolgreich hochgeladen!');
        setTimeout(() => this.meldung.set(''), 4000);
      },
      error: () => {
        this.laedt.set(false);
        this.fehler.set('Upload fehlgeschlagen. Bitte erneut versuchen.');
      },
    });
  }

  verwerfen() {
    this.vorschau.set(null);
    this.meldung.set('');
    this.fehler.set('');
  }
}
