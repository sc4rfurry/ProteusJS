/**
 * Cross-Browser Compatibility Test Suite
 * Tests ProteusJS functionality across different browser environments
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestHelpers } from '../utils/test-helpers';
import { ProteusJS } from '../../src/core/ProteusJS';

interface BrowserEnvironment {
  name: string;
  userAgent: string;
  features: {
    resizeObserver: boolean;
    intersectionObserver: boolean;
    containerQueries: boolean;
    cssClamp: boolean;
    cssGrid: boolean;
    flexbox: boolean;
  };
}

const BROWSER_ENVIRONMENTS: BrowserEnvironment[] = [
  {
    name: 'Chrome 90+',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
    features: {
      resizeObserver: true,
      intersectionObserver: true,
      containerQueries: true,
      cssClamp: true,
      cssGrid: true,
      flexbox: true
    }
  },
  {
    name: 'Firefox 88+',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
    features: {
      resizeObserver: true,
      intersectionObserver: true,
      containerQueries: false, // Limited support
      cssClamp: true,
      cssGrid: true,
      flexbox: true
    }
  },
  {
    name: 'Safari 14+',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    features: {
      resizeObserver: true,
      intersectionObserver: true,
      containerQueries: false,
      cssClamp: true,
      cssGrid: true,
      flexbox: true
    }
  },
  {
    name: 'Edge 90+',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 Edg/90.0.818.66',
    features: {
      resizeObserver: true,
      intersectionObserver: true,
      containerQueries: true,
      cssClamp: true,
      cssGrid: true,
      flexbox: true
    }
  },
  {
    name: 'Legacy Browser',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
    features: {
      resizeObserver: false,
      intersectionObserver: false,
      containerQueries: false,
      cssClamp: false,
      cssGrid: true,
      flexbox: true
    }
  }
];

describe('Cross-Browser Compatibility', () => {
  let proteus: ProteusJS;
  let testContainer: HTMLElement;
  let originalUserAgent: string;

  beforeEach(() => {
    TestHelpers.cleanup();
    originalUserAgent = navigator.userAgent;
    testContainer = TestHelpers.createContainer({
      width: 400,
      height: 300,
      className: 'cross-browser-test'
    });
  });

  afterEach(() => {
    if (proteus) {
      proteus.destroy();
    }
    TestHelpers.cleanup();
    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true
    });
  });

  BROWSER_ENVIRONMENTS.forEach(browser => {
    describe(`${browser.name} Environment`, () => {
      beforeEach(() => {
        // Mock browser environment
        mockBrowserEnvironment(browser);
        proteus = new ProteusJS();
      });

      it('should initialize successfully', () => {
        expect(() => {
          proteus.init();
        }).not.toThrow();

        expect(proteus.isInitialized()).toBe(true);
      });

      it('should detect browser capabilities correctly', () => {
        const capabilities = proteus.getBrowserCapabilities();

        expect(capabilities.resizeObserver).toBe(browser.features.resizeObserver);
        expect(capabilities.intersectionObserver).toBe(browser.features.intersectionObserver);
        expect(capabilities.containerQueries).toBe(browser.features.containerQueries);
        expect(capabilities.cssClamp).toBe(browser.features.cssClamp);
      });

      it('should provide appropriate polyfills', () => {
        proteus.init();

        if (!browser.features.resizeObserver) {
          expect(global.ResizeObserver).toBeDefined();
          expect(global.ResizeObserver.toString()).toContain('polyfill');
        }

        if (!browser.features.intersectionObserver) {
          expect(global.IntersectionObserver).toBeDefined();
          expect(global.IntersectionObserver.toString()).toContain('polyfill');
        }
      });

      it('should handle container queries with fallbacks', () => {
        const container = TestHelpers.createContainer({
          width: 400,
          height: 300,
          className: 'container-query-test'
        });

        expect(() => {
          proteus.container(container, {
            breakpoints: {
              sm: '300px',
              md: '600px',
              lg: '900px'
            }
          });
        }).not.toThrow();

        // Should work regardless of native support
        const hasBreakpointClasses = container.classList.contains('proteus-sm') ||
                                   container.classList.contains('proteus-md') ||
                                   container.classList.contains('proteus-lg');
        expect(hasBreakpointClasses).toBe(true);
      });

      it('should handle fluid typography with fallbacks', () => {
        const textElement = document.createElement('p');
        textElement.textContent = 'Test text';
        testContainer.appendChild(textElement);

        expect(() => {
          proteus.fluidType(textElement, {
            minSize: 14,
            maxSize: 18,
            minViewport: 320,
            maxViewport: 1200
          });
        }).not.toThrow();

        const fontSize = window.getComputedStyle(textElement).fontSize;
        
        if (browser.features.cssClamp) {
          expect(fontSize).toContain('clamp');
        } else {
          // Should use JavaScript fallback
          expect(parseFloat(fontSize)).toBeGreaterThan(0);
        }
      });

      it('should handle layout systems appropriately', () => {
        const gridContainer = TestHelpers.createContainer({
          width: 600,
          height: 400,
          className: 'grid-test'
        });
        const items = TestHelpers.createGridItems(6, gridContainer);

        if (browser.features.cssGrid) {
          expect(() => {
            proteus.createGrid(gridContainer, {
              columns: 'auto-fit',
              minColumnWidth: '200px',
              gap: '1rem'
            });
          }).not.toThrow();

          const display = window.getComputedStyle(gridContainer).display;
          expect(display).toBe('grid');
        } else {
          // Should fall back to flexbox
          expect(() => {
            proteus.createGrid(gridContainer, {
              columns: 'auto-fit',
              minColumnWidth: '200px',
              gap: '1rem'
            });
          }).not.toThrow();

          const display = window.getComputedStyle(gridContainer).display;
          expect(display).toBe('flex');
        }
      });

      it('should maintain performance across browsers', async () => {
        const { duration } = await TestHelpers.measurePerformance(async () => {
          const containers = Array.from({ length: 10 }, (_, i) =>
            TestHelpers.createContainer({
              width: 300 + i * 10,
              height: 200,
              className: `perf-container-${i}`
            })
          );

          containers.forEach(container => {
            proteus.container(container, {
              breakpoints: { sm: '300px', md: '600px' }
            });
          });

          await TestHelpers.simulateResize(containers[0], 350, 250);
        });

        // Performance should be reasonable across all browsers
        expect(duration).toBeLessThan(50); // 50ms budget for cross-browser
      });

      it('should handle errors gracefully', () => {
        // Test with invalid configurations
        expect(() => {
          proteus.container(null as any, { breakpoints: {} });
        }).not.toThrow();

        expect(() => {
          proteus.fluidType(null as any, { minSize: 14, maxSize: 18 });
        }).not.toThrow();

        // Should log warnings but not crash
        expect(console.warn).toHaveBeenCalled();
      });

      it('should provide consistent API across browsers', () => {
        // Core methods should be available
        expect(typeof proteus.container).toBe('function');
        expect(typeof proteus.fluidType).toBe('function');
        expect(typeof proteus.createGrid).toBe('function');
        expect(typeof proteus.createFlexbox).toBe('function');
        expect(typeof proteus.enableAccessibility).toBe('function');

        // Configuration methods
        expect(typeof proteus.init).toBe('function');
        expect(typeof proteus.destroy).toBe('function');
        expect(typeof proteus.getMetrics).toBe('function');
      });
    });
  });

  describe('Feature Detection and Graceful Degradation', () => {
    it('should detect and report all browser features', () => {
      proteus = new ProteusJS();
      const features = proteus.detectFeatures();

      expect(features).toHaveProperty('resizeObserver');
      expect(features).toHaveProperty('intersectionObserver');
      expect(features).toHaveProperty('containerQueries');
      expect(features).toHaveProperty('cssClamp');
      expect(features).toHaveProperty('cssGrid');
      expect(features).toHaveProperty('flexbox');
      expect(features).toHaveProperty('customProperties');
    });

    it('should provide feature-specific fallbacks', () => {
      // Mock a browser with limited features
      mockBrowserEnvironment({
        name: 'Limited Browser',
        userAgent: 'Limited/1.0',
        features: {
          resizeObserver: false,
          intersectionObserver: false,
          containerQueries: false,
          cssClamp: false,
          cssGrid: false,
          flexbox: true
        }
      });

      proteus = new ProteusJS();
      proteus.init();

      const container = TestHelpers.createContainer({
        width: 400,
        height: 300,
        className: 'fallback-test'
      });

      // Should still work with fallbacks
      expect(() => {
        proteus.container(container, {
          breakpoints: { sm: '300px', md: '600px' }
        });
      }).not.toThrow();

      // Should use JavaScript-based solutions
      expect(container.hasAttribute('data-proteus-fallback')).toBe(true);
    });

    it('should warn about unsupported features', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      
      mockBrowserEnvironment({
        name: 'Very Limited Browser',
        userAgent: 'VeryLimited/1.0',
        features: {
          resizeObserver: false,
          intersectionObserver: false,
          containerQueries: false,
          cssClamp: false,
          cssGrid: false,
          flexbox: false
        }
      });

      proteus = new ProteusJS();
      proteus.init();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('limited browser support')
      );
    });
  });

  describe('Progressive Enhancement', () => {
    it('should enhance basic layouts progressively', () => {
      const container = TestHelpers.createContainer({
        width: 600,
        height: 400,
        className: 'progressive-test'
      });

      // Start with basic CSS
      container.style.display = 'block';
      
      proteus = new ProteusJS();
      proteus.init();

      // Apply ProteusJS enhancements
      proteus.container(container, {
        breakpoints: { sm: '300px', md: '600px' },
        progressive: true
      });

      // Should enhance without breaking existing layout
      expect(container.style.display).not.toBe('');
      expect(container.hasAttribute('data-proteus-enhanced')).toBe(true);
    });

    it('should maintain functionality when JavaScript is disabled', () => {
      // This test simulates the scenario where ProteusJS fails to load
      const container = TestHelpers.createContainer({
        width: 400,
        height: 300,
        className: 'no-js-test'
      });

      // Apply CSS-only fallbacks
      container.style.cssText = `
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-wrap: wrap;
      `;

      // Basic layout should still work
      expect(window.getComputedStyle(container).display).toBe('flex');
      expect(window.getComputedStyle(container).flexWrap).toBe('wrap');
    });
  });

  function mockBrowserEnvironment(browser: BrowserEnvironment) {
    // Mock user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: browser.userAgent,
      writable: true
    });

    // Mock feature support
    if (!browser.features.resizeObserver) {
      (global as any).ResizeObserver = undefined;
    }

    if (!browser.features.intersectionObserver) {
      (global as any).IntersectionObserver = undefined;
    }

    // Mock CSS.supports
    (global.CSS.supports as any) = vi.fn((property: string, value?: string) => {
      if (property === 'container-type' || property === 'container') {
        return browser.features.containerQueries;
      }
      if (property === 'clamp' || (property === 'font-size' && value?.includes('clamp'))) {
        return browser.features.cssClamp;
      }
      if (property === 'display' && value === 'grid') {
        return browser.features.cssGrid;
      }
      if (property === 'display' && value === 'flex') {
        return browser.features.flexbox;
      }
      return true; // Default to supported
    });

    // Mock other browser-specific APIs as needed
    if (!browser.features.resizeObserver) {
      // Provide polyfill
      (global as any).ResizeObserver = class ResizeObserverPolyfill {
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
        }
        
        observe(element: Element) {
          // Polyfill implementation
          setTimeout(() => {
            this.callback([{
              target: element,
              contentRect: element.getBoundingClientRect()
            }] as any, this as any);
          }, 0);
        }
        
        unobserve() {}
        disconnect() {}
        
        toString() {
          return 'function ResizeObserver() { [polyfill code] }';
        }
        
        private callback: ResizeObserverCallback;
      };
    }
  }
});
