# ProteusJS Documentation

**Native-first web development primitives for modern applications**

ProteusJS v2.0.0 provides modern web platform APIs, enhanced accessibility, performance scheduling, and PWA capabilities with comprehensive migration tools and breaking changes.

## Quick Start

### Installation

```bash
npm install @sc4rfurryx/proteusjs
```

### Tree-shakable Imports

```javascript
// Import only what you need
import { transition } from '@sc4rfurryx/proteusjs/transitions';
import { tether } from '@sc4rfurryx/proteusjs/anchor';
import { boost } from '@sc4rfurryx/proteusjs/perf';
```

### CDN Usage

```html
<script type="importmap">
{
  "imports": {
    "@sc4rfurryx/proteusjs/transitions": 
      "https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@2.0.0/dist/modules/transitions.esm.js"
  }
}
</script>
```

## Core Modules

### 🎬 View Transitions
Smooth page transitions with native View Transitions API fallback.

```javascript
import { transition } from '@sc4rfurryx/proteusjs/transitions';

// Basic transition
await transition(() => {
  document.body.classList.toggle('dark-theme');
});

// With custom name
await transition(() => {
  updateContent();
}, { name: 'slide-in' });
```

### ⚓ Anchor Positioning
CSS Anchor Positioning with JavaScript fallback for unsupported browsers.

```javascript
import { tether } from '@sc4rfurryx/proteusjs/anchor';

const tooltip = document.getElementById('tooltip');
const button = document.getElementById('button');

const controller = tether(tooltip, {
  anchor: button,
  placement: 'top',
  offset: 8
});

// Update position
controller.update();
```

**Browser Compatibility:**
- ✅ Chrome 125+ (native CSS anchor positioning)
- ✅ Firefox, Safari (JavaScript fallback)
- ⚠️ Limited support in older browsers

### 📦 Container Queries
Modern container-based responsive design.

```javascript
import { container } from '@sc4rfurryx/proteusjs/container';

// Enable container queries
container('.card', {
  type: 'inline-size',
  name: 'card-container'
});
```

**CSS Usage with correct units:**
```css
.card {
  container-type: inline-size;
  container-name: card-container;
}

@container card-container (min-width: 300px) {
  .card-content {
    /* Use correct container query units */
    width: 50cqw;  /* 50% of container width */
    height: 25cqh; /* 25% of container height */
    padding: 2cqi; /* 2% of container inline size */
    margin: 1cqb;  /* 1% of container block size */
  }
}
```

**Important:** Use `cqw`, `cqh`, `cqi`, `cqb` units (not `50 cw` syntax).

### ⚡ Performance
Web performance optimization utilities.

```javascript
import { boost } from '@sc4rfurryx/proteusjs/perf';

// Content visibility optimization
boost.contentVisibility('.lazy-content', 'auto');

// Measure Core Web Vitals
const metrics = await boost.measureCWV();
console.log(`CLS: ${metrics.cls}, FID: ${metrics.fid}ms, LCP: ${metrics.lcp}s`);

// Speculation rules for preloading
boost.speculate({
  prerender: ['/next-page'],
  prefetch: ['/api/data']
});
```

### 🎯 Typography
Responsive typography with fluid scaling.

```javascript
import { fluid } from '@sc4rfurryx/proteusjs/typography';

// Fluid font sizes
fluid('h1', { min: 24, max: 48, viewport: [320, 1200] });
fluid('.text-lg', { min: 16, max: 20 });
```

### 🔍 Accessibility Audit (Dev-only)
Development-time accessibility checking.

```javascript
import { audit } from '@sc4rfurryx/proteusjs/a11y-audit';

// Run accessibility audit
const report = await audit(document, {
  rules: ['images', 'headings', 'forms'],
  format: 'console'
});

console.log(`Found ${report.violations.length} violations`);
```

### 🎛️ Accessibility Primitives
Headless accessibility patterns.

```javascript
import { dialog, tooltip, focusTrap } from '@sc4rfurryx/proteusjs/a11y-primitives';

// Modal dialog with focus management
const modal = dialog('#modal', {
  modal: true,
  restoreFocus: true
});

// Tooltip with ARIA
const tip = tooltip(trigger, content, { delay: 300 });

// Focus trap for modals
const trap = focusTrap(container);
trap.activate();
```

## Framework Adapters

### React
```javascript
import { useTransition, usePopover } from '@sc4rfurryx/proteusjs/adapters/react';

function MyComponent() {
  const [startTransition] = useTransition();
  
  const handleClick = () => {
    startTransition(() => {
      setTheme(theme === 'light' ? 'dark' : 'light');
    });
  };
  
  return <button onClick={handleClick}>Toggle Theme</button>;
}
```

### Vue
```javascript
import { useTransition } from '@sc4rfurryx/proteusjs/adapters/vue';

export default {
  setup() {
    const { transition } = useTransition();
    
    const toggleTheme = () => {
      transition(() => {
        // Update theme
      });
    };
    
    return { toggleTheme };
  }
};
```

### Svelte
```javascript
import { proteusTransition } from '@sc4rfurryx/proteusjs/adapters/svelte';

let theme = 'light';

function toggleTheme() {
  proteusTransition(() => {
    theme = theme === 'light' ? 'dark' : 'light';
  });
}
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| View Transitions | 111+ | Fallback | Fallback | 111+ |
| Anchor Positioning | 125+ | Fallback | Fallback | 125+ |
| Container Queries | 105+ | 110+ | 16+ | 105+ |
| Content Visibility | 85+ | Fallback | Fallback | 85+ |

## Bundle Sizes

All modules are optimized for minimal bundle impact:

- **transitions**: ~3.5KB
- **anchor**: ~7.8KB  
- **container**: ~6.0KB
- **perf**: ~8.2KB
- **typography**: ~6.2KB
- **a11y-audit**: ~2.2KB (dev-only)
- **a11y-primitives**: ~3.8KB

*Sizes are uncompressed. Gzipped sizes are typically 60-70% smaller.*

## License

MIT License - see [LICENSE](LICENSE) file for details.
