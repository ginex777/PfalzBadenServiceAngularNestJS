import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        console.error('Netzwerkfehler — Server nicht erreichbar');
      } else if (err.status === 401) {
        // Skip redirect for auth endpoints themselves
        if (!req.url.includes('/api/auth/')) {
          router.navigate(['/login'], { queryParams: { reason: 'session' } });
        }
      } else if (err.status >= 500) {
        console.error(`Server-Fehler ${err.status}:`, err.message);
      }
      return throwError(() => err);
    }),
  );
};
