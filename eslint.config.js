import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      // TypeScript specific rules - relaxed for publication
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for large codebase
      '@typescript-eslint/no-explicit-any': 'warn', // Allow any for complex types
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict for publication

      // General rules - relaxed
      'no-console': 'off', // Allow console for debugging and logging
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
      'comma-dangle': 'off', // Allow flexibility
      'quotes': 'off', // Allow flexibility
      'semi': 'off', // Allow flexibility

      // Performance rules - relaxed
      'no-loop-func': 'warn',
      'no-new-object': 'warn',
      'no-new-wrappers': 'warn',

      // Accessibility rules
      'no-alert': 'warn',

      // Browser API compatibility
      'no-undef': 'off', // TypeScript handles this better
      'no-unused-vars': 'off', // Let TypeScript handle this
      'no-useless-escape': 'warn',
      'no-misleading-character-class': 'warn',
      'no-case-declarations': 'warn'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'off'
    }
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.config.js',
      '*.config.ts',
      'coverage/',
      'examples/',
      '**/*.test.ts',
      '**/*.spec.ts'
    ]
  }
];
