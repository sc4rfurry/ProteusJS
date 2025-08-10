ProteusJS v1.1.0 Documentation
===============================

.. image:: https://img.shields.io/npm/v/@sc4rfurryx/proteusjs.svg
   :target: https://www.npmjs.com/package/@sc4rfurryx/proteusjs
   :alt: npm version

.. image:: https://img.shields.io/npm/dm/@sc4rfurryx/proteusjs.svg
   :target: https://www.npmjs.com/package/@sc4rfurryx/proteusjs
   :alt: npm downloads

.. image:: https://img.shields.io/github/license/sc4rfurry/ProteusJS.svg
   :target: https://github.com/sc4rfurry/ProteusJS/blob/main/LICENSE
   :alt: License

**ProteusJS v1.1.0** is a collection of native-first, tree-shakable web development primitives that wrap modern web platform features with excellent developer experience. Each module is lightweight (≤6KB gzipped), framework-agnostic, and designed for performance, accessibility, and modern web standards.

🌊 **Native-first web development primitives that adapt like the sea god himself**

Key Features
------------

🧩 **Modular Architecture**
   Import only what you need with subpath exports

🌐 **Native-First**
   Prefer web standards over JavaScript re-implementations

🎯 **Tree-Shakable**
   Each module is independently optimized (≤6KB gzipped)

⚡ **Performance-First**
   Built-in Core Web Vitals optimizations

♿ **Accessibility-First**
   WCAG compliance baked in, not bolted on

🔧 **Framework Adapters**
   React, Vue, and Svelte integrations included

Available Modules
-----------------

🎬 **Transitions**
   View Transitions API wrapper with fallbacks

📜 **Scroll**
   Scroll-driven animations with Intersection Observer fallback

⚓ **Anchor**
   CSS Anchor Positioning with JavaScript fallback

🎭 **Popover**
   HTML Popover API wrapper with accessibility

📦 **Container**
   Container queries with dev visualization

🔤 **Typography**
   Fluid typography with CSS clamp()

🔍 **A11y Audit**
   Accessibility auditing (dev-only)

♿ **A11y Primitives**
   Headless accessibility patterns

⚡ **Performance**
   Performance guardrails and optimizations

Quick Start
-----------

Installation
~~~~~~~~~~~~

.. code-block:: bash

   # npm
   npm install @sc4rfurryx/proteusjs

   # yarn
   yarn add @sc4rfurryx/proteusjs

   # pnpm
   pnpm add @sc4rfurryx/proteusjs

Basic Usage
~~~~~~~~~~~

.. code-block:: typescript

   import { ProteusJS } from '@sc4rfurryx/proteusjs';

   // Initialize ProteusJS
   const proteus = new ProteusJS();

   // Create responsive container
   proteus.container('.hero-section', {
     breakpoints: {
       sm: '320px',
       md: '768px',
       lg: '1024px'
     }
   });

   // Apply fluid typography
   proteus.fluidType('h1, h2, h3', {
     minSize: 16,
     maxSize: 32,
     accessibility: 'AAA'
   });

CDN Usage
~~~~~~~~~

.. code-block:: html

   <script src="https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.js"></script>
   <script>
     const proteus = new ProteusJS();
     proteus.autoOptimize(document.body);
   </script>

Documentation Structure
-----------------------

.. toctree::
   :maxdepth: 2
   :caption: Getting Started

   getting-started/installation
   getting-started/quick-start
   getting-started/configuration
   getting-started/basic-concepts

.. toctree::
   :maxdepth: 2
   :caption: Core Features

   features/container-queries
   features/fluid-typography
   features/accessibility
   features/performance
   features/responsive-images
   features/theming

.. toctree::
   :maxdepth: 2
   :caption: API Reference

   api/core-api
   api/container-api
   api/typography-api
   api/accessibility-api
   api/performance-api
   api/configuration

.. toctree::
   :maxdepth: 2
   :caption: Framework Integration

   frameworks/react
   frameworks/vue
   frameworks/angular
   frameworks/vanilla-js

.. toctree::
   :maxdepth: 2
   :caption: Advanced Usage

   advanced/custom-breakpoints
   advanced/performance-optimization
   advanced/accessibility-compliance
   advanced/browser-compatibility
   advanced/plugin-development

.. toctree::
   :maxdepth: 2
   :caption: Examples & Tutorials

   examples/e-commerce-grid
   examples/blog-layout
   examples/dashboard
   examples/landing-page
   examples/before-after

.. toctree::
   :maxdepth: 2
   :caption: Guides

   guides/migration
   guides/troubleshooting
   guides/best-practices
   guides/performance-tips

.. toctree::
   :maxdepth: 1
   :caption: Reference

   reference/browser-support
   reference/changelog
   reference/contributing
   reference/faq

What Makes ProteusJS Different?
-------------------------------

**Container-Based Responsive Design**
   Unlike traditional media queries that respond to viewport size, ProteusJS uses container queries to make elements responsive to their parent container's size.

**Accessibility-First Approach**
   Every feature is designed with accessibility in mind, providing automatic WCAG 2.1 compliance and screen reader support.

**Performance Optimized**
   Advanced performance monitoring, memory management, and optimization techniques ensure your site stays fast.

**Framework Agnostic**
   Works seamlessly with any framework or vanilla JavaScript, with dedicated integrations for React, Vue, and Angular.

**Zero Configuration**
   Intelligent defaults mean you can get started immediately, with extensive customization options when needed.

Browser Support
---------------

ProteusJS supports all modern browsers with automatic polyfills for older browsers:

- **Chrome/Edge**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **iOS Safari**: 14+
- **Android Chrome**: 88+

Legacy browser support (IE11, older mobile browsers) is provided through automatic polyfills.

Community & Support
-------------------

- **GitHub**: https://github.com/sc4rfurry/ProteusJS
- **Issues**: https://github.com/sc4rfurry/ProteusJS/issues
- **Discussions**: https://github.com/sc4rfurry/ProteusJS/discussions
- **npm**: https://www.npmjs.com/package/@sc4rfurryx/proteusjs

License
-------

ProteusJS is released under the MIT License. See the `LICENSE <https://github.com/sc4rfurry/ProteusJS/blob/main/LICENSE>`_ file for details.

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
