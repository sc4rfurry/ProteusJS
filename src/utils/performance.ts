/**
 * Performance utilities for ProteusJS
 * Provides timing, measurement, and optimization tools
 */

export interface TimingMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceBudget {
  responseTime: number; // Maximum response time in ms
  frameRate: number;    // Minimum frame rate
  memoryUsage: number;  // Maximum memory usage in MB
}

export class PerformanceTracker {
  private marks: Map<string, TimingMark> = new Map();
  private measurements: TimingMark[] = [];
  private budget: PerformanceBudget;
  private warningThreshold: number = 0.8; // 80% of budget

  constructor(budget?: Partial<PerformanceBudget>) {
    this.budget = {
      responseTime: 60,  // 60ms default
      frameRate: 60,     // 60fps default
      memoryUsage: 100,  // 100MB default
      ...budget
    };
  }

  /**
   * Start timing a performance mark
   */
  public mark(name: string, metadata?: Record<string, unknown>): void {
    const mark: TimingMark = {
      name,
      startTime: performance.now(),
      ...(metadata && { metadata })
    };
    
    this.marks.set(name, mark);
    
    // Use Performance API if available
    if (typeof performance.mark === 'function') {
      performance.mark(`proteus-${name}-start`);
    }
  }

  /**
   * End timing a performance mark
   */
  public measure(name: string): TimingMark | null {
    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`ProteusJS: Performance mark "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - mark.startTime;
    
    const measurement: TimingMark = {
      ...mark,
      endTime,
      duration
    };

    this.measurements.push(measurement);
    this.marks.delete(name);

    // Use Performance API if available
    if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
      performance.mark(`proteus-${name}-end`);
      performance.measure(`proteus-${name}`, `proteus-${name}-start`, `proteus-${name}-end`);
    }

    // Check against budget
    this.checkBudget(measurement);

    return measurement;
  }

  /**
   * Get all measurements
   */
  public getMeasurements(): TimingMark[] {
    return [...this.measurements];
  }

  /**
   * Get measurements by name pattern
   */
  public getMeasurementsByPattern(pattern: RegExp): TimingMark[] {
    return this.measurements.filter(m => pattern.test(m.name));
  }

  /**
   * Get average duration for measurements with the same name
   */
  public getAverageDuration(name: string): number {
    const matching = this.measurements.filter(m => m.name === name && m.duration !== undefined);
    if (matching.length === 0) return 0;
    
    const total = matching.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / matching.length;
  }

  /**
   * Get performance statistics
   */
  public getStats(): Record<string, unknown> {
    const stats: Record<string, unknown> = {
      totalMeasurements: this.measurements.length,
      activeMeasurements: this.marks.size,
      budget: this.budget,
      violations: this.getBudgetViolations()
    };

    // Group by name
    const byName: Record<string, { count: number; avgDuration: number; maxDuration: number }> = {};
    
    this.measurements.forEach(m => {
      if (m.duration === undefined) return;
      
      if (!byName[m.name]) {
        byName[m.name] = { count: 0, avgDuration: 0, maxDuration: 0 };
      }
      
      byName[m.name]!.count++;
      byName[m.name]!.maxDuration = Math.max(byName[m.name]!.maxDuration, m.duration);
    });

    // Calculate averages
    Object.keys(byName).forEach(name => {
      byName[name]!.avgDuration = this.getAverageDuration(name);
    });

    stats['byName'] = byName;
    return stats;
  }

  /**
   * Clear all measurements
   */
  public clear(): void {
    this.measurements.length = 0;
    this.marks.clear();
  }

  /**
   * Update performance budget
   */
  public updateBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  /**
   * Check measurement against budget
   */
  private checkBudget(measurement: TimingMark): void {
    if (measurement.duration === undefined) return;

    const warningThreshold = this.budget.responseTime * this.warningThreshold;
    const errorThreshold = this.budget.responseTime;

    if (measurement.duration > errorThreshold) {
      console.error(
        `ProteusJS: Performance budget exceeded for "${measurement.name}": ${measurement.duration.toFixed(2)}ms > ${errorThreshold}ms`
      );
    } else if (measurement.duration > warningThreshold) {
      console.warn(
        `ProteusJS: Performance warning for "${measurement.name}": ${measurement.duration.toFixed(2)}ms > ${warningThreshold.toFixed(2)}ms`
      );
    }
  }

  /**
   * Get budget violations
   */
  private getBudgetViolations(): TimingMark[] {
    return this.measurements.filter(m => 
      m.duration !== undefined && m.duration > this.budget.responseTime
    );
  }
}

/**
 * Global performance tracker instance
 */
export const performanceTracker = new PerformanceTracker();

/**
 * Decorator for automatic performance tracking
 */
export function trackPerformance(name?: string): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const trackingName = name || `${(target as { constructor: { name: string } }).constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: unknown[]): unknown {
      performanceTracker.mark(trackingName);
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle async methods
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            performanceTracker.measure(trackingName);
          });
        }
        
        performanceTracker.measure(trackingName);
        return result;
      } catch (error) {
        performanceTracker.measure(trackingName);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Measure function execution time
 */
export function measureTime<T extends (...args: unknown[]) => unknown>(
  func: T,
  name?: string
): T {
  const measureName = name || func.name || 'anonymous';

  return ((...args: unknown[]) => {
    performanceTracker.mark(measureName);
    
    try {
      const result = func(...args);
      
      // Handle async functions
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        return (result as Promise<unknown>).finally(() => {
          performanceTracker.measure(measureName);
        });
      }
      
      performanceTracker.measure(measureName);
      return result;
    } catch (error) {
      performanceTracker.measure(measureName);
      throw error;
    }
  }) as T;
}

