/**
 * Performance Monitor for ProteusJS
 * Tracks and optimizes performance metrics
 */

export interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  responseTime: number;
  observerCount: number;
  eventCount: number;
  lastUpdate: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameRateHistory: number[] = [];
  private responseTimeHistory: number[] = [];
  private isMonitoring: boolean = false;
  private animationFrameId: number | null = null;
  private performanceLevel: 'low' | 'medium' | 'high';

  constructor(performanceLevel: 'low' | 'medium' | 'high' = 'high') {
    this.performanceLevel = performanceLevel;
    this.metrics = {
      frameRate: 0,
      memoryUsage: 0,
      responseTime: 0,
      observerCount: 0,
      eventCount: 0,
      lastUpdate: Date.now()
    };
  }

  /**
   * Start performance monitoring
   */
  public start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.scheduleFrame();
  }

  /**
   * Stop performance monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Record response time for an operation
   */
  public recordResponseTime(startTime: number): void {
    const responseTime = performance.now() - startTime;
    this.responseTimeHistory.push(responseTime);
    
    // Keep only last 100 measurements
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory.shift();
    }
    
    // Calculate average response time
    this.metrics.responseTime = this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
  }

  /**
   * Update observer count
   */
  public updateObserverCount(count: number): void {
    this.metrics.observerCount = count;
  }

  /**
   * Update event count
   */
  public updateEventCount(count: number): void {
    this.metrics.eventCount = count;
  }

  /**
   * Check if performance is within acceptable limits
   */
  public isPerformanceGood(): boolean {
    const targetFrameRate = this.getTargetFrameRate();
    const targetResponseTime = this.getTargetResponseTime();
    
    return this.metrics.frameRate >= targetFrameRate && 
           this.metrics.responseTime <= targetResponseTime;
  }

  /**
   * Get performance recommendations
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.frameRate < this.getTargetFrameRate()) {
      recommendations.push('Frame rate is below target. Consider reducing animation complexity.');
    }
    
    if (this.metrics.responseTime > this.getTargetResponseTime()) {
      recommendations.push('Response time is too high. Consider optimizing calculations.');
    }
    
    if (this.metrics.observerCount > this.getMaxObservers()) {
      recommendations.push('Too many observers active. Consider lazy evaluation.');
    }
    
    if (this.metrics.memoryUsage > this.getMaxMemoryUsage()) {
      recommendations.push('Memory usage is high. Check for memory leaks.');
    }
    
    return recommendations;
  }

  /**
   * Get performance score (0-100)
   */
  public getPerformanceScore(): number {
    const frameRateScore = Math.min(this.metrics.frameRate / this.getTargetFrameRate(), 1) * 30;
    const responseTimeScore = Math.max(1 - (this.metrics.responseTime / this.getTargetResponseTime()), 0) * 30;
    const memoryScore = Math.max(1 - (this.metrics.memoryUsage / this.getMaxMemoryUsage()), 0) * 20;
    const observerScore = Math.max(1 - (this.metrics.observerCount / this.getMaxObservers()), 0) * 20;
    
    return Math.round(frameRateScore + responseTimeScore + memoryScore + observerScore);
  }

  /**
   * Schedule next frame for monitoring
   */
  private scheduleFrame(): void {
    if (!this.isMonitoring) return;
    
    this.animationFrameId = requestAnimationFrame((currentTime) => {
      this.updateFrameRate(currentTime);
      this.updateMemoryUsage();
      this.metrics.lastUpdate = Date.now();
      this.scheduleFrame();
    });
  }

  /**
   * Update frame rate calculation
   */
  private updateFrameRate(currentTime: number): void {
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    if (deltaTime > 0) {
      const currentFrameRate = 1000 / deltaTime;
      this.frameRateHistory.push(currentFrameRate);
      
      // Keep only last 60 measurements (1 second at 60fps)
      if (this.frameRateHistory.length > 60) {
        this.frameRateHistory.shift();
      }
      
      // Calculate average frame rate
      this.metrics.frameRate = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length;
    }
  }

  /**
   * Update memory usage
   */
  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  /**
   * Get target frame rate based on performance level
   */
  private getTargetFrameRate(): number {
    switch (this.performanceLevel) {
      case 'low': return 30;
      case 'medium': return 45;
      case 'high': return 60;
      default: return 60;
    }
  }

  /**
   * Get target response time based on performance level
   */
  private getTargetResponseTime(): number {
    switch (this.performanceLevel) {
      case 'low': return 100; // 100ms
      case 'medium': return 80;  // 80ms
      case 'high': return 60;   // 60ms
      default: return 60;
    }
  }

  /**
   * Get maximum allowed observers
   */
  private getMaxObservers(): number {
    switch (this.performanceLevel) {
      case 'low': return 50;
      case 'medium': return 100;
      case 'high': return 200;
      default: return 200;
    }
  }

  /**
   * Get maximum allowed memory usage (MB)
   */
  private getMaxMemoryUsage(): number {
    switch (this.performanceLevel) {
      case 'low': return 50;
      case 'medium': return 100;
      case 'high': return 200;
      default: return 200;
    }
  }
}
