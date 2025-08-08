Container Queries
=================

Container queries are the cornerstone of ProteusJS, enabling true container-based responsive design. Unlike traditional media queries that respond to viewport size, container queries make elements responsive to their parent container's dimensions.

Overview
--------

Container queries solve the fundamental problem of component-based responsive design. When building reusable components, you often don't know where they'll be placed or what size their container will be. Container queries let components adapt to their actual available space.

**Key Benefits:**

- **Component-based responsiveness**: Components adapt to their container, not the viewport
- **Reusable designs**: Same component works in sidebar, main content, or modal
- **Better performance**: Only affected elements are updated when containers resize
- **Future-proof**: Uses native CSS Container Queries with automatic polyfills

Basic Usage
-----------

Creating a Responsive Container
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   import { ProteusJS } from '@sc4rfurryx/proteusjs';

   const proteus = new ProteusJS();

   // Basic container with breakpoints
   proteus.container('.card-container', {
     breakpoints: {
       sm: '320px',
       md: '500px',
       lg: '700px'
     }
   });

This creates a container that will apply different styles based on its width:

.. code-block:: css

   /* Default styles (< 320px) */
   .card-container .card {
     display: block;
   }

   /* Small container (>= 320px) */
   .card-container[data-container-size="sm"] .card {
     display: flex;
     flex-direction: column;
   }

   /* Medium container (>= 500px) */
   .card-container[data-container-size="md"] .card {
     flex-direction: row;
   }

   /* Large container (>= 700px) */
   .card-container[data-container-size="lg"] .card {
     padding: 2rem;
   }

Advanced Configuration
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   proteus.container('.advanced-container', {
     breakpoints: {
       xs: '280px',
       sm: '400px',
       md: '600px',
       lg: '800px',
       xl: '1000px'
     },
     units: true,           // Enable container units (cw, ch, etc.)
     isolation: true,       // Isolate container context
     polyfill: true,        // Use polyfill if needed
     autoDetect: true,      // Auto-detect container candidates
     debounce: 16,          // Debounce resize events (ms)
     threshold: 0.1         // Intersection threshold
   });

Container Units
---------------

When ``units: true`` is enabled, ProteusJS provides container-relative units:

.. code-block:: css

   .container-element {
     /* Container width units */
     width: 50cw;           /* 50% of container width */
     padding: 2cw;          /* 2% of container width */
     
     /* Container height units */
     height: 30ch;          /* 30% of container height */
     margin: 1ch 0;         /* 1% of container height */
     
     /* Container inline/block units */
     font-size: 4ci;        /* 4% of container inline size */
     line-height: 6cb;      /* 6% of container block size */
   }

Real-World Examples
-------------------

Responsive Card Component
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: html

   <div class="card-container">
     <article class="card">
       <img src="image.jpg" alt="Card image" class="card-image">
       <div class="card-content">
         <h2 class="card-title">Responsive Card</h2>
         <p class="card-text">This card adapts to its container size.</p>
         <button class="card-button">Learn More</button>
       </div>
     </article>
   </div>

.. code-block:: css

   .card {
     background: white;
     border-radius: 8px;
     overflow: hidden;
     box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   }

   /* Default: stacked layout */
   .card-image {
     width: 100%;
     height: 200px;
     object-fit: cover;
   }

   .card-content {
     padding: 1rem;
   }

   /* Medium container: side-by-side layout */
   .card-container[data-container-size="md"] .card {
     display: flex;
   }

   .card-container[data-container-size="md"] .card-image {
     width: 200px;
     height: auto;
   }

   .card-container[data-container-size="md"] .card-content {
     flex: 1;
     padding: 1.5rem;
   }

   /* Large container: enhanced spacing */
   .card-container[data-container-size="lg"] .card-content {
     padding: 2rem;
   }

.. code-block:: typescript

   proteus.container('.card-container', {
     breakpoints: {
       sm: '300px',
       md: '500px',
       lg: '700px'
     }
   });

Adaptive Navigation
~~~~~~~~~~~~~~~~~~~

