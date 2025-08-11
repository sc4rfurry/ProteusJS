# ProteusJS v2.0.0 Documentation

Welcome to ProteusJS v2.0.0 - the major evolution featuring modern web platform APIs, enhanced accessibility, performance scheduling, and PWA capabilities.

## 🌟 What's New in v2.0.0

ProteusJS v2.0.0 represents a complete architectural transformation with:

- **Modern Web Platform APIs**: Navigation API, View Transitions, Popover API, Scheduler API
- **Enhanced Accessibility**: WAI-ARIA APG compliance with automated testing
- **Performance Scheduling**: Intelligent task scheduling and yielding
- **PWA Capabilities**: File System Access, Badging, Web Share, Background Sync
- **Intelligent Prefetching**: Speculation Rules with behavior-based optimization
- **Breaking Changes**: Clean API design with comprehensive migration tools

## 📦 Package Architecture

v2.0.0 introduces a modular package architecture:

### Core Packages

| Package | Description | Size | APIs |
|---------|-------------|------|------|
| `@sc4rfurryx/proteusjs` | Main library with legacy modules | ~25KB | Core utilities, legacy APIs |
| `@sc4rfurryx/proteusjs-router` | Navigation API router | ~6KB | Navigation API, History fallback |
| `@sc4rfurryx/proteusjs-transitions` | View Transitions helpers | ~4KB | View Transitions API |
| `@sc4rfurryx/proteusjs-layer` | Popover & positioning | ~10KB | Popover API, CSS Anchor Positioning |
| `@sc4rfurryx/proteusjs-schedule` | Performance scheduling | ~6KB | Scheduler API, task management |
| `@sc4rfurryx/proteusjs-pwa` | PWA integration | ~12KB | File System, Badging, Web Share |
| `@sc4rfurryx/proteusjs-speculate` | Intelligent prefetching | ~5KB | Speculation Rules API |

### Utility Packages

| Package | Description | Purpose |
|---------|-------------|---------|
| `@sc4rfurryx/proteusjs-codemods` | Migration tools | v1→v2 automated migration |
| `@sc4rfurryx/proteusjs-cli` | Command line tools | Development utilities |
| `@sc4rfurryx/proteusjs-eslint-plugin` | ESLint rules | Code quality enforcement |
| `@sc4rfurryx/proteusjs-vite` | Vite integration | Build tool optimization |

## 🚀 Quick Start

### Installation

```bash
# Install core library
npm install @sc4rfurryx/proteusjs@2.0.0

# Install specific packages as needed
npm install @sc4rfurryx/proteusjs-router
npm install @sc4rfurryx/proteusjs-transitions
npm install @sc4rfurryx/proteusjs-layer
npm install @sc4rfurryx/proteusjs-schedule
npm install @sc4rfurryx/proteusjs-pwa
npm install @sc4rfurryx/proteusjs-speculate
```

### CDN Usage

```html
<!-- Core library -->
<script type="module">
  import { ProteusJS } from 'https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@2.0.0/dist/proteus.esm.js';
</script>

<!-- Individual packages -->
<script type="module">
  import { navigate } from 'https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs-router@2.0.0/dist/index.esm.js';
  import { viewTransition } from 'https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs-transitions@2.0.0/dist/index.esm.js';
</script>
```

### Basic Usage

```javascript
// Navigation with View Transitions
import { navigate } from '@sc4rfurryx/proteusjs-router';
import { slideTransition } from '@sc4rfurryx/proteusjs-transitions';

// Navigate with smooth transition
await navigate('/about', {
  transition: { name: 'slide', duration: 300 }
});

// Or use explicit transition
await slideTransition('right', () => {
  // Update DOM
  document.getElementById('content').innerHTML = newContent;
});
```

```javascript
// Popover with native API
import { popover } from '@sc4rfurryx/proteusjs-layer';

const controller = popover(triggerElement, contentElement, {
  placement: 'bottom',
  trigger: 'click'
});

controller.show();
```

