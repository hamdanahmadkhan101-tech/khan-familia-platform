import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

const tsFiles = ['**/*.ts', '**/*.tsx'];
const tsProject = {
  project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json', './apps/api/tsconfig.eslint.json'],
  tsconfigRootDir: import.meta.dirname,
};

const webFiles = ['apps/web/**/*.{ts,tsx}'];
const uiFiles = ['packages/ui/**/*.{ts,tsx}'];
const nodeFiles = [
  'apps/api/**/*.{ts,tsx}',
  'apps/worker/**/*.{ts,tsx}',
  'packages/config/**/*.{ts,tsx}',
  'packages/types/**/*.{ts,tsx}',
  'packages/validation/**/*.{ts,tsx}',
  'packages/constants/**/*.{ts,tsx}',
  'packages/sdk/**/*.{ts,tsx}',
  'packages/database/**/*.{ts,tsx}',
  'packages/utils/**/*.{ts,tsx}',
];

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.json',
      '**/*.yml',
      '**/*.yaml',
      '**/*.md',
      '**/*.mdx',
      '**/*.css',
    ],
  },
  js.configs.recommended,
  {
    files: tsFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: tsProject,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['apps/*', 'apps/**'],
              message: 'Do not import from apps. Use packages or app-local aliases.',
            },
            {
              group: ['../apps/*', '../../apps/*', '../../../apps/*', '../../../../apps/*', '../../../../../apps/*'],
              message: 'Do not import from other apps. Use packages or app-local aliases.',
            },
          ],
        },
      ],
    },
  },
  {
    files: webFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    files: ['apps/web/next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    files: uiFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  prettier,
];
