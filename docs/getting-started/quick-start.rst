Quick Start Guide
==================

Get up and running with ProteusJS in just a few minutes. This guide will walk you through the essential features and show you how to create responsive, accessible web layouts.

Basic Setup
-----------

1. **Install ProteusJS**

.. code-block:: bash

   npm install @sc4rfurryx/proteusjs

2. **Import and Initialize**

.. code-block:: typescript

   import { ProteusJS } from '@sc4rfurryx/proteusjs';

   const proteus = new ProteusJS();

3. **Start Using Container Queries**

.. code-block:: typescript

   // Make any element responsive to its container size
   proteus.container('.my-container', {
     breakpoints: {
       sm: '320px',
       md: '768px', 
       lg: '1024px'
     }
   });

Your First Responsive Component
-------------------------------

Let's create a responsive card component that adapts to its container:

HTML Structure
~~~~~~~~~~~~~~

.. code-block:: html

   <div class="card-container">
     <div class="card">
       <img src="image.jpg" alt="Card image" class="card-image">
       <div class="card-content">
         <h2 class="card-title">Responsive Card</h2>
         <p class="card-text">This card adapts to its container size, not the viewport!</p>
         <button class="card-button">Learn More</button>
       </div>
     </div>
   </div>

CSS Styles
~~~~~~~~~~~

.. code-block:: css

   .card-container {
     width: 100%;
     max-width: 800px;
     margin: 0 auto;
     padding: 1rem;
   }

   .card {
     background: white;
     border-radius: 8px;
     box-shadow: 0 2px 8px rgba(0,0,0,0.1);
     overflow: hidden;
   }

   /* Default mobile-first layout */
   .card-content {
     padding: 1rem;
   }

   .card-title {
     margin: 0 0 0.5rem 0;
   }

   .card-text {
     margin: 0 0 1rem 0;
     color: #666;
   }

   /* Container query styles - applied when container is >= 500px */
   .card-container[data-container-size="md"] .card {
     display: flex;
   }

   .card-container[data-container-size="md"] .card-image {
     width: 200px;
     height: 150px;
     object-fit: cover;
   }

   .card-container[data-container-size="md"] .card-content {
     flex: 1;
     padding: 1.5rem;
   }

JavaScript Setup
~~~~~~~~~~~~~~~~

.. code-block:: typescript

   import { ProteusJS } from '@sc4rfurryx/proteusjs';

   const proteus = new ProteusJS();

   // Enable container queries
   proteus.container('.card-container', {
     breakpoints: {
       sm: '320px',
       md: '500px',
       lg: '700px'
     }
   });

   // Add fluid typography
   proteus.fluidType('.card-title', {
     minSize: 18,
     maxSize: 24,
     accessibility: 'AA'
   });

   proteus.fluidType('.card-text', {
     minSize: 14,
     maxSize: 16,
     accessibility: 'AA'
   });

Essential Features
------------------

Container Queries
~~~~~~~~~~~~~~~~~

Make elements responsive to their container, not the viewport:

.. code-block:: typescript

   // Basic container queries
   proteus.container('.sidebar', {
     breakpoints: {
       narrow: '200px',
       wide: '300px'
     }
   });

   // Advanced container queries with custom properties
   proteus.container('.gallery', {
     breakpoints: {
       sm: '300px',
       md: '600px',
       lg: '900px',
       xl: '1200px'
     },
     units: true, // Enable container units (cw, ch, etc.)
     isolation: true // Isolate container context
   });

Fluid Typography
~~~~~~~~~~~~~~~~

Create text that scales smoothly with accessibility compliance:

.. code-block:: typescript

   // Basic fluid typography
   proteus.fluidType('h1', {
     minSize: 24,
     maxSize: 48
   });

   // Advanced with accessibility
   proteus.fluidType('p', {
     minSize: 16,
     maxSize: 18,
     accessibility: 'AAA', // WCAG AAA compliance
     minViewport: 320,
     maxViewport: 1200
   });

   // Responsive line height
   proteus.fluidType('.content', {
     minSize: 16,
     maxSize: 18,
     accessibility: 'AA',
     enforceAccessibility: true,
     respectUserPreferences: true
   });

Accessibility Features
~~~~~~~~~~~~~~~~~~~~~~

Enable comprehensive accessibility with one line:

.. code-block:: typescript

   // Basic accessibility enhancement
   proteus.enableAccessibility(document.body, {
     wcagLevel: 'AA',
     screenReader: true,
     keyboardNavigation: true
   });

   // Advanced accessibility features
   proteus.enableAccessibility('.main-content', {
     wcagLevel: 'AAA',
     screenReader: true,
     cognitiveAccessibility: true,
     showReadingTime: true,
     simplifyContent: true,
     readingLevel: 'middle'
   });

Performance Monitoring
~~~~~~~~~~~~~~~~~~~~~~

