import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      './tests/setup/test-config.ts',
      './tests/setup/test-environment.ts',
      './tests/setup/custom-matchers.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'docs/',
        'examples/',
        'src/test/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        'rollup.config.js',
        '.eslintrc.js'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/',
      'dist/',
      'docs/',
      'examples/'
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    },
    reporters: ['verbose'],
    outputFile: {
      json: './coverage/test-results.json',
      junit: './coverage/junit.xml'
    }
  },
  esbuild: {
    target: 'es2020'
  },
  define: {
    __DEV__: true,
    __TEST__: true
  }
});
