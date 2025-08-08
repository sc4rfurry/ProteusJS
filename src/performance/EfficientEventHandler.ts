/**
 * Efficient Resizing & Event Handling for ProteusJS
 * Debounced resize events with RAF timing, batch DOM operations, and 60fps performance
 */

export interface EventHandlerConfig {
  debounceDelay: number;
  throttleDelay: number;
  useRAF: boolean;
  batchOperations: boolean;
  passiveListeners: boolean;
  intersectionBased: boolean;
  performanceTarget: number; // Target frame time in ms (16.67ms for 60fps)
  maxBatchSize: number;
  priorityLevels: ('high' | 'normal' | 'low')[];
}

export interface EventOperation {
  id: string;
  element: Element;
  callback: () => void;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  cost: number; // Estimated execution cost in ms
}

export interface PerformanceMetrics {
  frameTime: number;
  fps: number;
  operationsPerFrame: number;
  queueSize: number;
  droppedFrames: number;
  averageLatency: number;
}

export class EfficientEventHandler {
  private config: Required<EventHandlerConfig>;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private operationQueue: Map<string, EventOperation> = new Map();
  private batchQueue: EventOperation[] = [];
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private metrics: PerformanceMetrics;
  private isProcessing: boolean = false;
  private visibleElements: Set<Element> = new Set();

  // Debounce and throttle timers
  private debounceTimers: Map<string, number> = new Map();
  private throttleTimers: Map<string, number> = new Map();
  private lastThrottleTime: Map<string, number> = new Map();

  constructor(config: Partial<EventHandlerConfig> = {}) {
    this.config = {
      debounceDelay: 16, // ~1 frame at 60fps
      throttleDelay: 16,
      useRAF: true,
      batchOperations: true,
      passiveListeners: true,
      intersectionBased: true,
      performanceTarget: 16.67, // 60fps target
      maxBatchSize: 10,
      priorityLevels: ['high', 'normal', 'low'],
      ...config
    };

    this.metrics = this.createInitialMetrics();
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize the efficient event handling system
   */
  public initialize(): void {
    this.setupResizeObserver();
    this.setupIntersectionObserver();
    this.startProcessingLoop();
  }

  /**
   * Clean up and destroy the event handler
   */
  public destroy(): void {
    this.stopProcessingLoop();
    this.cleanupObservers();
    this.clearQueues();
  }

  /**
   * Register element for efficient resize handling
   */
  public observeResize(
    element: Element, 
    callback: (entry: ResizeObserverEntry) => void,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string {
    const operationId = this.generateOperationId('resize', element);
    
    // Wrap callback for batching
    const wrappedCallback = () => {
      if (this.resizeObserver) {
        // Get the latest resize entry for this element
        const rect = element.getBoundingClientRect();
        const entry = {
          target: element,
          contentRect: rect,
          borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
          contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
          devicePixelContentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }]
        } as ResizeObserverEntry;
        
        callback(entry);
      }
    };

    // Add to operation queue
    this.addOperation({
      id: operationId,
      element,
      callback: wrappedCallback,
      priority,
      timestamp: performance.now(),
      cost: this.estimateOperationCost('resize')
    });

    // Start observing with ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.observe(element);
    }