.. code-block:: html

   <nav class="navigation">
     <div class="nav-brand">Logo</div>
     <ul class="nav-menu">
       <li><a href="#home">Home</a></li>
       <li><a href="#about">About</a></li>
       <li><a href="#services">Services</a></li>
       <li><a href="#contact">Contact</a></li>
     </ul>
     <button class="nav-toggle">☰</button>
   </nav>

.. code-block:: css

   .navigation {
     display: flex;
     align-items: center;
     padding: 1rem;
     background: white;
     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   }

   /* Default: collapsed menu */
   .nav-menu {
     display: none;
   }

   .nav-toggle {
     display: block;
     margin-left: auto;
   }

   /* Medium container: horizontal menu */
   .navigation[data-container-size="md"] .nav-menu {
     display: flex;
     gap: 2rem;
     margin-left: auto;
     margin-right: 1rem;
   }

   .navigation[data-container-size="md"] .nav-toggle {
     display: none;
   }

.. code-block:: typescript

   proteus.container('.navigation', {
     breakpoints: {
       sm: '400px',
       md: '600px',
       lg: '800px'
     }
   });

Grid Layouts
~~~~~~~~~~~~

.. code-block:: html

   <div class="product-grid">
     <div class="product-item">Product 1</div>
     <div class="product-item">Product 2</div>
     <div class="product-item">Product 3</div>
     <div class="product-item">Product 4</div>
     <div class="product-item">Product 5</div>
     <div class="product-item">Product 6</div>
   </div>

.. code-block:: css

   .product-grid {
     display: grid;
     gap: 1rem;
     grid-template-columns: 1fr; /* Default: single column */
   }

   /* Small container: 2 columns */
   .product-grid[data-container-size="sm"] {
     grid-template-columns: repeat(2, 1fr);
   }

   /* Medium container: 3 columns */
   .product-grid[data-container-size="md"] {
     grid-template-columns: repeat(3, 1fr);
   }

   /* Large container: 4 columns */
   .product-grid[data-container-size="lg"] {
     grid-template-columns: repeat(4, 1fr);
   }

   .product-item {
     background: #f5f5f5;
     padding: 1rem;
     border-radius: 8px;
     text-align: center;
   }

.. code-block:: typescript

   proteus.container('.product-grid', {
     breakpoints: {
       sm: '400px',
       md: '600px',
       lg: '900px',
       xl: '1200px'
     }
   });

Browser Support
---------------

ProteusJS container queries work in all modern browsers:

**Native Support:**
- Chrome 105+
- Firefox 110+
- Safari 16+

**Polyfill Support:**
- All browsers back to IE11
- Automatic polyfill detection and loading
- Graceful degradation for unsupported features

Performance Considerations
--------------------------

**Optimization Techniques:**

1. **Debounced Resize Events**: Resize events are debounced to prevent excessive calculations
2. **Intersection Observer**: Only active containers are monitored
3. **Efficient DOM Updates**: Minimal DOM manipulation using data attributes
4. **Memory Management**: Automatic cleanup when containers are removed

**Best Practices:**

.. code-block:: typescript

   // Good: Reasonable number of breakpoints
   proteus.container('.container', {
     breakpoints: {
       sm: '400px',
       md: '600px',
       lg: '800px'
     }
   });

   // Avoid: Too many breakpoints
   proteus.container('.container', {
     breakpoints: {
       xs: '300px',
       sm: '350px',
       md: '400px',
       // ... too many breakpoints
     }
   });

Troubleshooting
---------------

**Common Issues:**

1. **Container not responding**: Ensure the container has a defined width
2. **Styles not applying**: Check CSS selector specificity
3. **Performance issues**: Reduce number of breakpoints or increase debounce time

**Debug Mode:**

.. code-block:: typescript

   const proteus = new ProteusJS({ debug: true });
   
   proteus.container('.debug-container', {
     breakpoints: { md: '500px' }
   });

   // Check container status
   console.log(proteus.getContainerInfo('.debug-container'));

API Reference
-------------

For complete API documentation, see :doc:`../api/container-api`.

Next Steps
----------

- :doc:`fluid-typography` - Learn about responsive typography
- :doc:`accessibility` - Ensure your containers are accessible
- :doc:`../examples/e-commerce-grid` - See real-world examples
