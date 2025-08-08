# ProteusJS API Documentation

## 🚀 Getting Started

### Installation & Initialization

```typescript
import { ProteusJS } from '@sc4rfurryx/proteusjs';

// Initialize ProteusJS
const proteus = new ProteusJS(options?);
```

### Constructor Options

```typescript
interface ProteusOptions {
  performance?: {
    debounceMs?: number;        // Default: 16ms
    enableCaching?: boolean;    // Default: true
    memoryLimit?: number;       // Default: 100MB
  };
  accessibility?: {
    defaultLevel?: 'A' | 'AA' | 'AAA';  // Default: 'AA'
    announcements?: boolean;    // Default: true
  };
  debug?: boolean;             // Default: false
}
```

## 📦 Container Query API

### `container(selector, options)`

Creates responsive containers with element-based breakpoints.

```typescript
proteus.container(selector: string | Element | Element[], options: ContainerOptions)

interface ContainerOptions {
  breakpoints: BreakpointConfig;
  containerType?: 'inline-size' | 'size' | 'block-size' | 'auto';
  debounceMs?: number;
  announceChanges?: boolean;
  cssClasses?: boolean;
  callbacks?: {
    resize?: (state: ContainerState) => void;
    breakpointChange?: (breakpoint: string, active: boolean) => void;
  };
}

interface BreakpointConfig {
  [name: string]: string;  // e.g., { sm: '300px', md: '600px' }
}

interface ContainerState {
  width: number;
  height: number;
  activeBreakpoints: string[];
  containerType: string;
}
```

#### Example Usage

```typescript
// Basic container with breakpoints
proteus.container('.sidebar', {
  breakpoints: {
    sm: '200px',
    md: '400px',
    lg: '600px'
  }
});

// Advanced container with callbacks
proteus.container('.product-grid', {
  breakpoints: { sm: '300px', lg: '900px' },
  announceChanges: true,
  callbacks: {
    breakpointChange: (breakpoint, active) => {
      console.log(`${breakpoint} is now ${active ? 'active' : 'inactive'}`);
    }
  }
});
```

## 📝 Typography API

### `fluidType(selector, options)`

Applies fluid typography with accessibility compliance.

```typescript
proteus.fluidType(selector: string | Element | Element[], options: FluidTypeOptions)

interface FluidTypeOptions {
  minSize: number;              // Minimum font size in specified unit
  maxSize: number;              // Maximum font size in specified unit
  minContainer?: number;        // Minimum container width (default: 320)
  maxContainer?: number;        // Maximum container width (default: 1200)
  unit?: 'px' | 'rem' | 'em';   // Default: 'px'
  accessibility?: 'A' | 'AA' | 'AAA';  // WCAG compliance level
  scalingFunction?: 'linear' | 'exponential' | string;
}
```

#### Example Usage

```typescript
// Basic fluid typography
proteus.fluidType('h1', {
  minSize: 24,
  maxSize: 48
});

// AAA accessibility compliance
proteus.fluidType('p', {
  minSize: 16,
  maxSize: 18,
  accessibility: 'AAA',  // Enforces 1.5+ line height
  unit: 'rem'
});

// Custom scaling
proteus.fluidType('.hero-title', {
  minSize: 32,
  maxSize: 72,
  minContainer: 400,
  maxContainer: 1400,
  scalingFunction: 'exponential'
});
```

## ♿ Accessibility API

### `enableAccessibility(element, options)`

Enables comprehensive accessibility features.

```typescript
proteus.enableAccessibility(element: Element, options: AccessibilityOptions)

interface AccessibilityOptions {
  wcagLevel?: 'A' | 'AA' | 'AAA';
  screenReader?: boolean;
  keyboardNavigation?: boolean;
  motionPreferences?: boolean;
  colorCompliance?: boolean;
  cognitiveAccessibility?: boolean;
  announcements?: boolean;
  focusManagement?: boolean;
  skipLinks?: boolean;
  landmarks?: boolean;
  autoLabeling?: boolean;
  enhanceErrorMessages?: boolean;
  showReadingTime?: boolean;
  simplifyContent?: boolean;
  readingLevel?: 'elementary' | 'middle' | 'high' | 'college';
}
```

#### Example Usage

```typescript
// Basic accessibility enhancement
proteus.enableAccessibility(document.body, {
  wcagLevel: 'AA',
  screenReader: true,
  keyboardNavigation: true
});

// Cognitive accessibility features
proteus.enableAccessibility(document.main, {
  wcagLevel: 'AAA',
  cognitiveAccessibility: true,
  showReadingTime: true,
  simplifyContent: true,
  readingLevel: 'middle'
});

// Form accessibility enhancement
proteus.enableAccessibility(document.querySelector('form'), {
  enhanceErrorMessages: true,
  autoLabeling: true,
  focusManagement: true
});
```

### `auditAccessibility(element)`

Performs comprehensive accessibility audit.

```typescript
proteus.auditAccessibility(element: Element): AccessibilityReport

interface AccessibilityReport {
  score: number;                // 0-100
  level: 'A' | 'AA' | 'AAA';
  passed: boolean;
  issues: AccessibilityIssue[];
  recommendations: string[];
}

interface AccessibilityIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  element: Element;
  description: string;
  wcagReference: string;
}
```

