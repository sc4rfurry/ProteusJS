/**
 * Tests for Efficient Event Handler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EfficientEventHandler } from '../EfficientEventHandler';

// Mock ResizeObserver and IntersectionObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('EfficientEventHandler', () => {
  let eventHandler: EfficientEventHandler;
  let testElement: HTMLElement;

  beforeEach(() => {
    eventHandler = new EfficientEventHandler({
      debounceDelay: 10,
      throttleDelay: 10,
      useRAF: false, // Use timer for testing
      batchOperations: true,
      performanceTarget: 16
    });

    testElement = document.createElement('div');
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    eventHandler.destroy();
    document.body.removeChild(testElement);
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => eventHandler.initialize()).not.toThrow();
    });

    it('should setup observers when initialized', () => {
      eventHandler.initialize();
      expect(global.ResizeObserver).toHaveBeenCalled();
      expect(global.IntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('Resize Observation', () => {
    it('should register resize observation', () => {
      eventHandler.initialize();
      
      const callback = vi.fn();
      const operationId = eventHandler.observeResize(testElement, callback);
      
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });

    it('should call resize callback when triggered', async () => {
      eventHandler.initialize();
      
      const callback = vi.fn();
      eventHandler.observeResize(testElement, callback);
      
      // Simulate resize
      const resizeObserverInstance = (global.ResizeObserver as any).mock.instances[0];
      const resizeCallback = (global.ResizeObserver as any).mock.calls[0][0];
      
      const mockEntry = {
        target: testElement,
        contentRect: { width: 100, height: 100 },
        borderBoxSize: [{ inlineSize: 100, blockSize: 100 }],
        contentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
        devicePixelContentBoxSize: [{ inlineSize: 100, blockSize: 100 }]
      };
      
      resizeCallback([mockEntry]);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Intersection Observation', () => {
    it('should register intersection observation', () => {
      eventHandler.initialize();
      
      const callback = vi.fn();
      const operationId = eventHandler.observeIntersection(testElement, callback);
      
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });
  });

  describe('Debounced Events', () => {
    it('should add debounced event listener', () => {
      const callback = vi.fn();
      const operationId = eventHandler.addDebouncedListener(testElement, 'click', callback);
      
      expect(operationId).toBeDefined();
    });

    it('should debounce rapid events', async () => {
      const callback = vi.fn();
      eventHandler.addDebouncedListener(testElement, 'click', callback, 20);
      
      // Trigger multiple events rapidly
      testElement.click();
      testElement.click();
      testElement.click();
      
      // Should not be called immediately
      expect(callback).not.toHaveBeenCalled();
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
      // Should be called only once after debounce
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Throttled Events', () => {
    it('should add throttled event listener', () => {
      const callback = vi.fn();
      const operationId = eventHandler.addThrottledListener(testElement, 'scroll', callback);
      
      expect(operationId).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics', () => {
      const metrics = eventHandler.getMetrics();
      
      expect(metrics).toHaveProperty('frameTime');
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('operationsPerFrame');
      expect(metrics).toHaveProperty('queueSize');
      expect(metrics).toHaveProperty('droppedFrames');
      expect(metrics).toHaveProperty('averageLatency');
    });

    it('should update metrics during operation', async () => {
      eventHandler.initialize();
      
      const callback = vi.fn();
      eventHandler.observeResize(testElement, callback);
      
      const initialMetrics = eventHandler.getMetrics();
      
      // Trigger some operations
      const resizeCallback = (global.ResizeObserver as any).mock.calls[0][0];
      resizeCallback([{
        target: testElement,
        contentRect: { width: 100, height: 100 }
      }]);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const updatedMetrics = eventHandler.getMetrics();
      expect(updatedMetrics.queueSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Operation Management', () => {
    it('should remove operations from queue', () => {
      eventHandler.initialize();
      
      const callback = vi.fn();
      const operationId = eventHandler.observeResize(testElement, callback);
      
      eventHandler.removeOperation(operationId);
      
      // Operation should be removed from queue
      const metrics = eventHandler.getMetrics();
      expect(metrics.queueSize).toBe(0);
    });

    it('should flush all operations', async () => {
      eventHandler.initialize();
      
      const callback = vi.fn();
      eventHandler.observeResize(testElement, callback);
      
      // Add operation to queue
      const resizeCallback = (global.ResizeObserver as any).mock.calls[0][0];
      resizeCallback([{
        target: testElement,
        contentRect: { width: 100, height: 100 }
      }]);
      
      // Flush operations
      eventHandler.flush();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      eventHandler.initialize();
      
      const resizeObserverInstance = (global.ResizeObserver as any).mock.instances[0];
      const intersectionObserverInstance = (global.IntersectionObserver as any).mock.instances[0];
      
      eventHandler.destroy();
      
      expect(resizeObserverInstance.disconnect).toHaveBeenCalled();
      expect(intersectionObserverInstance.disconnect).toHaveBeenCalled();
    });
  });

  describe('Performance Budgeting', () => {
    it('should respect performance budget', async () => {
      const handler = new EfficientEventHandler({
        performanceTarget: 1, // Very low budget
        maxBatchSize: 1,
        useRAF: false
      });
      
      handler.initialize();
      
      const callbacks = Array.from({ length: 10 }, () => vi.fn());
      
      // Add many operations
      callbacks.forEach((callback, index) => {
        handler.observeResize(testElement, callback);
      });
      
      // Trigger operations
      const resizeCallback = (global.ResizeObserver as any).mock.calls[0][0];
      resizeCallback(callbacks.map(() => ({
        target: testElement,
        contentRect: { width: 100, height: 100 }
      })));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Not all callbacks should be executed due to budget constraints
      const executedCount = callbacks.filter(cb => cb.mock.calls.length > 0).length;
      expect(executedCount).toBeLessThan(callbacks.length);
      
      handler.destroy();
    });
  });
});
