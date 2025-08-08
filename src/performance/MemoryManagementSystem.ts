/**
 * Memory Management System for ProteusJS
 * Automatic observer cleanup, event listener lifecycle management, and memory optimization
 */

export interface MemoryConfig {
  autoCleanup: boolean;
  cleanupInterval: number;
  memoryThreshold: number;
  gcOptimization: boolean;
  leakDetection: boolean;
  performanceMonitoring: boolean;
}

export interface MemoryMetrics {
  totalObservers: number;
  activeObservers: number;
  totalEventListeners: number;
  activeEventListeners: number;
  memoryUsage: number;
  gcCollections: number;
  leaksDetected: number;
  cleanupOperations: number;
}

export interface ManagedResource {
  id: string;
  type: 'observer' | 'listener' | 'timer' | 'animation' | 'cache';
  element?: Element;
  cleanup: () => void;
  timestamp: number;
  lastAccessed: number;
  memorySize: number;
}

export class MemoryManagementSystem {
  private config: Required<MemoryConfig>;
  private resources: Map<string, ManagedResource> = new Map();
  private metrics: MemoryMetrics;
  private cleanupTimer: number | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private weakRefs: Set<WeakRef<any>> = new Set();

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      autoCleanup: true,
      cleanupInterval: 30000, // 30 seconds
      memoryThreshold: 50 * 1024 * 1024, // 50MB
      gcOptimization: true,
      leakDetection: true,
      performanceMonitoring: true,
      ...config
    };

    this.metrics = this.createInitialMetrics();
    this.setupMemoryMonitoring();
    this.startAutoCleanup();
  }

  /**
   * Register a managed resource
   */
  public register(
    type: ManagedResource['type'],
    cleanup: () => void,
    element?: Element,
    estimatedSize: number = 1024
  ): string {
    const id = this.generateResourceId();
    const resource: ManagedResource = {
      id,
      type,
      ...(element && { element }),
      cleanup,
      timestamp: performance.now(),
      lastAccessed: performance.now(),
      memorySize: estimatedSize
    };

    this.resources.set(id, resource);
    this.updateMetrics(type, 'register');

    // Create weak reference for leak detection
    if (element && this.config.leakDetection) {
      this.weakRefs.add(new WeakRef(element));
    }

    return id;
  }

  /**
   * Unregister and cleanup a resource
   */
  public unregister(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      try {
        resource.cleanup();
        this.updateMetrics(resource.type, 'unregister');
      } catch (error) {
        console.error('Error during resource cleanup:', error);
      }
      
      this.resources.delete(id);
      this.metrics.cleanupOperations++;
    }
  }

  /**
   * Register ResizeObserver with automatic cleanup
   */
  public registerResizeObserver(
    observer: ResizeObserver,
    elements: Element[]
  ): string {
    return this.register(
      'observer',
      () => {
        observer.disconnect();
      },
      elements[0],
      elements.length * 512 // Estimate memory per observed element
    );
  }

  /**
   * Register IntersectionObserver with automatic cleanup
   */
  public registerIntersectionObserver(
    observer: IntersectionObserver,
    elements: Element[]
  ): string {
    return this.register(
      'observer',
      () => {
        observer.disconnect();
      },
      elements[0],
      elements.length * 256
    );
  }

  /**
   * Register event listener with automatic cleanup
   */
  public registerEventListener(
    element: Element,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): string {
    return this.register(
      'listener',
      () => {
        element.removeEventListener(event, listener, options);
      },
      element,
      128 // Estimate memory per listener
    );
  }

  /**
   * Register timer with automatic cleanup
   */
  public registerTimer(timerId: number, type: 'timeout' | 'interval' = 'timeout'): string {
    return this.register(
      'timer',
      () => {
        if (type === 'timeout') {
          clearTimeout(timerId);
        } else {
          clearInterval(timerId);
        }
      },
      undefined,
      64
    );
  }

  /**
   * Register animation with automatic cleanup
   */
  public registerAnimation(animation: Animation): string {
    return this.register(
      'animation',
      () => {
        animation.cancel();
      },
      (animation.effect as any)?.target instanceof Element ? (animation.effect as any).target : undefined,
      256
    );
  }

  /**
   * Register cache entry with automatic cleanup
   */
  public registerCacheEntry(
    cache: Map<any, any> | WeakMap<any, any>,
    key: any,
    estimatedSize: number = 1024
  ): string {
    return this.register(
      'cache',
      () => {
        cache.delete(key);
      },
      undefined,
      estimatedSize
    );
  }

  /**
   * Force cleanup of all resources
   */
  public cleanup(): void {
    const resourceIds = Array.from(this.resources.keys());
    resourceIds.forEach(id => this.unregister(id));
  }

  /**
   * Cleanup resources by type
   */
  public cleanupByType(type: ManagedResource['type']): void {
    const resourceIds = Array.from(this.resources.entries())
      .filter(([, resource]) => resource.type === type)
      .map(([id]) => id);
    
    resourceIds.forEach(id => this.unregister(id));
  }

  /**
   * Cleanup stale resources
   */
  public cleanupStale(maxAge: number = 300000): void { // 5 minutes default
    const now = performance.now();
    const staleIds = Array.from(this.resources.entries())
      .filter(([, resource]) => now - resource.lastAccessed > maxAge)
      .map(([id]) => id);
    
    staleIds.forEach(id => this.unregister(id));
  }

  /**
   * Cleanup resources for removed elements
   */
  public cleanupOrphanedResources(): void {
    const orphanedIds: string[] = [];
    
    this.resources.forEach((resource, id) => {
      if (resource.element && !document.contains(resource.element)) {
        orphanedIds.push(id);
      }
    });
    
    orphanedIds.forEach(id => this.unregister(id));
  }

  /**
   * Get current memory metrics
   */
  public getMetrics(): MemoryMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Get resource count by type
   */
  public getResourceCount(type?: ManagedResource['type']): number {
    if (!type) {
      return this.resources.size;
    }
    
    return Array.from(this.resources.values())
      .filter(resource => resource.type === type).length;
  }

  /**
   * Check for memory leaks
   */
  public detectLeaks(): string[] {
    const leaks: string[] = [];
    
    // Check for orphaned weak references
    this.weakRefs.forEach(weakRef => {
      if (weakRef.deref() === undefined) {
        // Element was garbage collected but we might still have resources
        this.cleanupOrphanedResources();
      }
    });
    
    // Check for excessive resource accumulation
    const resourceCounts = new Map<string, number>();
    this.resources.forEach(resource => {
      const count = resourceCounts.get(resource.type) || 0;
      resourceCounts.set(resource.type, count + 1);
    });
    
    resourceCounts.forEach((count, type) => {
      const threshold = this.getThresholdForType(type);
      if (count > threshold) {
        leaks.push(`Excessive ${type} resources: ${count} (threshold: ${threshold})`);
      }
    });
    
    this.metrics.leaksDetected = leaks.length;
    return leaks;
  }

  /**
   * Optimize garbage collection
   */
  public optimizeGC(): void {
    if (!this.config.gcOptimization) return;
    
    // Force cleanup of stale resources
    this.cleanupStale();
    
    // Clear weak references to collected objects
    const validWeakRefs = new Set<WeakRef<any>>();
    this.weakRefs.forEach(weakRef => {
      if (weakRef.deref() !== undefined) {
        validWeakRefs.add(weakRef);
      }
    });
    this.weakRefs = validWeakRefs;
    
    // Suggest garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
      this.metrics.gcCollections++;
    }
  }

  /**
   * Destroy memory management system
   */
  public destroy(): void {
    this.stopAutoCleanup();
    this.stopMemoryMonitoring();
    this.cleanup();
    this.weakRefs.clear();
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if (!this.config.performanceMonitoring) return;
    
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        this.updateMemoryUsage();
        this.checkMemoryThreshold();
      }, 5000);
    }
    
    // Monitor performance entries
    if (window.PerformanceObserver) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure' && entry.name.includes('proteus')) {
              // Track ProteusJS-related performance measures
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('PerformanceObserver not fully supported:', error);
      }
    }
  }

  /**
   * Start automatic cleanup
   */
  private startAutoCleanup(): void {
    if (!this.config.autoCleanup) return;
    
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupStale();
      this.cleanupOrphanedResources();
      this.detectLeaks();
      
      if (this.config.gcOptimization) {
        this.optimizeGC();
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize || 0;
    }
  }

  /**
   * Check memory threshold and trigger cleanup if needed
   */
  private checkMemoryThreshold(): void {
    if (this.metrics.memoryUsage > this.config.memoryThreshold) {
      console.warn('Memory threshold exceeded, triggering cleanup');
      this.cleanupStale(60000); // Cleanup resources older than 1 minute
      this.optimizeGC();
    }
  }

  /**
   * Update metrics for resource operations
   */
  private updateMetrics(type: ManagedResource['type'], operation: 'register' | 'unregister'): void {
    switch (type) {
      case 'observer':
        if (operation === 'register') {
          this.metrics.totalObservers++;
          this.metrics.activeObservers++;
        } else {
          this.metrics.activeObservers--;
        }
        break;
      case 'listener':
        if (operation === 'register') {
          this.metrics.totalEventListeners++;
          this.metrics.activeEventListeners++;
        } else {
          this.metrics.activeEventListeners--;
        }
        break;
    }
  }

  /**
   * Get threshold for resource type
   */
  private getThresholdForType(type: string): number {
    const thresholds: Record<string, number> = {
      observer: 100,
      listener: 500,
      timer: 50,
      animation: 20,
      cache: 1000
    };

    return thresholds[type] || 100;
  }

  /**
   * Generate unique resource ID
   */
  private generateResourceId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): MemoryMetrics {
    return {
      totalObservers: 0,
      activeObservers: 0,
      totalEventListeners: 0,
      activeEventListeners: 0,
      memoryUsage: 0,
      gcCollections: 0,
      leaksDetected: 0,
      cleanupOperations: 0
    };
  }
}
