/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  viewTransition,
  setupSharedElement,
  namedTransition,
  slideTransition,
  fadeTransition,
  isViewTransitionsSupported,
  getActiveViewTransition,
  skipActiveTransition
} from './index';

// Mock View Transition
const mockViewTransition = {
  finished: Promise.resolve(),
  ready: Promise.resolve(),
  updateCallbackDone: Promise.resolve(),
  skipTransition: vi.fn()
};

const mockStartViewTransition = vi.fn().mockReturnValue(mockViewTransition);

describe('ProteusJS Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock document.head for style injection
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.head.innerHTML = '';
  });

  describe('Feature Detection', () => {
    it('should detect View Transitions API support', () => {
      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true
      });
      
      expect(isViewTransitionsSupported()).toBe(true);
    });

    it('should handle missing View Transitions API', () => {
      delete (document as any).startViewTransition;
      expect(isViewTransitionsSupported()).toBe(false);
    });
  });

  describe('Basic View Transitions', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true
      });
    });

    it('should start a view transition', async () => {
      const updateCallback = vi.fn();
      
      const result = await viewTransition(updateCallback);
      
      expect(mockStartViewTransition).toHaveBeenCalled();
      expect(updateCallback).toHaveBeenCalled();
      expect(result).toBe(mockViewTransition);
    });

    it('should handle transition with name', async () => {
      const updateCallback = vi.fn();
      
      await viewTransition(updateCallback, { name: 'test-transition' });
      
      expect(mockStartViewTransition).toHaveBeenCalled();
      expect(document.documentElement.style.getPropertyValue('view-transition-name')).toBe('test-transition');
    });

    it('should skip transition when requested', async () => {
      const updateCallback = vi.fn();
      
      await viewTransition(updateCallback, { skipTransition: true });
      
      expect(mockStartViewTransition).not.toHaveBeenCalled();
      expect(updateCallback).toHaveBeenCalled();
    });

    it('should fallback gracefully without API support', async () => {
      delete (document as any).startViewTransition;
      
      const updateCallback = vi.fn();
      const result = await viewTransition(updateCallback);
      
      expect(updateCallback).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('Shared Elements', () => {
    let testElement: HTMLElement;

    beforeEach(() => {
      testElement = document.createElement('div');
      document.body.appendChild(testElement);
    });

    afterEach(() => {
      document.body.removeChild(testElement);
    });

    it('should setup shared element', () => {
      const cleanup = setupSharedElement({
        name: 'test-element',
        element: testElement
      });
      
      expect(testElement.style.viewTransitionName).toBe('test-element');
      expect(typeof cleanup).toBe('function');
    });

    it('should setup shared element with group', () => {
      setupSharedElement({
        name: 'test-element',
        element: testElement,
        group: 'test-group'
      });
      
      expect(testElement.style.viewTransitionName).toBe('test-element');
      expect(testElement.style.getPropertyValue('--view-transition-group')).toBe('test-group');
    });

    it('should cleanup shared element', () => {
      const cleanup = setupSharedElement({
        name: 'test-element',
        element: testElement
      });
      
      cleanup();
      
      expect(testElement.style.viewTransitionName).toBe('');
    });
  });

  describe('Named Transitions', () => {
    let testElements: HTMLElement[];

    beforeEach(() => {
      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true
      });
      
      testElements = [
        document.createElement('div'),
        document.createElement('div')
      ];
      
      testElements.forEach(el => document.body.appendChild(el));
    });

    afterEach(() => {
      testElements.forEach(el => document.body.removeChild(el));
    });

    it('should create named transition', async () => {
      const updateCallback = vi.fn();
      
      await namedTransition('test-transition', testElements, updateCallback);
      
      expect(mockStartViewTransition).toHaveBeenCalled();
      expect(updateCallback).toHaveBeenCalled();
      
      // Elements should be cleaned up after transition
      testElements.forEach(el => {
        expect(el.style.viewTransitionName).toBe('');
      });
    });
  });

  describe('Predefined Transitions', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true
      });
    });

    it('should create slide transition', async () => {
      const updateCallback = vi.fn();
      
      await slideTransition('right', updateCallback, { duration: 500 });
      
      expect(mockStartViewTransition).toHaveBeenCalled();
      expect(updateCallback).toHaveBeenCalled();
      
      // Check if styles were injected
      const styles = document.head.querySelectorAll('style');
      expect(styles.length).toBeGreaterThan(0);
      
      const styleContent = Array.from(styles).map(s => s.textContent).join('');
      expect(styleContent).toContain('slide-out-right');
      expect(styleContent).toContain('slide-in-right');
      expect(styleContent).toContain('500ms');
    });

    it('should create fade transition', async () => {
      const updateCallback = vi.fn();
      
      await fadeTransition(updateCallback, { duration: 300, easing: 'ease-out' });
      
      expect(mockStartViewTransition).toHaveBeenCalled();
      expect(updateCallback).toHaveBeenCalled();
      
      // Check if styles were injected
      const styles = document.head.querySelectorAll('style');
      expect(styles.length).toBeGreaterThan(0);
      
      const styleContent = Array.from(styles).map(s => s.textContent).join('');
      expect(styleContent).toContain('fade-out');
      expect(styleContent).toContain('fade-in');
      expect(styleContent).toContain('300ms');
      expect(styleContent).toContain('ease-out');
    });
  });

  describe('Active Transition Management', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'activeViewTransition', {
        value: mockViewTransition,
        writable: true
      });
      
      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true
      });
    });

    it('should get active view transition', () => {
      const active = getActiveViewTransition();
      expect(active).toBe(mockViewTransition);
    });

    it('should skip active transition', () => {
      skipActiveTransition();
      expect(mockViewTransition.skipTransition).toHaveBeenCalled();
    });

    it('should handle no active transition', () => {
      delete (document as any).activeViewTransition;
      
      const active = getActiveViewTransition();
      expect(active).toBeNull();
      
      // Should not throw when skipping non-existent transition
      expect(() => skipActiveTransition()).not.toThrow();
    });

    it('should handle missing API gracefully', () => {
      delete (document as any).startViewTransition;
      delete (document as any).activeViewTransition;
      
      const active = getActiveViewTransition();
      expect(active).toBeNull();
    });
  });

  describe('Style Cleanup', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true
      });
    });

    it('should cleanup styles after transition', async () => {
      const updateCallback = vi.fn();
      
      // Use a very short duration for testing
      await slideTransition('right', updateCallback, { duration: 1 });
      
      expect(document.head.querySelectorAll('style').length).toBeGreaterThan(0);
      
      // Wait for cleanup (duration + 100ms buffer)
      await new Promise(resolve => setTimeout(resolve, 110));
      
      // Styles should be cleaned up
      expect(document.head.querySelectorAll('style').length).toBe(0);
    });
  });
});
