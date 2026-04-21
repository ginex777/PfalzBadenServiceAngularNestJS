import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, share } from 'rxjs';
import { API_BASE_URL } from '../tokens';

export interface AuthUser {
  email: string;
  rolle: 'admin' | 'readonly' | 'mitarbeiter';
  vorname?: string | null;
  nachname?: string | null;
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

  /** In-flight refresh observable — shared so concurrent requests only trigger one refresh */
  private _refreshInFlight$: Observable<{ accessToken: string; refreshToken: string }> | null =
    null;

  login(email: string, password: string) {
    return this.http
      .post<{
        accessToken: string;
        refreshToken: string;
        email: string;
        rolle: string;
        vorname?: string | null;
        nachname?: string | null;
      }>(`${this.base}/auth/login`, { email, password })
      .pipe(
        tap((res) =>
          this._storeSession(
            res.accessToken,
            res.refreshToken,
            res.email,
            res.rolle,
            res.vorname,
            res.nachname,
          ),
        ),
      );
  }

  /** Attempt a silent token refresh using the stored refresh token.
   *  Returns the new token pair or throws if the refresh token is missing/expired. */
  refreshTokens(): Observable<{ accessToken: string; refreshToken: string }> {
    if (this._refreshInFlight$) return this._refreshInFlight$;

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      this._clearSession();
      return throwError(() => new Error('Kein Refresh-Token vorhanden'));
    }

    this._refreshInFlight$ = this.http
      .post<{
        accessToken: string;
        refreshToken: string;
      }>(`${this.base}/auth/refresh`, { refreshToken })
      .pipe(
        tap((res) => {
          localStorage.setItem(ACCESS_KEY, res.accessToken);
          localStorage.setItem(REFRESH_KEY, res.refreshToken);
          this.accessToken.set(res.accessToken);
        }),
        catchError((err) => {
          this._clearSession();
          this.router.navigate(['/login']);
          return throwError(() => err);
        }),
        // Complete the shared observable so the next 401 starts a fresh refresh
        share(),
      );

    // Reset after the refresh completes (success or error)
    this._refreshInFlight$.subscribe({
      complete: () => {
        this._refreshInFlight$ = null;
      },
      error: () => {
        this._refreshInFlight$ = null;
      },
    });

    return this._refreshInFlight$;
  }

  logout() {
    const refresh = localStorage.getItem(REFRESH_KEY);
    this._clearSession();
    if (refresh) {
      this.http.post(`${this.base}/auth/logout`, { refreshToken: refresh }).subscribe();
    }
    this.router.navigate(['/login']);
  }

  checkSetupRequired() {
    return this.http.post<{ setupRequired: boolean }>(`${this.base}/auth/setup/status`, {});
  }

  setup(email: string, password: string) {
    return this.http.post(`${this.base}/auth/setup`, { email, password });
  }

  private _storeSession(
    accessToken: string,
    refreshToken: string,
    email: string,
    rolle: string,
    vorname?: string | null,
    nachname?: string | null,
  ) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    const user: AuthUser = { email, rolle: rolle as AuthUser['rolle'], vorname, nachname };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.accessToken.set(accessToken);
    this.currentUser.set(user);
  }

  private _clearSession() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
  }

  private _load(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private _loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
