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
 * ProteusJS v${process.env.npm_package_version || '1.0.0'}
 * Shape-shifting responsive design that adapts like the sea god himself
 * (c) 2024 sc4rfurry
 * Released under the MIT License
 */`;

const baseConfig = {
  input: 'src/index.ts',
  external: [],
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
      sourceMap: !isDev
    })
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

// TypeScript Declarations
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
