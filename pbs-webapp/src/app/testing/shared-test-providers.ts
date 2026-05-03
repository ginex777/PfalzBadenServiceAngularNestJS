import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../core/tokens';

export const sharedTestProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([]),
  { provide: API_BASE_URL, useValue: '/api' },
];
