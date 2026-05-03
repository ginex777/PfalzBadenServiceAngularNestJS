import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MobileApiConfigService } from './api-config.service';
import { MobileAuthService } from './auth.service';
import { ObjectContextService } from './object-context.service';
import { TimerStateService } from './timer-state.service';

const preferenceStore = vi.hoisted(() => new Map<string, string>());
const secureStore = vi.hoisted(() => new Map<string, string>());

const preferencesMock = vi.hoisted(() => ({
  get: vi.fn(async ({ key }: { key: string }) => ({
    value: preferenceStore.get(key) ?? null,
  })),
  set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
    preferenceStore.set(key, value);
  }),
  remove: vi.fn(async ({ key }: { key: string }) => {
    preferenceStore.delete(key);
  }),
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: preferencesMock,
}));

const secureStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(async (key: string) => secureStore.get(key) ?? null),
  setItem: vi.fn(async (key: string, value: string) => {
    secureStore.set(key, value);
  }),
  removeItem: vi.fn(async (key: string) => {
    secureStore.delete(key);
  }),
  setKeyPrefix: vi.fn(async () => undefined),
  setSynchronize: vi.fn(async () => undefined),
  setDefaultKeychainAccess: vi.fn(async () => undefined),
}));

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  KeychainAccess: { whenUnlockedThisDeviceOnly: 1 },
  SecureStorage: secureStorageMock,
}));

