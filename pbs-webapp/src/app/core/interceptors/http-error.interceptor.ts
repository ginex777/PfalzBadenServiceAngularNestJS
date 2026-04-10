import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        console.error('Netzwerkfehler — Server nicht erreichbar');
      } else if (err.status === 401) {
        console.warn('Session abgelaufen oder nicht autorisiert');
      } else if (err.status >= 500) {
        console.error(`Server-Fehler ${err.status}:`, err.message);
      }
      return throwError(() => err);
    }),
  );
};
