/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  navigate,
  back,
  forward,
  reload,
  intercept,
  getCurrentNavigation,
  getNavigationHistory,
  isNavigationAPISupported,
  isViewTransitionsSupported
} from './index';

// Mock Navigation API
const mockNavigation = {
  navigate: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  reload: vi.fn(),
  addEventListener: vi.fn(),
  currentEntry: {
    url: 'https://example.com/',
    key: 'test-key',
    id: 'test-id',
    index: 0,
    sameDocument: true,
    getState: () => ({ test: 'state' })
  },
  entries: () => []
};

// Mock View Transitions API
const mockStartViewTransition = vi.fn();

describe('ProteusJS Router', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/',
        reload: vi.fn()
      },
      writable: true
    });
    
    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        length: 1,
        state: null
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Feature Detection', () => {
    it('should detect Navigation API support', () => {
      // Mock Navigation API support
      Object.defineProperty(window, 'navigation', {
        value: mockNavigation,
        writable: true
      });
      
      expect(isNavigationAPISupported()).toBe(true);
    });

    it('should detect View Transitions support', () => {
      // Mock View Transitions API support
      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true
      });
      
      expect(isViewTransitionsSupported()).toBe(true);
    });

    it('should handle missing APIs gracefully', () => {
      // Remove APIs
      delete (window as any).navigation;
      delete (document as any).startViewTransition;
      
      expect(isNavigationAPISupported()).toBe(false);
      expect(isViewTransitionsSupported()).toBe(false);
    });
  });

  describe('Navigation Functions', () => {
    describe('with Navigation API', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'navigation', {
          value: mockNavigation,
          writable: true
        });
      });

      it('should navigate using Navigation API', async () => {
        await navigate('/test-page');
        
        expect(mockNavigation.navigate).toHaveBeenCalledWith('/test-page', {
          replace: undefined,
          state: undefined,
          info: undefined
        });
      });

      it('should navigate with options', async () => {
        await navigate('/test-page', {
          replace: true,
          state: { test: 'data' }
        });
        
        expect(mockNavigation.navigate).toHaveBeenCalledWith('/test-page', {
          replace: true,
          state: { test: 'data' },
          info: undefined
        });
      });

      it('should use back function', () => {
        back();
        expect(mockNavigation.back).toHaveBeenCalled();
      });

      it('should use forward function', () => {
        forward();
        expect(mockNavigation.forward).toHaveBeenCalled();
      });

      it('should use reload function', () => {
        reload();
        expect(mockNavigation.reload).toHaveBeenCalled();
      });
    });

    describe('with History API fallback', () => {
      beforeEach(() => {
        // Remove Navigation API
        delete (window as any).navigation;
      });

      it('should navigate using History API', async () => {
        await navigate('/test-page');
        
        expect(window.history.pushState).toHaveBeenCalledWith(undefined, '', '/test-page');
      });

      it('should navigate with replace option', async () => {
        await navigate('/test-page', { replace: true, state: { test: 'data' } });
        
        expect(window.history.replaceState).toHaveBeenCalledWith({ test: 'data' }, '', '/test-page');
      });

      it('should use history back', () => {
        back();
        expect(window.history.back).toHaveBeenCalled();
      });

      it('should use history forward', () => {
        forward();
        expect(window.history.forward).toHaveBeenCalled();
      });

      it('should use location reload', () => {
        reload();
        expect(window.location.reload).toHaveBeenCalled();
      });
    });
  });

  describe('View Transitions Integration', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true
      });
      Object.defineProperty(window, 'navigation', {
        value: mockNavigation,
        writable: true
      });
    });

    it('should use view transitions when available', async () => {
      mockStartViewTransition.mockResolvedValue(undefined);
      
      await navigate('/test-page', {
        transition: { name: 'slide', duration: 300 }
      });
      
      expect(mockStartViewTransition).toHaveBeenCalled();
    });

    it('should fallback without view transitions', async () => {
      delete (document as any).startViewTransition;
      
      await navigate('/test-page', {
        transition: { name: 'slide', duration: 300 }
      });
      
      expect(mockNavigation.navigate).toHaveBeenCalled();
    });
  });

  describe('Navigation Interception', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'navigation', {
        value: mockNavigation,
        writable: true
      });
    });

    it('should set up navigation interception', () => {
      const handler = vi.fn().mockReturnValue(true);
      const cleanup = intercept(handler);
      
      expect(mockNavigation.addEventListener).toHaveBeenCalledWith(
        'navigate',
        expect.any(Function),
        { signal: expect.any(AbortSignal) }
      );
      
      expect(typeof cleanup).toBe('function');
    });

    it('should handle popstate events in fallback mode', () => {
      delete (window as any).navigation;
      
      const handler = vi.fn();
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      intercept(handler);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    });
  });

  describe('Navigation State', () => {
    it('should get current navigation with Navigation API', () => {
      Object.defineProperty(window, 'navigation', {
        value: mockNavigation,
        writable: true
      });
      
      const current = getCurrentNavigation();
      
      expect(current).toEqual({
        url: 'https://example.com/',
        key: 'test-key',
        id: 'test-id',
        index: 0,
        sameDocument: true,
        state: { test: 'state' }
      });
    });

    it('should get current navigation with History API fallback', () => {
      delete (window as any).navigation;
      
      const current = getCurrentNavigation();
      
      expect(current).toEqual({
        url: 'https://example.com/',
        key: 'default',
        id: 'default',
        index: 0,
        sameDocument: true,
        state: null
      });
    });

    it('should get navigation history', () => {
      Object.defineProperty(window, 'navigation', {
        value: {
          ...mockNavigation,
          entries: () => [mockNavigation.currentEntry]
        },
        writable: true
      });
      
      const history = getNavigationHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({
        url: 'https://example.com/',
        key: 'test-key',
        id: 'test-id',
        index: 0,
        sameDocument: true,
        state: { test: 'state' }
      });
    });
  });
});