/**
 * Create a performance-aware wrapper for frequently called functions
 */
export function createPerformanceWrapper<T extends (...args: unknown[]) => unknown>(
  func: T,
  options: {
    name?: string;
    sampleRate?: number; // 0-1, percentage of calls to measure
    budget?: number; // ms
  } = {}
): T {
  const { name = func.name || 'wrapped', sampleRate = 0.1, budget = 16 } = options;
  let callCount = 0;
  let totalTime = 0;
  let maxTime = 0;

  return ((...args: unknown[]) => {
    callCount++;
    const shouldMeasure = Math.random() < sampleRate;
    
    if (shouldMeasure) {
      const startTime = performance.now();
      
      try {
        const result = func(...args);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        totalTime += duration;
        maxTime = Math.max(maxTime, duration);
        
        if (duration > budget) {
          console.warn(
            `ProteusJS: Performance budget exceeded in ${name}: ${duration.toFixed(2)}ms > ${budget}ms`
          );
        }
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        totalTime += duration;
        maxTime = Math.max(maxTime, duration);
        throw error;
      }
    } else {
      return func(...args);
    }
  }) as T;
}

/**
 * Get browser performance information
 */
export function getBrowserPerformanceInfo(): object {
  const info: any = {
    timing: {},
    memory: {},
    navigation: {}
  };

  // Navigation timing (using modern API)
  try {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0]!;
      info.timing = {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        domInteractive: nav.domInteractive - nav.fetchStart
      };
    }
  } catch (error) {
    // Modern browsers should support performance.getEntriesByType
    // If not available, we'll just skip the timing information
    console.warn('ProteusJS: Performance timing API not available', error);
  }

  // Memory info
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    info.memory = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }

  // Navigation info (using modern API)
  try {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0]!;
      info.navigation = {
        type: nav.type === 'navigate' ? 0 : nav.type === 'reload' ? 1 : nav.type === 'back_forward' ? 2 : 255,
        redirectCount: nav.redirectCount || 0
      };
    }
  } catch (error) {
    // Fallback for older browsers (deprecated APIs)
    const perfAny = performance as any;
    if (perfAny.navigation) {
      info.navigation = {
        type: perfAny.navigation.type,
        redirectCount: perfAny.navigation.redirectCount
      };
    }
  }

  return info;
}
