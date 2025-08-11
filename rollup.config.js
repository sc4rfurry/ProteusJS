import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import analyzer from 'rollup-plugin-analyzer';

const isDev = process.env.NODE_ENV === 'development';
const isAnalyze = process.env.ANALYZE === 'true';

const banner = `/*!
 * ProteusJS v${process.env.npm_package_version || '1.1.1'}
 * Shape-shifting responsive design that adapts like the sea god himself
 * (c) 2025 sc4rfurry
 * Released under the MIT License
 */`;

const baseConfig = {
  input: 'src/index.ts',
  external: [],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
      sourceMap: !isDev
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs()
  ]
};

const configs = [];

// UMD Build (for script tags)
configs.push({
  ...baseConfig,
  output: [
    {
      file: 'dist/proteus.js',
      format: 'umd',
      name: 'ProteusJS',
      exports: 'named',
      banner,
      sourcemap: !isDev
    },
    !isDev && {
      file: 'dist/proteus.min.js',
      format: 'umd',
      name: 'ProteusJS',
      exports: 'named',
      banner,
      sourcemap: true,
      plugins: [terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        format: {
          comments: /^!/
        }
      })]
    }
  ].filter(Boolean),
  plugins: [
    ...baseConfig.plugins,
    isAnalyze && analyzer({
      summaryOnly: true,
      limit: 10
    })
  ].filter(Boolean)
});

// ES Module Build
configs.push({
  ...baseConfig,
  output: [
    {
      file: 'dist/proteus.esm.js',
      format: 'es',
      banner,
      sourcemap: !isDev
    },
    !isDev && {
      file: 'dist/proteus.esm.min.js',
      format: 'es',
      banner,
      sourcemap: true,
      plugins: [terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        format: {
          comments: /^!/
        }
      })]
    }
  ].filter(Boolean)
});

// CommonJS Build
configs.push({
  ...baseConfig,
  output: {
    file: 'dist/proteus.cjs.js',
    format: 'cjs',
    exports: 'named',
    banner,
    sourcemap: !isDev
  }
});

// Individual Module Builds
const modules = [
  'transitions',
  'scroll',
  'anchor',
  'popover',
  'container',
  'typography',
  'a11y-audit',
  'a11y-primitives',
  'perf'
];

const adapters = [
  // TODO: Fix TypeScript parsing issues in adapter files
  // The adapters need to be converted to use JSDoc annotations
  // or the TypeScript plugin configuration needs to be fixed
  // 'react',
  // 'vue',
  // 'svelte'
];

// Build individual modules
modules.forEach(module => {
  configs.push({
    input: `src/modules/${module}/index.ts`,
    external: [],
    output: {
      file: `dist/modules/${module}.esm.js`,
      format: 'es',
      banner,
      sourcemap: !isDev
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: !isDev
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  });

  // TypeScript declarations for modules
  if (!isDev) {
    configs.push({
      input: `src/modules/${module}/index.ts`,
      output: {
        file: `dist/modules/${module}.d.ts`,
        format: 'es'
      },
      plugins: [dts()]
    });
  }
});

// Build framework adapters
adapters.forEach(adapter => {
  configs.push({
    input: `src/adapters/${adapter}.ts`,
    external: ['react', 'vue', 'svelte'], // Don't bundle framework dependencies
    output: {
      file: `dist/adapters/${adapter}.esm.js`,
      format: 'es',
      banner,
      sourcemap: !isDev
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: !isDev,
        outputToFilesystem: true,
        include: ['src/adapters/**/*.ts'],
        exclude: ['**/*.test.ts', '**/*.spec.ts'],
        compilerOptions: {
          target: 'ES2021',
          module: 'ESNext',
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          isolatedModules: true
        }
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.ts', '.js']
      }),
      commonjs()
    ]
  });

  // TypeScript declarations for adapters
  if (!isDev) {
    configs.push({
      input: `src/adapters/${adapter}.ts`,
      external: ['react', 'vue', 'svelte'],
      output: {
        file: `dist/adapters/${adapter}.d.ts`,
        format: 'es'
      },
      plugins: [dts()]
    });
  }
});

// TypeScript Declarations for main entry
if (!isDev) {
  configs.push({
    input: 'src/index.ts',
    output: {
      file: 'dist/proteus.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  });
}

export default defineConfig(configs);
