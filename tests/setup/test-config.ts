/**
 * Comprehensive Test Configuration for ProteusJS
 * Sets up DOM environment, mocks, and testing utilities
 */

import { vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { setupTestEnvironment } from './test-environment';

// Setup JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;

// Setup comprehensive test environment
setupTestEnvironment();

// Override JSDOM's getComputedStyle with our comprehensive mock
// This must be done AFTER setting up the window object
const mockGetComputedStyle = vi.fn((element: Element) => {
  const htmlElement = element as HTMLElement;

  // Get font size from inline style or use element-specific defaults
  let fontSize = htmlElement.style.fontSize;

  if (!fontSize) {
    // Set default font sizes based on element type
    switch (htmlElement.tagName.toLowerCase()) {
      case 'h1': fontSize = '32px'; break;
      case 'h2': fontSize = '24px'; break;
      case 'h3': fontSize = '20px'; break;
      case 'h4': fontSize = '18px'; break;
      case 'h5': fontSize = '16px'; break;
      case 'h6': fontSize = '14px'; break;
      default: fontSize = '16px'; break;
    }
  }

  // Ensure fontSize is always a valid pixel value
  if (!fontSize.includes('px') && !fontSize.includes('clamp') && !fontSize.includes('rem') && !fontSize.includes('em')) {
    fontSize = '16px';
  }

  // For clamp values, return them as-is for tests that expect clamp syntax
  // For pixel values, ensure they're valid
  if (fontSize.includes('clamp')) {
    // Keep clamp values intact - tests will handle parsing
  } else if (!fontSize.match(/^\d+(\.\d+)?(px|rem|em)$/)) {
    fontSize = '16px'; // Fallback for invalid values
  }

  // Get other properties from inline styles or defaults
  const lineHeight = htmlElement.style.lineHeight || '1.5';
  const fontFamily = htmlElement.style.fontFamily || 'Arial, sans-serif';
  const fontWeight = htmlElement.style.fontWeight || 'normal';
  const fontStyle = htmlElement.style.fontStyle || 'normal';
  const transition = htmlElement.style.transition || 'none';
  const display = htmlElement.style.display || 'block';
  const overflow = htmlElement.style.overflow || 'visible';
  const textOverflow = htmlElement.style.textOverflow || 'clip';
  const width = htmlElement.style.width || '100px';
  const height = htmlElement.style.height || '20px';
  const color = htmlElement.style.color || 'rgb(0, 0, 0)';
  const backgroundColor = htmlElement.style.backgroundColor || 'rgba(0, 0, 0, 0)';
  const contain = htmlElement.style.contain || 'none';

  // Create comprehensive computed style object with smart fontSize handling
  const computedStyle = {
    fontSize, // Return the full value (including clamp)
    lineHeight,
    fontFamily,
    fontWeight,
    fontStyle,
    transition,
    display,
    overflow,
    textOverflow,
    width,
    height,
    color,
    backgroundColor,
    contain,
    flexWrap: htmlElement.style.flexWrap || 'nowrap',
    getPropertyValue: (prop: string) => {
      switch (prop) {
        case 'font-size': return fontSize;
        case 'line-height': return lineHeight;
        case 'font-family': return fontFamily;
        case 'font-weight': return fontWeight;
        case 'font-style': return fontStyle;
        case 'transition': return transition;
        case 'display': return display;
        case 'overflow': return overflow;
        case 'text-overflow': return textOverflow;
        case 'width': return width;
        case 'height': return height;
        case 'color': return color;
        case 'background-color': return backgroundColor;
        case 'contain': return contain;
        case 'flex-wrap': return htmlElement.style.flexWrap || 'nowrap';
        default: return '';
      }
    }
  };

  return computedStyle;
});

// Apply the mock to both global and window
global.getComputedStyle = mockGetComputedStyle;
(global.window as any).getComputedStyle = mockGetComputedStyle;

// Comprehensive CSS value parser for tests
(global as any).parseCSSValue = (cssValue: string, type: 'min' | 'max' | 'current' = 'current'): number => {
  if (!cssValue) return 0;

  // Handle clamp values: clamp(min, preferred, max)
  if (cssValue.includes('clamp')) {
    const clampMatch = cssValue.match(/clamp\(\s*([\d.]+)px\s*,\s*([^,]+)\s*,\s*([\d.]+)px\s*\)/);
    if (clampMatch) {
      const min = parseFloat(clampMatch[1]);
      const max = parseFloat(clampMatch[3]);

      switch (type) {
        case 'min': return min;
        case 'max': return max;
        case 'current':
          // For current, return a reasonable middle value or min if range is small
          return Math.abs(max - min) <= 2 ? min : (min + max) / 2;
      }
    }
  }

  // Handle static values: 16px, 1.5, etc.
  const staticMatch = cssValue.match(/([\d.]+)/);
  return staticMatch ? parseFloat(staticMatch[1]) : 0;
};

// Legacy helper for backward compatibility
(global as any).extractClampMinimum = (clampValue: string): number => {
  return (global as any).parseCSSValue(clampValue, 'min');
};

// Mock Element.matches for event delegation
Element.prototype.matches = Element.prototype.matches || function(selector: string) {
  const element = this as HTMLElement;

  // Simple selector matching for tests
  if (selector.startsWith('.')) {
    const className = selector.substring(1);
    return element.classList.contains(className);
  }

  if (selector.startsWith('#')) {
    const id = selector.substring(1);
    return element.id === id;
  }

  // Tag name matching
  return element.tagName.toLowerCase() === selector.toLowerCase();
};

// Mock Canvas API for TextFitting
const mockCanvas = {
  getContext: vi.fn(() => ({
    measureText: vi.fn((text: string) => ({
      width: text.length * 8 // Simple approximation
    })),
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    fillText: vi.fn(),
    clearRect: vi.fn()
  })),
  width: 100,
  height: 50
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName: string) => {
  if (tagName.toLowerCase() === 'canvas') {
    return mockCanvas as any;
  }
  return originalCreateElement(tagName);
});

