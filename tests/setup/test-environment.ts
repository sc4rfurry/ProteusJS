/**
 * Test Environment Setup
 * Provides comprehensive mocking for browser APIs in test environment
 */

import { vi } from 'vitest';

// Mock getComputedStyle to return proper values (removed - using test-config.ts version)

// Mock MutationObserver
class MockMutationObserver {
  private callback: MutationCallback;
  private isObserving = false;

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe() {
    this.isObserving = true;
  }

  disconnect() {
    this.isObserving = false;
  }

  takeRecords(): MutationRecord[] {
    return [];
  }

  // Helper method for tests to trigger mutations
  triggerMutation(mutations: MutationRecord[]) {
    if (this.isObserving) {
      this.callback(mutations, this);
    }
  }
}

// Mock ResizeObserver
class MockResizeObserver {
  private callback: ResizeObserverCallback;
  private observedElements = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.observedElements.add(element);
  }

  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Helper method for tests to trigger resize
  triggerResize(entries: ResizeObserverEntry[]) {
    this.callback(entries, this);
  }
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;
  private observedElements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.observedElements.add(element);
  }

  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Helper method for tests to trigger intersection
  triggerIntersection(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this);
  }
}

// Mock matchMedia
const mockMatchMedia = vi.fn((query: string) => ({
  matches: query.includes('prefers-reduced-motion') ? false : true,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// Setup global mocks
export function setupTestEnvironment() {
  // getComputedStyle is mocked in test-config.ts to avoid conflicts

  // Mock MutationObserver
  Object.defineProperty(global, 'MutationObserver', {
    value: MockMutationObserver,
    writable: true,
  });

  // Mock ResizeObserver
  Object.defineProperty(global, 'ResizeObserver', {
    value: MockResizeObserver,
    writable: true,
  });

  // Mock IntersectionObserver
  Object.defineProperty(global, 'IntersectionObserver', {
    value: MockIntersectionObserver,
    writable: true,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: mockMatchMedia,
    writable: true,
  });

  // Mock performance
  Object.defineProperty(window, 'performance', {
    value: mockPerformance,
    writable: true,
  });

  // Mock requestAnimationFrame
  Object.defineProperty(global, 'requestAnimationFrame', {
    value: vi.fn((callback) => setTimeout(callback, 16)),
    writable: true,
  });

  // Mock cancelAnimationFrame
  Object.defineProperty(global, 'cancelAnimationFrame', {
    value: vi.fn(clearTimeout),
    writable: true,
  });

  // Mock CSS object and supports method
  if (typeof CSS === 'undefined') {
    (global as any).CSS = {};
  }

  Object.defineProperty(CSS, 'supports', {
    value: vi.fn((property: string, value?: string) => {
      // Mock support for modern CSS features
      if (property === 'container-type') return true;
      if (property === 'container-name') return true;
      if (property.includes('clamp')) return true;
      if (property.includes('custom-properties')) return true;
      return false;
    }),
    writable: true,
  });

  // Mock document.documentElement styles
  Object.defineProperty(document.documentElement, 'style', {
    value: {
      fontSize: '16px',
      lineHeight: '1.5',
      fontFamily: 'Arial, sans-serif',
    },
    writable: true,
  });
}

// Export mock instances for test access
export {
  MockMutationObserver,
  MockResizeObserver,
  MockIntersectionObserver,
  mockMatchMedia,
  mockPerformance,
};
