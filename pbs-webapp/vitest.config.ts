import { defineConfig } from 'vitest/config';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const resolveProjectFile = (path: string) => fileURLToPath(new URL(path, import.meta.url));

function readComponentResource(sourceFile: string, resourcePath: string): string {
  const fullPath = resolve(dirname(sourceFile), resourcePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

function inlineAngularComponentResources(): Plugin {
  return {
    name: 'pbs-inline-angular-component-resources',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/src/') && !id.includes('\\src\\')) {
        return null;
      }

      let transformed = code.replace(
        /templateUrl:\s*['"]([^'"]+)['"]/g,
        (_match: string, resourcePath: string) =>
          `template: ${JSON.stringify(readComponentResource(id, resourcePath))}`,
      );

      transformed = transformed.replace(
        /styleUrl:\s*['"]([^'"]+)['"]/g,
        (_match: string, resourcePath: string) =>
          `styles: [${JSON.stringify(readComponentResource(id, resourcePath))}]`,
      );

      transformed = transformed.replace(
        /styleUrls:\s*\[([^\]]*)\]/g,
        (_match: string, resourceList: string) => {
          const styles = Array.from(resourceList.matchAll(/['"]([^'"]+)['"]/g)).map(([, resourcePath]) =>
            JSON.stringify(readComponentResource(id, resourcePath)),
          );
          return `styles: [${styles.join(', ')}]`;
        },
      );

      return transformed === code ? null : { code: transformed, map: null };
    },
  };
}

export default defineConfig({
  plugins: [inlineAngularComponentResources()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    fakeTimers: { shouldClearNativeTimers: true },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 1,
        branches: 1,
        functions: 1,
        lines: 1,
      },
    },
  },
  resolve: {
    alias: {
      '@pbs/types': resolveProjectFile('./libs/types/src/index.ts'),
      '@pbs/utils': resolveProjectFile('./libs/utils/src/index.ts'),
    },
  },
});
