import type { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

const SILENT_AUTH_URLS = ['/api/auth/refresh', '/api/auth/login'];

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const isSilentAuth = SILENT_AUTH_URLS.some((u) => req.url.includes(u));

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        if (!isSilentAuth) toast.error('Server nicht erreichbar – bitte Verbindung prüfen.');
      } else if (err.status === 401) {
        // jwtInterceptor already attempted refresh — if still 401, session expired
        if (!req.url.includes('/api/auth/')) {
          router.navigate(['/login'], { queryParams: { reason: 'session' } });
        }
      } else if (err.status >= 500) {
        if (!isSilentAuth) toast.error('Serverfehler – bitte erneut versuchen.');
      }
      return throwError(() => err);
    }),
  );
};
