/**
 * Performance Profiler for ProteusJS
 * Real-time performance monitoring with bottleneck detection and optimization suggestions
 */

export interface ProfilerConfig {
  enableRealTimeMonitoring: boolean;
  frameRateTarget: number;
  memoryThreshold: number;
  enableBottleneckDetection: boolean;
  enableOptimizationSuggestions: boolean;
  reportingInterval: number;
}

export interface PerformanceReport {
  timestamp: number;
  frameRate: FrameRateMetrics;
  memory: MemoryMetrics;
  timing: TimingMetrics;
  bottlenecks: Bottleneck[];
  suggestions: OptimizationSuggestion[];
  score: number;
}

export interface FrameRateMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  droppedFrames: number;
  jankEvents: number;
}

export interface MemoryMetrics {
  used: number;
  total: number;
  peak: number;
  leaks: MemoryLeak[];
  gcEvents: number;
}

export interface TimingMetrics {
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface Bottleneck {
  type: 'layout' | 'paint' | 'script' | 'memory' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element?: Element;
  impact: number;
  timestamp: number;
}

export interface OptimizationSuggestion {
  category: 'performance' | 'memory' | 'accessibility' | 'best-practice';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  implementation: string;
  estimatedImpact: number;
}

export interface MemoryLeak {
  type: 'listener' | 'observer' | 'timer' | 'reference';
  element?: Element;
  description: string;
  size: number;
}

export class PerformanceProfiler {
  private config: Required<ProfilerConfig>;
  private isActive: boolean = false;
  private frameRateMonitor: FrameRateMonitor;
  private memoryMonitor: MemoryMonitor;
  private timingMonitor: TimingMonitor;
  private bottleneckDetector: BottleneckDetector;
  private optimizationEngine: OptimizationEngine;
  private reportHistory: PerformanceReport[] = [];

  constructor(config: Partial<ProfilerConfig> = {}) {
    this.config = {
      enableRealTimeMonitoring: true,
      frameRateTarget: 60,
      memoryThreshold: 100 * 1024 * 1024, // 100MB
      enableBottleneckDetection: true,
      enableOptimizationSuggestions: true,
      reportingInterval: 5000, // 5 seconds
      ...config
    };

    this.frameRateMonitor = new FrameRateMonitor(this.config.frameRateTarget);
    this.memoryMonitor = new MemoryMonitor(this.config.memoryThreshold);
    this.timingMonitor = new TimingMonitor();
    this.bottleneckDetector = new BottleneckDetector();
    this.optimizationEngine = new OptimizationEngine();
  }

  /**
   * Start performance profiling
   */
  public start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.frameRateMonitor.start();
    this.memoryMonitor.start();
    this.timingMonitor.start();

    if (this.config.enableBottleneckDetection) {
      this.bottleneckDetector.start();
    }

    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeReporting();
    }

