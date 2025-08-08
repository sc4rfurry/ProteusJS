/**
 * PerformanceMonitor Test Suite
 * Comprehensive tests for performance monitoring system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor, PerformanceThresholds } from '../PerformanceMonitor';

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
  },
  configurable: true
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(() => callback(performance.now()), 16);
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    performanceMonitor = new PerformanceMonitor();
    
    // Mock performance.now to return predictable values
    let mockTime = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      mockTime += 16.67; // Simulate 60fps
      return mockTime;
    });
  });

  afterEach(() => {
    performanceMonitor.stop();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default thresholds', () => {
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.frameRate).toBe(60);
      expect(metrics.averageFrameTime).toBe(16.67);
      expect(metrics.memoryUsage).toBeDefined();
    });

    it('should accept custom thresholds', () => {
      const customThresholds: Partial<PerformanceThresholds> = {
        minFrameRate: 30,
        maxMemoryUsage: 200 * 1024 * 1024
      };

      const monitor = new PerformanceMonitor(customThresholds);
      
      expect(monitor).toBeDefined();
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      expect(() => {
        performanceMonitor.start();
      }).not.toThrow();
    });

    it('should stop monitoring', () => {
      performanceMonitor.start();
      
      expect(() => {
        performanceMonitor.stop();
      }).not.toThrow();
    });

    it('should handle multiple start calls gracefully', () => {
      performanceMonitor.start();
      performanceMonitor.start(); // Should not cause issues
      
      expect(() => {
        performanceMonitor.stop();
      }).not.toThrow();
    });

    it('should handle stop without start gracefully', () => {
      expect(() => {
        performanceMonitor.stop();
      }).not.toThrow();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect frame rate metrics', async () => {
      performanceMonitor.start();
      
      // Wait for a few frames
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.frameRate).toBeGreaterThan(0);
      expect(metrics.averageFrameTime).toBeGreaterThan(0);
    });

    it('should collect memory metrics', () => {
      performanceMonitor.updateMetrics();
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.memoryUsage.used).toBeGreaterThan(0);
      expect(metrics.memoryUsage.total).toBeGreaterThan(0);
      expect(metrics.memoryUsage.percentage).toBeGreaterThan(0);
    });

    it('should collect DOM metrics', () => {
      // Add some DOM elements
      for (let i = 0; i < 10; i++) {
        const div = document.createElement('div');
        document.body.appendChild(div);
      }

      performanceMonitor.updateMetrics();
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.domNodes).toBeGreaterThan(0);
    });

    it('should track operations per second', () => {
      performanceMonitor.start();
      
      // Record some operations
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordOperation();
      }
      
      performanceMonitor.updateMetrics();
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.operationsPerSecond).toBeGreaterThanOrEqual(0);
    });

    it('should update cache hit rate', () => {
      performanceMonitor.updateCacheHitRate(80, 100);
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.cacheHitRate).toBe(80);
    });
  });

  describe('Performance Alerts', () => {
    it('should generate frame rate alerts', () => {
      // Mock low frame rate
      vi.spyOn(performance, 'now').mockImplementation(() => {
        return Date.now(); // This will result in inconsistent frame times
      });

      const monitor = new PerformanceMonitor({ minFrameRate: 55 });
      monitor.start();
      
      // Force metrics update with poor performance
      monitor['metrics'].frameRate = 30; // Below threshold
      monitor['checkThresholds']();
      
      const alerts = monitor.getAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].metric).toBe('frameRate');
      expect(alerts[0].type).toBe('warning');
    });

    it('should generate memory alerts', () => {
      const monitor = new PerformanceMonitor({ maxMemoryUsage: 10 * 1024 * 1024 }); // 10MB threshold
      
      // Force high memory usage
      monitor['metrics'].memoryUsage.used = 20 * 1024 * 1024; // 20MB
      monitor['checkThresholds']();
      
      const alerts = monitor.getAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].metric).toBe('memoryUsage');
      expect(alerts[0].type).toBe('critical');
    });

    it('should generate DOM node alerts', () => {
      const monitor = new PerformanceMonitor({ maxDOMNodes: 100 });
      
      // Force high DOM node count
      monitor['metrics'].domNodes = 200;
      monitor['checkThresholds']();
      
      const alerts = monitor.getAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].metric).toBe('domNodes');
    });

    it('should clear alerts', () => {
      const monitor = new PerformanceMonitor({ minFrameRate: 55 });
      
      // Generate an alert
      monitor['metrics'].frameRate = 30;
      monitor['checkThresholds']();
      
      expect(monitor.getAlerts().length).toBeGreaterThan(0);
      
      monitor.clearAlerts();
      
      expect(monitor.getAlerts().length).toBe(0);
    });

    it('should prevent duplicate alerts', () => {
      const monitor = new PerformanceMonitor({ minFrameRate: 55 });
      
      // Generate multiple alerts for the same metric
      monitor['metrics'].frameRate = 30;
      monitor['checkThresholds']();
      monitor['checkThresholds']();
      monitor['checkThresholds']();
      
      const alerts = monitor.getAlerts();
      
      expect(alerts.length).toBe(1); // Should only have one alert
    });
  });

  describe('Callbacks', () => {
    it('should add and call callbacks', () => {
      const callback = vi.fn();
      
      performanceMonitor.addCallback(callback);
      performanceMonitor.updateMetrics();
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          frameRate: expect.any(Number),
          memoryUsage: expect.any(Object)
        })
      );
    });

    it('should remove callbacks', () => {
      const callback = vi.fn();
      
      performanceMonitor.addCallback(callback);
      performanceMonitor.removeCallback(callback);
      performanceMonitor.updateMetrics();
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      performanceMonitor.addCallback(errorCallback);
      
      expect(() => {
        performanceMonitor.updateMetrics();
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Recommendations', () => {
    it('should provide frame rate recommendations', () => {
      performanceMonitor['metrics'].frameRate = 30; // Below threshold
      
      const recommendations = performanceMonitor.getRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('DOM manipulations'))).toBe(true);
    });

    it('should provide memory recommendations', () => {
      performanceMonitor['metrics'].memoryUsage.percentage = 90; // High memory usage
      
      const recommendations = performanceMonitor.getRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('Memory usage'))).toBe(true);
    });

    it('should provide DOM recommendations', () => {
      performanceMonitor['metrics'].domNodes = 6000; // Above threshold
      
      const recommendations = performanceMonitor.getRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('DOM tree'))).toBe(true);
    });

    it('should provide cache recommendations', () => {
      performanceMonitor['metrics'].cacheHitRate = 50; // Low hit rate
      
      const recommendations = performanceMonitor.getRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('Cache hit rate'))).toBe(true);
    });

    it('should return empty recommendations for good performance', () => {
      // Set all metrics to good values
      performanceMonitor['metrics'] = {
        frameRate: 60,
        averageFrameTime: 16.67,
        memoryUsage: { used: 10 * 1024 * 1024, total: 100 * 1024 * 1024, percentage: 10 },
        domNodes: 100,
        eventListeners: 50,
        observers: 5,
        cacheHitRate: 90,
        operationsPerSecond: 100,
        lastMeasurement: performance.now()
      };
      
      const recommendations = performanceMonitor.getRecommendations();
      
      expect(recommendations.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing performance.memory gracefully', () => {
      // Remove performance.memory
      delete (performance as any).memory;
      
      expect(() => {
        performanceMonitor.updateMetrics();
      }).not.toThrow();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryUsage.used).toBe(0);
    });

    it('should handle empty frame times', () => {
      performanceMonitor['frameTimes'] = [];
      
      expect(() => {
        performanceMonitor['updateFrameMetrics']();
      }).not.toThrow();
    });

    it('should handle zero cache operations', () => {
      performanceMonitor.updateCacheHitRate(0, 0);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('should limit alert history', () => {
      const monitor = new PerformanceMonitor({ minFrameRate: 55 });
      
      // Generate many alerts
      for (let i = 0; i < 60; i++) {
        monitor['addAlert']({
          type: 'warning',
          metric: 'test',
          value: i,
          threshold: 100,
          message: `Test alert ${i}`,
          timestamp: performance.now() + i * 1000, // Different timestamps
          suggestions: []
        });
      }
      
      const alerts = monitor.getAlerts();
      expect(alerts.length).toBeLessThanOrEqual(50); // Should be limited to 50
    });
  });

  describe('Integration', () => {
    it('should work with real-time monitoring', async () => {
      performanceMonitor.start();
      
      // Simulate some activity
      for (let i = 0; i < 5; i++) {
        performanceMonitor.recordOperation();
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.operationsPerSecond).toBeGreaterThanOrEqual(0);
      expect(metrics.lastMeasurement).toBeGreaterThan(0);
    });

    it('should provide comprehensive metrics snapshot', () => {
      performanceMonitor.updateMetrics();
      
      const metrics = performanceMonitor.getMetrics();
      
      // Verify all expected properties exist
      expect(metrics).toHaveProperty('frameRate');
      expect(metrics).toHaveProperty('averageFrameTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('domNodes');
      expect(metrics).toHaveProperty('eventListeners');
      expect(metrics).toHaveProperty('observers');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('operationsPerSecond');
      expect(metrics).toHaveProperty('lastMeasurement');
    });
  });
});
