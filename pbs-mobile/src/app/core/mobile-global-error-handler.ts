import { ErrorHandler, Injectable } from '@angular/core';
import * as SentryCapacitor from '@sentry/capacitor';

@Injectable()
export class MobileGlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    // Keep console output for local debugging (Sentry is prod-only by default).
    // eslint-disable-next-line no-console
    console.error('Global error caught:', error);
    SentryCapacitor.captureException(error);
  }
}

