/**
 * Test Utilities for ProteusJS Testing
 * Helper functions for creating DOM elements, measuring performance, and testing accessibility
 */

import { vi } from 'vitest';

export class TestHelpers {
  /**
   * Create a test container with specified dimensions
   */
  static createContainer(options: {
    width?: number;
    height?: number;
    className?: string;
    id?: string;
    innerHTML?: string;
  } = {}): HTMLElement {
    const container = document.createElement('div');
    
    if (options.className) container.className = options.className;
    if (options.id) container.id = options.id;
    if (options.innerHTML) container.innerHTML = options.innerHTML;
    
    // Mock getBoundingClientRect to return specified dimensions
    container.getBoundingClientRect = vi.fn(() => ({
      width: options.width || 300,
      height: options.height || 200,
      top: 0,
      left: 0,
      bottom: options.height || 200,
      right: options.width || 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }));
    
    // Mock offsetWidth/Height
    Object.defineProperty(container, 'offsetWidth', {
      value: options.width || 300,
      writable: true
    });
    Object.defineProperty(container, 'offsetHeight', {
      value: options.height || 200,
      writable: true
    });
    
    document.body.appendChild(container);
    return container;
  }

  /**
   * Create multiple test elements for grid/flexbox testing
   */
  static createGridItems(count: number, container: HTMLElement): HTMLElement[] {
    const items: HTMLElement[] = [];
    
    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'grid-item';
      item.textContent = `Item ${i + 1}`;
      item.style.width = '100px';
      item.style.height = '100px';
      
      // Mock dimensions
      item.getBoundingClientRect = vi.fn(() => ({
        width: 100,
        height: 100,
        top: Math.floor(i / 3) * 110,
        left: (i % 3) * 110,
        bottom: Math.floor(i / 3) * 110 + 100,
        right: (i % 3) * 110 + 100,
        x: (i % 3) * 110,
        y: Math.floor(i / 3) * 110,
        toJSON: () => ({})
      }));
      
      container.appendChild(item);
      items.push(item);
    }
    
