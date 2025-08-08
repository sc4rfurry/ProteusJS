Installation Guide
==================

ProteusJS can be installed and used in multiple ways depending on your project setup and preferences.

Package Manager Installation
-----------------------------

npm
~~~

.. code-block:: bash

   npm install @sc4rfurryx/proteusjs

yarn
~~~~

.. code-block:: bash

   yarn add @sc4rfurryx/proteusjs

pnpm
~~~~

.. code-block:: bash

   pnpm add @sc4rfurryx/proteusjs

CDN Installation
----------------

For quick prototyping or simple projects, you can use ProteusJS directly from a CDN:

Latest Version
~~~~~~~~~~~~~~

.. code-block:: html

   <!-- Minified version (recommended for production) -->
   <script src="https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.min.js"></script>

   <!-- Development version (with source maps) -->
   <script src="https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.js"></script>

Specific Version
~~~~~~~~~~~~~~~~

.. code-block:: html

   <!-- Replace 1.0.0 with your desired version -->
   <script src="https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.min.js"></script>

ES Modules
~~~~~~~~~~

.. code-block:: html

   <!-- ES Module version -->
   <script type="module">
     import { ProteusJS } from 'https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.esm.min.js';
     const proteus = new ProteusJS();
   </script>

Module Formats
--------------

ProteusJS is distributed in multiple formats to support different environments:

ES Modules (ESM)
~~~~~~~~~~~~~~~~

.. code-block:: javascript

   // Modern bundlers (Webpack, Vite, Rollup)
   import { ProteusJS } from '@sc4rfurryx/proteusjs';

   // Specific imports for tree-shaking
   import { ProteusJS, FluidTypography, SmartContainer } from '@sc4rfurryx/proteusjs';

CommonJS (CJS)
~~~~~~~~~~~~~~

.. code-block:: javascript

   // Node.js or older bundlers
   const { ProteusJS } = require('@sc4rfurryx/proteusjs');

UMD (Universal Module Definition)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: html

   <!-- Browser global -->
   <script src="https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.min.js"></script>
   <script>
     const proteus = new ProteusJS();
   </script>

TypeScript Support
------------------

ProteusJS includes full TypeScript definitions out of the box:

.. code-block:: typescript

   import { ProteusJS, ProteusConfig, ContainerOptions } from '@sc4rfurryx/proteusjs';

   const config: ProteusConfig = {
     debug: true,
     performance: 'high',
     accessibility: true
   };

   const proteus = new ProteusJS(config);

   const containerOptions: ContainerOptions = {
     breakpoints: {
       sm: '320px',
       md: '768px',
       lg: '1024px'
     }
   };

   proteus.container('.my-container', containerOptions);

Framework-Specific Installation
-------------------------------

React
~~~~~

.. code-block:: bash

   npm install @sc4rfurryx/proteusjs

.. code-block:: typescript

   import { ProteusProvider, useProteus } from '@sc4rfurryx/proteusjs/react';

Vue 3
~~~~~

.. code-block:: bash

   npm install @sc4rfurryx/proteusjs

.. code-block:: typescript

   import { ProteusPlugin } from '@sc4rfurryx/proteusjs/vue';

Angular
~~~~~~~

.. code-block:: bash

   npm install @sc4rfurryx/proteusjs

.. code-block:: typescript

   import { ProteusService } from '@sc4rfurryx/proteusjs/angular';

Verification
------------

After installation, verify that ProteusJS is working correctly:

Basic Test
~~~~~~~~~~

.. code-block:: html

   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>ProteusJS Test</title>
   </head>
   <body>
     <div class="container">
       <h1>ProteusJS Test</h1>
       <p>This text should be responsive!</p>
     </div>

     <script src="https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.js"></script>
     <script>
       const proteus = new ProteusJS({ debug: true });

       // Test container queries
       proteus.container('.container', {
         breakpoints: { sm: '300px', lg: '600px' }
       });

       // Test fluid typography
       proteus.fluidType('h1, p', {
         minSize: 14,
         maxSize: 24
       });

       console.log('ProteusJS initialized successfully!');
       console.log('Version:', proteus.version);
       console.log('Features:', proteus.detectFeatures());
     </script>
   </body>
   </html>

Feature Detection
~~~~~~~~~~~~~~~~~

.. code-block:: javascript

   import { ProteusJS } from '@sc4rfurryx/proteusjs';

   const proteus = new ProteusJS();
   const features = proteus.detectFeatures();

   console.log('Supported features:', features.supported);
   console.log('Missing features:', features.missing);
   console.log('Polyfills active:', features.polyfillsActive);

Bundle Size
-----------

ProteusJS is optimized for minimal bundle impact:

- **Minified**: ~230KB
- **Gzipped**: ~50KB
- **Tree-shakeable**: Import only what you need

Tree Shaking
~~~~~~~~~~~~

.. code-block:: javascript

   // Import only specific features to reduce bundle size
   import { ProteusJS } from '@sc4rfurryx/proteusjs/core';
   import { FluidTypography } from '@sc4rfurryx/proteusjs/typography';
   import { SmartContainer } from '@sc4rfurryx/proteusjs/containers';

Next Steps
----------

Now that ProteusJS is installed, continue with:

1. :doc:`quick-start` - Get up and running in minutes
2. :doc:`configuration` - Learn about configuration options
3. :doc:`basic-concepts` - Understand core concepts
4. :doc:`../features/container-queries` - Dive into container queries

Troubleshooting
---------------

Common installation issues and solutions:

**Module not found error**
   Make sure you're using the correct import path and that the package is properly installed.

**TypeScript errors**
   Ensure your TypeScript version is 4.5+ and that you have proper type definitions.

**Build errors**
   Check that your bundler supports ES modules and has proper configuration for external dependencies.

For more help, see the :doc:`../guides/troubleshooting` guide or open an issue on GitHub.
