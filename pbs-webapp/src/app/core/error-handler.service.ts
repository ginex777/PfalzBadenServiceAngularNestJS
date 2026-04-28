import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from './services/toast.service';
import * as Sentry from '@sentry/angular';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);

  handleError(error: unknown): void {
    console.error('Global error caught:', error);

    // Extract meaningful error message
    const message = extractErrorMessage(error) ?? 'Ein unerwarteter Fehler ist aufgetreten.';

    // Show user-friendly error toast
    this.toast.error(`Fehler: ${message}`);

    // Production error tracking (initialized in `src/main.ts` via runtime config).
    if (typeof window !== 'undefined') {
      Sentry.captureException(error);
    }
  }
}

function extractErrorMessage(error: unknown): string | null {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  if (isRecord(error)) {
    const msg = error['message'];
    if (typeof msg === 'string') return msg;

    const nested = error['error'];
    if (isRecord(nested)) {
      const nestedMsg = nested['message'];
      if (typeof nestedMsg === 'string') return nestedMsg;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
