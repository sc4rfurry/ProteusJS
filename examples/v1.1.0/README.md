# ProteusJS v1.1.0 Examples

This directory contains comprehensive examples demonstrating all the new modular capabilities of ProteusJS v1.1.0.

## 🌊 What's New in v1.1.0

ProteusJS v1.1.0 represents a complete architectural transformation from a monolithic library to a collection of **native-first, tree-shakable web development primitives**. Each module wraps modern web platform features with excellent developer experience.

## 📁 Example Files

### 🌐 Vanilla JavaScript
- **`basic-usage.html`** - Complete showcase of all 9 core modules
- **`../showcase/v1.1.0-landing.html`** - Beautiful landing page with interactive demos

### ⚛️ React Examples
- **`react-examples.tsx`** - React hooks and components for all modules
- Demonstrates: `useTransition`, `usePopover`, `useAnchor`, `useContainer`, etc.

### 🟢 Vue Examples  
- **`vue-examples.vue`** - Vue composables and directives
- Demonstrates: `useTransition`, `usePopover`, reactive container queries, etc.

### 🧡 Svelte Examples
- **`svelte-examples.svelte`** - Svelte actions and stores (coming soon)

## 🧩 Core Modules Demonstrated

### 1. 🎬 Transitions Module
```javascript
import { transition, navigate } from '@sc4rfurryx/proteusjs/transitions';

// Smooth View Transitions API
await transition(() => {
  document.body.classList.toggle('dark-mode');
});
```

### 2. ⚓ Anchor Module
```javascript
import { tether } from '@sc4rfurryx/proteusjs/anchor';

// CSS Anchor Positioning with fallback
const controller = tether(floatingEl, {
  anchor: anchorEl,
  placement: 'bottom-start',
  offset: 8
});
```

### 3. 🎭 Popover Module
```javascript
import { attach } from '@sc4rfurryx/proteusjs/popover';

// HTML Popover API with accessibility
const popover = attach(triggerEl, panelEl, {
  type: 'menu',
  trapFocus: true,
  restoreFocus: true
});
```

### 4. 📦 Container Module
```javascript
import { defineContainer } from '@sc4rfurryx/proteusjs/container';

// Container queries with dev visualization
defineContainer('.sidebar', {
  name: 'sidebar',
  type: 'inline-size'
});
```

### 5. 🔤 Typography Module
```javascript
import { fluidType } from '@sc4rfurryx/proteusjs/typography';

// Fluid typography with CSS clamp()
const { css } = fluidType(1, 2.5, {
  minViewportPx: 320,
  maxViewportPx: 1200,
  lineHeight: 1.5
});
```

### 6. 📜 Scroll Module
```javascript
import { scrollAnimate } from '@sc4rfurryx/proteusjs/scroll';

// Scroll-driven animations
scrollAnimate('.parallax', {
  timeline: 'view',
  range: 'entry 0% exit 100%'
});
```

### 7. ♿ A11y Primitives Module
```javascript
import { dialog, tooltip, combobox, tabs, menu } from '@sc4rfurryx/proteusjs/a11y-primitives';

// Headless accessibility patterns
const dialogController = dialog(dialogEl, {
  modal: true,
  trapFocus: true
});

const tooltipController = tooltip(triggerEl, tooltipEl, {
  delay: 500,
  placement: 'top'
});
```

### 8. ⚡ Performance Module
```javascript
import { boost } from '@sc4rfurryx/proteusjs/perf';

// Performance optimizations
boost.contentVisibility('.lazy-content', 'auto');
boost.speculate({
  prerender: ['/next-page'],
  prefetch: ['/docs']
});

// Core Web Vitals measurement
const metrics = await boost.measureCWV();
```

### 9. 🔍 A11y Audit Module
```javascript
import { audit } from '@sc4rfurryx/proteusjs/a11y-audit';

// Development-time accessibility auditing
const report = await audit(document.body, {
  rules: ['color-contrast', 'focus-visible', 'aria-labels'],
  level: 'AA'
});
```

## 🔧 Framework Adapters

### ⚛️ React Hooks
```jsx
import { useTransition, usePopover, useAnchor } from '@sc4rfurryx/proteusjs/adapters/react';

function MyComponent() {
  const [isTransitioning, startTransition] = useTransition();
  const { triggerRef, panelRef, isOpen, toggle } = usePopover({
    type: 'menu',
    trapFocus: true
  });

  return (
    <div>
      <button ref={triggerRef} onClick={toggle}>
        Toggle Menu
      </button>
      {isOpen && (
        <div ref={panelRef}>Menu content</div>
      )}
    </div>
  );
}
```

### 🟢 Vue Composables
```vue
<template>
  <div>
    <button ref="triggerRef" @click="toggle">
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

### 🧡 Svelte Actions
```svelte
<script>
  import { proteusTransition, proteusPopover } from '@sc4rfurryx/proteusjs/adapters/svelte';
  let isOpen = false;
</script>

<button use:proteusTransition={{ callback: () => isOpen = !isOpen }}>
  Toggle Menu
</button>

<div use:proteusPopover={{ type: 'menu', isOpen, trapFocus: true }}>
  Menu content
</div>
```

## 🚀 Running the Examples

### 1. Basic HTML Examples
```bash
# Serve the HTML files with a local server
npx serve examples/v1.1.0/
# or
python -m http.server 8000
```

### 2. React Examples
```bash
# In a React project
npm install @sc4rfurryx/proteusjs
# Copy react-examples.tsx to your project
```

### 3. Vue Examples
```bash
# In a Vue project  
npm install @sc4rfurryx/proteusjs
# Copy vue-examples.vue to your project
```

## 🎨 Showcase Landing Page

The **`../showcase/v1.1.0-landing.html`** file is a complete, production-ready landing page featuring:

- ✨ **Glass morphism design** with custom CSS
- 🎬 **Interactive demos** of all modules
- 📱 **Responsive design** using container queries
- ♿ **Full accessibility** compliance
- 🎨 **Custom SVG animations** and graphics
- 🌙 **Dark/light theme** with View Transitions
- ⚡ **Performance optimizations** built-in

## 🔗 Key Features Demonstrated

- **Native-first approach** - Prefers web standards over JavaScript
- **Tree-shakable modules** - Import only what you need
- **Framework agnostic** - Works with any framework or vanilla JS
- **Accessibility first** - WCAG compliance built-in
- **Performance optimized** - Core Web Vitals focused
- **Modern web standards** - View Transitions, Anchor Positioning, Container Queries
- **Excellent DX** - TypeScript support, great error messages

## 📚 Next Steps

1. **Explore the examples** - Start with `basic-usage.html`
2. **Try the showcase** - Open `../showcase/v1.1.0-landing.html`
3. **Read the docs** - Visit the documentation for detailed API reference
4. **Install ProteusJS** - `npm install @sc4rfurryx/proteusjs`
5. **Start building** - Import modules and start creating!

---

**🌊 ProteusJS v1.1.0 - Native-first web development primitives that adapt like the sea god himself!**
