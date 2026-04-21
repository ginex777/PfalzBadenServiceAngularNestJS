import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export const API_BASE = environment.apiBase;

export interface AuthUser {
  email: string;
  rolle: string;
  mitarbeiterId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MobileAuthService {
  readonly accessToken = signal<string | null>(null);
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoggedIn = computed(() => !!this.accessToken());

  constructor(private readonly http: HttpClient) {}

  async restoreSession(): Promise<void> {
    const { value: token } = await Preferences.get({ key: 'access_token' });
    const { value: userRaw } = await Preferences.get({ key: 'auth_user' });
    if (token) this.accessToken.set(token);
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw) as AuthUser;
        this.currentUser.set(user);
      } catch {
        /**/
      }
    }
  }

  login(email: string, password: string) {
    return this.http
      .post<{
        accessToken: string;
        refreshToken: string;
        email: string;
        rolle: string;
        mitarbeiterId: number | null;
      }>(`${API_BASE}/api/auth/login`, { email, password })
      .pipe(
        tap(async (res) => {
          await Preferences.set({ key: 'access_token', value: res.accessToken });
          await Preferences.set({ key: 'refresh_token', value: res.refreshToken });
          const user: AuthUser = {
            email: res.email,
            rolle: res.rolle,
            mitarbeiterId: res.mitarbeiterId,
          };
          await Preferences.set({ key: 'auth_user', value: JSON.stringify(user) });
          this.accessToken.set(res.accessToken);
          this.currentUser.set(user);
        }),
      );
  }

  async logout() {
    const { value: refresh } = await Preferences.get({ key: 'refresh_token' });
    if (refresh) {
      this.http.post(`${API_BASE}/api/auth/logout`, { refreshToken: refresh }).subscribe();
    }
    await Preferences.remove({ key: 'access_token' });
    await Preferences.remove({ key: 'refresh_token' });
    await Preferences.remove({ key: 'auth_user' });
    this.accessToken.set(null);
    this.currentUser.set(null);
  }
}