    return items;
  }

  /**
   * Simulate container resize
   */
  static async simulateResize(element: HTMLElement, newWidth: number, newHeight: number): Promise<void> {
    // Update mock dimensions
    element.getBoundingClientRect = vi.fn(() => ({
      width: newWidth,
      height: newHeight,
      top: 0,
      left: 0,
      bottom: newHeight,
      right: newWidth,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }));
    
    Object.defineProperty(element, 'offsetWidth', { value: newWidth, writable: true });
    Object.defineProperty(element, 'offsetHeight', { value: newHeight, writable: true });
    
    // Trigger ResizeObserver callback
    const resizeObserver = (global.ResizeObserver as any).mock.instances[0];
    if (resizeObserver) {
      const callback = (global.ResizeObserver as any).mock.calls[0][0];
      callback([{
        target: element,
        contentRect: { width: newWidth, height: newHeight, top: 0, left: 0, bottom: newHeight, right: newWidth }
      }]);
    }
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Measure performance of a function
   */
  static async measurePerformance<T>(fn: () => Promise<T> | T): Promise<{
    result: T;
    duration: number;
    memoryUsed: number;
  }> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const result = await fn();
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      result,
      duration: endTime - startTime,
      memoryUsed: endMemory - startMemory
    };
  }

  /**
   * Test accessibility features
   */
  static testAccessibility(element: HTMLElement): {
    hasAriaLabel: boolean;
    hasRole: boolean;
    isKeyboardAccessible: boolean;
    hasProperContrast: boolean;
    hasSkipLinks: boolean;
  } {
    return {
      hasAriaLabel: !!(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')),
      hasRole: !!element.getAttribute('role'),
      isKeyboardAccessible: element.tabIndex >= 0 || element.tagName.toLowerCase() === 'button',
      hasProperContrast: true, // Would need color contrast calculation
      hasSkipLinks: !!document.querySelector('a[href^="#"]')
    };
  }

  /**
   * Simulate user interactions
   */
  static async simulateClick(element: HTMLElement): Promise<void> {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  static async simulateKeyPress(element: HTMLElement, key: string): Promise<void> {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);

    // Handle Tab navigation manually for tests
    if (key === 'Tab') {
      const focusableElements = this.getFocusableElements();
      const currentIndex = focusableElements.indexOf(element);
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      const nextElement = focusableElements[nextIndex];
      if (nextElement) {
        nextElement.focus();
      }
    }

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Get all focusable elements in the document
   */
  private static getFocusableElements(): HTMLElement[] {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Wait for animations to complete
   */
  static async waitForAnimation(duration: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Check if element has CSS property
   */
  static hasCSS(element: HTMLElement, property: string, value?: string): boolean {
    const styles = window.getComputedStyle(element);
    const actualValue = styles.getPropertyValue(property);
    
    if (value) {
      return actualValue === value;
    }
    
    return actualValue !== '' && actualValue !== 'initial' && actualValue !== 'inherit';
  }

  /**
   * Create mock intersection observer entry
   */
  static createIntersectionEntry(element: HTMLElement, isIntersecting: boolean = true): IntersectionObserverEntry {
    return {
      target: element,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRect: isIntersecting ? element.getBoundingClientRect() : { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) },
      rootBounds: { top: 0, left: 0, bottom: 1000, right: 1000, width: 1000, height: 1000, x: 0, y: 0, toJSON: () => ({}) },
      time: performance.now()
    };
  }

  /**
   * Test responsive behavior
   */
  static async testResponsiveBehavior(
    element: HTMLElement,
    breakpoints: { width: number; expectedBehavior: () => boolean }[]
  ): Promise<boolean> {
    for (const { width, expectedBehavior } of breakpoints) {
      await this.simulateResize(element, width, 400);
      
      if (!expectedBehavior()) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Clean up test DOM
   */
  static cleanup(): void {
    document.body.innerHTML = '';
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset performance counters
    (performance.now as any).mockReturnValue(Date.now());
  }

  /**
   * Create typography test elements
   */
  static createTypographyElements(): {
    heading: HTMLElement;
    paragraph: HTMLElement;
    container: HTMLElement;
  } {
    const container = this.createContainer({ width: 800, height: 600, className: 'typography-container' });
    
    const heading = document.createElement('h1');
    heading.textContent = 'Test Heading';
    heading.style.fontSize = '2rem';
    container.appendChild(heading);
    
    const paragraph = document.createElement('p');
    paragraph.textContent = 'This is a test paragraph with some content to test fluid typography scaling.';
    paragraph.style.fontSize = '1rem';
    container.appendChild(paragraph);
    
    return { heading, paragraph, container };
  }

  /**
   * Test memory leaks
   */
  static async testMemoryLeaks(fn: () => void, iterations: number = 100): Promise<{
    hasLeak: boolean;
    memoryGrowth: number;
  }> {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    for (let i = 0; i < iterations; i++) {
      fn();
      
      // Force garbage collection simulation
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryGrowth = finalMemory - initialMemory;
    
    // Consider it a leak if memory grew by more than 1MB per 100 iterations
    const hasLeak = memoryGrowth > 1024 * 1024;
    
    return { hasLeak, memoryGrowth };
  }

  /**
   * Mock CSS container query support
   */
  static mockContainerQuerySupport(supported: boolean = true): void {
    (global.CSS.supports as any).mockImplementation((property: string) => {
      if (property === 'container-type' || property === 'container') {
        return supported;
      }
      return false;
    });
  }

  /**
   * Create performance benchmark
   */
  static async benchmark(
    name: string,
    fn: () => Promise<void> | void,
    iterations: number = 1000
  ): Promise<{
    name: string;
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  }> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }
    
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return {
      name,
      averageTime,
      minTime,
      maxTime,
      totalTime
    };
  }
}
