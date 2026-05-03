import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { tap, catchError, throwError, share, of, map } from 'rxjs';
import { API_BASE_URL } from '../tokens';

export interface AuthUser {
  email: string;
  rolle: 'admin' | 'readonly' | 'mitarbeiter';
  vorname?: string | null;
  nachname?: string | null;
}

const USER_KEY = 'pbs-auth-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = inject(API_BASE_URL);

  readonly accessToken = signal<string | null>(null);
  readonly currentUser = signal<AuthUser | null>(this._loadUser());
  readonly isLoggedIn = computed(() => !!this.accessToken());

  /** In-flight refresh observable — shared so concurrent requests only trigger one refresh */
  private _refreshInFlight$: Observable<{ accessToken: string }> | null = null;

  /** Called once at app startup — restores session via HttpOnly cookie if still valid */
  initializeSession(): Observable<void> {
    const user = this._loadUser();
    if (!user) return of(undefined);

    return this.http
      .post<{ accessToken: string; refreshToken: string }>(
        `${this.base}/auth/refresh`,
        {},
      )
      .pipe(
        tap((res) => {
          this.accessToken.set(res.accessToken);
          this.currentUser.set(user);
        }),
        catchError(() => {
          this._clearSession();
          return of(undefined);
        }),
        map(() => undefined),
      );
  }

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
          this._storeSession(res.accessToken, res.email, res.rolle, res.vorname, res.nachname),
        ),
      );
  }

  /** Silent token refresh — cookie sent automatically by browser.
   *  Returns new access token or throws if cookie is missing/expired. */
  refreshTokens(): Observable<{ accessToken: string }> {
    if (this._refreshInFlight$) return this._refreshInFlight$;

    this._refreshInFlight$ = this.http
      .post<{ accessToken: string; refreshToken: string }>(
        `${this.base}/auth/refresh`,
        {},
      )
      .pipe(
        tap((res) => {
          this.accessToken.set(res.accessToken);
        }),
        catchError((err) => {
          this._clearSession();
          void this.router.navigate(['/login']);
          return throwError(() => err);
        }),
        share(),
      );

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
    this._clearSession();
    this.http.post(`${this.base}/auth/logout`, {}).subscribe();
    void this.router.navigate(['/login']);
  }

  checkSetupRequired() {
    return this.http.post<{ setupRequired: boolean }>(`${this.base}/auth/setup/status`, {});
  }

  setup(email: string, password: string) {
    return this.http.post(`${this.base}/auth/setup`, { email, password });
  }

  private _storeSession(
    accessToken: string,
    email: string,
    rolle: string,
    vorname?: string | null,
    nachname?: string | null,
  ) {
    const user: AuthUser = { email, rolle: rolle as AuthUser['rolle'], vorname, nachname };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.accessToken.set(accessToken);
    this.currentUser.set(user);
  }

  private _clearSession() {
    localStorage.removeItem(USER_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
  }

  private _loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
