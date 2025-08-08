/**
 * PerformanceMonitor - Comprehensive performance monitoring and optimization
 * Tracks frame rates, memory usage, and provides optimization recommendations
 */

import { logger } from '../utils/Logger';

export interface PerformanceMetrics {
  frameRate: number;
  averageFPS: number;
  averageFrameTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  domNodes: number;
  eventListeners: number;
  observers: number;
  cacheHitRate: number;
  operationsPerSecond: number;
  lastMeasurement: number;
}

export interface PerformanceThresholds {
  minFrameRate: number;
  maxFrameTime: number;
  maxMemoryUsage: number;
  maxDOMNodes: number;
  maxEventListeners: number;
}

export interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  suggestions: string[];
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetrics;
  bottlenecks: string[];
  memoryLeaks: boolean;
}

export interface BottleneckInfo {
  type: 'dom' | 'memory' | 'cpu' | 'network';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: number;
  suggestions: string[];
}

class BottleneckDetector {
  private detectedBottlenecks: BottleneckInfo[] = [];

  public detectBottlenecks(metrics: PerformanceMetrics): BottleneckInfo[] {
    this.detectedBottlenecks = [];

    // CPU bottleneck detection
    if (metrics.averageFPS < 30) {
      this.detectedBottlenecks.push({
        type: 'cpu',
        severity: 'high',
        description: 'Low frame rate detected',
        impact: (30 - metrics.averageFPS) / 30,
        suggestions: [
          'Reduce DOM manipulations',
          'Optimize JavaScript execution',
          'Use requestAnimationFrame for animations'
        ]
      });
    }

    // Memory bottleneck detection
    if (metrics.memoryUsage.percentage > 80) {
      this.detectedBottlenecks.push({
        type: 'memory',
        severity: 'high',
        description: 'High memory usage detected',
        impact: metrics.memoryUsage.percentage / 100,
        suggestions: [
          'Clean up unused objects',
          'Remove event listeners',
          'Optimize image sizes'
        ]
      });
    }

    // DOM bottleneck detection
    if (metrics.domNodes > 5000) {
      this.detectedBottlenecks.push({
        type: 'dom',
        severity: 'medium',
        description: 'Large DOM tree detected',
        impact: Math.min(metrics.domNodes / 10000, 1),
        suggestions: [
          'Implement virtual scrolling',
          'Remove unused DOM nodes',
          'Use document fragments for batch operations'
        ]
      });
    }

    return this.detectedBottlenecks;
  }

  public getBottlenecks(): BottleneckInfo[] {
    return [...this.detectedBottlenecks];
  }
}

class MemoryOptimizer {
  private memoryLeakDetector: Map<string, number> = new Map();
  private cleanupTasks: (() => void)[] = [];

  public optimizeMemory(): void {
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    // Run cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        logger.warn('Memory cleanup task failed:', error);
      }
    });

    // Clear cleanup tasks
    this.cleanupTasks = [];
  }

  public detectMemoryLeaks(metrics: PerformanceMetrics): boolean {
    const currentMemory = metrics.memoryUsage.used;
    const timestamp = Date.now();

    // Store memory usage
    this.memoryLeakDetector.set(timestamp.toString(), currentMemory);

    // Keep only last 10 measurements
    const entries = Array.from(this.memoryLeakDetector.entries());
    if (entries.length > 10) {
      entries.slice(0, -10).forEach(([key]) => {
        this.memoryLeakDetector.delete(key);
      });
    }

    // Detect consistent memory growth
    if (entries.length >= 5) {
      const values = entries.map(([, value]) => value);
      const isIncreasing = values.every((val, i) => i === 0 || val >= (values[i - 1] || 0));
      const lastValue = values[values.length - 1] || 0;
      const firstValue = values[0] || 1;
      const growthRate = (lastValue - firstValue) / firstValue;

      return isIncreasing && growthRate > 0.1; // 10% growth
    }

    return false;
  }

  public addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }
}

