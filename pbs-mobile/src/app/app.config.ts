import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { MobileAuthService } from './core/auth.service';
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
    provideIonicAngular(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: MobileAuthService) => () => auth.restoreSession(),
      deps: [MobileAuthService],
      multi: true,
    },
  ],
};
