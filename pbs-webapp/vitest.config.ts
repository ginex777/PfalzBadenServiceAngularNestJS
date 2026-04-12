import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    fakeTimers: { shouldClearNativeTimers: true },
  },
  resolve: {
    alias: {
      '@pbs/types': new URL('../libs/types/src/index.ts', import.meta.url).pathname,
      '@pbs/utils': new URL('../libs/utils/src/index.ts', import.meta.url).pathname,
    },
  },
});
