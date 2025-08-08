/**
 * ContainerBreakpoints Test Suite
 * Comprehensive tests for breakpoint management system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContainerBreakpoints, BreakpointMap } from '../ContainerBreakpoints';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('ContainerBreakpoints', () => {
  let containerBreakpoints: ContainerBreakpoints;
  let testElement: HTMLElement;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Create test element
    testElement = document.createElement('div');
    testElement.id = 'test-element';
    testElement.style.width = '400px';
    testElement.style.height = '300px';
    document.body.appendChild(testElement);

    containerBreakpoints = new ContainerBreakpoints();
    mockCallback = vi.fn();

    // Mock getBoundingClientRect
    vi.spyOn(testElement, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);
  });

  afterEach(() => {
    containerBreakpoints.destroy();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Breakpoint Registration', () => {
    it('should register breakpoints successfully', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px',
        lg: '800px'
      };

      const id = containerBreakpoints.register(testElement, breakpoints, mockCallback);
      
      expect(id).toBeTruthy();
      expect(id).toMatch(/^proteus-breakpoint-\d+-\d+$/);
    });

    it('should handle invalid breakpoint values gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const breakpoints: BreakpointMap = {
        invalid: 'not-a-valid-value',
        valid: '300px'
      };

      const id = containerBreakpoints.register(testElement, breakpoints);
      
      expect(id).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should register multiple breakpoint sets', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      const registrations = [
        {
          element: element1,
          breakpoints: { sm: '300px', md: '500px' }
        },
        {
          element: element2,
          breakpoints: { xs: '200px', lg: '800px' }
        }
      ];

      const ids = containerBreakpoints.registerMultiple(registrations);
      
      expect(ids).toHaveLength(2);
      expect(ids.every(id => id.length > 0)).toBe(true);
    });
  });

  describe('Breakpoint Detection', () => {
    it('should detect correct breakpoint for current width', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px',
        lg: '800px'
      };

      const id = containerBreakpoints.register(testElement, breakpoints, mockCallback);
      
      // Element width is 400px, should be 'sm' (300px <= 400px < 500px)
      const currentBreakpoint = containerBreakpoints.getCurrentBreakpoint(id);
      expect(currentBreakpoint).toBe('sm');
    });

    it('should call callback when breakpoint changes', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px',
        lg: '800px'
      };

      containerBreakpoints.register(testElement, breakpoints, mockCallback);
      
      // Initial callback should be called
      expect(mockCallback).toHaveBeenCalledWith(
        'sm',
        expect.objectContaining({
          width: 400,
          height: 300,
          breakpoint: 'sm',
          element: testElement
        })
      );
    });

    it('should update breakpoint when element resizes', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px',
        lg: '800px'
      };

      const id = containerBreakpoints.register(testElement, breakpoints, mockCallback);
      
      // Simulate resize to 600px width
      vi.spyOn(testElement, 'getBoundingClientRect').mockReturnValue({
        width: 600,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 600,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);

      containerBreakpoints.updateElement(testElement);
      
      const currentBreakpoint = containerBreakpoints.getCurrentBreakpoint(id);
      expect(currentBreakpoint).toBe('md');
    });
  });

  describe('CSS Class Management', () => {
    it('should add breakpoint CSS classes', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px'
      };

      containerBreakpoints.register(testElement, breakpoints);
      
      expect(testElement.classList.contains('proteus-sm')).toBe(true);
      expect(testElement.getAttribute('data-proteus-breakpoint')).toBe('sm');
    });

    it('should update CSS classes when breakpoint changes', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px'
      };

      containerBreakpoints.register(testElement, breakpoints);
      
      // Initially should have 'sm' class
      expect(testElement.classList.contains('proteus-sm')).toBe(true);
      
      // Simulate resize to trigger 'md' breakpoint
      vi.spyOn(testElement, 'getBoundingClientRect').mockReturnValue({
        width: 600,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 600,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);

      containerBreakpoints.updateElement(testElement);
      
      expect(testElement.classList.contains('proteus-sm')).toBe(false);
      expect(testElement.classList.contains('proteus-md')).toBe(true);
      expect(testElement.getAttribute('data-proteus-breakpoint')).toBe('md');
    });

    it('should remove CSS classes when unregistering', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px'
      };

      const id = containerBreakpoints.register(testElement, breakpoints);
      
      expect(testElement.classList.contains('proteus-sm')).toBe(true);
      
      containerBreakpoints.unregister(id);
      
      expect(testElement.classList.contains('proteus-sm')).toBe(false);
      expect(testElement.hasAttribute('data-proteus-breakpoint')).toBe(false);
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch custom events on breakpoint change', () => {
      const eventSpy = vi.fn();
      testElement.addEventListener('proteus:breakpoint-change', eventSpy);

      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px'
      };

      containerBreakpoints.register(testElement, breakpoints);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'proteus:breakpoint-change',
          detail: expect.objectContaining({
            breakpoint: 'sm',
            width: 400,
            height: 300
          })
        })
      );
    });
  });

  describe('Breakpoint Value Parsing', () => {
    it('should parse pixel values correctly', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px'
      };

      const id = containerBreakpoints.register(testElement, breakpoints);
      const config = containerBreakpoints['breakpoints'].get(id);
      
      expect(config?.parsedBreakpoints).toEqual([
        { name: 'sm', value: 300, unit: 'px', originalValue: '300px' },
        { name: 'md', value: 500, unit: 'px', originalValue: '500px' }
      ]);
    });

    it('should parse em values correctly', () => {
      const breakpoints: BreakpointMap = {
        sm: '20em',
        md: '30em'
      };

      const id = containerBreakpoints.register(testElement, breakpoints);
      const config = containerBreakpoints['breakpoints'].get(id);
      
      // em values should be converted to pixels (assuming 16px base)
      expect(config?.parsedBreakpoints[0].value).toBe(320); // 20 * 16
      expect(config?.parsedBreakpoints[1].value).toBe(480); // 30 * 16
    });

    it('should handle unitless values as pixels', () => {
      const breakpoints: BreakpointMap = {
        sm: '300',
        md: '500'
      };

      const id = containerBreakpoints.register(testElement, breakpoints);
      const config = containerBreakpoints['breakpoints'].get(id);
      
      expect(config?.parsedBreakpoints[0].value).toBe(300);
      expect(config?.parsedBreakpoints[0].unit).toBe('px');
    });
  });

  describe('Management and Metrics', () => {
    it('should provide performance metrics', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px',
        lg: '800px'
      };

      containerBreakpoints.register(testElement, breakpoints);
      
      const metrics = containerBreakpoints.getMetrics();
      
      expect(metrics.totalRegistrations).toBe(1);
      expect(metrics.activeElements).toBe(1);
      expect(metrics.averageBreakpoints).toBe(3);
      expect(metrics.breakpointDistribution).toEqual({
        sm: 1,
        md: 1,
        lg: 1
      });
    });

    it('should get all active breakpoints', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px'
      };

      containerBreakpoints.register(testElement, breakpoints);
      
      const activeBreakpoints = containerBreakpoints.getAllActiveBreakpoints();
      
      expect(activeBreakpoints).toHaveLength(1);
      expect(activeBreakpoints[0]).toEqual(
        expect.objectContaining({
          element: testElement,
          breakpoint: 'sm',
          width: 400,
          height: 300
        })
      );
    });

    it('should unregister all breakpoints for an element', () => {
      const breakpoints1: BreakpointMap = { sm: '300px' };
      const breakpoints2: BreakpointMap = { md: '500px' };

      containerBreakpoints.register(testElement, breakpoints1);
      containerBreakpoints.register(testElement, breakpoints2);
      
      expect(containerBreakpoints.getMetrics().totalRegistrations).toBe(2);
      
      containerBreakpoints.unregisterElement(testElement);
      
      expect(containerBreakpoints.getMetrics().totalRegistrations).toBe(0);
    });

    it('should update all breakpoints at once', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      containerBreakpoints.register(element1, { sm: '300px' }, callback1);
      containerBreakpoints.register(element2, { md: '500px' }, callback2);
      
      // Clear previous calls
      callback1.mockClear();
      callback2.mockClear();
      
      containerBreakpoints.updateAll();
      
      // Both callbacks should be called during update
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle cleanup properly', () => {
      const breakpoints: BreakpointMap = {
        sm: '300px',
        md: '500px'
      };

      containerBreakpoints.register(testElement, breakpoints);
      
      expect(() => {
        containerBreakpoints.destroy();
      }).not.toThrow();
      
      // CSS classes should be removed
      expect(testElement.classList.contains('proteus-sm')).toBe(false);
    });

    it('should handle invalid registration IDs gracefully', () => {
      const currentBreakpoint = containerBreakpoints.getCurrentBreakpoint('invalid-id');
      expect(currentBreakpoint).toBeNull();
      
      expect(() => {
        containerBreakpoints.unregister('invalid-id');
      }).not.toThrow();
    });
  });
});
