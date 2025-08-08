/**
 * Container Queries Test Suite
 * Tests container detection, breakpoint triggering, and responsive behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestHelpers } from '../utils/test-helpers';
import { SmartContainers } from '../../src/containers/SmartContainers';
import { ContainerBreakpoints } from '../../src/containers/ContainerBreakpoints';

describe('Container Queries System', () => {
  let smartContainers: SmartContainers;
  let containerBreakpoints: ContainerBreakpoints;
  let testContainer: HTMLElement;

  beforeEach(() => {
    TestHelpers.cleanup();
    smartContainers = new SmartContainers();
    containerBreakpoints = new ContainerBreakpoints();
    testContainer = TestHelpers.createContainer({
      width: 400,
      height: 300,
      className: 'test-container',
      id: 'test-container'
    });
  });

  afterEach(() => {
    smartContainers.destroy();
    containerBreakpoints.destroy();
    TestHelpers.cleanup();
  });

  describe('Container Detection', () => {
    it('should detect containers automatically', async () => {
      const containers = await smartContainers.detectContainers();
      
      expect(containers.length).toBeGreaterThan(0);
      expect(containers[0].element).toBe(testContainer);
      expect(containers[0].type).toBe('block');
    });

    it('should identify container types correctly', async () => {
      // Test grid container
      const gridContainer = TestHelpers.createContainer({
        width: 600,
        height: 400,
        className: 'grid-container'
      });
      gridContainer.style.display = 'grid';
      
      const containers = await smartContainers.detectContainers();
      const gridContainerInfo = containers.find(c => c.element === gridContainer);
      
      expect(gridContainerInfo?.type).toBe('grid');
    });

    it('should calculate container confidence scores', async () => {
      const containers = await smartContainers.detectContainers();
      
      expect(containers[0].confidence).toBeGreaterThan(0);
      expect(containers[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should prioritize containers correctly', async () => {
      const mainContainer = TestHelpers.createContainer({
        width: 800,
        height: 600,
        className: 'main-container'
      });
      mainContainer.setAttribute('role', 'main');
      
      const containers = await smartContainers.detectContainers();
      const mainContainerInfo = containers.find(c => c.element === mainContainer);
      
      expect(mainContainerInfo?.priority).toBe('high');
    });
  });

  describe('Breakpoint System', () => {
    it('should register breakpoints correctly', () => {
      const breakpoints = {
        sm: '300px',
        md: '600px',
        lg: '900px'
      };
      
      const id = containerBreakpoints.register(testContainer, breakpoints);
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should trigger breakpoint callbacks on resize', async () => {
      const breakpointCallback = vi.fn();
      const breakpoints = {
        sm: '300px',
        md: '600px'
      };
      
      containerBreakpoints.register(testContainer, breakpoints, breakpointCallback);

      // Clear initial callback from registration
      breakpointCallback.mockClear();

      // Simulate resize to trigger medium breakpoint
      await TestHelpers.simulateResize(testContainer, 650, 400);
      containerBreakpoints.updateContainer(testContainer);
      
      expect(breakpointCallback).toHaveBeenCalledWith('md', expect.objectContaining({
        width: 650,
        height: 400,
        breakpoint: 'md'
      }));
    });

    it('should handle multiple breakpoint transitions', async () => {
      const breakpointCallback = vi.fn();
      const breakpoints = {
        xs: '200px',
        sm: '400px',
        md: '600px',
        lg: '800px'
      };
      
      containerBreakpoints.register(testContainer, breakpoints, breakpointCallback);

      // Clear initial callback from registration
      breakpointCallback.mockClear();

      // Test multiple size transitions
      await TestHelpers.simulateResize(testContainer, 250, 300);
      containerBreakpoints.updateContainer(testContainer);
      expect(breakpointCallback).toHaveBeenLastCalledWith('xs', expect.any(Object));

      await TestHelpers.simulateResize(testContainer, 450, 300);
      containerBreakpoints.updateContainer(testContainer);
      expect(breakpointCallback).toHaveBeenLastCalledWith('sm', expect.any(Object));

      await TestHelpers.simulateResize(testContainer, 650, 300);
      containerBreakpoints.updateContainer(testContainer);
      expect(breakpointCallback).toHaveBeenLastCalledWith('md', expect.any(Object));
      
      expect(breakpointCallback).toHaveBeenCalledTimes(3);
    });

    it('should support custom breakpoint units', () => {
      const breakpoints = {
        small: '20em',
        medium: '40rem',
        large: '60ch'
      };
      
      expect(() => {
        containerBreakpoints.register(testContainer, breakpoints);
      }).not.toThrow();
    });
  });

  describe('Container Units', () => {
    it('should calculate container width units (cw)', () => {
      const containerWidth = 400;
      const expectedCw = containerWidth / 100; // 1cw = 1% of container width
      
      // Mock container width calculation
      const cw = smartContainers.calculateContainerUnit(testContainer, 'cw');
      
      expect(cw).toBe(expectedCw);
    });

    it('should calculate container height units (ch)', () => {
      const containerHeight = 300;
      const expectedCh = containerHeight / 100; // 1ch = 1% of container height
      
      const ch = smartContainers.calculateContainerUnit(testContainer, 'ch');
      
      expect(ch).toBe(expectedCh);
    });

    it('should calculate container min units (cmin)', () => {
      const containerWidth = 400;
      const containerHeight = 300;
      const expectedCmin = Math.min(containerWidth, containerHeight) / 100;
      
      const cmin = smartContainers.calculateContainerUnit(testContainer, 'cmin');
      
      expect(cmin).toBe(expectedCmin);
    });

    it('should calculate container max units (cmax)', () => {
      const containerWidth = 400;
      const containerHeight = 300;
      const expectedCmax = Math.max(containerWidth, containerHeight) / 100;
      
      const cmax = smartContainers.calculateContainerUnit(testContainer, 'cmax');
      
      expect(cmax).toBe(expectedCmax);
    });
  });

  describe('Context Isolation', () => {
    it('should isolate nested containers', async () => {
      const parentContainer = TestHelpers.createContainer({
        width: 600, // Start below 'md' threshold
        height: 600,
        className: 'parent-container'
      });
      
      const childContainer = TestHelpers.createContainer({
        width: 220, // Start below 'sm' threshold (250px)
        height: 200,
        className: 'child-container'
      });
      parentContainer.appendChild(childContainer);
      
      const parentBreakpoints = { sm: '400px', md: '700px' };
      const childBreakpoints = { xs: '200px', sm: '250px' };
      
      const parentCallback = vi.fn();
      const childCallback = vi.fn();
      
      containerBreakpoints.register(parentContainer, parentBreakpoints, parentCallback);
      containerBreakpoints.register(childContainer, childBreakpoints, childCallback);

      // Clear initial callbacks from registration
      parentCallback.mockClear();
      childCallback.mockClear();

      // Resize parent - should not affect child
      parentContainer.style.width = '750px';
      parentContainer.style.height = '600px';
      parentContainer.getBoundingClientRect = vi.fn(() => ({
        width: 750, height: 600, top: 0, left: 0, bottom: 600, right: 750, x: 0, y: 0, toJSON: () => ({})
      }));
      containerBreakpoints.updateContainer(parentContainer); // Only update parent
      expect(parentCallback).toHaveBeenCalledWith('md', expect.objectContaining({
        width: 750,
        height: 600,
        breakpoint: 'md'
      }));
      expect(childCallback).not.toHaveBeenCalled();

      // Resize child - should not affect parent
      childContainer.style.width = '260px';
      childContainer.style.height = '200px';
      childContainer.getBoundingClientRect = vi.fn(() => ({
        width: 260, height: 200, top: 0, left: 0, bottom: 200, right: 260, x: 0, y: 0, toJSON: () => ({})
      }));
      containerBreakpoints.updateContainer(childContainer); // Only update child
      expect(childCallback).toHaveBeenCalledWith('sm', expect.any(Object));
    });

    it('should prevent breakpoint conflicts between containers', async () => {
      const container1 = TestHelpers.createContainer({
        width: 400,
        height: 300,
        className: 'container-1'
      });
      
      const container2 = TestHelpers.createContainer({
        width: 600,
        height: 400,
        className: 'container-2'
      });
      
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      containerBreakpoints.register(container1, { sm: '300px', md: '500px' }, callback1);
      containerBreakpoints.register(container2, { sm: '400px', md: '700px' }, callback2);
      
      // Resize both containers
      await TestHelpers.simulateResize(container1, 350, 300);
      await TestHelpers.simulateResize(container2, 450, 400);
      
      // Each should trigger their own breakpoints independently
      expect(callback1).toHaveBeenCalledWith('sm', expect.any(Object));
      expect(callback2).toHaveBeenCalledWith('sm', expect.any(Object));
    });
  });

  describe('Performance', () => {
    it('should handle container detection within performance budget', async () => {
      const { duration } = await TestHelpers.measurePerformance(async () => {
        await smartContainers.detectContainers();
      });
      
      // Should complete within 16ms (60fps budget)
      expect(duration).toBeLessThan(16);
    });

    it('should handle multiple breakpoint registrations efficiently', async () => {
      const containers = Array.from({ length: 100 }, (_, i) => 
        TestHelpers.createContainer({
          width: 300 + i,
          height: 200,
          className: `container-${i}`
        })
      );
      
      const { duration } = await TestHelpers.measurePerformance(() => {
        containers.forEach(container => {
          containerBreakpoints.register(container, {
            sm: '300px',
            md: '600px',
            lg: '900px'
          });
        });
      });
      
      // Should handle 100 registrations within performance budget
      expect(duration).toBeLessThan(50);
    });

    it('should not cause memory leaks', async () => {
      const { hasLeak } = await TestHelpers.testMemoryLeaks(() => {
        const container = TestHelpers.createContainer({ width: 300, height: 200 });
        const id = containerBreakpoints.register(container, { sm: '300px' });
        containerBreakpoints.unregister(id);
        container.remove();
      }, 50);
      
      expect(hasLeak).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid breakpoint values gracefully', () => {
      expect(() => {
        containerBreakpoints.register(testContainer, {
          invalid: 'not-a-size'
        });
      }).not.toThrow();
    });

    it('should handle missing container elements', () => {
      const removedContainer = TestHelpers.createContainer({ width: 300, height: 200 });
      const id = containerBreakpoints.register(removedContainer, { sm: '300px' });
      
      removedContainer.remove();
      
      expect(() => {
        containerBreakpoints.unregister(id);
      }).not.toThrow();
    });

    it('should handle ResizeObserver not supported', () => {
      // Mock ResizeObserver as undefined
      const originalResizeObserver = global.ResizeObserver;
      (global as any).ResizeObserver = undefined;
      
      expect(() => {
        containerBreakpoints.register(testContainer, { sm: '300px' });
      }).not.toThrow();
      
      // Restore ResizeObserver
      global.ResizeObserver = originalResizeObserver;
    });
  });
});
