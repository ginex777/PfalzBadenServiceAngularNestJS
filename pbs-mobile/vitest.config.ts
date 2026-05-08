import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const resolveProjectFile = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 34,
        branches: 43,
        functions: 40,
        lines: 38,
      },
    },
  },
  resolve: {
    alias: {
      '@ionic/angular/standalone': resolveProjectFile('./src/test-ionic-standalone.ts'),
      '@ionic/core/components': resolveProjectFile('./node_modules/@ionic/core/components/index.js'),
    },
  },
});
