import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
  ErrorHandler,
} from '@angular/core';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { MobileAuthService } from './core/auth.service';
import { MobileApiConfigService } from './core/api-config.service';
import { MobileGlobalErrorHandler } from './core/mobile-global-error-handler';
import { routes } from './app.routes';

const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(MobileAuthService);
  if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh')) {
    return next(req);
  }

  return from(auth.getAccessToken()).pipe(
    switchMap((token) => {
      const requestWithToken = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

      return next(requestWithToken).pipe(
        catchError((error: { status?: number }) => {
          if (error.status !== 401) {
            return throwError(() => error);
          }

          return from(auth.refreshAccessToken()).pipe(
            switchMap((newToken) => {
              if (!newToken) {
                return throwError(() => error);
              }
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(retried);
            }),
          );
        }),
      );
    }),
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (apiConfig: MobileApiConfigService) => () => apiConfig.restore(),
      deps: [MobileApiConfigService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: MobileAuthService) => () => auth.restoreSession(),
      deps: [MobileAuthService],
      multi: true,
    },
    { provide: ErrorHandler, useClass: MobileGlobalErrorHandler },
  ],
};