// Mock getBoundingClientRect to return dimensions based on style.width/height
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = vi.fn(function(this: Element) {
  // If element already has a mock (from simulateResize), use that
  if ((this as any).getBoundingClientRect !== Element.prototype.getBoundingClientRect) {
    return (this as any).getBoundingClientRect();
  }

  const element = this as HTMLElement;
  const width = element.style.width ? parseFloat(element.style.width) : 100;
  const height = element.style.height ? parseFloat(element.style.height) : 50;

  return {
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => ({})
  } as DOMRect;
});

// Apply the mock to both global and window
global.getComputedStyle = mockGetComputedStyle;
(global.window as any).getComputedStyle = mockGetComputedStyle;

// Helper function to parse font sizes that might contain clamp values
(global as any).parseClampAwareFloat = (value: string): number => {
  if (value && value.includes('clamp(')) {
    const clampMatch = value.match(/clamp\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (clampMatch) {
      // Return the minimum value for testing
      return parseFloat(clampMatch[1].trim());
    }
  }
  return parseFloat(value);
};

// Mock browser APIs
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn((element) => {
    // Simulate resize observation
    setTimeout(() => {
      callback([{
        target: element,
        contentRect: {
          width: element.offsetWidth || 300,
          height: element.offsetHeight || 200,
          top: 0,
          left: 0,
          bottom: element.offsetHeight || 200,
          right: element.offsetWidth || 300
        }
      }]);
    }, 0);
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn((element) => {
    // Simulate intersection
    setTimeout(() => {
      callback([{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRect: element.getBoundingClientRect(),
        rootBounds: { top: 0, left: 0, bottom: 1000, right: 1000, width: 1000, height: 1000 },
        time: performance.now()
      }]);
    }, 0);
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}));

// Mock performance API
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 100000000
  }
} as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn((callback) => {
  setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0);
  return 1;
});

global.cancelIdleCallback = vi.fn();

// Mock CSS.supports
global.CSS = {
  supports: vi.fn((property, value) => {
    // Mock support for container queries and other modern features
    if (property === 'container-type' || property === 'container') return true;
    if (property === 'aspect-ratio') return true;
    if (property === 'clamp') return true;
    return false;
  })
} as any;

// Mock matchMedia
global.matchMedia = vi.fn((query) => ({
  matches: query.includes('dark'),
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;

// Mock console methods for testing
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
};

// Add custom matchers for testing
expect.extend({
  toBeInViewport(received: Element) {
    const rect = received.getBoundingClientRect();
    const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                        rect.bottom <= window.innerHeight && 
                        rect.right <= window.innerWidth;
    
    return {
      message: () => `expected element to ${isInViewport ? 'not ' : ''}be in viewport`,
      pass: isInViewport
    };
  },
  
  toHaveAccessibleName(received: Element, expectedName?: string) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent?.trim();
    
    const hasName = !!accessibleName;
    const nameMatches = expectedName ? accessibleName === expectedName : true;
    
    return {
      message: () => `expected element to have accessible name${expectedName ? ` "${expectedName}"` : ''}`,
      pass: hasName && nameMatches
    };
  },
  
  toBeResponsive(received: Element) {
    const styles = window.getComputedStyle(received);
    const hasFluidWidth = styles.width.includes('%') || styles.width.includes('vw') || 
                         styles.width.includes('clamp') || styles.maxWidth !== 'none';
    
    return {
      message: () => `expected element to be responsive`,
      pass: hasFluidWidth
    };
  },
  
  toHavePerformantStyles(received: Element) {
    const styles = window.getComputedStyle(received);
    const hasWillChange = styles.willChange !== 'auto';
    const hasTransform3d = styles.transform.includes('3d') || styles.transform.includes('translateZ');
    
    return {
      message: () => `expected element to have performant styles`,
      pass: hasWillChange || hasTransform3d
    };
  }
});

// Declare custom matchers for TypeScript
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeInViewport(): any;
      toHaveAccessibleName(name?: string): any;
      toBeResponsive(): any;
      toHavePerformantStyles(): any;
    }
  }
}

export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-config.ts'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
