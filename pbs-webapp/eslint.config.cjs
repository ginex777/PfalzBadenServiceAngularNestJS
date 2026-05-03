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
      // ── Unused imports / vars ──────────────────────────────────────────────
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': ['warn', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      }],

      // ── TypeScript hygiene ─────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
      }],
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',

      // ── General correctness ────────────────────────────────────────────────
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'off',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'warn',
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
    },
  },
  // ── Angular templates ────────────────────────────────────────────────────
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
      // Accessibility
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
    },
  },
  // ── Angular TypeScript ────────────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@angular-eslint': ngPlugin,
    },
    rules: {
      ...ngPlugin.configs.recommended.rules,
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      // Small standalone components in this repo intentionally keep compact
      // inline templates/styles; splitting them creates churn, not safety.
      '@angular-eslint/component-max-inline-declarations': 'off',
    },
  },
];
