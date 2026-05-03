import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MobileApiConfigService } from './api-config.service';
import { MobileTokenStorageService } from './mobile-token-storage.service';
import { ObjectContextService } from './object-context.service';
import { TimerStateService } from './timer-state.service';

export interface AuthUser {
  email: string;
  rolle: string;
  mitarbeiterId?: number | null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  rolle: string;
  mitarbeiterId: number | null;
}

@Injectable({ providedIn: 'root' })
export class MobileAuthService {
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(MobileTokenStorageService);
  private readonly objectContext = inject(ObjectContextService);
  private readonly timerState = inject(TimerStateService);
  private readonly apiConfig: MobileApiConfigService;
  readonly accessToken = signal<string | null>(null);
  readonly currentUser = signal<AuthUser | null>(null);
  readonly sessionResetVersion = signal(0);
  readonly isLoggedIn = computed(() => !!this.accessToken() && !!this.currentUser());
  private refreshPromise: Promise<string | null> | null = null;

  constructor(
    private readonly http: HttpClient,
    apiConfig: MobileApiConfigService,
  ) {
    this.apiConfig = apiConfig;
  }

  async restoreSession(): Promise<void> {
    await this.tokenStorage.migrateLegacyPreferenceTokens();
    const token = await this.tokenStorage.getAccessToken();
    const { value: userRaw } = await Preferences.get({ key: 'auth_user' });
    if (token) this.accessToken.set(token);
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw) as AuthUser;
        this.currentUser.set(user);
        await this.objectContext.restoreSelectedObjectForUser(user.email);
      } catch {
        /**/
      }
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessToken()) return this.accessToken();
    const value = await this.tokenStorage.getAccessToken();
    if (value) {
      this.accessToken.set(value);
    }
    return value;
  }

  login(email: string, password: string) {
    const baseUrl = this.apiConfig.apiBaseUrl();
    return this.http
      .post<LoginResponse>(`${baseUrl}/api/auth/login`, { email, password })
      .pipe(
        switchMap((res) => from(this.persistLogin(res)).pipe(map(() => res))),
      );
  }

  async logout() {
    const baseUrl = this.apiConfig.apiBaseUrl();
    const refresh = await this.tokenStorage.getRefreshToken();
    if (refresh) {
      this.http.post(`${baseUrl}/api/auth/logout`, { refreshToken: refresh }).subscribe();
    }
    await this.resetSessionState();
  }

  async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.performRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string | null> {
    const baseUrl = this.apiConfig.apiBaseUrl();
    const refreshToken = await this.tokenStorage.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await firstValueFrom(
        this.http.post<{ accessToken: string; refreshToken: string }>(`${baseUrl}/api/auth/refresh`, {
          refreshToken,
        }),
      );
      await this.tokenStorage.setTokens(res);
      this.accessToken.set(res.accessToken);
      return res.accessToken;
    } catch {
      await this.resetSessionState({ redirectToLogin: true });
      return null;
    }
  }

  private async persistLogin(res: LoginResponse): Promise<void> {
    const previousUser = this.currentUser();
    if (previousUser && previousUser.email !== res.email) {
      await this.objectContext.clearSelectedObjectForUser(previousUser.email);
      this.objectContext.resetSessionState();
      this.timerState.clearActive();
      this.sessionResetVersion.update((version) => version + 1);
    }

    await this.tokenStorage.setTokens(res);
    const user: AuthUser = {
      email: res.email,
      rolle: res.rolle,
      mitarbeiterId: res.mitarbeiterId,
    };
    await Preferences.set({ key: 'auth_user', value: JSON.stringify(user) });
    this.accessToken.set(res.accessToken);
    this.currentUser.set(user);
    await this.objectContext.restoreSelectedObjectForUser(user.email);
  }

  private async resetSessionState(options?: { redirectToLogin?: boolean }): Promise<void> {
    const user = this.currentUser();
    if (user) {
      await this.objectContext.clearSelectedObjectForUser(user.email);
    }
    await this.tokenStorage.clearTokens();
    await Preferences.remove({ key: 'auth_user' });
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.objectContext.resetSessionState();
    this.timerState.clearActive();
    this.sessionResetVersion.update((version) => version + 1);
    if (options?.redirectToLogin) {
      await this.router.navigate(['/login']);
    }
  }
}
