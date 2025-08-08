Core API Reference
===================

The ProteusJS core API provides the main interface for all library functionality. This reference covers all public methods, properties, and configuration options.

ProteusJS Class
---------------

The main class that provides access to all ProteusJS functionality.

Constructor
~~~~~~~~~~~

.. code-block:: typescript

   new ProteusJS(config?: ProteusConfig)

Creates a new ProteusJS instance with optional configuration.

**Parameters:**

- ``config`` (optional): Configuration object for customizing ProteusJS behavior

**Example:**

.. code-block:: typescript

   import { ProteusJS } from '@sc4rfurryx/proteusjs';

   // Basic initialization
   const proteus = new ProteusJS();

   // With configuration
   const proteus = new ProteusJS({
     debug: true,
     performance: 'high',
     accessibility: true,
     autoInit: true
   });

Configuration Interface
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   interface ProteusConfig {
     debug?: boolean;                    // Enable debug logging
     performance?: 'low' | 'medium' | 'high';  // Performance level
     accessibility?: boolean;            // Enable accessibility features
     autoInit?: boolean;                // Auto-initialize on creation
     containers?: ContainerConfig;       // Container query settings
     typography?: TypographyConfig;      // Typography settings
     layout?: LayoutConfig;             // Layout settings
     animations?: AnimationConfig;       // Animation settings
     theming?: ThemingConfig;           // Theme settings
   }

Core Methods
~~~~~~~~~~~~

init()
^^^^^^

.. code-block:: typescript

   init(): Promise<void>

Initializes ProteusJS and all its subsystems.

**Returns:** Promise that resolves when initialization is complete

**Example:**

.. code-block:: typescript

   const proteus = new ProteusJS({ autoInit: false });
   await proteus.init();

destroy()
^^^^^^^^^

.. code-block:: typescript

   destroy(): void

Destroys the ProteusJS instance and cleans up all resources.

**Example:**

.. code-block:: typescript

   proteus.destroy();

getConfig()
^^^^^^^^^^^

.. code-block:: typescript

   getConfig(): Required<ProteusConfig>

Returns the current configuration object.

**Returns:** Complete configuration object with all defaults applied

**Example:**

.. code-block:: typescript

   const config = proteus.getConfig();
   console.log('Debug mode:', config.debug);

Container Methods
~~~~~~~~~~~~~~~~~

container()
^^^^^^^^^^^

.. code-block:: typescript

   container(
     selector: string | Element | Element[], 
     options?: ContainerOptions
   ): SmartContainer | SmartContainer[]

Creates responsive containers with container query support.

**Parameters:**

- ``selector``: CSS selector, element, or array of elements
- ``options``: Container configuration options

**Returns:** Single container or array of containers

**Example:**

.. code-block:: typescript

   // Basic container
   proteus.container('.my-container', {
     breakpoints: {
       sm: '320px',
       md: '768px',
       lg: '1024px'
     }
   });

   // Advanced container with all options
   proteus.container('.advanced-container', {
     breakpoints: {
       xs: '280px',
       sm: '400px',
       md: '600px',
       lg: '800px',
       xl: '1000px'
     },
     units: true,           // Enable container units
     isolation: true,       // Isolate container context
     polyfill: true,        // Use polyfill if needed
     autoDetect: true,      // Auto-detect container candidates
     debounce: 16,          // Debounce resize events
     threshold: 0.1         // Intersection threshold
   });

ContainerOptions Interface
^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: typescript

   interface ContainerOptions {
     breakpoints?: Record<string, string>;  // Breakpoint definitions
     units?: boolean;                       // Enable container units
     isolation?: boolean;                   // Isolate container context
     polyfill?: boolean;                   // Use polyfill fallback
     autoDetect?: boolean;                 // Auto-detect containers
     debounce?: number;                    // Debounce delay (ms)
     threshold?: number;                   // Intersection threshold
   }

