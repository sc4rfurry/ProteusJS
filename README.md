<div align="center">

# 🌊 ProteusJS v1.1.0

**Native-first web development primitives that adapt like the sea god himself**

*Lightweight, framework-agnostic utilities for modern, accessible, high-performance web applications*

[![npm version](https://img.shields.io/npm/v/@sc4rfurryx/proteusjs.svg?style=for-the-badge)](https://www.npmjs.com/package/@sc4rfurryx/proteusjs)
[![npm downloads](https://img.shields.io/npm/dm/@sc4rfurryx/proteusjs.svg?style=for-the-badge)](https://www.npmjs.com/package/@sc4rfurryx/proteusjs)
[![GitHub stars](https://img.shields.io/github/stars/sc4rfurry/ProteusJS.svg?style=for-the-badge)](https://github.com/sc4rfurry/ProteusJS/stargazers)
[![GitHub license](https://img.shields.io/github/license/sc4rfurry/ProteusJS.svg?style=for-the-badge)](https://github.com/sc4rfurry/ProteusJS/blob/main/LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WCAG 2.1](https://img.shields.io/badge/WCAG-2.1%20AAA-4CAF50?style=for-the-badge)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/sc4rfurry/ProteusJS/ci.yml?style=for-the-badge)](https://github.com/sc4rfurry/ProteusJS/actions)
[![Coverage](https://img.shields.io/badge/Coverage-86%25-brightgreen?style=for-the-badge)](https://github.com/sc4rfurry/ProteusJS)

</div>

---

## 🚀 **What is ProteusJS v1.1.0?**

ProteusJS v1.1.0 is a complete architectural transformation - from a monolithic framework to a collection of **native-first, tree-shakable modules** that wrap modern web platform features with great developer experience. Each module is lightweight (≤6KB gzipped), framework-agnostic, and designed for **performance**, **accessibility**, and **modern web standards**.

### 🆕 **What's New in v1.1.0**

- **🧩 Modular Architecture**: Import only what you need with subpath exports
- **🌐 Native-First**: Prefer web standards over JavaScript re-implementations
- **🎯 Tree-Shakable**: Each module is independently optimized
- **⚡ Performance-First**: Built-in Core Web Vitals optimizations
- **♿ Accessibility-First**: WCAG compliance baked in, not bolted on
- **🔧 Framework Adapters**: React, Vue, and Svelte integrations

## ✨ **Key Features**

<table>
<tr>
<td width="50%">

### 🎯 **Intelligent Container Queries**
- 📦 Native container query support with automatic fallbacks
- 📱 Responsive breakpoints based on element size, not viewport
- ⚡ Real-time layout adaptation with performance optimization
- 🧠 Memory-efficient observer management

### 📝 **Advanced Typography System**
- 🔤 Fluid typography with clamp-based scaling
- 📏 Automatic line height optimization for readability
- ♿ WCAG AAA compliance for enhanced accessibility
- 🌍 Multi-language support with intelligent spacing

</td>
<td width="50%">

### ♿ **Comprehensive Accessibility Engine**
- ✅ WCAG 2.1 Level A, AA, and AAA compliance
- 🔊 Screen reader optimization with live regions
- ⌨️ Keyboard navigation enhancement
- 🧩 Cognitive accessibility features including content simplification
- 🔍 Automated accessibility auditing and reporting

### 🚀 **Performance Optimizations**
- 🚀 Lazy loading with intersection observers
- 🧹 Memory management and cleanup
- ⏱️ Debounced resize handling
- 🎯 Efficient DOM manipulation

</td>
</tr>
</table>

## 🚀 **Quick Start**

### 📦 **Installation**

```bash
# npm
npm install @sc4rfurryx/proteusjs

# yarn
yarn add @sc4rfurryx/proteusjs

# pnpm
pnpm add @sc4rfurryx/proteusjs

# CDN (for quick testing)
<script src="https://unpkg.com/@sc4rfurryx/proteusjs@latest/dist/proteus.min.js"></script>
```

### ⚡ **Basic Usage (v1.1.0 Modular API)**

```typescript
// 🧩 Import only what you need (tree-shakable)
import { transition, navigate } from '@sc4rfurryx/proteusjs/transitions';
import { tether } from '@sc4rfurryx/proteusjs/anchor';
import { attach } from '@sc4rfurryx/proteusjs/popover';
import { boost } from '@sc4rfurryx/proteusjs/perf';

// 🎬 View Transitions
await transition(() => {
  document.body.classList.toggle('dark-mode');
});

// ⚓ Anchor Positioning
const controller = tether(floatingEl, {
  anchor: anchorEl,
  placement: 'bottom',
  align: 'center'
});

// 🎭 Popover/Dialog
const popover = attach(triggerEl, panelEl, {
  type: 'menu',
  trapFocus: true
});

// ⚡ Performance Boost
boost.contentVisibility('.lazy-content');
boost.speculate({ prerender: ['/next-page'] });
```

### 🧩 **All Available Modules**

```typescript
// 🎬 View Transitions API
import { transition, navigate } from '@sc4rfurryx/proteusjs/transitions';

// 📜 Scroll-driven Animations
import { scrollAnimate, scrollTimeline } from '@sc4rfurryx/proteusjs/scroll';

// ⚓ CSS Anchor Positioning
import { tether, anchor } from '@sc4rfurryx/proteusjs/anchor';

// 🎭 HTML Popover API
import { attach, dialog } from '@sc4rfurryx/proteusjs/popover';

// 📦 Container Queries
import { defineContainer, observe } from '@sc4rfurryx/proteusjs/container';

// 🔤 Fluid Typography
import { fluidType, typeScale } from '@sc4rfurryx/proteusjs/typography';

// 🔍 A11y Auditing (dev-only)
import { audit } from '@sc4rfurryx/proteusjs/a11y-audit';

// ♿ A11y Primitives
import { dialog, tooltip, combobox, tabs, menu } from '@sc4rfurryx/proteusjs/a11y-primitives';

// ⚡ Performance Guardrails
import { boost } from '@sc4rfurryx/proteusjs/perf';
```

<details>
<summary>🎨 <strong>Complete Example</strong></summary>

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProteusJS v1.1.0 Demo</title>
</head>
<body>
    <div class="hero-container">
        <h1>Modern Web Development</h1>
        <p>Native-first, accessible, performant.</p>
        <button id="theme-toggle">Toggle Theme</button>
    </div>

    <script type="module">
        import { transition } from '@sc4rfurryx/proteusjs/transitions';
        import { defineContainer } from '@sc4rfurryx/proteusjs/container';
        import { fluidType } from '@sc4rfurryx/proteusjs/typography';
        import { boost } from '@sc4rfurryx/proteusjs/perf';

        // Container queries
        defineContainer('.hero-container', {
          name: 'hero',
          type: 'inline-size'
        });

        // Fluid typography
        const { css } = fluidType(1, 2.5, { lineHeight: 1.5 });
        document.head.insertAdjacentHTML('beforeend', `<style>h1 { ${css} }</style>`);

        // View transitions
        document.getElementById('theme-toggle').addEventListener('click', () => {
          transition(() => {
            document.body.classList.toggle('dark-theme');
          });
        });

        // Performance optimizations
        boost.contentVisibility('.hero-container');
        boost.speculate({ prefetch: ['/about', '/contact'] });
    </script>
</body>
</html>
```

</details>

---

## 🎯 **Why Choose ProteusJS?**

<div align="center">

| 🆚 **Traditional Approach** | ✨ **ProteusJS Approach** |
|:---|:---|
| 📱 Viewport-based breakpoints | 📦 **Container-based breakpoints** |
| 🔧 Manual accessibility implementation | ♿ **Automated WCAG compliance** |
| ⚡ Basic performance optimization | 🚀 **Real-time performance monitoring** |
| 📝 Static typography | 🔤 **Fluid, accessible typography** |
| 🎨 Framework-specific solutions | 🌐 **Framework-agnostic design** |

</div>

### 🏆 **Key Differentiators**

- **🎯 Container-First Design**: Revolutionary approach using element-based breakpoints instead of viewport-based
- **♿ Accessibility-First**: Built-in WCAG 2.1 compliance with cognitive accessibility features
- **⚡ Performance-Optimized**: Real-time monitoring with sub-60ms response times
- **👨‍💻 Developer-Friendly**: Comprehensive TypeScript support with excellent documentation
- **🔧 Framework-Agnostic**: Works with React, Vue, Angular, and vanilla JavaScript

---

## 🎨 **Live Examples & Showcases**

Experience ProteusJS in action with our comprehensive real-world examples:

### 🛒 **[E-commerce Product Grid](examples/real-world/e-commerce-showcase.html)**
- Responsive product grid with container queries
- Accessibility-enhanced product cards
- Real-time performance metrics
- WCAG compliance demonstrations

### 📝 **[Blog Article Layout](examples/real-world/blog-article-showcase.html)**
- Fluid typography with reading time estimation
- Cognitive accessibility features
- Content simplification toggle
- Enhanced keyboard navigation

### 📊 **[Dashboard Interface](examples/real-world/dashboard-showcase.html)**
- Adaptive admin panel layout
- Container-based responsive widgets
- Accessibility controls panel
- Performance monitoring dashboard

### 🚀 **[Landing Page](examples/real-world/landing-page-showcase.html)**
- Hero section with fluid typography
- Interactive container query demos
- Performance metrics visualization
- Responsive component showcases

### 📊 **[Before/After Comparison](examples/comparisons/before-after-showcase.html)**
- Side-by-side traditional vs ProteusJS
- Interactive comparison controls
- Feature comparison table
- Code examples and metrics

---

## 📚 **API Documentation**

<details>
<summary>🎬 <strong>Transitions Module</strong></summary>

### `transition(callback, options?)`
Wraps View Transitions API with fallbacks.

```typescript
import { transition, navigate } from '@sc4rfurryx/proteusjs/transitions';

// Basic transition
await transition(() => {
  document.body.classList.toggle('dark-mode');
});

// Navigation with transition
await navigate('/new-page', {
  fallback: 'fade',
  duration: 300
});
```

</details>

<details>
<summary>⚓ <strong>Anchor Module</strong></summary>

### `tether(floating, options)`
CSS Anchor Positioning with JS fallback.

```typescript
import { tether } from '@sc4rfurryx/proteusjs/anchor';

const controller = tether(floatingEl, {
  anchor: anchorEl,
  placement: 'bottom-start',
  offset: 8,
  flip: true,
  shift: true
});

// Cleanup
controller.destroy();
```

</details>

<details>
<summary>🎭 <strong>Popover Module</strong></summary>

### `attach(trigger, panel, options)`
HTML Popover API with accessibility.

```typescript
import { attach } from '@sc4rfurryx/proteusjs/popover';

const popover = attach(triggerEl, panelEl, {
  type: 'menu',
  trigger: 'click',
  trapFocus: true,
  restoreFocus: true,
  closeOnEscape: true
});
```

</details>

<details>
<summary>📦 <strong>Container Module</strong></summary>

### `defineContainer(selector, options)`
Container queries with dev visualization.

```typescript
import { defineContainer } from '@sc4rfurryx/proteusjs/container';

defineContainer('.sidebar', {
  name: 'sidebar',
  type: 'inline-size'
});

// CSS: @container sidebar (min-width: 300px) { ... }
```

</details>

<details>
<summary>🔤 <strong>Typography Module</strong></summary>

### `fluidType(minRem, maxRem, options?)`
Generates CSS clamp() for fluid typography.

```typescript
import { fluidType } from '@sc4rfurryx/proteusjs/typography';

const { css } = fluidType(1, 2.5, {
  minViewportPx: 320,
  maxViewportPx: 1200,
  lineHeight: 1.5
});

// Returns: font-size: clamp(1rem, 4vw + 0.5rem, 2.5rem); line-height: 1.5;
```

</details>

<details>
<summary>♿ <strong>A11y Primitives Module</strong></summary>

### Headless accessibility patterns

```typescript
import { dialog, tooltip, combobox, tabs, menu } from '@sc4rfurryx/proteusjs/a11y-primitives';

// Modal dialog
const dialogController = dialog(dialogEl, {
  modal: true,
  trapFocus: true,
  restoreFocus: true
});

// Accessible tooltip
const tooltipController = tooltip(triggerEl, tooltipEl, {
  delay: 500,
  placement: 'top'
});

// Keyboard-navigable tabs
const tabsController = tabs(tabsContainerEl);
```

</details>

<details>
<summary>⚡ <strong>Performance Module</strong></summary>

### `boost` object with performance utilities

```typescript
import { boost } from '@sc4rfurryx/proteusjs/perf';

// Content visibility optimization
boost.contentVisibility('.lazy-section', 'auto', {
  containIntrinsicSize: '600px 400px'
});

// Resource priority hints
boost.fetchPriority('img.hero', 'high');

// Speculation rules
boost.speculate({
  prerender: ['/pricing'],
  prefetch: ['/blog'],
  sameOriginOnly: true
});

// Yield to browser
await boost.yieldToBrowser();
```

</details>

---

## 🔧 **Framework Adapters**

<details>
<summary>⚛️ <strong>React Adapter</strong></summary>

```typescript
import { useTransition, usePopover, useAnchor } from '@sc4rfurryx/proteusjs/adapters/react';

function MyComponent() {
  const [isTransitioning, startTransition] = useTransition();

  const { triggerRef, panelRef, isOpen, toggle } = usePopover({
    type: 'menu',
    trapFocus: true
  });

  const { floatingRef, anchorRef } = useAnchor({
    placement: 'bottom',
    offset: 8
  });

  return (
    <div>
      <button
        ref={triggerRef}
        onClick={() => startTransition(() => toggle())}
      >
        Toggle Menu
      </button>
      <div ref={panelRef} hidden={!isOpen}>
        Menu content
      </div>
    </div>
  );
}
```

</details>

<details>
<summary>🟢 <strong>Vue Adapter</strong></summary>

```vue
<template>
  <div>
    <button @click="startTransition(() => toggle())">
      Toggle Menu
    </button>
    <div v-show="isOpen" ref="panelRef">
      Menu content
    </div>
  </div>
</template>

<script setup>
import { useTransition, usePopover } from '@sc4rfurryx/proteusjs/adapters/vue';

const { isTransitioning, startTransition } = useTransition();
const { triggerRef, panelRef, isOpen, toggle } = usePopover({
  type: 'menu',
  trapFocus: true
});
</script>
```

</details>

<details>
<summary>🧡 <strong>Svelte Adapter</strong></summary>

```svelte
<script>
  import { proteusTransition, proteusPopover } from '@sc4rfurryx/proteusjs/adapters/svelte';

  let isOpen = false;
</script>

<button
  use:proteusTransition={{
    callback: () => isOpen = !isOpen
  }}
>
  Toggle Menu
</button>

<div
  use:proteusPopover={{
    type: 'menu',
    isOpen,
    trapFocus: true
  }}
>
  Menu content
</div>
```

</details>

---

## 🎨 **Real-World Examples**

<details>
<summary>🛒 <strong>E-commerce Product Grid</strong></summary>

```typescript
// Responsive product grid that adapts to container size
proteus.container('.product-grid', {
  breakpoints: { sm: '300px', md: '600px', lg: '900px' }
});

proteus.createGrid('.product-grid', {
  minItemWidth: '200px',
  gap: '1rem'
});

// Accessible product cards
proteus.enableAccessibility('.product-card', {
  wcagLevel: 'AA',
  autoLabeling: true,
  enhanceErrorMessages: true
});
```

</details>

<details>
<summary>📝 <strong>Blog Article Layout</strong></summary>

```typescript
// Fluid typography for optimal reading
proteus.fluidType('article h1', {
  minSize: 24,
  maxSize: 48,
  accessibility: 'AAA'
});

proteus.fluidType('article p', {
  minSize: 16,
  maxSize: 18,
  accessibility: 'AAA'
});

// Cognitive accessibility features
proteus.enableAccessibility('article', {
  showReadingTime: true,
  simplifyContent: true,
  readingLevel: 'middle',
  cognitiveAccessibility: true
});
```

</details>

<details>
<summary>📊 <strong>Dashboard Layout</strong></summary>

```typescript
// Responsive dashboard with container queries
proteus.container('.dashboard', {
  breakpoints: {
    compact: '400px',
    comfortable: '800px',
    spacious: '1200px'
  },
  announceChanges: true
});

// Accessible data visualization
proteus.enableAccessibility('.chart', {
  wcagLevel: 'AA',
  screenReader: true,
  autoLabeling: true
});
```

</details>

---

## 🌐 **Browser Compatibility**

<div align="center">

| Browser | Version | Support Level |
|:--------|:--------|:-------------|
| 🟢 **Chrome** | 88+ | ✅ Full Support |
| 🟢 **Firefox** | 85+ | ✅ Full Support |
| 🟢 **Safari** | 14+ | ✅ Full Support |
| 🟢 **Edge** | 88+ | ✅ Full Support |
| 📱 **iOS Safari** | 14+ | ✅ Full Support |
| 📱 **Android Chrome** | 88+ | ✅ Full Support |

</div>

### 🔧 **Polyfills Included**
- ✅ Container Query polyfill for older browsers
- ✅ ResizeObserver polyfill
- ✅ IntersectionObserver polyfill
- ✅ Graceful degradation strategies

---

## 🔧 **Framework Integration**

<details>
<summary>⚛️ <strong>React Integration</strong></summary>

```tsx
import { useEffect, useRef } from 'react';
import { ProteusJS } from '@sc4rfurryx/proteusjs';

function ResponsiveComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const proteus = new ProteusJS();
      proteus.container(containerRef.current, {
        breakpoints: { sm: '300px', lg: '600px' }
      });

      return () => proteus.destroy();
    }
  }, []);

  return <div ref={containerRef}>Responsive content</div>;
}
```

</details>

<details>
<summary>💚 <strong>Vue 3 Integration</strong></summary>

```vue
<template>
  <div ref="container">Responsive content</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ProteusJS } from '@sc4rfurryx/proteusjs';

const container = ref();
let proteus;

onMounted(() => {
  proteus = new ProteusJS();
  proteus.container(container.value, {
    breakpoints: { sm: '300px', lg: '600px' }
  });
});

onUnmounted(() => {
  proteus?.destroy();
});
</script>
```

</details>

<details>
<summary>🅰️ <strong>Angular Integration</strong></summary>

```typescript
import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ProteusJS } from '@sc4rfurryx/proteusjs';

@Component({
  selector: 'app-responsive',
  template: '<div>Responsive content</div>'
})
export class ResponsiveComponent implements OnInit, OnDestroy {
  private proteus: ProteusJS;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.proteus = new ProteusJS();
    this.proteus.container(this.elementRef.nativeElement, {
      breakpoints: { sm: '300px', lg: '600px' }
    });
  }

  ngOnDestroy() {
    this.proteus.destroy();
  }
}
```

</details>

---

## 🧪 **Testing & Quality**

<div align="center">

![Test Coverage](https://img.shields.io/badge/Coverage-86%25-brightgreen?style=for-the-badge)
![Tests Passing](https://img.shields.io/badge/Tests-132%2F153%20Passing-success?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=for-the-badge)

</div>

```bash
# 🧪 Run all tests
npm test

# ♿ Run accessibility validation tests
npm run accessibility

# ⚡ Run performance benchmarks
npm run benchmark

# 📊 Generate coverage report
npm run test:coverage
```

---

## 🤝 **Contributing**

We welcome contributions from the community! 🎉

<div align="center">

[![Contributors](https://img.shields.io/github/contributors/sc4rfurry/ProteusJS.svg?style=for-the-badge)](https://github.com/sc4rfurry/ProteusJS/graphs/contributors)
[![Issues](https://img.shields.io/github/issues/sc4rfurry/ProteusJS.svg?style=for-the-badge)](https://github.com/sc4rfurry/ProteusJS/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/sc4rfurry/ProteusJS.svg?style=for-the-badge)](https://github.com/sc4rfurry/ProteusJS/pulls)

</div>

### 🚀 **Quick Start for Contributors**

```bash
# 1️⃣ Fork and clone the repository
git clone https://github.com/sc4rfurry/ProteusJS.git
cd ProteusJS

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start development
npm run dev

# 4️⃣ Run tests
npm test

# 5️⃣ Build for production
npm run build:prod
```

### 📋 **Code Standards**
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier formatting
- ✅ WCAG 2.1 compliance required
- ✅ 90%+ test coverage target
- ✅ Semantic commit messages

### 🐛 **Found a Bug?**
[Open an issue](https://github.com/sc4rfurry/ProteusJS/issues/new) with a detailed description and reproduction steps.

### 💡 **Have an Idea?**
[Start a discussion](https://github.com/sc4rfurry/ProteusJS/discussions) to share your ideas with the community.

---

## 📄 **License**

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**ProteusJS** is open source software licensed under the [MIT License](LICENSE).

</div>

---

## 🙏 **Acknowledgments**

Special thanks to:

- 🌐 **Web Content Accessibility Guidelines (WCAG) 2.1** - For accessibility standards
- 📦 **CSS Container Queries Working Group** - For container query specifications
- 🎨 **Modern Web Standards Community** - For best practices and innovations
- 👥 **All Contributors** - For making ProteusJS better every day

---

<div align="center">

## 🌟 **Star History**

[![Star History Chart](https://api.star-history.com/svg?repos=sc4rfurry/ProteusJS&type=Date)](https://star-history.com/#sc4rfurry/ProteusJS&Date)

---

### **Made with ❤️ by [sc4rfurry](https://github.com/sc4rfurry)**

**ProteusJS** - *Shape-shifting responsive design for the modern web* 🌊

[⭐ Star this repo](https://github.com/sc4rfurry/ProteusJS/stargazers) • [🐛 Report Bug](https://github.com/sc4rfurry/ProteusJS/issues) • [💡 Request Feature](https://github.com/sc4rfurry/ProteusJS/issues) • [📖 Documentation](https://github.com/sc4rfurry/ProteusJS#readme)

</div>
- **Visual Regression Tests**: UI consistency validation

## 🚀 Production Deployment

### Quality Gates
Before deploying to production, ensure all quality gates pass:

```bash
npm run validate:production
```

Required quality gates:
- ✅ Test coverage ≥ 80%
- ✅ Performance benchmarks passed
- ✅ WCAG AA compliance ≥ 90%
- ✅ No critical security vulnerabilities
- ✅ Bundle size optimized
- ✅ Browser compatibility verified

### Performance Monitoring
```javascript
// Production monitoring setup
proteus.performance.addCallback('production', (metrics) => {
  // Send to monitoring service
  analytics.track('performance', {
    fps: metrics.averageFPS,
    memory: metrics.memoryUsage.percentage,
    operations: metrics.operationsPerSecond
  });
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/proteusjs/proteus.git
cd proteus
npm install
npm run dev
```

### Running Tests
```bash
npm run test:watch
npm run test:coverage
npm run validate:all
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the CSS Container Queries specification
- Built with modern web standards and accessibility in mind
- Named after Proteus, the shape-shifting sea god of Greek mythology
- Special thanks to the web standards community and accessibility advocates
