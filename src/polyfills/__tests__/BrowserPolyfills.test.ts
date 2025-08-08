/**
 * BrowserPolyfills Test Suite
 * Tests for cross-browser compatibility polyfills
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserPolyfills } from '../BrowserPolyfills';

describe('BrowserPolyfills', () => {
  let polyfills: BrowserPolyfills;
  let originalResizeObserver: any;
  let originalIntersectionObserver: any;
  let originalPerformance: any;
  let originalCSS: any;

  beforeEach(() => {
    // Store original implementations
    originalResizeObserver = (global as any).ResizeObserver;
    originalIntersectionObserver = (global as any).IntersectionObserver;
    originalPerformance = global.performance;
    originalCSS = (global as any).CSS;

    polyfills = BrowserPolyfills.getInstance();
  });

  afterEach(() => {
    // Restore original implementations
    (global as any).ResizeObserver = originalResizeObserver;
    (global as any).IntersectionObserver = originalIntersectionObserver;
    global.performance = originalPerformance;
    (global as any).CSS = originalCSS;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BrowserPolyfills.getInstance();
      const instance2 = BrowserPolyfills.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Browser Support Detection', () => {
    it('should detect supported features', () => {
      const support = polyfills.checkBrowserSupport();
      
      expect(support).toHaveProperty('supported');
      expect(support).toHaveProperty('missing');
      expect(support).toHaveProperty('warnings');
      expect(Array.isArray(support.supported)).toBe(true);
      expect(Array.isArray(support.missing)).toBe(true);
      expect(Array.isArray(support.warnings)).toBe(true);
    });

    it('should detect missing ResizeObserver', () => {
      delete (global as any).ResizeObserver;
      
      const support = polyfills.checkBrowserSupport();
      
      expect(support.missing).toContain('ResizeObserver');
    });

    it('should detect missing IntersectionObserver', () => {
      delete (global as any).IntersectionObserver;
      
      const support = polyfills.checkBrowserSupport();
      
      expect(support.missing).toContain('IntersectionObserver');
    });

    it('should detect browser-specific warnings', () => {
      // Mock IE user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko',
        configurable: true
      });
      
      const support = polyfills.checkBrowserSupport();
      
      expect(support.warnings.some(w => w.includes('Internet Explorer'))).toBe(true);
    });
  });

  describe('ResizeObserver Polyfill', () => {
    beforeEach(() => {
      delete (global as any).ResizeObserver;
    });

    it('should load ResizeObserver polyfill when missing', async () => {
      await polyfills.loadPolyfills({ resizeObserver: true });
      
      expect(typeof (global as any).ResizeObserver).toBe('function');
      expect(polyfills.getLoadedPolyfills()).toContain('ResizeObserver');
    });

    it('should create functional ResizeObserver polyfill', async () => {
      await polyfills.loadPolyfills({ resizeObserver: true });
      
      const callback = vi.fn();
      const observer = new (global as any).ResizeObserver(callback);
      
      expect(observer).toBeDefined();
      expect(typeof observer.observe).toBe('function');
      expect(typeof observer.unobserve).toBe('function');
      expect(typeof observer.disconnect).toBe('function');
    });

    it('should not load polyfill when ResizeObserver exists', async () => {
      (global as any).ResizeObserver = vi.fn();
      
      await polyfills.loadPolyfills({ resizeObserver: true });
      
      expect(polyfills.getLoadedPolyfills()).not.toContain('ResizeObserver');
    });
  });

  describe('IntersectionObserver Polyfill', () => {
    beforeEach(() => {
      delete (global as any).IntersectionObserver;
    });

    it('should load IntersectionObserver polyfill when missing', async () => {
      await polyfills.loadPolyfills({ intersectionObserver: true });
      
      expect(typeof (global as any).IntersectionObserver).toBe('function');
      expect(polyfills.getLoadedPolyfills()).toContain('IntersectionObserver');
    });

    it('should create functional IntersectionObserver polyfill', async () => {
      await polyfills.loadPolyfills({ intersectionObserver: true });
      
      const callback = vi.fn();
      const observer = new (global as any).IntersectionObserver(callback);
      
      expect(observer).toBeDefined();
      expect(typeof observer.observe).toBe('function');
      expect(typeof observer.unobserve).toBe('function');
      expect(typeof observer.disconnect).toBe('function');
    });
  });

  describe('Performance API Polyfill', () => {
    it('should load performance polyfill when missing', async () => {
      delete (global as any).performance;
      
      await polyfills.loadPolyfills({ performance: true });
      
      expect(typeof performance).toBe('object');
      expect(typeof performance.now).toBe('function');
      expect(polyfills.getLoadedPolyfills()).toContain('Performance');
    });

    it('should provide working performance.now', async () => {
      delete (global as any).performance;
      
      await polyfills.loadPolyfills({ performance: true });
      
      const time1 = performance.now();
      await new Promise(resolve => setTimeout(resolve, 10));
      const time2 = performance.now();
      
      expect(time2).toBeGreaterThan(time1);
    });
  });

  describe('RequestAnimationFrame Polyfill', () => {
    it('should load RAF polyfill when missing', async () => {
      delete (global as any).requestAnimationFrame;
      delete (global as any).cancelAnimationFrame;
      
      await polyfills.loadPolyfills({ requestAnimationFrame: true });
      
      expect(typeof requestAnimationFrame).toBe('function');
      expect(typeof cancelAnimationFrame).toBe('function');
      expect(polyfills.getLoadedPolyfills()).toContain('RequestAnimationFrame');
    });

    it('should provide working requestAnimationFrame', async () => {
      delete (global as any).requestAnimationFrame;
      
      await polyfills.loadPolyfills({ requestAnimationFrame: true });
      
      const callback = vi.fn();
      const id = requestAnimationFrame(callback);
      
      expect(typeof id).toBe('number');
      
      // Wait for callback
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('CSS.supports Polyfill', () => {
    it('should load CSS.supports polyfill when missing', async () => {
      delete (global as any).CSS;
      
      await polyfills.loadPolyfills({ cssSupports: true });
      
      expect(typeof CSS).toBe('object');
      expect(typeof CSS.supports).toBe('function');
      expect(polyfills.getLoadedPolyfills()).toContain('CSS.supports');
    });

    it('should provide working CSS.supports', async () => {
      delete (global as any).CSS;
      
      await polyfills.loadPolyfills({ cssSupports: true });
      
      // Test basic property support
      const supportsColor = CSS.supports('color', 'red');
      const supportsInvalid = CSS.supports('invalid-property', 'invalid-value');
      
      expect(typeof supportsColor).toBe('boolean');
      expect(typeof supportsInvalid).toBe('boolean');
    });
  });

  describe('Element.classList Polyfill', () => {
    it('should load classList polyfill when missing', async () => {
      // Mock missing classList
      const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'classList');
      delete (Element.prototype as any).classList;
      
      await polyfills.loadPolyfills({ classList: true });
      
      const element = document.createElement('div');
      expect(element.classList).toBeDefined();
      expect(typeof element.classList.add).toBe('function');
      expect(polyfills.getLoadedPolyfills()).toContain('Element.classList');
      
      // Restore original
      if (originalDescriptor) {
        Object.defineProperty(Element.prototype, 'classList', originalDescriptor);
      }
    });
  });

  describe('Element.closest Polyfill', () => {
    it('should load closest polyfill when missing', async () => {
      const originalClosest = Element.prototype.closest;
      delete (Element.prototype as any).closest;
      
      await polyfills.loadPolyfills({ closest: true });
      
      const element = document.createElement('div');
      expect(typeof element.closest).toBe('function');
      expect(polyfills.getLoadedPolyfills()).toContain('Element.closest');
      
      // Restore original
      Element.prototype.closest = originalClosest;
    });
  });

  describe('Auto Initialization', () => {
    it('should auto-initialize based on browser support', async () => {
      // Remove some features to trigger polyfills
      delete (global as any).ResizeObserver;
      delete (global as any).IntersectionObserver;
      
      await BrowserPolyfills.autoInit();
      
      expect(typeof (global as any).ResizeObserver).toBe('function');
      expect(typeof (global as any).IntersectionObserver).toBe('function');
    });

    it('should not load unnecessary polyfills', async () => {
      // Ensure features exist
      (global as any).ResizeObserver = vi.fn();
      (global as any).IntersectionObserver = vi.fn();
      
      const polyfillsBefore = polyfills.getLoadedPolyfills().length;
      
      await BrowserPolyfills.autoInit();
      
      const polyfillsAfter = polyfills.getLoadedPolyfills().length;
      
      // Should not have loaded additional polyfills
      expect(polyfillsAfter).toBe(polyfillsBefore);
    });
  });

  describe('Configuration', () => {
    it('should respect polyfill configuration', async () => {
      delete (global as any).ResizeObserver;
      delete (global as any).IntersectionObserver;
      
      await polyfills.loadPolyfills({
        resizeObserver: true,
        intersectionObserver: false
      });
      
      expect(typeof (global as any).ResizeObserver).toBe('function');
      expect(typeof (global as any).IntersectionObserver).toBe('undefined');
    });

    it('should use default configuration when none provided', async () => {
      delete (global as any).ResizeObserver;
      
      await polyfills.loadPolyfills();
      
      expect(typeof (global as any).ResizeObserver).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle polyfill loading errors gracefully', async () => {
      // This test ensures no errors are thrown during polyfill loading
      expect(async () => {
        await polyfills.loadPolyfills();
      }).not.toThrow();
    });

    it('should handle missing DOM gracefully', async () => {
      // Mock missing document
      const originalDocument = global.document;
      delete (global as any).document;
      
      expect(async () => {
        await polyfills.loadPolyfills();
      }).not.toThrow();
      
      // Restore document
      global.document = originalDocument;
    });
  });
});
