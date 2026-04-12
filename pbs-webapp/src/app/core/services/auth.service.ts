import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../tokens';

export interface AuthUser {
  email: string;
  rolle: 'admin' | 'readonly' | 'mitarbeiter';
}

const ACCESS_KEY = 'pbs-access-token';
const REFRESH_KEY = 'pbs-refresh-token';
const USER_KEY = 'pbs-auth-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = inject(API_BASE_URL);

  readonly accessToken = signal<string | null>(this._load(ACCESS_KEY));
  readonly currentUser = signal<AuthUser | null>(this._loadUser());
  readonly isLoggedIn = computed(() => !!this.accessToken());

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string; refreshToken: string; email: string; rolle: string }>(
      `${this.base}/api/auth/login`,
      { email, password },
    ).pipe(
      tap(res => {
        sessionStorage.setItem(ACCESS_KEY, res.accessToken);
        localStorage.setItem(REFRESH_KEY, res.refreshToken);
        const user: AuthUser = { email: res.email, rolle: res.rolle as AuthUser['rolle'] };
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        this.accessToken.set(res.accessToken);
        this.currentUser.set(user);
      }),
    );
  }

  logout() {
    const refresh = localStorage.getItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
    if (refresh) {
      this.http.post(`${this.base}/api/auth/logout`, { refreshToken: refresh }).subscribe();
    }
    this.router.navigate(['/login']);
  }

  checkSetupRequired() {
    return this.http.post<{ setupRequired: boolean }>(`${this.base}/api/auth/setup/status`, {});
  }

  setup(email: string, password: string) {
    return this.http.post(`${this.base}/api/auth/setup`, { email, password });
  }

  private _load(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }

  private _loadUser(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
