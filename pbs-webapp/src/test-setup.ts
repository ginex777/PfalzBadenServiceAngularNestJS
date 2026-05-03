import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { sharedTestProviders } from './app/testing/shared-test-providers';

// Make Vitest globals available as jest-compatible API
(globalThis as Record<string, unknown>)['jest'] = {
  fn: vi.fn.bind(vi),
  spyOn: vi.spyOn.bind(vi),
  clearAllMocks: vi.clearAllMocks.bind(vi),
  resetAllMocks: vi.resetAllMocks.bind(vi),
  restoreAllMocks: vi.restoreAllMocks.bind(vi),
};

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: sharedTestProviders,
  });
});
