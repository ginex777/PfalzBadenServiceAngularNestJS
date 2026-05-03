import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const MAX_DIMENSION = 1920;

export interface CapturedPhoto {
  blob: Blob;
  dataUrl: string;
}

export function isCameraCancel(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /cancel|dismiss/i.test(msg);
}

export function base64ToBlob(dataUrl: string, mimeType = 'image/jpeg'): Blob {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i += 1) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

async function resizeDataUrl(dataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(mimeType, 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

@Injectable({ providedIn: 'root' })
export class PhotoCaptureService {
  async captureFromCamera(): Promise<CapturedPhoto | null> {
    return this.capture(CameraSource.Camera);
  }

  async pickFromGallery(): Promise<CapturedPhoto | null> {
    return this.capture(CameraSource.Photos);
  }

  async captureWithPrompt(): Promise<CapturedPhoto | null> {
    return this.capture(CameraSource.Prompt);
  }

  private async capture(source: CameraSource): Promise<CapturedPhoto | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source,
      });
      if (!image.base64String) return null;
      const mimeType = `image/${image.format ?? 'jpeg'}`;
      const rawDataUrl = `data:${mimeType};base64,${image.base64String}`;
      const dataUrl = await resizeDataUrl(rawDataUrl, mimeType);
      const blob = base64ToBlob(dataUrl, mimeType);
      return { blob, dataUrl };
    } catch (err) {
      if (isCameraCancel(err)) return null;
      throw err;
    }
  }
}