```javascript
// Performance scheduling
import { postTask, processInChunks } from '@sc4rfurryx/proteusjs-schedule';

// Schedule high-priority task
await postTask(() => {
  // Critical work
}, { priority: 'user-blocking' });

// Process large dataset with yielding
await processInChunks(largeArray, (item) => {
  return processItem(item);
}, {
  chunkSize: 100,
  yieldInterval: 5
});
```

## 🔄 Migration from v1.x

### Automated Migration

```bash
# Install migration tool
npm install -g @sc4rfurryx/proteusjs-codemods

# Run automated migration
proteusjs-migrate migrate ./src

# Preview changes without modifying files
proteusjs-migrate migrate ./src --dry-run
```

### Manual Migration Steps

1. **Update Dependencies**
   ```bash
   npm uninstall @sc4rfurryx/proteusjs@1.x
   npm install @sc4rfurryx/proteusjs@2.0.0
   ```

2. **Update Imports**
   ```javascript
   // Before (v1.x)
   import { ProteusJS } from '@sc4rfurryx/proteusjs';
   import { transition } from '@sc4rfurryx/proteusjs/transitions';
   
   // After (v2.0.0)
   import { ProteusJS } from '@sc4rfurryx/proteusjs';
   import { navigate } from '@sc4rfurryx/proteusjs-router';
   import { viewTransition } from '@sc4rfurryx/proteusjs-transitions';
   ```

3. **Update API Calls**
   ```javascript
   // Before (v1.x)
   const proteus = new ProteusJS();
   proteus.navigate('/page');
   
   // After (v2.0.0)
   import { navigate } from '@sc4rfurryx/proteusjs-router';
   await navigate('/page');
   ```

## 📚 Documentation Structure

- **[Getting Started](./getting-started.md)** - Installation and basic usage
- **[API Reference](./api/)** - Complete API documentation
- **[Migration Guide](./migration-guide.md)** - v1→v2 upgrade instructions
- **[Examples](./examples/)** - Code examples and tutorials
- **[Browser Support](./browser-support.md)** - Compatibility information
- **[Performance](./performance.md)** - Optimization guidelines

### Package Documentation

- **[Router](./packages/router.md)** - Navigation API integration
- **[Transitions](./packages/transitions.md)** - View Transitions helpers
- **[Layer](./packages/layer.md)** - Popover and positioning
- **[Schedule](./packages/schedule.md)** - Performance scheduling
- **[PWA](./packages/pwa.md)** - Progressive Web App features
- **[Speculate](./packages/speculate.md)** - Intelligent prefetching

## 🌐 Browser Support

ProteusJS v2.0.0 targets **Web Platform Baseline** with graceful fallbacks:

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Navigation API | 102+ | ❌ (fallback) | ❌ (fallback) | 102+ |
| View Transitions | 111+ | ❌ (fallback) | ❌ (fallback) | 111+ |
| Popover API | 114+ | ❌ (fallback) | 17+ | 114+ |
| CSS Anchor Positioning | 125+ | ❌ (fallback) | ❌ (fallback) | 125+ |
| Scheduler API | 94+ | ❌ (fallback) | ❌ (fallback) | 94+ |
| File System Access | 86+ | ❌ (fallback) | ❌ (fallback) | 86+ |
| Speculation Rules | 103+ | ❌ (fallback) | ❌ (fallback) | 103+ |

**Fallback Strategy**: All features gracefully degrade with polyfills or alternative implementations.

## 🎯 Performance

### Bundle Sizes (Gzipped)

- **Total v2.0.0**: ~43KB (all packages)
- **Core only**: ~25KB
- **Individual packages**: 4-12KB each
- **Tree-shaking**: Import only what you need

### Performance Targets

- **Navigation**: <5ms average
- **View Transitions**: <10ms average
- **Popover Creation**: <3ms average
- **Task Scheduling**: <2ms average
- **File Operations**: <15ms average

## 🧪 Testing

ProteusJS v2.0.0 includes comprehensive testing:

```bash
# Run all tests
npm run test:all

# Run with coverage
npm run test:all:coverage

# Run performance benchmarks
npm run benchmark

# Run accessibility audits
npm run accessibility
```

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Ready to upgrade?** Start with the [Migration Guide](./migration-guide.md) or explore the [API Reference](./api/) for detailed documentation.