    return operationId;
  }

  /**
   * Register element for intersection-based activation
   */
  public observeIntersection(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    _options: IntersectionObserverInit = {}
  ): string {
    const operationId = this.generateOperationId('intersection', element);

    // Wrap callback for batching
    const wrappedCallback = () => {
      const rect = element.getBoundingClientRect();
      const rootBounds = document.documentElement.getBoundingClientRect();
      
      const entry = {
        target: element,
        boundingClientRect: rect,
        rootBounds,
        intersectionRect: rect,
        intersectionRatio: this.calculateIntersectionRatio(rect, rootBounds),
        isIntersecting: this.isElementIntersecting(rect, rootBounds),
        time: performance.now()
      } as IntersectionObserverEntry;

      callback(entry);
    };

    this.addOperation({
      id: operationId,
      element,
      callback: wrappedCallback,
      priority: 'normal',
      timestamp: performance.now(),
      cost: this.estimateOperationCost('intersection')
    });

    // Start observing with IntersectionObserver
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }

    return operationId;
  }

  /**
   * Add debounced event listener
   */
  public addDebouncedListener(
    element: Element,
    event: string,
    callback: (event: Event) => void,
    delay?: number
  ): string {
    const operationId = this.generateOperationId(event, element);
    const debounceDelay = delay || this.config.debounceDelay;

    const debouncedCallback = (event: Event) => {
      this.debounce(operationId, () => {
        this.addOperation({
          id: `${operationId}-${Date.now()}`,
          element,
          callback: () => callback(event),
          priority: 'normal',
          timestamp: performance.now(),
          cost: this.estimateOperationCost(event.type)
        });
      }, debounceDelay);
    };

    const options = this.config.passiveListeners ? { passive: true } : false;
    element.addEventListener(event, debouncedCallback, options);

    return operationId;
  }

  /**
   * Add throttled event listener
   */
  public addThrottledListener(
    element: Element,
    event: string,
    callback: (event: Event) => void,
    delay?: number
  ): string {
    const operationId = this.generateOperationId(event, element);
    const throttleDelay = delay || this.config.throttleDelay;

    const throttledCallback = (event: Event) => {
      this.throttle(operationId, () => {
        this.addOperation({
          id: `${operationId}-${Date.now()}`,
          element,
          callback: () => callback(event),
          priority: 'normal',
          timestamp: performance.now(),
          cost: this.estimateOperationCost(event.type)
        });
      }, throttleDelay);
    };

    const options = this.config.passiveListeners ? { passive: true } : false;
    element.addEventListener(event, throttledCallback, options);

    return operationId;
  }

  /**
   * Add passive event listener
   */
  public addPassiveListener(
    element: Element,
    event: string,
    callback: (event: Event) => void
  ): string {
    const operationId = this.generateOperationId(event, element);

    const passiveCallback = (event: Event) => {
      this.addOperation({
        id: `${operationId}-${Date.now()}`,
        element,
        callback: () => callback(event),
        priority: 'normal',
        timestamp: performance.now(),
        cost: this.estimateOperationCost(event.type)
      });
    };

    element.addEventListener(event, passiveCallback, { passive: true });

    return operationId;
  }

  /**
   * Batch DOM operations for better performance
   */
  public batchDOMOperations(operations: () => void): void {
    // Use requestAnimationFrame to batch DOM operations
    requestAnimationFrame(() => {
      operations();
    });
  }

  /**
   * Remove passive event listener
   */
  public removePassiveListener(_element: Element, _event: string, operationId: string): void {
    this.removeOperation(operationId);
    // Note: In a real implementation, we'd need to store the callback reference
    // to properly remove it. For now, we just remove from our operation queue.
  }

  /**
   * Add delegated event listener
   */
  public addDelegatedListener(
    container: Element,
    selector: string,
    event: string,
    callback: (event: Event, target: Element) => void
  ): string {
    const operationId = this.generateOperationId(`delegated-${event}`, container);

    const delegatedCallback = (event: Event) => {
      const target = event.target as Element;
      if (target && target.matches && target.matches(selector)) {
        this.addOperation({
          id: `${operationId}-${Date.now()}`,
          element: container,
          callback: () => callback(event, target),
          priority: 'normal',
          timestamp: performance.now(),
          cost: this.estimateOperationCost(event.type)
        });
      }
    };

    const options = this.config.passiveListeners ? { passive: true } : false;
    container.addEventListener(event, delegatedCallback, options);

    return operationId;
  }

  /**
   * Remove operation from queue
   */
  public removeOperation(operationId: string): void {
    this.operationQueue.delete(operationId);
    this.batchQueue = this.batchQueue.filter(op => op.id !== operationId);
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Force process all queued operations
   */
  public flush(): void {
    this.processOperations(true);
  }

  /**
   * Setup ResizeObserver with batching
   */
  private setupResizeObserver(): void {
    if (!window.ResizeObserver) {
      console.warn('ResizeObserver not supported, falling back to window resize');
      this.setupFallbackResize();
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.config.batchOperations) {
        // Batch resize operations
        entries.forEach(entry => {
          const operationId = this.generateOperationId('resize', entry.target);
          const operation = this.operationQueue.get(operationId);
          
          if (operation) {
            operation.timestamp = performance.now();
            this.batchQueue.push(operation);
          }
        });
      } else {
        // Process immediately
        entries.forEach(entry => {
          const operationId = this.generateOperationId('resize', entry.target);
          const operation = this.operationQueue.get(operationId);
          
          if (operation) {
            operation.callback();
          }
        });
      }
    });
  }

  /**
   * Setup IntersectionObserver for visibility-based activation
   */
  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.visibleElements.add(entry.target);
        } else {
          this.visibleElements.delete(entry.target);
        }

        const operationId = this.generateOperationId('intersection', entry.target);
        const operation = this.operationQueue.get(operationId);
        
        if (operation) {
          if (this.config.batchOperations) {
            operation.timestamp = performance.now();
            this.batchQueue.push(operation);
          } else {
            operation.callback();
          }
        }
      });
    }, {
      rootMargin: '50px', // Start processing slightly before element is visible
      threshold: [0, 0.1, 0.5, 1.0]
    });
  }

  /**
   * Setup fallback resize handling for older browsers
   */
  private setupFallbackResize(): void {
    let resizeTimeout: number;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        // Process all resize operations
        this.operationQueue.forEach(operation => {
          if (operation.id.includes('resize')) {
            if (this.config.batchOperations) {
              this.batchQueue.push(operation);
            } else {
              operation.callback();
            }
          }
        });
      }, this.config.debounceDelay);
    };

    const options = this.config.passiveListeners ? { passive: true } : false;
    window.addEventListener('resize', handleResize, options);
  }

  /**
   * Start the main processing loop
   */
  private startProcessingLoop(): void {
    if (this.config.useRAF) {
      this.processWithRAF();
    } else {
      this.processWithTimer();
    }
  }

  /**
   * Process operations using requestAnimationFrame
   */
  private processWithRAF(): void {
    const process = (timestamp: number) => {
      this.updateMetrics(timestamp);
      this.processOperations();
      
      if (!this.isProcessing) {
        this.rafId = requestAnimationFrame(process);
      }
    };

    this.rafId = requestAnimationFrame(process);
  }

  /**
   * Process operations using timer (fallback)
   */
  private processWithTimer(): void {
    const interval = Math.max(this.config.performanceTarget, 16);
    
    const process = () => {
      if (!this.isProcessing) {
        this.processOperations();
        setTimeout(process, interval);
      }
    };

    setTimeout(process, interval);
  }

  /**
   * Process queued operations with performance budgeting
   */
  private processOperations(forceFlush: boolean = false): void {
    if (this.batchQueue.length === 0 && this.operationQueue.size === 0) {
      return;
    }

    const startTime = performance.now();
    const budget = forceFlush ? Infinity : this.config.performanceTarget;
    let processedCount = 0;

    // Sort operations by priority and timestamp
    const sortedOperations = this.getSortedOperations();

    for (const operation of sortedOperations) {
      const elapsed = performance.now() - startTime;
      
      // Check if we have budget remaining
      if (!forceFlush && elapsed + operation.cost > budget) {
        break;
      }

      // Only process operations for visible elements (if intersection-based)
      if (this.config.intersectionBased && 
          !this.visibleElements.has(operation.element) && 
          operation.priority !== 'high') {
        continue;
      }

      try {
        operation.callback();
        processedCount++;
        
        // Remove from queues
        this.operationQueue.delete(operation.id);
        this.batchQueue = this.batchQueue.filter(op => op.id !== operation.id);
        
        // Respect batch size limit
        if (!forceFlush && processedCount >= this.config.maxBatchSize) {
          break;
        }
      } catch (error) {
        console.error('Error processing operation:', error);
        this.operationQueue.delete(operation.id);
      }
    }

    // Update metrics
    this.metrics.operationsPerFrame = processedCount;
    this.metrics.queueSize = this.operationQueue.size + this.batchQueue.length;
  }

  /**
   * Get operations sorted by priority and age
   */
  private getSortedOperations(): EventOperation[] {
    const allOperations = [
      ...Array.from(this.operationQueue.values()),
      ...this.batchQueue
    ];

    return allOperations.sort((a, b) => {
      // Priority first
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Add operation to queue
   */
  private addOperation(operation: EventOperation): void {
    this.operationQueue.set(operation.id, operation);
  }

  /**
   * Debounce function execution
   */
  private debounce(key: string, func: () => void, delay: number): void {
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Throttle function execution
   */
  private throttle(key: string, func: () => void, delay: number): void {
    const lastTime = this.lastThrottleTime.get(key) || 0;
    const now = performance.now();

    if (now - lastTime >= delay) {
      func();
      this.lastThrottleTime.set(key, now);
    } else {
      // Schedule for later if not already scheduled
      if (!this.throttleTimers.has(key)) {
        const timer = window.setTimeout(() => {
          func();
          this.lastThrottleTime.set(key, performance.now());
          this.throttleTimers.delete(key);
        }, delay - (now - lastTime));

        this.throttleTimers.set(key, timer);
      }
    }
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(type: string, element: Element): string {
    const elementId = element.id || element.tagName + Math.random().toString(36).substring(2, 11);
    return `${type}-${elementId}`;
  }

  /**
   * Estimate operation execution cost
   */
  private estimateOperationCost(operationType: string): number {
    const baseCosts = {
      resize: 2,
      intersection: 1,
      scroll: 1,
      click: 0.5,
      mousemove: 0.5,
      default: 1
    };

    return baseCosts[operationType as keyof typeof baseCosts] || baseCosts.default;
  }

  /**
   * Calculate intersection ratio
   */
  private calculateIntersectionRatio(rect: DOMRect, rootBounds: DOMRect): number {
    const intersectionArea = Math.max(0, 
      Math.min(rect.right, rootBounds.right) - Math.max(rect.left, rootBounds.left)
    ) * Math.max(0,
      Math.min(rect.bottom, rootBounds.bottom) - Math.max(rect.top, rootBounds.top)
    );

    const elementArea = rect.width * rect.height;
    return elementArea > 0 ? intersectionArea / elementArea : 0;
  }

  /**
   * Check if element is intersecting viewport
   */
  private isElementIntersecting(rect: DOMRect, rootBounds: DOMRect): boolean {
    return rect.left < rootBounds.right &&
           rect.right > rootBounds.left &&
           rect.top < rootBounds.bottom &&
           rect.bottom > rootBounds.top;
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    this.lastFrameTime = performance.now();
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(timestamp: number): void {
    const deltaTime = timestamp - this.lastFrameTime;
    this.frameCount++;

    // Update frame time and FPS
    this.metrics.frameTime = deltaTime;
    this.metrics.fps = 1000 / deltaTime;

    // Track dropped frames (frames taking longer than target)
    if (deltaTime > this.config.performanceTarget * 1.5) {
      this.metrics.droppedFrames++;
    }

    // Calculate average latency (simplified)
    const currentLatency = this.batchQueue.length > 0 
      ? timestamp - Math.min(...this.batchQueue.map(op => op.timestamp))
      : 0;
    
    this.metrics.averageLatency = (this.metrics.averageLatency + currentLatency) / 2;

    this.lastFrameTime = timestamp;
  }

  /**
   * Stop processing loop
   */
  private stopProcessingLoop(): void {
    this.isProcessing = true;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Clean up observers
   */
  private cleanupObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }

  /**
   * Clear all queues
   */
  private clearQueues(): void {
    this.operationQueue.clear();
    this.batchQueue = [];
    
    // Clear timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    this.lastThrottleTime.clear();
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): PerformanceMetrics {
    return {
      frameTime: 0,
      fps: 60,
      operationsPerFrame: 0,
      queueSize: 0,
      droppedFrames: 0,
      averageLatency: 0
    };
  }
}
