import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { tap } from 'rxjs/operators';
import { from, switchMap } from 'rxjs';

// Change to your production API URL before building
export const API_BASE = 'http://localhost:3000';

export interface AuthUser {
  email: string;
  rolle: string;
  mitarbeiterId?: number;
}

@Injectable({ providedIn: 'root' })
export class MobileAuthService {
  private readonly http = new HttpClient(null as any); // injected via DI

  readonly accessToken = signal<string | null>(null);
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoggedIn = computed(() => !!this.accessToken());

  constructor(private _http: HttpClient) {
    this._restoreSession();
  }

  private async _restoreSession() {
    const { value: token } = await Preferences.get({ key: 'access_token' });
    const { value: userRaw } = await Preferences.get({ key: 'auth_user' });
    if (token) this.accessToken.set(token);
    if (userRaw) {
      try { this.currentUser.set(JSON.parse(userRaw)); } catch { /**/ }
    }
  }

  login(email: string, password: string) {
    return this._http.post<{ accessToken: string; refreshToken: string; email: string; rolle: string }>(
      `${API_BASE}/api/auth/login`,
      { email, password },
    ).pipe(
      tap(async res => {
        await Preferences.set({ key: 'access_token', value: res.accessToken });
        await Preferences.set({ key: 'refresh_token', value: res.refreshToken });
        const user: AuthUser = { email: res.email, rolle: res.rolle };
        await Preferences.set({ key: 'auth_user', value: JSON.stringify(user) });
        this.accessToken.set(res.accessToken);
        this.currentUser.set(user);
      }),
    );
  }

  async logout() {
    const { value: refresh } = await Preferences.get({ key: 'refresh_token' });
    if (refresh) {
      this._http.post(`${API_BASE}/api/auth/logout`, { refreshToken: refresh }).subscribe();
    }
    await Preferences.remove({ key: 'access_token' });
    await Preferences.remove({ key: 'refresh_token' });
    await Preferences.remove({ key: 'auth_user' });
    this.accessToken.set(null);
    this.currentUser.set(null);
  }
}
