// Flat ESLint v9 config with TypeScript, Jest, and Prettier compatibility
// See: https://typescript-eslint.io/getting-started/typed-linting

// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore generated, external, and config files
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'eslint.config.js',
      'eslint.config.mjs',
      '.eslintrc.js'
    ]
  },

  // Base JS rules for any .js files (none in src, but keep for tooling scripts)
  {
    files: ['**/*.js']
  },
  js.configs.recommended,

  // TypeScript rules for project sources (typed linting)
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json']
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      // Reasonable TS best practices; keep strict but pragmatic defaults
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // TypeScript rules for examples (no project/typed context to avoid tsconfig coupling)
  {
    files: ['examples/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },

  // Test files: allow require imports used in Jest scenarios
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // Disable formatting-related rules; delegate to Prettier
  prettier
);



