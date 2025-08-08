/**
 * Test setup file for Vitest
 */

import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Mock CSS.supports
Object.defineProperty(global, 'CSS', {
  value: {
    supports: vi.fn().mockReturnValue(true)
  },
  writable: true
});

// Mock window.getComputedStyle
global.getComputedStyle = vi.fn().mockImplementation(() => ({
  getPropertyValue: vi.fn().mockReturnValue(''),
  setProperty: vi.fn(),
  removeProperty: vi.fn()
}));

// Mock Element.getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn().mockImplementation(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: vi.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock performance.memory for memory monitoring tests
Object.defineProperty(performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 100000000
  }
});

// Mock performance timing methods
Object.defineProperty(performance, 'mark', {
  writable: true,
  value: vi.fn()
});

Object.defineProperty(performance, 'measure', {
  writable: true,
  value: vi.fn()
});

Object.defineProperty(performance, 'getEntriesByType', {
  writable: true,
  value: vi.fn().mockReturnValue([])
});

Object.defineProperty(performance, 'getEntriesByName', {
  writable: true,
  value: vi.fn().mockReturnValue([])
});

// Mock console methods in test environment
if (process.env['NODE_ENV'] === 'test') {
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn()
  };
}