    console.log('🔍 ProteusJS Performance Profiler Started');
  }

  /**
   * Stop performance profiling
   */
  public stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.frameRateMonitor.stop();
    this.memoryMonitor.stop();
    this.timingMonitor.stop();
    this.bottleneckDetector.stop();

    console.log('🔍 ProteusJS Performance Profiler Stopped');
  }

  /**
   * Generate performance report
   */
  public generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      frameRate: this.frameRateMonitor.getMetrics(),
      memory: this.memoryMonitor.getMetrics(),
      timing: this.timingMonitor.getMetrics(),
      bottlenecks: this.bottleneckDetector.getBottlenecks(),
      suggestions: this.optimizationEngine.getSuggestions(),
      score: this.calculatePerformanceScore()
    };

    this.reportHistory.push(report);
    
    // Keep only last 10 reports
    if (this.reportHistory.length > 10) {
      this.reportHistory.shift();
    }

    return report;
  }

  /**
   * Get optimization suggestions
   */
  public getOptimizationSuggestions(): OptimizationSuggestion[] {
    return this.optimizationEngine.getSuggestions();
  }

  /**
   * Start frame rate monitoring (alias for start)
   */
  public startFrameRateMonitoring(): void {
    this.start();
  }

  /**
   * Measure operation performance
   */
  public async measureOperation<T>(name: string, operation: () => T | Promise<T>): Promise<{ result: T; duration: number; name: string }> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        result,
        duration,
        name
      };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Still return timing info even if operation failed
      throw {
        error,
        duration,
        name
      };
    }
  }

  /**
   * Detect performance bottlenecks
   */
  public detectBottlenecks(): Bottleneck[] {
    return this.bottleneckDetector.getBottlenecks();
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stop();
    this.reportHistory = [];
  }

  /**
   * Export detailed performance data
   */
  public exportData(): string {
    const data = {
      config: this.config,
      reports: this.reportHistory,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    const frameRate = this.frameRateMonitor.getMetrics();
    const memory = this.memoryMonitor.getMetrics();
    const timing = this.timingMonitor.getMetrics();
    const bottlenecks = this.bottleneckDetector.getBottlenecks();

    let score = 100;

    // Frame rate impact (40% of score)
    const frameRateRatio = frameRate.average / this.config.frameRateTarget;
    score -= (1 - Math.min(frameRateRatio, 1)) * 40;

    // Memory impact (20% of score)
    const memoryRatio = memory.used / this.config.memoryThreshold;
    score -= Math.max(0, memoryRatio - 0.8) * 20;

    // Timing impact (20% of score)
    if (timing.largestContentfulPaint > 2500) score -= 10;
    if (timing.cumulativeLayoutShift > 0.1) score -= 10;

    // Bottlenecks impact (20% of score)
    bottlenecks.forEach(bottleneck => {
      const impact = {
        low: 1,
        medium: 3,
        high: 5,
        critical: 10
      }[bottleneck.severity];
      score -= impact;
    });

    return Math.max(0, Math.round(score));
  }

  /**
   * Start real-time reporting
   */
  private startRealTimeReporting(): void {
    setInterval(() => {
      if (this.isActive) {
        const report = this.generateReport();
        this.emitPerformanceUpdate(report);
      }
    }, this.config.reportingInterval);
  }

  /**
   * Emit performance update event
   */
  private emitPerformanceUpdate(report: PerformanceReport): void {
    const event = new CustomEvent('proteus:performance-update', {
      detail: report
    });
    document.dispatchEvent(event);
  }
}

/**
 * Frame Rate Monitor
 */
class FrameRateMonitor {
  private target: number;
  private frames: number[] = [];
  private lastTime: number = 0;
  private rafId: number | null = null;

  constructor(target: number) {
    this.target = target;
  }

  start(): void {
    this.lastTime = performance.now();
    this.tick();
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getMetrics(): FrameRateMetrics {
    const current = this.frames.length > 0 ? this.frames[this.frames.length - 1]! : 0;
    const average = this.frames.length > 0 ? 
      this.frames.reduce((a, b) => a + b, 0) / this.frames.length : 0;
    const min = this.frames.length > 0 ? Math.min(...this.frames) : 0;
    const max = this.frames.length > 0 ? Math.max(...this.frames) : 0;
    const droppedFrames = this.frames.filter(fps => fps < this.target * 0.9).length;
    const jankEvents = this.frames.filter(fps => fps < this.target * 0.5).length;

    return { current, average, min, max, droppedFrames, jankEvents };
  }

  private tick = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    const fps = 1000 / deltaTime;

    this.frames.push(fps);
    
    // Keep only last 60 frames
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    this.lastTime = currentTime;
    this.rafId = requestAnimationFrame(this.tick);
  };
}

/**
 * Memory Monitor
 */
class MemoryMonitor {
  private threshold: number;
  private samples: number[] = [];

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  start(): void {
    setInterval(() => {
      this.takeSample();
    }, 1000);
  }

  stop(): void {
    // Cleanup if needed
  }