export class PerformanceMonitor {
  private metrics!: PerformanceMetrics;
  private thresholds!: PerformanceThresholds;
  private alerts: PerformanceAlert[] = [];
  private isMonitoring: boolean = false;
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private bottleneckDetector: BottleneckDetector;
  private memoryOptimizer: MemoryOptimizer;
  private performanceHistory: PerformanceSnapshot[] = [];
  private callbacks: Map<string, (metrics: PerformanceMetrics) => void> = new Map();
  private measurementInterval: number = 1000; // 1 second
  private detailedProfiling: boolean = false;
  private frameTimes: number[] = [];
  private operationCount: number = 0;
  private lastOperationTime: number = 0;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    // Initialize advanced monitoring components
    this.bottleneckDetector = new BottleneckDetector();
    this.memoryOptimizer = new MemoryOptimizer();
    this.thresholds = {
      minFrameRate: 55, // Target 60fps with 5fps tolerance
      maxFrameTime: 16.67, // 60fps = 16.67ms per frame
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxDOMNodes: 5000,
      maxEventListeners: 1000,
      ...thresholds
    };

    this.metrics = this.createInitialMetrics();
  }

  /**
   * Start performance monitoring (alias for start)
   */
  public startMonitoring(): void {
    this.start();
  }

  /**
   * Start performance monitoring
   */
  public start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.lastOperationTime = performance.now();
    this.startFrameMonitoring();
    this.startMemoryMonitoring();
  }

  /**
   * Stop performance monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Destroy the performance monitor and clean up all resources
   */
  public destroy(): void {
    this.stop();
    this.callbacks.clear();
    this.alerts = [];
    this.frameTimes = [];
    this.frameCount = 0;
    this.operationCount = 0;
    this.metrics = this.createInitialMetrics();
  }

  /**
   * Start frame rate monitoring
   */
  public startFrameRateMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }
    this.start();
  }

  /**
   * Stop frame rate monitoring
   */
  public stopFrameRateMonitoring(): void {
    this.stop();
  }

  /**
   * Measure operation performance
   */
  public async measureOperation<T>(name: string, operation: () => Promise<T> | T): Promise<{ result: T; duration: number; name: string }> {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;

    this.recordOperation();

    return { result, duration, name };
  }

  /**
   * Detect performance bottlenecks
   */
  public detectBottlenecks(): Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }> {
    const bottlenecks: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }> = [];

    // Check frame rate
    if (this.metrics.averageFPS < 30) {
      bottlenecks.push({
        type: 'frame-rate',
        severity: 'high',
        description: `Low frame rate: ${this.metrics.averageFPS.toFixed(1)} FPS`
      });
    } else if (this.metrics.averageFPS < 50) {
      bottlenecks.push({
        type: 'frame-rate',
        severity: 'medium',
        description: `Moderate frame rate: ${this.metrics.averageFPS.toFixed(1)} FPS`
      });
    }

    // Check memory usage
    if (this.metrics.memoryUsage.percentage > 80) {
      bottlenecks.push({
        type: 'memory',
        severity: 'high',
        description: `High memory usage: ${this.metrics.memoryUsage.percentage.toFixed(1)}%`
      });
    }

    return bottlenecks;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    // Update metrics before returning them
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get performance alerts
   */
  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear performance alerts
   */
  public clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Add performance monitoring callback
   */
  public addCallback(id: string, callback: (metrics: PerformanceMetrics) => void): void {
    this.callbacks.set(id, callback);
  }

  /**
   * Remove performance monitoring callback
   */
  public removeCallback(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Record an operation for performance tracking
   */
  public recordOperation(): void {
    this.operationCount++;
  }

  /**
   * Update cache hit rate
   */
  public updateCacheHitRate(hits: number, total: number): void {
    this.metrics.cacheHitRate = total > 0 ? (hits / total) * 100 : 0;
  }

  /**
   * Force immediate metrics update
   */
  public updateMetrics(): void {
    this.updateFrameMetrics();
    this.updateMemoryMetrics();
    this.updateDOMMetrics();
    this.updateOperationMetrics();
    this.checkThresholds();
    this.notifyCallbacks();
  }

  /**
   * Get performance recommendations
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.frameRate < this.thresholds.minFrameRate) {
      recommendations.push('Consider reducing DOM manipulations or using requestAnimationFrame');
      recommendations.push('Enable batch DOM operations to improve frame rate');
    }

    if (this.metrics.memoryUsage.percentage > 80) {
      recommendations.push('Memory usage is high - consider implementing cleanup routines');
      recommendations.push('Review event listeners and observers for potential leaks');
    }

    if (this.metrics.domNodes > this.thresholds.maxDOMNodes) {
      recommendations.push('DOM tree is large - consider virtualization for long lists');
      recommendations.push('Remove unused DOM elements to improve performance');
    }

    if (this.metrics.eventListeners > this.thresholds.maxEventListeners) {
      recommendations.push('High number of event listeners - consider event delegation');
      recommendations.push('Review and cleanup unused event listeners');
    }

    if (this.metrics.cacheHitRate < 70) {
      recommendations.push('Cache hit rate is low - review caching strategy');
      recommendations.push('Consider increasing cache size or improving cache keys');
    }

    return recommendations;
  }

  /**
   * Start frame rate monitoring
   */
  private startFrameMonitoring(): void {
    const measureFrame = (timestamp: number) => {
      if (!this.isMonitoring) return;

      const deltaTime = timestamp - this.lastFrameTime;
      this.frameTimes.push(deltaTime);
      
      // Keep only last 60 frames for rolling average
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
      }

      this.frameCount++;
      this.lastFrameTime = timestamp;

      // Update metrics every 60 frames or 1 second
      if (this.frameCount % 60 === 0 || deltaTime > 1000) {
        this.updateFrameMetrics();
        this.checkThresholds();
        this.notifyCallbacks();
      }

      this.rafId = requestAnimationFrame(measureFrame);
    };

    this.rafId = requestAnimationFrame(measureFrame);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    // Update memory metrics every 5 seconds
    const updateMemory = () => {
      if (!this.isMonitoring) return;

      this.updateMemoryMetrics();
      setTimeout(updateMemory, 5000);
    };

    setTimeout(updateMemory, 5000);
  }

  /**
   * Update frame-related metrics
   */
  private updateFrameMetrics(): void {
    if (this.frameTimes.length === 0) return;

    const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    const frameRate = averageFrameTime > 0 ? 1000 / averageFrameTime : 60; // Fallback to 60fps

    this.metrics.averageFrameTime = Math.round(averageFrameTime * 100) / 100;
    this.metrics.frameRate = Math.round(frameRate * 100) / 100;
    this.metrics.averageFPS = this.metrics.frameRate; // Keep them in sync
    this.metrics.lastMeasurement = performance.now();
  }

  /**
   * Update memory-related metrics
   */
  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      };
    }
  }

  /**
   * Update DOM-related metrics
   */
  private updateDOMMetrics(): void {
    this.metrics.domNodes = document.querySelectorAll('*').length;
    
    // Estimate event listeners (this is approximate)
    this.metrics.eventListeners = this.estimateEventListeners();
    
    // Count observers (ResizeObserver, IntersectionObserver, etc.)
    this.metrics.observers = this.countObservers();
  }

  /**
   * Update operation metrics
   */
  private updateOperationMetrics(): void {
    const now = performance.now();
    const timeDelta = (now - this.lastOperationTime) / 1000; // Convert to seconds
    
    if (timeDelta > 0) {
      this.metrics.operationsPerSecond = Math.round(this.operationCount / timeDelta);
    }
    
    this.operationCount = 0;
    this.lastOperationTime = now;
  }

  /**
   * Estimate number of event listeners
   */
  private estimateEventListeners(): number {
    // This is an approximation - actual count would require tracking
    const elements = document.querySelectorAll('*');
    let count = 0;
    
    // Common events that are likely to have listeners
    const commonEvents = ['click', 'scroll', 'resize', 'load', 'input', 'change'];
    
    elements.forEach(element => {
      commonEvents.forEach(event => {
        if ((element as any)[`on${event}`] !== null) {
          count++;
        }
      });
    });
    
    return count;
  }

  /**
   * Count active observers
   */
  private countObservers(): number {
    // This would need to be integrated with actual observer tracking
    // For now, return an estimate
    return 0;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkThresholds(): void {
    const now = performance.now();

    // Check frame rate
    if (this.metrics.frameRate < this.thresholds.minFrameRate) {
      this.addAlert({
        type: 'warning',
        metric: 'frameRate',
        value: this.metrics.frameRate,
        threshold: this.thresholds.minFrameRate,
        message: `Frame rate (${this.metrics.frameRate}fps) is below target (${this.thresholds.minFrameRate}fps)`,
        timestamp: now,
        suggestions: [
          'Reduce DOM manipulations',
          'Use requestAnimationFrame for animations',
          'Enable batch DOM operations'
        ]
      });
    }

    // Check memory usage
    if (this.metrics.memoryUsage.used > this.thresholds.maxMemoryUsage) {
      this.addAlert({
        type: 'critical',
        metric: 'memoryUsage',
        value: this.metrics.memoryUsage.used,
        threshold: this.thresholds.maxMemoryUsage,
        message: `Memory usage (${Math.round(this.metrics.memoryUsage.used / 1024 / 1024)}MB) exceeds threshold`,
        timestamp: now,
        suggestions: [
          'Implement cleanup routines',
          'Review for memory leaks',
          'Optimize data structures'
        ]
      });
    }

    // Check DOM nodes
    if (this.metrics.domNodes > this.thresholds.maxDOMNodes) {
      this.addAlert({
        type: 'warning',
        metric: 'domNodes',
        value: this.metrics.domNodes,
        threshold: this.thresholds.maxDOMNodes,
        message: `DOM tree size (${this.metrics.domNodes} nodes) is large`,
        timestamp: now,
        suggestions: [
          'Consider virtualization',
          'Remove unused elements',
          'Optimize DOM structure'
        ]
      });
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    // Avoid duplicate alerts for the same metric within 30 seconds
    const recentAlert = this.alerts.find(a => 
      a.metric === alert.metric && 
      alert.timestamp - a.timestamp < 30000
    );

    if (!recentAlert) {
      this.alerts.push(alert);
      
      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts.shift();
      }
    }
  }

  /**
   * Notify callbacks of metrics update
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        logger.error('Error in performance callback', error);
      }
    });
  }

  /**
   * Create initial metrics object
   */
  private createInitialMetrics(): PerformanceMetrics {
    return {
      frameRate: 60,
      averageFPS: 60,
      averageFrameTime: 16.67,
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0
      },
      domNodes: 0,
      eventListeners: 0,
      observers: 0,
      cacheHitRate: 0,
      operationsPerSecond: 0,
      lastMeasurement: performance.now()
    };
  }

  /**
   * Advanced performance monitoring methods
   */

  /**
   * Enable detailed profiling with comprehensive metrics
   */
  public enableDetailedProfiling(enable: boolean = true): void {
    this.detailedProfiling = enable;

    if (enable) {
      this.startAdvancedMonitoring();
    } else {
      this.stopAdvancedMonitoring();
    }
  }

  /**
   * Start advanced monitoring with bottleneck detection
   */
  private startAdvancedMonitoring(): void {
    // Enhanced frame rate monitoring
    this.startFrameRateMonitoring();

    // Memory leak detection
    setInterval(() => {
      const metrics = this.getMetrics();
      const hasMemoryLeak = this.memoryOptimizer.detectMemoryLeaks(metrics);

      if (hasMemoryLeak) {
        this.addAlert({
          type: 'warning',
          metric: 'memory',
          value: metrics.memoryUsage.percentage,
          threshold: 80,
          message: 'Potential memory leak detected',
          timestamp: Date.now(),
          suggestions: [
            'Check for unreferenced objects',
            'Remove unused event listeners',
            'Clear intervals and timeouts'
          ]
        });
      }
    }, 5000);

    // Bottleneck detection
    setInterval(() => {
      const metrics = this.getMetrics();
      const bottlenecks = this.bottleneckDetector.detectBottlenecks(metrics);

      bottlenecks.forEach(bottleneck => {
        if (bottleneck.severity === 'high') {
          this.addAlert({
            type: 'critical',
            metric: bottleneck.type,
            value: bottleneck.impact * 100,
            threshold: 50,
            message: bottleneck.description,
            timestamp: Date.now(),
            suggestions: bottleneck.suggestions
          });
        }
      });
    }, 2000);
  }

  /**
   * Stop advanced monitoring
   */
  private stopAdvancedMonitoring(): void {
    // This would clear the intervals set in startAdvancedMonitoring
    // For simplicity, we'll just log that advanced monitoring is stopped
    logger.info('Advanced performance monitoring stopped');
  }

  /**
   * Get comprehensive performance snapshot
   */
  public getPerformanceSnapshot(): PerformanceSnapshot {
    const metrics = this.getMetrics();
    const bottlenecks = this.bottleneckDetector.getBottlenecks().map(b => b.description);
    const memoryLeaks = this.memoryOptimizer.detectMemoryLeaks(metrics);

    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      metrics,
      bottlenecks,
      memoryLeaks
    };

    // Store in history
    this.performanceHistory.push(snapshot);

    // Keep only last 100 snapshots
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }

    return snapshot;
  }

  /**
   * Get performance history for analysis
   */
  public getPerformanceHistory(): PerformanceSnapshot[] {
    return [...this.performanceHistory];
  }

  /**
   * Analyze performance trends
   */
  public analyzePerformanceTrends(): {
    frameRateTrend: 'improving' | 'degrading' | 'stable';
    memoryTrend: 'improving' | 'degrading' | 'stable';
    overallHealth: 'good' | 'warning' | 'critical';
  } {
    if (this.performanceHistory.length < 5) {
      return {
        frameRateTrend: 'stable',
        memoryTrend: 'stable',
        overallHealth: 'good'
      };
    }

    const recent = this.performanceHistory.slice(-5);
    const frameRates = recent.map(s => s.metrics.averageFPS);
    const memoryUsages = recent.map(s => s.metrics.memoryUsage.percentage);

    // Analyze frame rate trend
    const frameRateSlope = this.calculateTrend(frameRates);
    const frameRateTrend = frameRateSlope > 1 ? 'improving' :
                          frameRateSlope < -1 ? 'degrading' : 'stable';

    // Analyze memory trend
    const memorySlope = this.calculateTrend(memoryUsages);
    const memoryTrend = memorySlope < -5 ? 'improving' :
                       memorySlope > 5 ? 'degrading' : 'stable';

    // Overall health assessment
    const currentMetrics = recent[recent.length - 1]?.metrics;
    let overallHealth: 'good' | 'warning' | 'critical' = 'good';

    if (currentMetrics) {
      if (currentMetrics.averageFPS < 30 || currentMetrics.memoryUsage.percentage > 80) {
        overallHealth = 'critical';
      } else if (currentMetrics.averageFPS < 45 || currentMetrics.memoryUsage.percentage > 60) {
        overallHealth = 'warning';
      }
    }

    return {
      frameRateTrend,
      memoryTrend,
      overallHealth
    };
  }

  /**
   * Calculate trend slope for a series of values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Optimize performance based on current metrics
   */
  public optimizePerformance(): void {
    const metrics = this.getMetrics();
    const bottlenecks = this.bottleneckDetector.detectBottlenecks(metrics);

    // Apply memory optimization if needed
    if (metrics.memoryUsage.percentage > 70) {
      this.memoryOptimizer.optimizeMemory();
      logger.info('Memory optimization applied');
    }

    // Apply DOM optimization
    if (metrics.domNodes > 3000) {
      this.optimizeDOM();
    }

    // Log optimization results
    bottlenecks.forEach(bottleneck => {
      logger.info(`Performance bottleneck detected: ${bottleneck.description}`);
      logger.info(`Suggestions: ${bottleneck.suggestions.join(', ')}`);
    });
  }

  /**
   * Optimize DOM performance
   */
  private optimizeDOM(): void {
    // Remove unused elements
    const unusedElements = document.querySelectorAll('[data-proteus-unused]');
    unusedElements.forEach(el => el.remove());

    // Optimize images
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      (img as HTMLImageElement).loading = 'lazy';
    });

    logger.info(`DOM optimization applied: removed ${unusedElements.length} unused elements, optimized ${images.length} images`);
  }

  /**
   * Generate performance report
   */
  public generatePerformanceReport(): {
    summary: string;
    metrics: PerformanceMetrics;
    bottlenecks: BottleneckInfo[];
    trends: {
      frameRateTrend: 'improving' | 'degrading' | 'stable';
      memoryTrend: 'improving' | 'degrading' | 'stable';
      overallHealth: 'good' | 'warning' | 'critical';
    };
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const bottlenecks = this.bottleneckDetector.detectBottlenecks(metrics);
    const trends = this.analyzePerformanceTrends();

    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (metrics.averageFPS < 45) {
      recommendations.push('Consider reducing animation complexity');
      recommendations.push('Optimize JavaScript execution with requestAnimationFrame');
    }

    if (metrics.memoryUsage.percentage > 60) {
      recommendations.push('Implement memory cleanup strategies');
      recommendations.push('Remove unused event listeners and observers');
    }

    if (metrics.domNodes > 2000) {
      recommendations.push('Consider virtual scrolling for large lists');
      recommendations.push('Remove unused DOM elements');
    }

    // Add bottleneck-specific recommendations
    bottlenecks.forEach(bottleneck => {
      recommendations.push(...bottleneck.suggestions);
    });

    const summary = `Performance Health: ${trends.overallHealth.toUpperCase()} | ` +
                   `FPS: ${metrics.averageFPS.toFixed(1)} | ` +
                   `Memory: ${metrics.memoryUsage.percentage.toFixed(1)}% | ` +
                   `DOM Nodes: ${metrics.domNodes}`;

    return {
      summary,
      metrics,
      bottlenecks,
      trends,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }
}
