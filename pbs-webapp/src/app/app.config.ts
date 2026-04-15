import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { nutzerInterceptor } from './core/interceptors/nutzer.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { GlobalErrorHandler } from './core/error-handler.service';
import { API_BASE_URL } from './core/tokens';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor, nutzerInterceptor, httpErrorInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
