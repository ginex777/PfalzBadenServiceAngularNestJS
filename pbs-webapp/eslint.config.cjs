const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const ngPlugin = require('@angular-eslint/eslint-plugin');
const ngTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const ngTemplateParser = require('@angular-eslint/template-parser');
const unusedImports = require('eslint-plugin-unused-imports');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.angular/**',
      '**/*.d.ts',
    ],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // auto-fix unused imports (primary goal)
      'unused-imports/no-unused-imports': 'error',

      // let unused-imports handle this so --fix can remove unused vars in many cases
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': ['warn', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      }],
    },
  },
  // Angular templates (.html): catch template-only issues that TypeScript ESLint cannot see.
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: ngTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': ngTemplatePlugin,
    },
    rules: {
      ...ngTemplatePlugin.configs.recommended.rules,
    },
  },
  // Angular-specific TS hygiene (selectors, lifecycle interfaces, etc.). Keep it light.
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@angular-eslint': ngPlugin,
    },
    rules: {
      ...ngPlugin.configs.recommended.rules,
      // Existing codebase uses constructor injection widely; don't force churn.
      '@angular-eslint/prefer-inject': 'off',
    },
  },
];
