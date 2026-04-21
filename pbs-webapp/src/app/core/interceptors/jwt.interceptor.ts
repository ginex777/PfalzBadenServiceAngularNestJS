import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

function addBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  // Skip auth endpoints to avoid infinite loops
  const isAuthEndpoint = req.url.includes('/api/auth/');

  const outgoing = token && !isAuthEndpoint ? addBearer(req, token) : req;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint) {
        // Try a silent refresh, then replay the original request once
        return auth.refreshTokens().pipe(
          switchMap(({ accessToken }) => next(addBearer(req, accessToken))),
          catchError((refreshErr) => {
            // Refresh failed — auth.refreshTokens() already cleared the session
            return throwError(() => refreshErr);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