Monitor and optimize performance automatically:

.. code-block:: typescript

   // Enable performance monitoring
   const proteus = new ProteusJS({
     performance: 'high',
     debug: true
   });

   // Get performance metrics
   const metrics = proteus.getPerformanceMetrics();
   console.log('Frame rate:', metrics.frameRate);
   console.log('Memory usage:', metrics.memoryUsage);

Complete Example
----------------

Here's a complete example that demonstrates multiple ProteusJS features:

.. code-block:: html

   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>ProteusJS Demo</title>
     <style>
       body {
         font-family: system-ui, sans-serif;
         margin: 0;
         padding: 2rem;
         background: #f5f5f5;
       }

       .hero {
         background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
         color: white;
         padding: 3rem 2rem;
         border-radius: 12px;
         margin-bottom: 2rem;
         text-align: center;
       }

       .grid {
         display: grid;
         gap: 1rem;
         grid-template-columns: 1fr;
       }

       /* Container-based responsive grid */
       .grid[data-container-size="md"] {
         grid-template-columns: repeat(2, 1fr);
       }

       .grid[data-container-size="lg"] {
         grid-template-columns: repeat(3, 1fr);
       }

       .card {
         background: white;
         padding: 1.5rem;
         border-radius: 8px;
         box-shadow: 0 2px 4px rgba(0,0,0,0.1);
       }
     </style>
   </head>
   <body>
     <div class="hero">
       <h1 class="hero-title">Welcome to ProteusJS</h1>
       <p class="hero-subtitle">Shape-shifting responsive design</p>
     </div>

     <div class="grid">
       <div class="card">
         <h2>Container Queries</h2>
         <p>Responsive design based on container size, not viewport.</p>
       </div>
       <div class="card">
         <h2>Fluid Typography</h2>
         <p>Text that scales smoothly with accessibility compliance.</p>
       </div>
       <div class="card">
         <h2>Performance</h2>
         <p>Optimized for speed with advanced monitoring.</p>
       </div>
     </div>

     <script src="https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.js"></script>
     <script>
       const proteus = new ProteusJS({
         debug: true,
         performance: 'high'
       });

       // Container queries for the grid
       proteus.container('.grid', {
         breakpoints: {
           sm: '400px',
           md: '600px',
           lg: '900px'
         }
       });

       // Fluid typography
       proteus.fluidType('.hero-title', {
         minSize: 28,
         maxSize: 48,
         accessibility: 'AA'
       });

       proteus.fluidType('.hero-subtitle', {
         minSize: 16,
         maxSize: 20,
         accessibility: 'AA'
       });

       proteus.fluidType('h2', {
         minSize: 18,
         maxSize: 24,
         accessibility: 'AA'
       });

       // Enable accessibility
       proteus.enableAccessibility(document.body, {
         wcagLevel: 'AA',
         screenReader: true,
         keyboardNavigation: true
       });

       console.log('ProteusJS initialized!');
       console.log('Features:', proteus.detectFeatures());
     </script>
   </body>
   </html>

Next Steps
----------

Now that you have ProteusJS running, explore these topics:

**Core Features**
- :doc:`../features/container-queries` - Deep dive into container queries
- :doc:`../features/fluid-typography` - Advanced typography techniques
- :doc:`../features/accessibility` - Comprehensive accessibility features

**Framework Integration**
- :doc:`../frameworks/react` - React hooks and components
- :doc:`../frameworks/vue` - Vue 3 composables and directives
- :doc:`../frameworks/angular` - Angular services and directives

**Advanced Topics**
- :doc:`../advanced/performance-optimization` - Performance best practices
- :doc:`../advanced/accessibility-compliance` - WCAG compliance guide
- :doc:`../examples/e-commerce-grid` - Real-world examples

Common Patterns
---------------

**Responsive Navigation**

.. code-block:: typescript

   proteus.container('.navigation', {
     breakpoints: { mobile: '600px', desktop: '900px' }
   });

**Adaptive Sidebar**

.. code-block:: typescript

   proteus.container('.sidebar', {
     breakpoints: { collapsed: '200px', expanded: '300px' }
   });

**Responsive Typography Scale**

.. code-block:: typescript

   proteus.fluidType('h1', { minSize: 32, maxSize: 64 });
   proteus.fluidType('h2', { minSize: 24, maxSize: 48 });
   proteus.fluidType('h3', { minSize: 20, maxSize: 32 });
   proteus.fluidType('p', { minSize: 16, maxSize: 18 });

Tips for Success
----------------

1. **Start Small**: Begin with basic container queries and fluid typography
2. **Test Accessibility**: Always test with screen readers and keyboard navigation
3. **Monitor Performance**: Use the built-in performance monitoring
4. **Progressive Enhancement**: ProteusJS works great as a progressive enhancement
5. **Framework Integration**: Use the framework-specific integrations for better DX
