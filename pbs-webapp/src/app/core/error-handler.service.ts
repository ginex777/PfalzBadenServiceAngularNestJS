import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from './services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);

  handleError(error: any): void {
    console.error('Global error caught:', error);
    
    // Extract meaningful error message
    let message = 'Ein unerwarteter Fehler ist aufgetreten.';
    
    if (error?.message) {
      message = error.message;
    } else if (error?.error?.message) {
      message = error.error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Show user-friendly error toast
    this.toast.error(`Fehler: ${message}`);

    // In production, you could send to error tracking service like Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }
}