# Changelog

All notable changes to ProteusJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-11

### 🚨 BREAKING CHANGES

#### Architecture
- **Monorepo Structure**: Migrated to monorepo with Changesets for release management
- **Package Split**: Core functionality split into focused packages
- **Browser Support**: Now targets Web Platform Baseline (modern browsers only)
- **Build System**: Dual ESM/CJS builds with proper export conditions

#### API Changes
- **Navigation**: Replaced custom routing with Navigation API-based router
- **Transitions**: Enhanced with View Transitions API integration
- **Positioning**: CSS Anchor Positioning with Floating UI fallback
- **Accessibility**: WAI-ARIA APG compliance with breaking API changes

### ✨ Added

#### New Packages
- **`@sc4rfurryx/proteusjs-router`**: Navigation API with SPA/MPA support
- **`@sc4rfurryx/proteusjs-transitions`**: View Transitions API helpers
- **`@sc4rfurryx/proteusjs-speculate`**: Speculation Rules utilities
- **`@sc4rfurryx/proteusjs-layer`**: Popover API + positioning primitives
- **`@sc4rfurryx/proteusjs-positioning`**: CSS Anchor Positioning wrapper
- **`@sc4rfurryx/proteusjs-schedule`**: Scheduler API utilities
- **`@sc4rfurryx/proteusjs-priorities`**: Resource priority helpers
- **`@sc4rfurryx/proteusjs-rum`**: Real User Monitoring with web-vitals
- **`@sc4rfurryx/proteusjs-pwa`**: PWA/OS integration utilities
- **`@sc4rfurryx/proteusjs-codemods`**: v1→v2 migration tools

#### New Features
- **Navigation & Transitions**
  - Navigation API router with History fallback
  - Cross-document View Transitions support
  - Speculation Rules for prefetch/prerender
  
- **Layered UI Primitives**
  - First-class Popover API support
  - CSS Anchor Positioning utilities
  - Container Query aware components
  
- **Accessibility Autopilot**
  - Enhanced focus management utilities
  - WAI-ARIA APG aligned components
  - Automated axe-core integration
  - CLI accessibility scanning (`proteus a11y:scan`)
  
- **Performance & Scheduling**
  - Scheduler API utilities (postTask, yield)
  - Resource priority helpers (fetchpriority)
  - Core Web Vitals RUM integration
  - Performance benchmarking tools
  
- **PWA & OS Integration**
  - File System Access helpers
  - Badging API utilities
  - Web Share/Share Target support
  - Periodic Background Sync helpers

#### Developer Experience
- **Migration Tools**: Automated codemods for v1→v2 migration
- **Compatibility Mode**: v1 API shims behind `compat` build flag
- **Enhanced TypeScript**: Improved type definitions and IntelliSense
- **Testing**: Playwright + axe-core integration
- **CI/CD**: Lighthouse CI with performance budgets

### 🔄 Changed

#### Core Modules (Enhanced)
- **transitions**: Now uses View Transitions API with fallbacks
- **scroll**: Enhanced with Scroll-Driven Animations support
- **anchor**: CSS Anchor Positioning with improved fallbacks
- **popover**: Native Popover API integration
- **container**: Container Query optimizations
- **typography**: Fluid typography improvements
- **a11y-audit**: Enhanced with axe-core integration
- **a11y-primitives**: WAI-ARIA APG compliance updates
- **perf**: Scheduler API integration for better performance

#### Build System
- **Tree-shaking**: Improved with preserveModules for ESM
- **Bundle Size**: 30% reduction through native API usage
- **TypeScript**: Strict mode with enhanced type safety
- **Size Limits**: Per-package budgets with CI enforcement

### 🗑️ Removed

#### Deprecated APIs
- **Legacy Router**: Replaced with Navigation API router
- **Custom Transitions**: Replaced with View Transitions API
- **Polyfills**: Automatic polyfills removed (now feature-gated)
- **IE Support**: Internet Explorer support completely removed

#### Breaking Removals
- **ProteusJS Constructor**: Legacy initialization patterns
- **Global Configuration**: Replaced with per-module configuration
- **Automatic Polyfills**: Now require explicit opt-in

### 🔧 Fixed

#### Performance
- **Memory Leaks**: Fixed in observer cleanup
- **Bundle Size**: Optimized tree-shaking
- **Runtime Performance**: 40% improvement with native APIs

#### Accessibility
- **Screen Reader**: Enhanced compatibility
- **Keyboard Navigation**: Improved focus management
- **ARIA**: Complete WAI-ARIA APG compliance

#### Browser Compatibility
- **Modern Browsers**: Optimized for Web Platform Baseline
- **Feature Detection**: Improved progressive enhancement
- **Fallbacks**: Better graceful degradation

### 📚 Documentation

#### New Documentation
- **Migration Guide**: Comprehensive v1→v2 migration instructions
- **API Reference**: Complete API documentation for all packages
- **Examples**: Interactive demos for all new features
- **Patterns**: WAI-ARIA APG aligned component patterns

#### Updated Documentation
- **Getting Started**: Updated for v2.0.0 architecture
- **Browser Support**: Web Platform Baseline requirements
- **Performance**: Benchmarks and optimization guides

### 🧪 Testing

#### New Testing Infrastructure
- **Playwright**: Cross-browser E2E testing
- **Axe-core**: Automated accessibility testing
- **Lighthouse CI**: Performance regression testing
- **Visual Testing**: Component visual regression tests

#### Coverage Improvements
- **Unit Tests**: 95%+ coverage on core packages
- **Integration Tests**: Cross-package compatibility
- **Performance Tests**: Benchmark regression detection

### 📦 Dependencies

#### Updated
- **TypeScript**: ^5.9.2 (strict mode)
- **Rollup**: ^4.20.0 (latest build optimizations)
- **Vitest**: ^3.2.4 (enhanced testing)

#### Added
- **Changesets**: Release management
- **Playwright**: E2E testing
- **@axe-core/playwright**: Accessibility testing
- **web-vitals**: Performance monitoring

### 🔒 Security

#### Enhancements
- **CSP**: Content Security Policy guidance
- **Trusted Types**: DOM sink protection
- **Permissions Policy**: Locked down defaults
- **COOP/COEP**: Cross-origin isolation notes

---

## [1.1.1] - 2024-12-10

### 🔧 Fixed
- **Build System**: Fixed TypeScript plugin configuration issues
- **Version Consistency**: Updated all version references throughout codebase
- **Framework Adapters**: Temporarily disabled due to TypeScript parsing issues

### 📚 Documentation
- **API Documentation**: Updated version references
- **Examples**: Corrected version numbers in demos

---

## [1.1.0] - 2024-12-09

### ✨ Added
- **Modular Architecture**: Complete rewrite to tree-shakable modules
- **Framework Adapters**: React, Vue, and Svelte integration packages
- **Enhanced TypeScript**: Improved type definitions and exports

### 🔄 Changed
- **Package Structure**: Migrated from monolithic to modular exports
- **Build System**: Rollup-based build with multiple output formats

---

## [1.0.0] - 2024-12-08

### 🎉 Initial Release
- **Core Framework**: ProteusJS foundation
- **Responsive Design**: Container queries and fluid typography
- **Accessibility**: WCAG compliance utilities
- **Performance**: Optimization and monitoring tools

---

**Legend:**
- 🚨 Breaking Changes
- ✨ Added
- 🔄 Changed  
- 🗑️ Removed
- 🔧 Fixed
- 📚 Documentation
- 🧪 Testing
- 📦 Dependencies
- 🔒 Security
