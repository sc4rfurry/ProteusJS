# ProteusJS v1→v2 Migration Guide

This guide helps you migrate from ProteusJS v1.x to v2.0.0, covering breaking changes, new features, and step-by-step migration instructions.

## 🎯 Migration Overview

ProteusJS v2.0.0 introduces significant architectural changes:

- **Modular Package Architecture**: Split into focused packages
- **Modern Web Platform APIs**: Navigation API, View Transitions, Popover API
- **Breaking API Changes**: Cleaner, more consistent API design
- **Enhanced Performance**: Better scheduling and optimization
- **Improved Accessibility**: WAI-ARIA APG compliance

## 🚀 Quick Migration

### Automated Migration Tool

The fastest way to migrate is using our automated codemod:

```bash
# Install migration tool
npm install -g @sc4rfurryx/proteusjs-codemods

# Detect ProteusJS usage
proteusjs-migrate detect ./

# Preview migration changes
proteusjs-migrate migrate ./ --dry-run

# Run migration
proteusjs-migrate migrate ./
```

### Manual Migration Checklist

- [ ] Update package dependencies
- [ ] Update import statements
- [ ] Update API calls
- [ ] Update configuration objects
- [ ] Update CSS class names
- [ ] Update event names
- [ ] Test functionality
- [ ] Update documentation

## 📦 Package Dependencies

### Before (v1.x)
```json
{
  "dependencies": {
    "@sc4rfurryx/proteusjs": "^1.1.0"
  }
}
```

### After (v2.0.0)
```json
{
  "dependencies": {
    "@sc4rfurryx/proteusjs": "^2.0.0",
    "@sc4rfurryx/proteusjs-router": "^2.0.0",
    "@sc4rfurryx/proteusjs-transitions": "^2.0.0",
    "@sc4rfurryx/proteusjs-layer": "^2.0.0",
    "@sc4rfurryx/proteusjs-schedule": "^2.0.0",
    "@sc4rfurryx/proteusjs-pwa": "^2.0.0",
    "@sc4rfurryx/proteusjs-speculate": "^2.0.0"
  }
}
```

**Note**: Install only the packages you need. The core package includes legacy modules for backward compatibility.

## 🔄 Import Changes

### Navigation & Routing

```javascript
// Before (v1.x)
import { ProteusJS } from '@sc4rfurryx/proteusjs';
const proteus = new ProteusJS();
proteus.navigate('/page');

// After (v2.0.0)
import { navigate } from '@sc4rfurryx/proteusjs-router';
await navigate('/page');
```

### Transitions

```javascript
// Before (v1.x)
import { transition } from '@sc4rfurryx/proteusjs/transitions';
transition(() => {
  // Update DOM
});

// After (v2.0.0)
import { viewTransition } from '@sc4rfurryx/proteusjs-transitions';
await viewTransition(() => {
  // Update DOM
});
```

### Popover & UI

```javascript
// Before (v1.x)
import { ProteusJS } from '@sc4rfurryx/proteusjs';
const proteus = new ProteusJS();
proteus.createPopover(trigger, content, options);

// After (v2.0.0)
import { popover } from '@sc4rfurryx/proteusjs-layer';
const controller = popover(trigger, content, options);
```

### Performance

```javascript
// Before (v1.x)
import { ProteusJS } from '@sc4rfurryx/proteusjs';
const proteus = new ProteusJS();
proteus.scheduleTask(callback);

// After (v2.0.0)
import { postTask } from '@sc4rfurryx/proteusjs-schedule';
await postTask(callback, { priority: 'user-visible' });
```

## 🔧 API Changes

### Constructor Pattern → Functional API

**Before (v1.x)**:
```javascript
const proteus = new ProteusJS({
  enableTransitions: true,
  enablePopover: true
});

proteus.init();
```

**After (v2.0.0)**:
```javascript
// Import only what you need
import { navigate } from '@sc4rfurryx/proteusjs-router';
import { popover } from '@sc4rfurryx/proteusjs-layer';

// Or use the main library with compatibility mode
import { ProteusJS } from '@sc4rfurryx/proteusjs';
ProteusJS.init({
  compatibility: { v1: true }
});
```

