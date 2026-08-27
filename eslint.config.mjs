import globals from 'globals';
import { fileURLToPath } from 'node:url';
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/node_modules/**',
    // Next.js-specific (client only)
    'client/.next/**',
    'client/out/**',
    'client/build/**',
    'client/next-env.d.ts',
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            // Config files go here
            'eslint.config.mjs',
            'server/tsdown.config.ts',
            'client/postcss.config.mjs',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowObjectTypes: 'always' },
      ],
    },
  },
  {
    files: [
      // Config files go here
      'eslint.config.mjs',
      'server/tsdown.config.ts',
      'client/postcss.config.mjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [...nextVitals, ...nextTs],
    settings: {
      next: {
        rootDir: fileURLToPath(new URL('./client/', import.meta.url)),
      },
    },
  },
  eslintConfigPrettier,
]);
