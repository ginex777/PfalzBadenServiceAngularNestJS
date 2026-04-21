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
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': ['warn', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      }],
    },
  },
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
