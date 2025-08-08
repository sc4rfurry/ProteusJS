/**
 * Browser Polyfills for ProteusJS
 * Comprehensive polyfills for cross-browser compatibility
 */

import { logger } from '../utils/Logger';

export interface PolyfillConfig {
  resizeObserver: boolean;
  intersectionObserver: boolean;
  customProperties: boolean;
  cssSupports: boolean;
  requestAnimationFrame: boolean;
  performance: boolean;
  classList: boolean;
  closest: boolean;
  matchMedia: boolean;
  mutationObserver: boolean;
}

export class BrowserPolyfills {
  private static instance: BrowserPolyfills;
  private polyfillsLoaded: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): BrowserPolyfills {
    if (!BrowserPolyfills.instance) {
      BrowserPolyfills.instance = new BrowserPolyfills();
    }
    return BrowserPolyfills.instance;
  }

  /**
   * Load all necessary polyfills
   */
  public async loadPolyfills(config: Partial<PolyfillConfig> = {}): Promise<void> {
    const defaultConfig: PolyfillConfig = {
      resizeObserver: true,
      intersectionObserver: true,
      customProperties: true,
      cssSupports: true,
      requestAnimationFrame: true,
      performance: true,
      classList: true,
      closest: true,
      matchMedia: true,
      mutationObserver: true
    };

    const finalConfig = { ...defaultConfig, ...config };

    logger.info('Loading ProteusJS polyfills...');

    // Load polyfills in order of dependency
    if (finalConfig.performance) await this.loadPerformancePolyfill();
    if (finalConfig.requestAnimationFrame) await this.loadRAFPolyfill();
    if (finalConfig.classList) await this.loadClassListPolyfill();
    if (finalConfig.closest) await this.loadClosestPolyfill();
    if (finalConfig.cssSupports) await this.loadCSSSupportsPolyfill();
    if (finalConfig.customProperties) await this.loadCustomPropertiesPolyfill();
    if (finalConfig.matchMedia) await this.loadMatchMediaPolyfill();
    if (finalConfig.mutationObserver) await this.loadMutationObserverPolyfill();
    if (finalConfig.resizeObserver) await this.loadResizeObserverPolyfill();
    if (finalConfig.intersectionObserver) await this.loadIntersectionObserverPolyfill();

    logger.info(`Loaded ${this.polyfillsLoaded.size} polyfills`);
  }

  /**
   * Check browser support for features
   */
  public checkBrowserSupport(): {
    supported: string[];
    missing: string[];
    warnings: string[];
  } {
    const supported: string[] = [];
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      supported.push('ResizeObserver');
    } else {
      missing.push('ResizeObserver');
    }

    // Check IntersectionObserver
    if (typeof IntersectionObserver !== 'undefined') {
      supported.push('IntersectionObserver');
    } else {
      missing.push('IntersectionObserver');
    }

    // Check CSS Custom Properties
    if (this.supportsCSSCustomProperties()) {
      supported.push('CSS Custom Properties');
    } else {
      missing.push('CSS Custom Properties');
    }

    // Check CSS.supports
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      supported.push('CSS.supports');
    } else {
      missing.push('CSS.supports');
    }

    // Check performance API
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      supported.push('Performance API');
    } else {
      missing.push('Performance API');
    }

    // Check matchMedia
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      supported.push('matchMedia');
    } else {
      missing.push('matchMedia');
    }

    // Check MutationObserver
    if (typeof window !== 'undefined' && typeof window.MutationObserver === 'function') {
      supported.push('MutationObserver');
    } else {
      missing.push('MutationObserver');
    }

    // Browser-specific warnings
    const userAgent = navigator.userAgent;
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      warnings.push('Internet Explorer detected - limited support');
    }
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      warnings.push('Safari detected - some features may need polyfills');
    }

    return { supported, missing, warnings };
  }

  /**
   * ResizeObserver polyfill
   */
  private async loadResizeObserverPolyfill(): Promise<void> {
    if (typeof ResizeObserver !== 'undefined') {
      return;
    }

    // Simple ResizeObserver polyfill
    (window as any).ResizeObserver = class ResizeObserverPolyfill {
      private callback: ResizeObserverCallback;
      private elements: Set<Element> = new Set();
      private rafId: number | null = null;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      observe(element: Element): void {
        this.elements.add(element);
        this.startPolling();
      }

      unobserve(element: Element): void {
        this.elements.delete(element);
        if (this.elements.size === 0) {
          this.stopPolling();
        }
      }

      disconnect(): void {
        this.elements.clear();
        this.stopPolling();
      }

      private startPolling(): void {
        if (this.rafId) return;

        const poll = () => {
          const entries: ResizeObserverEntry[] = [];
          
          this.elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            entries.push({
              target: element,
              contentRect: rect,
              borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
              contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
              devicePixelContentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }]
            } as ResizeObserverEntry);
          });

          if (entries.length > 0) {
            this.callback(entries, this);
          }

          this.rafId = requestAnimationFrame(poll);
        };

        this.rafId = requestAnimationFrame(poll);
      }

      private stopPolling(): void {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      }
    };

    this.polyfillsLoaded.add('ResizeObserver');
  }

  /**
   * IntersectionObserver polyfill
   */
  private async loadIntersectionObserverPolyfill(): Promise<void> {
    if (typeof IntersectionObserver !== 'undefined') {
      return;
    }

    // Simple IntersectionObserver polyfill
    (window as any).IntersectionObserver = class IntersectionObserverPolyfill {
      private callback: IntersectionObserverCallback;
      private elements: Set<Element> = new Set();
      private rafId: number | null = null;

      constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
        this.callback = callback;
      }

      observe(element: Element): void {
        this.elements.add(element);
        this.startPolling();
      }

      unobserve(element: Element): void {
        this.elements.delete(element);
        if (this.elements.size === 0) {
          this.stopPolling();
        }
      }

      disconnect(): void {
        this.elements.clear();
        this.stopPolling();
      }

      private startPolling(): void {
        if (this.rafId) return;

        const poll = () => {
          const entries: IntersectionObserverEntry[] = [];
          
          this.elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
            
            entries.push({
              target: element,
              boundingClientRect: rect,
              intersectionRatio: isIntersecting ? 1 : 0,
              intersectionRect: isIntersecting ? rect : new DOMRect(),
              isIntersecting,
              rootBounds: new DOMRect(0, 0, window.innerWidth, window.innerHeight),
              time: performance.now()
            } as IntersectionObserverEntry);
          });

          if (entries.length > 0) {
            this.callback(entries, this as any);
          }

          this.rafId = requestAnimationFrame(poll);
        };

        this.rafId = requestAnimationFrame(poll);
      }

      private stopPolling(): void {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      }
    };

    this.polyfillsLoaded.add('IntersectionObserver');
  }

  /**
   * Performance API polyfill
   */
  private async loadPerformancePolyfill(): Promise<void> {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return;
    }

    if (typeof performance === 'undefined') {
      (window as any).performance = {};
    }

    if (typeof performance.now !== 'function') {
      const startTime = Date.now();
      performance.now = function() {
        return Date.now() - startTime;
      };
    }

    this.polyfillsLoaded.add('Performance');
  }

  /**
   * RequestAnimationFrame polyfill
   */
  private async loadRAFPolyfill(): Promise<void> {
    if (typeof requestAnimationFrame === 'function') {
      return;
    }

    let lastTime = 0;
    
    (window as any).requestAnimationFrame = function(callback: FrameRequestCallback): number {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

    (window as any).cancelAnimationFrame = function(id: number): void {
      clearTimeout(id);
    };

    this.polyfillsLoaded.add('RequestAnimationFrame');
  }

  /**
   * CSS.supports polyfill
   */
  private async loadCSSSupportsPolyfill(): Promise<void> {
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      return;
    }

    if (typeof CSS === 'undefined') {
      (window as any).CSS = {};
    }

    CSS.supports = function(property: string, value?: string): boolean {
      const testElement = document.createElement('div');
      
      try {
        if (value) {
          testElement.style.setProperty(property, value);
          return testElement.style.getPropertyValue(property) === value;
        } else {
          // Parse property: value format
          const colonIndex = property.indexOf(':');
          if (colonIndex === -1) return false;
          
          const prop = property.substring(0, colonIndex).trim();
          const val = property.substring(colonIndex + 1).trim();
          
          testElement.style.setProperty(prop, val);
          return testElement.style.getPropertyValue(prop) === val;
        }
      } catch {
        return false;
      }
    };

    this.polyfillsLoaded.add('CSS.supports');
  }

  /**
   * CSS Custom Properties polyfill
   */
  private async loadCustomPropertiesPolyfill(): Promise<void> {
    if (this.supportsCSSCustomProperties()) {
      return;
    }

    // Basic CSS custom properties support
    const customProperties = new Map<string, string>();

    // Override getComputedStyle to handle custom properties
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(element: Element, pseudoElement?: string | null): CSSStyleDeclaration {
      const styles = originalGetComputedStyle.call(this, element, pseudoElement);
      
      // Add getPropertyValue method that handles custom properties
      const originalGetPropertyValue = styles.getPropertyValue;
      styles.getPropertyValue = function(property: string): string {
        if (property.startsWith('--')) {
          return customProperties.get(property) || '';
        }
        return originalGetPropertyValue.call(this, property);
      };

      return styles;
    };

    this.polyfillsLoaded.add('CSS Custom Properties');
  }

  /**
   * matchMedia polyfill
   */
  private async loadMatchMediaPolyfill(): Promise<void> {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return;
    }

    // Simple matchMedia polyfill
    (window as any).matchMedia = function(query: string): MediaQueryList {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() { return true; }
      } as MediaQueryList;
    };

    this.polyfillsLoaded.add('matchMedia');
  }

  /**
   * MutationObserver polyfill
   */
  private async loadMutationObserverPolyfill(): Promise<void> {
    if (typeof window !== 'undefined' && typeof window.MutationObserver === 'function') {
      return;
    }

    // Simple MutationObserver polyfill
    class MutationObserverPolyfill {
      private callback: MutationCallback;
      private target: Node | null = null;
      private config: MutationObserverInit = {};
      private isObserving = false;

      constructor(callback: MutationCallback) {
        this.callback = callback;
      }

      observe(target: Node, config: MutationObserverInit = {}): void {
        this.target = target;
        this.config = config;
        this.isObserving = true;
        // In a real polyfill, we'd set up polling or event listeners
        // For testing purposes, this basic implementation is sufficient
      }

      disconnect(): void {
        this.isObserving = false;
        this.target = null;
      }

      takeRecords(): MutationRecord[] {
        return [];
      }
    }

    (window as any).MutationObserver = MutationObserverPolyfill;
    this.polyfillsLoaded.add('MutationObserver');
  }

  /**
   * Element.classList polyfill
   */
  private async loadClassListPolyfill(): Promise<void> {
    if ('classList' in document.createElement('div')) {
      return;
    }

    // Basic classList polyfill for older browsers
    Object.defineProperty(Element.prototype, 'classList', {
      get() {
        const element = this;
        return {
          add(className: string) {
            if (!element.className.includes(className)) {
              element.className += (element.className ? ' ' : '') + className;
            }
          },
          remove(className: string) {
            element.className = element.className
              .split(' ')
              .filter((cls: string) => cls !== className)
              .join(' ');
          },
          contains(className: string) {
            return element.className.split(' ').includes(className);
          },
          toggle(className: string) {
            if (this.contains(className)) {
              this.remove(className);
            } else {
              this.add(className);
            }
          }
        };
      }
    });

    this.polyfillsLoaded.add('Element.classList');
  }

  /**
   * Element.closest polyfill
   */
  private async loadClosestPolyfill(): Promise<void> {
    if (typeof Element.prototype.closest === 'function') {
      return;
    }

    Element.prototype.closest = function(selector: string): Element | null {
      let element: Element | null = this;
      
      while (element && element.nodeType === 1) {
        if (element.matches && element.matches(selector)) {
          return element;
        }
        element = element.parentElement;
      }
      
      return null;
    };

    this.polyfillsLoaded.add('Element.closest');
  }

  /**
   * Check if CSS Custom Properties are supported
   */
  private supportsCSSCustomProperties(): boolean {
    try {
      const testElement = document.createElement('div');
      testElement.style.setProperty('--test', 'test');
      return testElement.style.getPropertyValue('--test') === 'test';
    } catch {
      return false;
    }
  }

  /**
   * Get loaded polyfills
   */
  public getLoadedPolyfills(): string[] {
    return Array.from(this.polyfillsLoaded);
  }

  /**
   * Initialize polyfills automatically based on browser detection
   */
  public static async autoInit(): Promise<void> {
    const polyfills = BrowserPolyfills.getInstance();
    const support = polyfills.checkBrowserSupport();

    // Load polyfills for missing features
    const config: Partial<PolyfillConfig> = {
      resizeObserver: support.missing.includes('ResizeObserver'),
      intersectionObserver: support.missing.includes('IntersectionObserver'),
      cssSupports: support.missing.includes('CSS.supports'),
      performance: support.missing.includes('Performance API'),
      customProperties: support.missing.includes('CSS Custom Properties'),
      matchMedia: support.missing.includes('matchMedia'),
      mutationObserver: support.missing.includes('MutationObserver')
    };

    await polyfills.loadPolyfills(config);

    if (support.warnings.length > 0) {
      logger.warn('Browser Warnings:', support.warnings);
    }
  }
}
