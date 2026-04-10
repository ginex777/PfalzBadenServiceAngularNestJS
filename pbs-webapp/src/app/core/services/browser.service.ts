import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserService {
  openUrl(url: string, target = '_blank'): void {
    window.open(url, target);
  }

  async copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }
}