### Method Name Changes

| v1.x Method | v2.0.0 Equivalent | Package |
|-------------|-------------------|---------|
| `proteus.navigate()` | `navigate()` | `@sc4rfurryx/proteusjs-router` |
| `proteus.transition()` | `viewTransition()` | `@sc4rfurryx/proteusjs-transitions` |
| `proteus.createPopover()` | `popover()` | `@sc4rfurryx/proteusjs-layer` |
| `proteus.createTooltip()` | `tooltip()` | `@sc4rfurryx/proteusjs-layer` |
| `proteus.scheduleTask()` | `postTask()` | `@sc4rfurryx/proteusjs-schedule` |
| `proteus.yieldControl()` | `yieldToMain()` | `@sc4rfurryx/proteusjs-schedule` |

### Configuration Changes

**Before (v1.x)**:
```javascript
const proteus = new ProteusJS({
  enablePolyfills: true,
  autoInit: true,
  debugMode: false,
  transitions: {
    duration: 300,
    easing: 'ease-in-out'
  }
});
```

**After (v2.0.0)**:
```javascript
// Package-specific configuration
import { configure } from '@sc4rfurryx/proteusjs-transitions';

configure({
  defaultDuration: 300,
  defaultEasing: 'ease-in-out'
});

// Or global configuration
import { ProteusJS } from '@sc4rfurryx/proteusjs';

ProteusJS.init({
  compatibility: {
    polyfills: true
  },
  initialization: {
    auto: true
  },
  development: {
    debug: false
  }
});
```

## 🎨 CSS Changes

### Class Name Updates

CSS class prefixes have been updated for clarity:

```css
/* Before (v1.x) */
.proteus-popover { }
.proteus-transition { }
.proteus-container { }

/* After (v2.0.0) */
.proteus-v2-popover { }
.proteus-v2-transition { }
.proteus-v2-container { }
```

### CSS Custom Properties

```css
/* Before (v1.x) */
:root {
  --proteus-transition-duration: 300ms;
  --proteus-popover-bg: white;
}

/* After (v2.0.0) */
:root {
  --proteus-transition-duration: 300ms;
  --proteus-layer-popover-bg: white;
  --proteus-schedule-yield-threshold: 5ms;
}
```

## 📡 Event Changes

### Event Name Updates

```javascript
// Before (v1.x)
element.addEventListener('proteus:navigate', handler);
element.addEventListener('proteus:transition', handler);
element.addEventListener('proteus:popover', handler);

// After (v2.0.0)
element.addEventListener('proteus:navigation', handler);
element.addEventListener('proteus:view-transition', handler);
element.addEventListener('proteus:layer-change', handler);
```

### Event Data Structure

**Before (v1.x)**:
```javascript
element.addEventListener('proteus:navigate', (event) => {
  console.log(event.detail.url);
  console.log(event.detail.options);
});
```

**After (v2.0.0)**:
```javascript
element.addEventListener('proteus:navigation', (event) => {
  console.log(event.detail.destination.url);
  console.log(event.detail.navigationType);
  console.log(event.detail.canIntercept);
});
```

## 🔧 Framework Adapters

### React

**Before (v1.x)**:
```jsx
import { useTransition } from '@sc4rfurryx/proteusjs/adapters/react';

function MyComponent() {
  const transition = useTransition();
  
  const handleClick = () => {
    transition(() => {
      // Update state
    });
  };
}
```

**After (v2.0.0)**:
```jsx
import { useViewTransition, useNavigation } from '@sc4rfurryx/proteusjs/adapters/react';

function MyComponent() {
  const { startTransition } = useViewTransition();
  const { navigate } = useNavigation();
  
  const handleClick = async () => {
    await startTransition(() => {
      // Update state
    });
  };
}
```

### Vue

