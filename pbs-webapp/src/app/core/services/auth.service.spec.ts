import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../tokens';
import { AuthService } from './auth.service';

const ACCESS_KEY = 'pbs-access-token';
const REFRESH_KEY = 'pbs-refresh-token';
const USER_KEY = 'pbs-auth-user';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  function configure(): void {
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.test/api' },
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('clears web session state when refresh token is missing', () => {
    localStorage.setItem(ACCESS_KEY, 'stale-access');
    localStorage.setItem(USER_KEY, JSON.stringify({ email: 'a@example.test', rolle: 'admin' }));
    configure();

    service.refreshTokens().subscribe({
      error: () => undefined,
    });

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('clears web session state and routes to login when refresh fails', () => {
    localStorage.setItem(ACCESS_KEY, 'stale-access');
    localStorage.setItem(REFRESH_KEY, 'stale-refresh');
    localStorage.setItem(USER_KEY, JSON.stringify({ email: 'a@example.test', rolle: 'admin' }));
    configure();

    service.refreshTokens().subscribe({
      error: () => undefined,
    });

    const request = httpMock.expectOne('https://api.test/api/auth/refresh');
    expect(request.request.method).toBe('POST');
    request.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears web session state immediately on logout', () => {
    localStorage.setItem(ACCESS_KEY, 'access');
    localStorage.setItem(REFRESH_KEY, 'refresh');
    localStorage.setItem(USER_KEY, JSON.stringify({ email: 'a@example.test', rolle: 'admin' }));
    configure();

    service.logout();

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);

    const request = httpMock.expectOne('https://api.test/api/auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush({});
  });
});
