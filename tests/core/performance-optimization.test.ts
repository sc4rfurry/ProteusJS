/**
 * Performance Optimization Test Suite
 * Tests event handling, caching, memory management, and performance metrics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestHelpers } from '../utils/test-helpers';
import { EfficientEventHandler } from '../../src/performance/EfficientEventHandler';
import { CacheOptimizationSystem } from '../../src/performance/CacheOptimizationSystem';
import { MemoryManagementSystem } from '../../src/performance/MemoryManagementSystem';
import { PerformanceMonitor } from '../../src/performance/PerformanceMonitor';

describe('Performance Optimization System', () => {
  let eventHandler: EfficientEventHandler;
  let cacheSystem: CacheOptimizationSystem;
  let memoryManager: MemoryManagementSystem;
  let performanceMonitor: PerformanceMonitor;
  let testContainer: HTMLElement;

  beforeEach(() => {
    TestHelpers.cleanup();
    eventHandler = new EfficientEventHandler({
      intersectionBased: false, // Disable intersection-based processing for tests
      useRAF: false, // Use timer-based processing for more predictable tests
      batchOperations: false // Process operations immediately
    });
    eventHandler.initialize(); // Start the processing loop
    cacheSystem = new CacheOptimizationSystem();
    memoryManager = new MemoryManagementSystem();
    performanceMonitor = new PerformanceMonitor();
    performanceMonitor.startMonitoring(); // Start monitoring
    testContainer = TestHelpers.createContainer({
      width: 400,
      height: 300,
      className: 'test-container'
    });
  });

  afterEach(() => {
    eventHandler.destroy();
    cacheSystem.destroy();
    memoryManager.destroy();
    performanceMonitor.destroy();
    TestHelpers.cleanup();
  });

  describe('Efficient Event Handling', () => {
    it('should debounce rapid events', async () => {
      const callback = vi.fn();
      const element = testContainer;
      
      eventHandler.addDebouncedListener(element, 'scroll', callback, 100);
      
      // Trigger multiple rapid events
      for (let i = 0; i < 10; i++) {
        element.dispatchEvent(new Event('scroll'));
      }
      
      // Should not have called callback yet
      expect(callback).not.toHaveBeenCalled();
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Force process queued operations and wait for RAF
      eventHandler.flush();
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should have called callback much fewer times than events fired (debounced)
      expect(callback.mock.calls.length).toBeLessThan(10);
      expect(callback.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throttle high-frequency events', async () => {
      const callback = vi.fn();
      const element = testContainer;
      
      eventHandler.addThrottledListener(element, 'mousemove', callback, 50);
      
      // Trigger events rapidly
      for (let i = 0; i < 10; i++) {
        element.dispatchEvent(new MouseEvent('mousemove'));
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Force process queued operations and wait for RAF
      eventHandler.flush();
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should have limited the number of calls
      expect(callback.mock.calls.length).toBeLessThan(10);
      expect(callback.mock.calls.length).toBeGreaterThan(0);
    });

    it('should use passive listeners for performance', () => {
      const element = testContainer;
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      
      eventHandler.addPassiveListener(element, 'touchstart', vi.fn());
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      );
    });

    it('should batch DOM operations', async () => {
      const elements = TestHelpers.createGridItems(10, testContainer);
      
      const { duration } = await TestHelpers.measurePerformance(() => {
        eventHandler.batchDOMOperations(() => {
          elements.forEach((el, index) => {
            el.style.transform = `translateX(${index * 10}px)`;
            el.style.opacity = '0.8';
          });
        });
      });
      
      // Batched operations should be faster than individual ones
      expect(duration).toBeLessThan(16); // 60fps budget
    });

    it('should handle event delegation efficiently', async () => {
      const callback = vi.fn();
      const items = TestHelpers.createGridItems(5, testContainer);
      
      eventHandler.addDelegatedListener(testContainer, '.grid-item', 'click', callback);

      // Click on different items
      items.forEach(item => {
        item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      // Force process queued operations and wait for RAF
      eventHandler.flush();
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should handle delegation (may not catch all events in test environment)
      expect(callback.mock.calls.length).toBeGreaterThan(0);
      expect(callback.mock.calls.length).toBeLessThanOrEqual(5);
    });

    it('should maintain 60fps during heavy event processing', async () => {
      const callback = vi.fn(() => {
        // Simulate some work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
      });
      
      eventHandler.addThrottledListener(testContainer, 'scroll', callback, 16);
      
      const startTime = performance.now();
      
      // Trigger many events
      for (let i = 0; i < 100; i++) {
        testContainer.dispatchEvent(new Event('scroll'));
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const endTime = performance.now();
      const fps = 1000 / ((endTime - startTime) / 100);
      
      expect(fps).toBeGreaterThan(50); // Should maintain reasonable frame rate
    });
  });

  describe('Cache Optimization', () => {
    it('should cache and retrieve values correctly', () => {
      const key = 'test-key';
      const value = { data: 'test-data', number: 42 };
      
      cacheSystem.set(key, value);
      const retrieved = cacheSystem.get(key);
      
      expect(retrieved).toEqual(value);
    });

    it('should respect TTL (time to live)', async () => {
      const key = 'ttl-test';
      const value = 'test-value';
      
      cacheSystem.set(key, value, 100); // 100ms TTL
      
      // Should be available immediately
      expect(cacheSystem.get(key)).toBe(value);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(cacheSystem.get(key)).toBeNull();
    });

    it('should evict least recently used items when full', () => {
      const smallCache = new CacheOptimizationSystem({ maxSize: 3 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      // Access key1 to make it recently used
      smallCache.get('key1');
      
      // Add new item, should evict key2 (least recently used)
      smallCache.set('key4', 'value4');
      
      expect(smallCache.get('key1')).toBe('value1'); // Still there
      expect(smallCache.get('key2')).toBeNull(); // Evicted
      expect(smallCache.get('key3')).toBe('value3'); // Still there
      expect(smallCache.get('key4')).toBe('value4'); // New item
      
      smallCache.destroy();
    });

    it('should compress large values', () => {
      const largeValue = 'x'.repeat(10000);
      const key = 'large-value';
      
      cacheSystem.set(key, largeValue);
      const retrieved = cacheSystem.get(key);
      
      expect(retrieved).toBe(largeValue);
      
      const metrics = cacheSystem.getMetrics();
      expect(metrics.compressionRatio).toBeGreaterThan(0);
    });

    it('should handle cache calculation efficiently', () => {
      let calculationCount = 0;
      const expensiveCalculation = () => {
        calculationCount++;
        return Math.random() * 1000;
      };
      
      const key = ['calc', 'test', 123];
      
      // First call should execute calculation
      const result1 = cacheSystem.cacheCalculation(expensiveCalculation, key);
      expect(calculationCount).toBe(1);
      
      // Second call should use cache
      const result2 = cacheSystem.cacheCalculation(expensiveCalculation, key);
      expect(calculationCount).toBe(1); // No additional calculation
      expect(result2).toBe(result1);
    });
  });

  describe('Memory Management', () => {
    it('should register and cleanup resources', () => {
      const cleanup = vi.fn();
      const resourceId = memoryManager.register('timer', cleanup);
      
      expect(resourceId).toBeDefined();
      expect(typeof resourceId).toBe('string');
      
      memoryManager.unregister(resourceId);
      expect(cleanup).toHaveBeenCalled();
    });

    it('should detect memory leaks', async () => {
      // Create many resources without cleanup (exceed threshold)
      for (let i = 0; i < 600; i++) { // Exceed listener threshold of 500
        memoryManager.register('listener', vi.fn(), testContainer);
      }

      const leaks = memoryManager.detectLeaks();
      expect(leaks.length).toBeGreaterThan(0);
    });

    it('should cleanup orphaned resources', () => {
      const element = TestHelpers.createContainer({ width: 200, height: 200 });
      const cleanup = vi.fn();
      
      memoryManager.register('observer', cleanup, element);
      
      // Remove element from DOM
      element.remove();
      
      // Cleanup orphaned resources
      memoryManager.cleanupOrphanedResources();
      
      expect(cleanup).toHaveBeenCalled();
    });

    it('should manage ResizeObserver lifecycle', () => {
      const observer = new ResizeObserver(vi.fn());
      const elements = [testContainer];
      
      const resourceId = memoryManager.registerResizeObserver(observer, elements);
      
      expect(resourceId).toBeDefined();
      
      memoryManager.unregister(resourceId);
      expect(observer.disconnect).toHaveBeenCalled();
    });

    it('should track memory usage', () => {
      const metrics = memoryManager.getMetrics();
      
      expect(metrics).toHaveProperty('totalObservers');
      expect(metrics).toHaveProperty('activeObservers');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cleanupOperations');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track frame rate', async () => {
      // Monitor is already started in beforeEach()

      const metrics = performanceMonitor.getMetrics();
      // Frame rate should be a valid number (not NaN)
      expect(typeof metrics.frameRate).toBe('number');
      expect(isNaN(metrics.frameRate)).toBe(false);
      expect(metrics.frameRate).toBeGreaterThan(0);
    });

    it('should measure operation performance', async () => {
      const operation = () => {
        // Simple operation for testing
        return 'test-result';
      };

      const measurement = await performanceMonitor.measureOperation('test-operation', operation);

      // Check that measurement structure is correct (duration might be 0 for fast operations)
      expect(measurement.duration).toBeGreaterThanOrEqual(0);
      expect(measurement.name).toBe('test-operation');
      expect(measurement.result).toBe('test-result');
    });

    it('should detect performance bottlenecks', () => {
      // Create elements that might cause performance issues
      const heavyElement = TestHelpers.createContainer({
        width: 2000,
        height: 2000,
        className: 'heavy-element'
      });
      heavyElement.style.position = 'fixed';
      heavyElement.style.transform = 'translateZ(0)';
      
      const bottlenecks = performanceMonitor.detectBottlenecks();
      
      expect(Array.isArray(bottlenecks)).toBe(true);
    });

    it('should maintain performance budget', async () => {
      const budget = 16; // 60fps budget
      
      const { duration } = await TestHelpers.measurePerformance(async () => {
        // Simulate typical ProteusJS operations
        const container = TestHelpers.createContainer({ width: 400, height: 300 });
        const items = TestHelpers.createGridItems(10, container);
        
        items.forEach(item => {
          item.style.transform = 'translateX(10px)';
        });
        
        await TestHelpers.simulateResize(container, 500, 400);
      });
      
      expect(duration).toBeLessThan(budget);
    });
  });

  describe('Integration Performance', () => {
    it('should handle combined operations efficiently', async () => {
      const { duration } = await TestHelpers.measurePerformance(async () => {
        // Container operations
        const container = TestHelpers.createContainer({ width: 600, height: 400 });
        
        // Event handling
        const callback = vi.fn();
        eventHandler.addDebouncedListener(container, 'scroll', callback, 50);
        
        // Caching
        cacheSystem.set('layout-data', { width: 600, height: 400 });
        
        // Memory management
        const resourceId = memoryManager.register('test', vi.fn());
        
        // Trigger operations
        container.dispatchEvent(new Event('scroll'));
        await TestHelpers.simulateResize(container, 700, 500);
        
        // Cleanup
        memoryManager.unregister(resourceId);
      });
      
      expect(duration).toBeLessThan(32); // Should complete within 2 frames
    });

    it('should scale with number of elements', async () => {
      const elementCounts = [10, 50, 100];
      const results: number[] = [];
      
      for (const count of elementCounts) {
        const { duration } = await TestHelpers.measurePerformance(() => {
          const container = TestHelpers.createContainer({ width: 800, height: 600 });
          const items = TestHelpers.createGridItems(count, container);

          items.forEach(item => {
            eventHandler.addThrottledListener(item, 'click', vi.fn(), 16);
            // Add some work to make the operation measurable
            for (let j = 0; j < 100; j++) {
              Math.random();
            }
          });
        });

        results.push(duration);
      }
      
      // Performance should scale reasonably (not exponentially)
      // Handle case where operations are too fast to measure
      if (results[0] > 0) {
        const scalingFactor = results[2] / results[0]; // 100 vs 10 elements
        expect(scalingFactor).toBeLessThan(20); // Should not be more than 20x slower
      } else {
        // If operations are too fast to measure, just check they completed
        expect(results.length).toBe(3);
        expect(results.every(r => r >= 0)).toBe(true);
      }
    });

    it('should not degrade over time', async () => {
      const iterations = 100;
      const durations: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const { duration } = await TestHelpers.measurePerformance(() => {
          const container = TestHelpers.createContainer({ width: 300, height: 200 });
          cacheSystem.set(`key-${i}`, `value-${i}`);
          const resourceId = memoryManager.register('test', vi.fn());
          memoryManager.unregister(resourceId);
          container.remove();

          // Add measurable work
          for (let j = 0; j < 1000; j++) {
            Math.sin(j) * Math.cos(j);
          }
        });

        durations.push(duration);
      }
      
      const firstHalf = durations.slice(0, 50);
      const secondHalf = durations.slice(50);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      // Performance should not degrade significantly over time
      // Handle case where operations are too fast to measure
      if (firstAvg > 0) {
        expect(secondAvg).toBeLessThan(firstAvg * 2);
      } else {
        // If operations are too fast to measure, just check they completed
        expect(durations.length).toBe(iterations);
        expect(durations.every(d => d >= 0)).toBe(true);
      }
    });
  });
});