## 🎨 Layout API

### `createGrid(selector, options)`

Creates adaptive CSS Grid layouts.

```typescript
proteus.createGrid(selector: string | Element | Element[], options: GridOptions)

interface GridOptions {
  minItemWidth: string;         // e.g., '250px'
  gap?: string;                 // Default: '1rem'
  maxColumns?: number;          // Maximum columns
  aspectRatio?: string;         // e.g., '16/9'
  responsive?: boolean;         // Default: true
}
```

#### Example Usage

```typescript
// Basic responsive grid
proteus.createGrid('.gallery', {
  minItemWidth: '200px',
  gap: '1rem'
});

// Advanced grid with constraints
proteus.createGrid('.product-grid', {
  minItemWidth: '250px',
  maxColumns: 4,
  aspectRatio: '4/3',
  gap: '2rem'
});
```

### `applySpacing(element, options)`

Applies consistent spacing with vertical rhythm.

```typescript
proteus.applySpacing(element: Element, options: SpacingOptions)

interface SpacingOptions {
  baseSize: number;             // Base font size in px
  scale: number;                // Spacing scale ratio
  rhythm?: boolean;             // Enable vertical rhythm
  unit?: 'px' | 'rem' | 'em';
}
```

## 🚀 Performance API

### `getPerformanceMetrics()`

Returns detailed performance information.

```typescript
proteus.getPerformanceMetrics(): PerformanceMetrics

interface PerformanceMetrics {
  renderTime: number;           // Average render time in ms
  memoryUsage: number;          // Memory usage in MB
  cacheHitRate: number;         // Cache efficiency (0-1)
  activeElements: number;       // Number of managed elements
  lastUpdateTime: number;       // Timestamp of last update
  fps: number;                  // Current frame rate
}
```

### `enablePerformanceMonitoring(options)`

Enables real-time performance monitoring.

```typescript
proteus.enablePerformanceMonitoring(options: PerformanceOptions)

interface PerformanceOptions {
  interval?: number;            // Monitoring interval in ms
  threshold?: {
    renderTime?: number;        // Alert threshold for render time
    memoryUsage?: number;       // Alert threshold for memory usage
    fps?: number;               // Alert threshold for FPS
  };
  onAlert?: (metric: string, value: number) => void;
}
```

## 🔧 Utility Methods

### `destroy()`

Cleans up all ProteusJS instances and event listeners.

```typescript
proteus.destroy(): void
```

### `getVersion()`

Returns the current ProteusJS version.

```typescript
proteus.getVersion(): string
```

### `isSupported(feature)`

Checks if a feature is supported in the current browser.

```typescript
proteus.isSupported(feature: string): boolean

// Supported features:
// 'container-queries', 'resize-observer', 'intersection-observer'
```

## 🎯 Advanced Features

### `autoOptimize(element, options)`

Automatically applies optimal settings based on content analysis.

```typescript
proteus.autoOptimize(element: Element, options: AutoOptimizeOptions)

interface AutoOptimizeOptions {
  typography?: boolean | FluidTypeOptions;
  accessibility?: boolean | AccessibilityOptions;
  container?: boolean | ContainerOptions;
  performance?: boolean | PerformanceOptions;
}
```

#### Example Usage

```typescript
// Automatic optimization with defaults
proteus.autoOptimize(document.body);

// Custom optimization settings
proteus.autoOptimize(document.body, {
  typography: { accessibility: 'AAA' },
  accessibility: { wcagLevel: 'AA' },
  container: { breakpoints: { sm: '300px', lg: '800px' } }
});
```

## 🔌 Framework Integration

### React Hooks

```typescript
import { useProteusContainer, useFluidType, useAccessibility } from '@sc4rfurryx/proteusjs/react';

// Container hook
const containerRef = useProteusContainer({
  breakpoints: { sm: '300px', lg: '600px' }
});

// Typography hook
const textRef = useFluidType({
  minSize: 16,
  maxSize: 24,
  accessibility: 'AA'
});

// Accessibility hook
const accessibleRef = useAccessibility({
  wcagLevel: 'AA',
  screenReader: true
});
```

### Vue Composables

```typescript
import { useProteusContainer, useFluidType } from '@sc4rfurryx/proteusjs/vue';

// In setup()
const { containerRef } = useProteusContainer({
  breakpoints: { sm: '300px', lg: '600px' }
});

const { textRef } = useFluidType({
  minSize: 16,
  maxSize: 24
});
```

## 🐛 Error Handling

### Error Types

```typescript
class ProteusError extends Error {
  code: string;
  element?: Element;
  details?: any;
}

// Error codes:
// 'INVALID_SELECTOR' - Invalid element selector
// 'UNSUPPORTED_FEATURE' - Feature not supported in browser
// 'INVALID_OPTIONS' - Invalid configuration options
// 'PERFORMANCE_THRESHOLD' - Performance threshold exceeded
```

### Error Handling Example

```typescript
try {
  proteus.container('.invalid-selector', {
    breakpoints: { sm: '300px' }
  });
} catch (error) {
  if (error instanceof ProteusError) {
    console.error(`ProteusJS Error [${error.code}]:`, error.message);
  }
}
```

---

**ProteusJS API Documentation** - Complete reference for all features and methods
