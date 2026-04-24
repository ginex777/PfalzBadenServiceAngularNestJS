import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

const API_BASE_URL_KEY = 'api_base_url';

@Injectable({ providedIn: 'root' })
export class MobileApiConfigService {
  readonly apiBaseUrl = signal<string>(this.normalizeBaseUrl(environment.apiBase));

  async restore(): Promise<void> {
    const { value } = await Preferences.get({ key: API_BASE_URL_KEY });
    if (!value) return;
    this.apiBaseUrl.set(this.normalizeBaseUrl(value));
  }

  async setApiBaseUrl(url: string): Promise<void> {
    const normalized = this.normalizeBaseUrl(url);
    await Preferences.set({ key: API_BASE_URL_KEY, value: normalized });
    this.apiBaseUrl.set(normalized);
  }

  async clearApiBaseUrlOverride(): Promise<void> {
    await Preferences.remove({ key: API_BASE_URL_KEY });
    this.apiBaseUrl.set(this.normalizeBaseUrl(environment.apiBase));
  }

  private normalizeBaseUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return '';
    return trimmed.replace(/\/+$/, '');
  }
}

