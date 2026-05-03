import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BrowserService {
  private readonly http = inject(HttpClient);

  openUrl(url: string, target = '_blank'): void {
    const rel = target === '_blank' ? 'noopener,noreferrer' : '';
    window.open(url, target, rel);
  }

  async copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }

  /** Lädt eine geschützte URL per HttpClient (JWT wird automatisch mitgeschickt)
   *  und öffnet den Blob in einem neuen Tab. Für PDFs, CSV und Excel-Downloads. */
  downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async blobOeffnen(url: string): Promise<void> {
    const blob = await firstValueFrom(this.http.get(url, { responseType: 'blob' }));
    const objectUrl = URL.createObjectURL(blob);
    const win = window.open(objectUrl, '_blank');
    // Object-URL nach kurzer Zeit freigeben
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    if (!win) {
      // Fallback: direkter Download wenn Popup geblockt
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = url.split('/').pop() ?? 'download';
      a.click();
    }
  }
}
