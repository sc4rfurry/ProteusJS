import { createPackageConfig } from '../rollup.config.shared.js';

export default createPackageConfig('@sc4rfurryx/proteusjs-layer', {
  external: ['@floating-ui/dom'],
  globals: {
    '@floating-ui/dom': 'FloatingUIDOM'
  }
});
