import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Create rollup configuration for ProteusJS packages
 */
export function createPackageConfig(packageName, options = {}) {
  const {
    external = [],
    globals = {},
    additionalPlugins = []
  } = options;

  const banner = `/*!
 * ${packageName} v${process.env.npm_package_version || '2.0.0'}
 * (c) 2024 sc4rfurry
 * Released under the MIT License.
 */`;

  const baseConfig = {
    input: 'src/index.ts',
    external: ['@sc4rfurryx/proteusjs', ...external],
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
      commonjs(),
      ...additionalPlugins
    ]
  };

  const configs = [];

  // ESM build
  configs.push({
    ...baseConfig,
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      banner,
      sourcemap: !isDev
    }
  });

  // CJS build
  configs.push({
    ...baseConfig,
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      exports: 'named',
      banner,
      sourcemap: !isDev
    }
  });

  // UMD build (for browser)
  configs.push({
    ...baseConfig,
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: packageName.replace(/[@\-]/g, ''),
      globals: {
        '@sc4rfurryx/proteusjs': 'ProteusJS',
        ...globals
      },
      banner,
      sourcemap: !isDev
    }
  });

  // Minified UMD build
  if (!isDev) {
    configs.push({
      ...baseConfig,
      output: {
        file: 'dist/index.min.js',
        format: 'umd',
        name: packageName.replace(/[@\-]/g, ''),
        globals: {
          '@sc4rfurryx/proteusjs': 'ProteusJS',
          ...globals
        },
        banner,
        sourcemap: true
      },
      plugins: [
        ...baseConfig.plugins,
        terser({
          format: {
            comments: /^!/
          }
        })
      ]
    });
  }

  // TypeScript declarations
  if (!isDev) {
    configs.push({
      input: 'src/index.ts',
      output: {
        file: 'dist/index.d.ts',
        format: 'es'
      },
      plugins: [dts()]
    });
  }

  return configs;
}

export default createPackageConfig;