  getMetrics(): MemoryMetrics {
    const current = this.getCurrentMemoryUsage();
    const peak = this.samples.length > 0 ? Math.max(...this.samples) : 0;
    const leaks = this.detectMemoryLeaks();

    return {
      used: current,
      total: this.threshold,
      peak,
      leaks,
      gcEvents: 0 // Would need to be tracked separately
    };
  }

  private takeSample(): void {
    const usage = this.getCurrentMemoryUsage();
    this.samples.push(usage);
    
    // Keep only last 60 samples
    if (this.samples.length > 60) {
      this.samples.shift();
    }
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    
    // Check for excessive event listeners
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const listeners = (element as any)._listeners;
      if (listeners && Object.keys(listeners).length > 10) {
        leaks.push({
          type: 'listener',
          element,
          description: `Element has ${Object.keys(listeners).length} event listeners`,
          size: Object.keys(listeners).length * 100 // Estimate
        });
      }
    });

    return leaks;
  }
}

/**
 * Timing Monitor
 */
class TimingMonitor {
  start(): void {
    // Monitor performance timing
  }

  stop(): void {
    // Cleanup
  }

  getMetrics(): TimingMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: 0, // Would need LCP observer
      cumulativeLayoutShift: 0, // Would need CLS observer
      firstInputDelay: 0 // Would need FID observer
    };
  }
}

/**
 * Bottleneck Detector
 */
class BottleneckDetector {
  private bottlenecks: Bottleneck[] = [];

  start(): void {
    this.detectLayoutBottlenecks();
    this.detectScriptBottlenecks();
    this.detectMemoryBottlenecks();
  }

  stop(): void {
    // Cleanup
  }

  getBottlenecks(): Bottleneck[] {
    return [...this.bottlenecks];
  }

  private detectLayoutBottlenecks(): void {
    // Detect elements that cause layout thrashing
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      
      if (styles.position === 'fixed' && styles.transform !== 'none') {
        this.bottlenecks.push({
          type: 'layout',
          severity: 'medium',
          description: 'Fixed positioned element with transform may cause performance issues',
          element,
          impact: 3,
          timestamp: Date.now()
        });
      }
    });
  }

  private detectScriptBottlenecks(): void {
    // Detect long-running scripts
    const longTasks = performance.getEntriesByType('longtask');
    longTasks.forEach(task => {
      const duration = task.duration || 0;
      if (duration > 50) {
        this.bottlenecks.push({
          type: 'script',
          severity: duration > 100 ? 'high' : 'medium',
          description: `Long task detected: ${duration.toFixed(2)}ms`,
          impact: Math.round(duration / 10),
          timestamp: Date.now()
        });
      }
    });
  }

  private detectMemoryBottlenecks(): void {
    // Detect memory-intensive operations
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usage > 0.8) {
        this.bottlenecks.push({
          type: 'memory',
          severity: usage > 0.9 ? 'critical' : 'high',
          description: `High memory usage: ${(usage * 100).toFixed(1)}%`,
          impact: Math.round(usage * 10),
          timestamp: Date.now()
        });
      }
    }
  }
}

/**
 * Optimization Engine
 */
class OptimizationEngine {
  getSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze current performance and suggest optimizations
    suggestions.push({
      category: 'performance',
      priority: 'high',
      title: 'Enable will-change for animated elements',
      description: 'Add will-change CSS property to elements that will be animated',
      implementation: 'element.style.willChange = "transform";',
      estimatedImpact: 15
    });

    suggestions.push({
      category: 'memory',
      priority: 'medium',
      title: 'Implement lazy loading for images',
      description: 'Add loading="lazy" to images below the fold',
      implementation: 'img.setAttribute("loading", "lazy");',
      estimatedImpact: 10
    });

    suggestions.push({
      category: 'accessibility',
      priority: 'high',
      title: 'Add missing ARIA labels',
      description: 'Ensure all interactive elements have proper ARIA labels',
      implementation: 'button.setAttribute("aria-label", "Description");',
      estimatedImpact: 5
    });

    return suggestions;
  }
}
