/**
 * Performance Benchmark Suite for ProteusJS
 * Comprehensive performance testing and validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestHelpers } from '../utils/test-helpers';
import { ProteusJS } from '../../src/core/ProteusJS';

interface BenchmarkResult {
  name: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  memoryUsage: number;
  passed: boolean;
}

interface PerformanceBudget {
  maxResponseTime: number; // milliseconds
  minOpsPerSecond: number;
  maxMemoryUsage: number; // bytes
}

describe('ProteusJS Performance Benchmarks', () => {
  let proteus: ProteusJS;
  let testContainer: HTMLElement;

  const PERFORMANCE_BUDGETS: Record<string, PerformanceBudget> = {
    containerDetection: {
      maxResponseTime: 16, // 60fps budget
      minOpsPerSecond: 1000,
      maxMemoryUsage: 1024 * 1024 // 1MB
    },
    breakpointRegistration: {
      maxResponseTime: 5,
      minOpsPerSecond: 2000,
      maxMemoryUsage: 512 * 1024 // 512KB
    },
    typographyScaling: {
      maxResponseTime: 8,
      minOpsPerSecond: 1500,
      maxMemoryUsage: 256 * 1024 // 256KB
    },
    layoutCalculation: {
      maxResponseTime: 12,
      minOpsPerSecond: 800,
      maxMemoryUsage: 2 * 1024 * 1024 // 2MB
    },
    eventHandling: {
      maxResponseTime: 2,
      minOpsPerSecond: 5000,
      maxMemoryUsage: 128 * 1024 // 128KB
    }
  };

  beforeEach(() => {
    TestHelpers.cleanup();
    proteus = new ProteusJS();
    testContainer = TestHelpers.createContainer({
      width: 400,
      height: 300,
      className: 'benchmark-container'
    });
  });

  afterEach(() => {
    proteus.destroy();
    TestHelpers.cleanup();
  });

  describe('Container Query Performance', () => {
    it('should detect containers within performance budget', async () => {
      const result = await runBenchmark(
        'Container Detection',
        async () => {
          const containers = Array.from({ length: 10 }, (_, i) =>
            TestHelpers.createContainer({
              width: 300 + i * 10,
              height: 200,
              className: `container-${i}`
            })
          );
          
          await proteus.detectContainers();
          
          // Cleanup
          containers.forEach(c => c.remove());
        },
        100, // iterations
        PERFORMANCE_BUDGETS.containerDetection
      );

      expect(result.passed).toBe(true);
      expect(result.averageTime).toBeLessThan(PERFORMANCE_BUDGETS.containerDetection.maxResponseTime);
    });

    it('should register breakpoints efficiently', async () => {
      const result = await runBenchmark(
        'Breakpoint Registration',
        () => {
          const container = TestHelpers.createContainer({ width: 400, height: 300 });
          proteus.container(container, {
            breakpoints: {
              sm: '300px',
              md: '600px',
              lg: '900px'
            }
          });
          container.remove();
        },
        500,
        PERFORMANCE_BUDGETS.breakpointRegistration
      );

      expect(result.passed).toBe(true);
      expect(result.opsPerSecond).toBeGreaterThan(PERFORMANCE_BUDGETS.breakpointRegistration.minOpsPerSecond);
    });

    it('should handle resize events within 60fps budget', async () => {
      const container = TestHelpers.createContainer({ width: 400, height: 300 });
      proteus.container(container, {
        breakpoints: { sm: '300px', md: '600px' }
      });

      const result = await runBenchmark(
        'Resize Event Handling',
        async () => {
          await TestHelpers.simulateResize(container, 
            300 + Math.random() * 400, 
            200 + Math.random() * 300
          );
        },
        100,
        PERFORMANCE_BUDGETS.eventHandling
      );

      expect(result.passed).toBe(true);
      expect(result.averageTime).toBeLessThan(16); // 60fps budget
    });
  });

  describe('Typography Performance', () => {
    it('should apply fluid typography within budget', async () => {
      const elements = Array.from({ length: 20 }, () => {
        const el = document.createElement('p');
        el.textContent = 'Sample text for typography testing';
        testContainer.appendChild(el);
        return el;
      });

      const result = await runBenchmark(
        'Fluid Typography Application',
        () => {
          elements.forEach(el => {
            proteus.fluidType(el, {
              minSize: 14,
              maxSize: 18,
              minViewport: 320,
              maxViewport: 1200
            });
          });
        },
        200,
        PERFORMANCE_BUDGETS.typographyScaling
      );

      expect(result.passed).toBe(true);
      expect(result.averageTime).toBeLessThan(PERFORMANCE_BUDGETS.typographyScaling.maxResponseTime);
    });

    it('should calculate typographic scales efficiently', async () => {
      const result = await runBenchmark(
        'Typographic Scale Calculation',
        () => {
          proteus.generateTypographicScale({
            baseSize: 16,
            ratio: 1.25,
            steps: 8
          });
        },
        1000,
        {
          maxResponseTime: 1,
          minOpsPerSecond: 10000,
          maxMemoryUsage: 64 * 1024
        }
      );

      expect(result.passed).toBe(true);
      expect(result.opsPerSecond).toBeGreaterThan(10000);
    });
  });

  describe('Layout Performance', () => {
    it('should create adaptive grids within budget', async () => {
      const gridContainers = Array.from({ length: 5 }, (_, i) =>
        TestHelpers.createContainer({
          width: 600,
          height: 400,
          className: `grid-container-${i}`
        })
      );

      const result = await runBenchmark(
        'Adaptive Grid Creation',
        () => {
          gridContainers.forEach(container => {
            const items = TestHelpers.createGridItems(12, container);
            proteus.createGrid(container, {
              columns: 'auto',
              gap: '1rem',
              responsive: true
            });
          });
        },
        50,
        PERFORMANCE_BUDGETS.layoutCalculation
      );

      expect(result.passed).toBe(true);
      expect(result.averageTime).toBeLessThan(PERFORMANCE_BUDGETS.layoutCalculation.maxResponseTime);
    });

    it('should handle flexbox layouts efficiently', async () => {
      const result = await runBenchmark(
        'Enhanced Flexbox Layout',
        () => {
          const container = TestHelpers.createContainer({ width: 800, height: 200 });
          const items = TestHelpers.createGridItems(10, container);
          
          proteus.createFlexbox(container, {
            direction: 'row',
            wrap: true,
            gap: '1rem',
            align: 'center'
          });
          
          container.remove();
        },
        100,
        PERFORMANCE_BUDGETS.layoutCalculation
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during normal operations', async () => {
      const initialMemory = getMemoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const container = TestHelpers.createContainer({ width: 300, height: 200 });
        proteus.container(container, { breakpoints: { sm: '300px' } });
        proteus.fluidType(container, { minSize: 14, maxSize: 18 });
        container.remove();
      }
      
      // Force garbage collection simulation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = getMemoryUsage();
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be minimal (less than 1MB for 100 operations)
      expect(memoryGrowth).toBeLessThan(1024 * 1024);
    });

    it('should cleanup resources properly', async () => {
      const resourceCounts = {
        observers: 0,
        listeners: 0,
        timers: 0
      };

      // Track resource creation
      const originalResizeObserver = global.ResizeObserver;
      global.ResizeObserver = class extends originalResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          resourceCounts.observers++;
        }
        
        disconnect() {
          super.disconnect();
          resourceCounts.observers--;
        }
      } as any;

      // Create and destroy many instances
      for (let i = 0; i < 50; i++) {
        const container = TestHelpers.createContainer({ width: 300, height: 200 });
        proteus.container(container, { breakpoints: { sm: '300px' } });
        container.remove();
      }

      // All observers should be cleaned up
      expect(resourceCounts.observers).toBe(0);

      // Restore original
      global.ResizeObserver = originalResizeObserver;
    });
  });

  describe('Stress Testing', () => {
    it('should handle large numbers of containers', async () => {
      const containerCount = 200;
      const containers = Array.from({ length: containerCount }, (_, i) =>
        TestHelpers.createContainer({
          width: 300 + (i % 100),
          height: 200,
          className: `stress-container-${i}`
        })
      );

      const result = await runBenchmark(
        'Large Container Set',
        () => {
          containers.forEach(container => {
            proteus.container(container, {
              breakpoints: { sm: '300px', md: '600px' }
            });
          });
        },
        1, // Single iteration due to large scale
        {
          maxResponseTime: 100, // More lenient for stress test
          minOpsPerSecond: 10,
          maxMemoryUsage: 10 * 1024 * 1024 // 10MB
        }
      );

      expect(result.passed).toBe(true);
      expect(result.averageTime).toBeLessThan(100);
    });

    it('should maintain performance under rapid changes', async () => {
      const container = TestHelpers.createContainer({ width: 400, height: 300 });
      proteus.container(container, {
        breakpoints: { xs: '200px', sm: '400px', md: '600px', lg: '800px' }
      });

      const result = await runBenchmark(
        'Rapid Container Resizing',
        async () => {
          const sizes = [250, 350, 450, 550, 650, 750];
          for (const size of sizes) {
            await TestHelpers.simulateResize(container, size, 300);
          }
        },
        20,
        {
          maxResponseTime: 50,
          minOpsPerSecond: 20,
          maxMemoryUsage: 1024 * 1024
        }
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle e-commerce grid performance', async () => {
      const result = await runBenchmark(
        'E-commerce Grid Scenario',
        () => {
          const gridContainer = TestHelpers.createContainer({ width: 1200, height: 800 });
          const products = TestHelpers.createGridItems(24, gridContainer); // 24 products
          
          proteus.createGrid(gridContainer, {
            columns: 'auto-fit',
            minColumnWidth: '250px',
            gap: '1rem',
            responsive: true
          });
          
          products.forEach(product => {
            proteus.fluidType(product, { minSize: 14, maxSize: 16 });
          });
          
          gridContainer.remove();
        },
        10,
        {
          maxResponseTime: 30,
          minOpsPerSecond: 30,
          maxMemoryUsage: 2 * 1024 * 1024
        }
      );

      expect(result.passed).toBe(true);
    });

    it('should handle dashboard layout performance', async () => {
      const result = await runBenchmark(
        'Dashboard Layout Scenario',
        () => {
          const dashboard = TestHelpers.createContainer({ width: 1400, height: 900 });
          
          // Create multiple widget containers
          const widgets = Array.from({ length: 8 }, (_, i) => {
            const widget = TestHelpers.createContainer({
              width: 300,
              height: 200,
              className: `widget-${i}`
            });
            dashboard.appendChild(widget);
            return widget;
          });
          
          // Apply ProteusJS features to each widget
          widgets.forEach(widget => {
            proteus.container(widget, {
              breakpoints: { sm: '200px', md: '300px', lg: '400px' }
            });
            
            const content = document.createElement('div');
            content.textContent = 'Widget content';
            widget.appendChild(content);
            
            proteus.fluidType(content, { minSize: 12, maxSize: 16 });
          });
          
          dashboard.remove();
        },
        5,
        {
          maxResponseTime: 50,
          minOpsPerSecond: 20,
          maxMemoryUsage: 3 * 1024 * 1024
        }
      );

      expect(result.passed).toBe(true);
    });
  });

  // Helper function to run benchmarks
  async function runBenchmark(
    name: string,
    operation: () => Promise<void> | void,
    iterations: number,
    budget: PerformanceBudget
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    const initialMemory = getMemoryUsage();
    
    // Warm up
    for (let i = 0; i < 3; i++) {
      await operation();
    }
    
    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await operation();
      const end = performance.now();
      times.push(end - start);
    }
    
    const finalMemory = getMemoryUsage();
    const memoryUsage = finalMemory - initialMemory;
    
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / averageTime;
    
    const passed = 
      averageTime <= budget.maxResponseTime &&
      opsPerSecond >= budget.minOpsPerSecond &&
      memoryUsage <= budget.maxMemoryUsage;
    
    const result: BenchmarkResult = {
      name,
      averageTime,
      minTime,
      maxTime,
      opsPerSecond,
      memoryUsage,
      passed
    };
    
    console.log(`Benchmark: ${name}`, result);
    
    return result;
  }

  function getMemoryUsage(): number {
    return (performance as any).memory?.usedJSHeapSize || 0;
  }
});