async function settleTokenStorage(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('MobileAuthService', () => {
  let service: MobileAuthService;
  let httpMock: HttpTestingController;
  let objectContext: ObjectContextService;
  let timerState: TimerStateService;

  beforeEach(() => {
    preferenceStore.clear();
    secureStore.clear();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        MobileAuthService,
        MobileApiConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(MobileAuthService);
    httpMock = TestBed.inject(HttpTestingController);
    objectContext = TestBed.inject(ObjectContextService);
    timerState = TestBed.inject(TimerStateService);
    TestBed.inject(MobileApiConfigService).apiBaseUrl.set('https://api.test');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('waits for token and user persistence before login emits success', async () => {
    const login = firstValueFrom(service.login('employee@example.test', 'secret'));

    const request = httpMock.expectOne('https://api.test/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      email: 'employee@example.test',
      rolle: 'mitarbeiter',
      mitarbeiterId: 7,
    });

    const response = await login;

    expect(response.accessToken).toBe('access-1');
    expect(secureStore.get('access_token')).toBe('access-1');
    expect(secureStore.get('refresh_token')).toBe('refresh-1');
    expect(preferenceStore.has('access_token')).toBe(false);
    expect(preferenceStore.has('refresh_token')).toBe(false);
    expect(preferenceStore.get('auth_user')).toBe(
      JSON.stringify({
        email: 'employee@example.test',
        rolle: 'mitarbeiter',
        mitarbeiterId: 7,
      }),
    );
    expect(service.accessToken()).toBe('access-1');
    expect(service.currentUser()).toEqual({
      email: 'employee@example.test',
      rolle: 'mitarbeiter',
      mitarbeiterId: 7,
    });
  });

  it('clears mobile session state when refresh fails', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    secureStore.set('access_token', 'stale-access');
    secureStore.set('refresh_token', 'stale-refresh');
    preferenceStore.set('auth_user', JSON.stringify({ email: 'employee@example.test', rolle: 'mitarbeiter' }));
    service.accessToken.set('stale-access');
    service.currentUser.set({ email: 'employee@example.test', rolle: 'mitarbeiter' });

    const refresh = service.refreshAccessToken();
    await settleTokenStorage();

    const request = httpMock.expectOne('https://api.test/api/auth/refresh');
    expect(request.request.method).toBe('POST');
    request.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    await expect(refresh).resolves.toBeNull();
    expect(secureStore.has('access_token')).toBe(false);
    expect(secureStore.has('refresh_token')).toBe(false);
    expect(preferenceStore.has('auth_user')).toBe(false);
    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('clears previous user mobile context before a different user logs in', async () => {
    secureStore.set('access_token', 'old-access');
    secureStore.set('refresh_token', 'old-refresh');
    preferenceStore.set('auth_user', JSON.stringify({ email: 'old@example.test', rolle: 'mitarbeiter', mitarbeiterId: 3 }));
    service.accessToken.set('old-access');
    service.currentUser.set({ email: 'old@example.test', rolle: 'mitarbeiter', mitarbeiterId: 3 });
    objectContext.objects.set([
      {
        id: 11,
        name: 'Old object',
        street: null,
        houseNumber: null,
        postalCode: null,
        city: null,
        status: 'AKTIV',
        customerName: null,
      },
    ]);
    objectContext.setSelectedObjectId(11);
    objectContext.objectsError.set('old error');
    timerState.setActive({ id: 22, start: new Date('2026-05-01T08:00:00.000Z') });

    await service.logout();

    const logoutRequest = httpMock.expectOne('https://api.test/api/auth/logout');
    expect(logoutRequest.request.method).toBe('POST');
    logoutRequest.flush({});
    expect(objectContext.objects()).toEqual([]);
    expect(objectContext.selectedObjectId()).toBeNull();
    expect(objectContext.objectsError()).toBeNull();
    expect(timerState.activeTimer()).toBeNull();
    expect(service.sessionResetVersion()).toBe(1);

    const login = firstValueFrom(service.login('new@example.test', 'secret'));
    const loginRequest = httpMock.expectOne('https://api.test/api/auth/login');
    loginRequest.flush({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      email: 'new@example.test',
      rolle: 'mitarbeiter',
      mitarbeiterId: 8,
    });

    await login;

    expect(service.currentUser()).toEqual({
      email: 'new@example.test',
      rolle: 'mitarbeiter',
      mitarbeiterId: 8,
    });
    expect(objectContext.objects()).toEqual([]);
    expect(objectContext.selectedObjectId()).toBeNull();
    expect(timerState.activeTimer()).toBeNull();
  });

  it('routes to login and clears mobile context when refresh fails', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    secureStore.set('access_token', 'stale-access');
    secureStore.set('refresh_token', 'stale-refresh');
    preferenceStore.set('auth_user', JSON.stringify({ email: 'employee@example.test', rolle: 'mitarbeiter' }));
    service.accessToken.set('stale-access');
    service.currentUser.set({ email: 'employee@example.test', rolle: 'mitarbeiter' });
    objectContext.setSelectedObjectId(23);
    timerState.setActive({ id: 24, start: new Date('2026-05-01T08:00:00.000Z') });

    const refresh = service.refreshAccessToken();
    await settleTokenStorage();

    const request = httpMock.expectOne('https://api.test/api/auth/refresh');
    request.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    await expect(refresh).resolves.toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(objectContext.selectedObjectId()).toBeNull();
    expect(timerState.activeTimer()).toBeNull();
  });

  it('migrates legacy token preferences into secure storage on restore', async () => {
    preferenceStore.set('access_token', 'legacy-access');
    preferenceStore.set('refresh_token', 'legacy-refresh');
    preferenceStore.set(
      'auth_user',
      JSON.stringify({
        email: 'employee@example.test',
        rolle: 'mitarbeiter',
        mitarbeiterId: 7,
      }),
    );

    await service.restoreSession();

    expect(secureStore.get('access_token')).toBe('legacy-access');
    expect(secureStore.get('refresh_token')).toBe('legacy-refresh');
    expect(preferenceStore.has('access_token')).toBe(false);
    expect(preferenceStore.has('refresh_token')).toBe(false);
    expect(service.accessToken()).toBe('legacy-access');
    expect(service.currentUser()).toEqual({
      email: 'employee@example.test',
      rolle: 'mitarbeiter',
      mitarbeiterId: 7,
    });
  });

  it('restores and clears the selected object per authenticated user', async () => {
    preferenceStore.set('selected_object_id:employee@example.test', '42');
    preferenceStore.set(
      'auth_user',
      JSON.stringify({
        email: 'employee@example.test',
        rolle: 'mitarbeiter',
        mitarbeiterId: 7,
      }),
    );
    secureStore.set('access_token', 'access-1');
    secureStore.set('refresh_token', 'refresh-1');

    await service.restoreSession();

    expect(objectContext.selectedObjectId()).toBe(42);

    await service.logout();
    const logoutRequest = httpMock.expectOne('https://api.test/api/auth/logout');
    logoutRequest.flush({});

    expect(objectContext.selectedObjectId()).toBeNull();
    expect(preferenceStore.has('selected_object_id:employee@example.test')).toBe(false);
  });
});