Typography Methods
~~~~~~~~~~~~~~~~~~

fluidType()
^^^^^^^^^^^

.. code-block:: typescript

   fluidType(
     selector: string | Element | Element[], 
     config?: ScalingConfig
   ): void

Applies fluid typography with accessibility compliance.

**Parameters:**

- ``selector``: CSS selector, element, or array of elements
- ``config``: Scaling configuration options

**Example:**

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
     minContainer: 320,
     maxContainer: 1200,
     unit: 'px',
     containerUnit: 'px',
     curve: 'linear',
     accessibility: 'AAA',
     enforceAccessibility: true,
     respectUserPreferences: true
   });

ScalingConfig Interface
^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: typescript

   interface ScalingConfig {
     minSize: number;                      // Minimum font size
     maxSize: number;                      // Maximum font size
     minContainer?: number;                // Minimum container size
     maxContainer?: number;                // Maximum container size
     unit?: 'px' | 'rem' | 'em';          // Font size unit
     containerUnit?: 'px' | 'rem' | 'em'; // Container unit
     curve?: 'linear' | 'ease' | 'ease-in' | 'ease-out';
     accessibility?: 'none' | 'AA' | 'AAA';
     enforceAccessibility?: boolean;
     respectUserPreferences?: boolean;
   }

createTypeScale()
^^^^^^^^^^^^^^^^^

.. code-block:: typescript

   createTypeScale(config?: ScaleConfig): TypeScale | number[]

Creates a typographic scale for consistent text sizing.

**Parameters:**

- ``config``: Scale configuration options

**Returns:** TypeScale object or array of scale values

**Example:**

.. code-block:: typescript

   // Create a modular scale
   const scale = proteus.createTypeScale({
     ratio: 1.25,        // Major third
     baseSize: 16,       // Base font size
     baseUnit: 'px',     // Unit
     levels: 6,          // Number of scale levels
     direction: 'both'   // Generate larger and smaller sizes
   });

   console.log(scale); // [10.24, 12.8, 16, 20, 25, 31.25]

Layout Methods
~~~~~~~~~~~~~~

createGrid()
^^^^^^^^^^^^

.. code-block:: typescript

   createGrid(
     selector: string | Element, 
     config?: Partial<GridConfig>
   ): AdaptiveGrid | null

Creates an adaptive CSS Grid layout.

**Parameters:**

- ``selector``: CSS selector or element
- ``config``: Grid configuration options

**Returns:** AdaptiveGrid instance or null

**Example:**

.. code-block:: typescript

   proteus.createGrid('.product-grid', {
     columns: {
       min: 1,
       max: 4,
       ideal: 3
     },
     gap: '1rem',
     minItemWidth: '250px',
     maxItemWidth: '350px',
     aspectRatio: '1/1',
     autoFlow: 'row',
     alignItems: 'stretch',
     justifyItems: 'stretch'
   });

Accessibility Methods
~~~~~~~~~~~~~~~~~~~~~

enableAccessibility()
^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: typescript

   enableAccessibility(
     element: Element, 
     config?: AccessibilityConfig
   ): void

Enables comprehensive accessibility features for an element.

**Parameters:**

- ``element``: Target element
- ``config``: Accessibility configuration options

**Example:**

.. code-block:: typescript

   // Basic accessibility
   proteus.enableAccessibility(document.body, {
     wcagLevel: 'AA',
     screenReader: true,
     keyboardNavigation: true
   });

   // Advanced accessibility
   proteus.enableAccessibility(document.main, {
     wcagLevel: 'AAA',
     screenReader: true,
     keyboardNavigation: true,
     motionPreferences: true,
     colorCompliance: true,
     cognitiveAccessibility: true,
     announcements: true,
     focusManagement: true,
     skipLinks: true,
     landmarks: true,
     autoLabeling: true,
     enhanceErrorMessages: true,
     showReadingTime: true,
     simplifyContent: true,
     readingLevel: 'middle'
   });

