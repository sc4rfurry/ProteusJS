# ProteusJS v2.0.0 Documentation

**Native-first web development primitives for modern applications**

ProteusJS v2.0.0 provides modern web platform APIs, enhanced accessibility, performance scheduling, and PWA capabilities with comprehensive migration tools and breaking changes.

```{admonition} 🌊 Shape-Shifting Web Development
:class: tip

ProteusJS adapts to your needs like Proteus, the ancient Greek sea god who could change his shape at will. Our library provides modern web platform APIs with intelligent fallbacks, ensuring your applications work seamlessly across all browsers and devices.
```

## 🚀 What's New in v2.0.0

- 🧭 **Navigation API**: Modern routing with History API fallback
- ✨ **View Transitions**: Smooth page transitions with CSS fallbacks
- 📱 **Popover API**: Advanced positioning with CSS Anchor support
- ⚡ **Scheduler API**: Performance optimization with task prioritization
- 🔧 **PWA Features**: File System, Badging, and Web Share APIs
- 🚀 **Speculation Rules**: Intelligent prefetching for faster navigation

<div class="feature-grid">

<div class="feature-card">

### 📦 **Modular Architecture**
Each package is independently usable with zero dependencies. Mix and match only what you need.

</div>

<div class="feature-card">

### ♿ **Accessibility First**
WCAG 2.1 AAA compliance built-in with comprehensive screen reader support and keyboard navigation.

</div>

<div class="feature-card">

### ⚡ **Performance Optimized**
22KB total bundle size (49% under budget) with tree-shaking and modern compression.

</div>

</div>

## Quick Start

### Installation

Install ProteusJS via npm:

    npm install @sc4rfurryx/proteusjs

### Basic Usage

Import only what you need:

    // Import specific modules
    import { transition } from '@sc4rfurryx/proteusjs/transitions';
    import { tether } from '@sc4rfurryx/proteusjs/anchor';
    import { boost } from '@sc4rfurryx/proteusjs/perf';

### CDN Usage

For CDN usage, use import maps:

    <script type="importmap">
    {
      "imports": {
        "@sc4rfurryx/proteusjs/transitions":
          "https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@2.0.0/dist/modules/transitions.esm.js"
      }
    }
    </script>

```{toctree}
:maxdepth: 2
:caption: Getting Started

getting-started/installation
getting-started/quick-start
v2/README
```

```{toctree}
:maxdepth: 2
:caption: Core Features

features/container-queries
features/accessibility
v2/browser-support
v2/performance
```

```{toctree}
:maxdepth: 2
:caption: API Reference

api/core-api
v2/api/README
```

```{toctree}
:maxdepth: 2
:caption: Migration & Guides

v2/migration-guide
```

## Core Modules

### 🎬 View Transitions
Smooth page transitions with native View Transitions API fallback.

Example usage:

    import { transition } from '@sc4rfurryx/proteusjs/transitions';

    // Basic transition
    await transition(() => {
      document.body.classList.toggle('dark-theme');
    });

### ⚓ Anchor Positioning
CSS Anchor Positioning with JavaScript fallback for unsupported browsers.

Example usage:

    import { tether } from '@sc4rfurryx/proteusjs/anchor';

    const tooltip = document.getElementById('tooltip');
    const button = document.getElementById('button');

    const controller = tether(tooltip, {
      anchor: button,
      placement: 'top',
      offset: 8
    });

**Browser Compatibility:**
- ✅ Chrome 125+ (native CSS anchor positioning)
- ✅ Firefox, Safari (JavaScript fallback)
- ⚠️ Limited support in older browsers

### 📦 Container Queries
Modern container-based responsive design.

Example usage:

    import { container } from '@sc4rfurryx/proteusjs/container';

    // Enable container queries
    container('.card', {
      type: 'inline-size',
      name: 'card-container'
    });

### ⚡ Performance
Web performance optimization utilities.

Example usage:

    import { boost } from '@sc4rfurryx/proteusjs/perf';

    // Content visibility optimization
    boost.contentVisibility('.lazy-content', 'auto');

    // Measure Core Web Vitals
    const metrics = await boost.measureCWV();
    console.log(`CLS: ${metrics.cls}, FID: ${metrics.fid}ms, LCP: ${metrics.lcp}s`);

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

## Framework Support

ProteusJS provides adapters for React, Vue, Svelte, and other popular frameworks with the same API.

## Browser Support

ProteusJS works across all modern browsers with intelligent fallbacks for unsupported features.

## License

MIT License - see [LICENSE](LICENSE) file for details.