**Before (v1.x)**:
```vue
<script>
import { useProteus } from '@sc4rfurryx/proteusjs/adapters/vue';

export default {
  setup() {
    const proteus = useProteus();
    return { proteus };
  }
}
</script>
```

**After (v2.0.0)**:
```vue
<script setup>
import { useNavigation, useViewTransition } from '@sc4rfurryx/proteusjs/adapters/vue';

const { navigate } = useNavigation();
const { startTransition } = useViewTransition();
</script>
```

## 🧪 Testing Changes

### Test Utilities

**Before (v1.x)**:
```javascript
import { createTestInstance } from '@sc4rfurryx/proteusjs/testing';

const proteus = createTestInstance();
```

**After (v2.0.0)**:
```javascript
import { mockNavigationAPI, mockViewTransitions } from '@sc4rfurryx/proteusjs/testing';

// Mock specific APIs for testing
mockNavigationAPI();
mockViewTransitions();
```

## 🚨 Breaking Changes Summary

### Removed Features

- **Constructor Pattern**: `new ProteusJS()` → functional imports
- **Global Instance**: No more global `proteus` object
- **Automatic Polyfills**: Must be explicitly enabled
- **Legacy Browser Support**: IE11 support removed

### Changed Behavior

- **Async by Default**: Most operations now return Promises
- **Explicit Imports**: Must import specific functions/packages
- **Feature Detection**: APIs check for native support first
- **Error Handling**: More specific error types and messages

### New Requirements

- **Modern Browsers**: ES2020+ support required
- **Module System**: ESM or CommonJS required
- **Build Tools**: Bundler recommended for optimal tree-shaking

## 🔄 Step-by-Step Migration

### 1. Backup Your Project
```bash
git commit -am "Backup before ProteusJS v2 migration"
```

### 2. Update Dependencies
```bash
npm uninstall @sc4rfurryx/proteusjs@1.x
npm install @sc4rfurryx/proteusjs@2.0.0
# Install additional packages as needed
```

### 3. Run Automated Migration
```bash
proteusjs-migrate migrate ./src --dry-run
proteusjs-migrate migrate ./src
```

### 4. Manual Updates
- Review generated changes
- Update configuration files
- Update CSS classes and custom properties
- Update test files

### 5. Test Thoroughly
```bash
npm test
npm run build
npm run lint
```

### 6. Update Documentation
- Update README files
- Update code comments
- Update API documentation

## 🆘 Troubleshooting

### Common Issues

**Import Errors**:
```javascript
// Error: Cannot resolve '@sc4rfurryx/proteusjs-router'
// Solution: Install the package
npm install @sc4rfurryx/proteusjs-router
```

**API Not Available**:
```javascript
// Error: navigate is not a function
// Solution: Check browser support and fallbacks
import { navigate, isNavigationAPISupported } from '@sc4rfurryx/proteusjs-router';

if (isNavigationAPISupported()) {
  await navigate('/page');
} else {
  // Fallback behavior
  window.location.href = '/page';
}
```

**Performance Issues**:
```javascript
// Issue: Slow transitions
// Solution: Use performance scheduling
import { postTask } from '@sc4rfurryx/proteusjs-schedule';

await postTask(() => {
  // Heavy work
}, { priority: 'background' });
```

### Getting Help

- **Documentation**: [docs/v2/](./README.md)
- **Examples**: [examples/v2/](../examples/v2/)
- **Issues**: [GitHub Issues](https://github.com/sc4rfurry/ProteusJS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sc4rfurry/ProteusJS/discussions)

## ✅ Migration Checklist

- [ ] Dependencies updated
- [ ] Imports updated
- [ ] API calls updated
- [ ] Configuration updated
- [ ] CSS classes updated
- [ ] Event handlers updated
- [ ] Tests passing
- [ ] Build successful
- [ ] Performance validated
- [ ] Accessibility tested
- [ ] Documentation updated

**Congratulations!** You've successfully migrated to ProteusJS v2.0.0. Enjoy the enhanced performance, modern APIs, and improved developer experience!