Performance Methods
~~~~~~~~~~~~~~~~~~~

getPerformanceMetrics()
^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: typescript

   getPerformanceMetrics(): PerformanceMetrics

Returns current performance metrics.

**Returns:** Object containing performance data

**Example:**

.. code-block:: typescript

   const metrics = proteus.getPerformanceMetrics();
   console.log('Frame rate:', metrics.frameRate);
   console.log('Memory usage:', metrics.memoryUsage);
   console.log('DOM nodes:', metrics.domNodes);

optimizePerformance()
^^^^^^^^^^^^^^^^^^^^^

.. code-block:: typescript

   optimizePerformance(): void

Triggers performance optimization based on current metrics.

**Example:**

.. code-block:: typescript

   // Manually trigger optimization
   proteus.optimizePerformance();

Utility Methods
~~~~~~~~~~~~~~~

detectFeatures()
^^^^^^^^^^^^^^^^

.. code-block:: typescript

   detectFeatures(): FeatureSupport

Detects browser feature support and active polyfills.

**Returns:** Object containing feature support information

**Example:**

.. code-block:: typescript

   const features = proteus.detectFeatures();
   console.log('Container queries supported:', features.containerQueries);
   console.log('Missing features:', features.missing);
   console.log('Polyfills active:', features.polyfillsActive);

version
^^^^^^^

.. code-block:: typescript

   readonly version: string

Returns the current ProteusJS version.

**Example:**

.. code-block:: typescript

   console.log('ProteusJS version:', proteus.version);

Static Methods
~~~~~~~~~~~~~~

getInstance()
^^^^^^^^^^^^^

.. code-block:: typescript

   static getInstance(): ProteusJS | null

Returns the current ProteusJS instance (singleton pattern).

**Returns:** Current instance or null if none exists

**Example:**

.. code-block:: typescript

   const proteus = ProteusJS.getInstance();
   if (proteus) {
     console.log('ProteusJS is already initialized');
   }

Subsystem Access
~~~~~~~~~~~~~~~~

ProteusJS provides access to its internal subsystems for advanced usage:

.. code-block:: typescript

   // Typography subsystem
   const typography = proteus.typography;

   // Container subsystem  
   const containers = proteus.containers;

   // Accessibility subsystem
   const accessibility = proteus.accessibility;

   // Performance monitor
   const performance = proteus.performance;

   // Theme system
   const theming = proteus.theming;

Event System
~~~~~~~~~~~~

ProteusJS includes a built-in event system for monitoring changes:

.. code-block:: typescript

   // Listen for container changes
   proteus.on('containerResize', (event) => {
     console.log('Container resized:', event.detail);
   });

   // Listen for typography changes
   proteus.on('typographyUpdate', (event) => {
     console.log('Typography updated:', event.detail);
   });

   // Listen for accessibility violations
   proteus.on('accessibilityViolation', (event) => {
     console.warn('Accessibility issue:', event.detail);
   });

Error Handling
~~~~~~~~~~~~~~

ProteusJS includes comprehensive error handling:

.. code-block:: typescript

   try {
     proteus.container('.invalid-selector', {
       breakpoints: { invalid: 'not-a-size' }
     });
   } catch (error) {
     console.error('ProteusJS error:', error.message);
   }

   // Enable debug mode for detailed error information
   const proteus = new ProteusJS({ debug: true });

Best Practices
~~~~~~~~~~~~~~

1. **Initialize Once**: Create a single ProteusJS instance per application
2. **Use Configuration**: Set up configuration at initialization rather than per-method
3. **Clean Up**: Always call ``destroy()`` when the instance is no longer needed
4. **Monitor Performance**: Use ``getPerformanceMetrics()`` to monitor impact
5. **Handle Errors**: Wrap ProteusJS calls in try-catch blocks for production code
