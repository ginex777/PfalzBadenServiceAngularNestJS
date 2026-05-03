import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class MobileGlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    // Keep console output for local debugging (Sentry is prod-only by default).
    console.error('Global error caught:', error);
    if (environment.production) {
      void import('@sentry/capacitor').then((sentry) => sentry.captureException(error));
    }
  }
}
