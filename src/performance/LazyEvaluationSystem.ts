/**
 * Lazy Evaluation System for ProteusJS
 * Viewport-based component activation with idle callbacks and progressive enhancement
 */

export interface LazyConfig {
  rootMargin: string;
  threshold: number[];
  useIdleCallback: boolean;
  idleTimeout: number;
  progressiveEnhancement: boolean;
  cacheResults: boolean;
  priorityQueue: boolean;
  maxConcurrent: number;
}

export interface LazyComponent {
  id: string;
  element: Element;
  activator: () => Promise<void>;
  priority: 'high' | 'normal' | 'low';
  dependencies: string[];
  activated: boolean;
  cached: boolean;
  timestamp: number;
}

export interface LazyMetrics {
  totalComponents: number;
  activatedComponents: number;
  pendingComponents: number;
  cacheHits: number;
  cacheMisses: number;
  averageActivationTime: number;
  idleCallbacksUsed: number;
}

export class LazyEvaluationSystem {
  private config: Required<LazyConfig>;
  private components: Map<string, LazyComponent> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;
  private activationQueue: LazyComponent[] = [];
  private cache: Map<string, any> = new Map();
  private metrics: LazyMetrics;
  private isProcessing: boolean = false;
  private activeActivations: Set<string> = new Set();

  constructor(config: Partial<LazyConfig> = {}) {
    this.config = {
      rootMargin: '50px',
      threshold: [0, 0.1, 0.5, 1.0],
      useIdleCallback: true,
      idleTimeout: 5000,
      progressiveEnhancement: true,
      cacheResults: true,
      priorityQueue: true,
      maxConcurrent: 3,
      ...config
    };

    this.metrics = this.createInitialMetrics();
    this.setupIntersectionObserver();
  }

  /**
   * Register a lazy component
   */
  public register(
    element: Element,
    activator: () => Promise<void>,
    options: {
      id?: string;
      priority?: 'high' | 'normal' | 'low';
      dependencies?: string[];
      immediate?: boolean;
    } = {}
  ): string {
    const id = options.id || this.generateId();
    
    const component: LazyComponent = {
      id,
      element,
      activator,
      priority: options.priority || 'normal',
      dependencies: options.dependencies || [],
      activated: false,
      cached: false,
      timestamp: performance.now()
    };

    this.components.set(id, component);
    this.metrics.totalComponents++;

    if (options.immediate) {
      this.activateComponent(component);
    } else {
      this.observeComponent(component);
    }

    return id;
  }

  /**
   * Unregister a component
   */
  public unregister(id: string): void {
    const component = this.components.get(id);
    if (component) {
      this.intersectionObserver?.unobserve(component.element);
      this.components.delete(id);
      this.cache.delete(id);
      this.metrics.totalComponents--;
    }
  }

  /**
   * Force activate a component
   */
  public async activate(id: string): Promise<void> {
    const component = this.components.get(id);
    if (component && !component.activated) {
      await this.activateComponent(component);
    }
  }

  /**
   * Preload components with high priority
   */
  public preloadHighPriority(): void {
    const highPriorityComponents = Array.from(this.components.values())
      .filter(c => c.priority === 'high' && !c.activated);

    highPriorityComponents.forEach(component => {
      this.scheduleActivation(component);
    });
  }

  /**
   * Get cached result
   */
  public getCached<T>(key: string): T | null {
    if (!this.config.cacheResults) return null;
    
    const cached = this.cache.get(key);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    
    this.metrics.cacheMisses++;
    return null;
  }

  /**
   * Set cached result
   */
  public setCached<T>(key: string, value: T): void {
    if (this.config.cacheResults) {
      this.cache.set(key, value);
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): LazyMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Destroy the lazy evaluation system
   */
  public destroy(): void {
    this.intersectionObserver?.disconnect();
    this.components.clear();
    this.cache.clear();
    this.activationQueue = [];
    this.activeActivations.clear();
  }

  /**
   * Setup intersection observer
   */
  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver not supported, falling back to immediate activation');
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const component = this.findComponentByElement(entry.target);
            if (component && !component.activated) {
              this.scheduleActivation(component);
            }
          }
        });
      },
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold
      }
    );
  }

  /**
   * Observe component for intersection
   */
  private observeComponent(component: LazyComponent): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(component.element);
    } else {
      // Fallback: activate immediately if no intersection observer
      this.scheduleActivation(component);
    }
  }

  /**
   * Schedule component activation
   */
  private scheduleActivation(component: LazyComponent): void {
    if (this.config.priorityQueue) {
      this.addToQueue(component);
      this.processQueue();
    } else {
      this.activateComponent(component);
    }
  }

  /**
   * Add component to activation queue
   */
  private addToQueue(component: LazyComponent): void {
    // Check if already in queue
    if (this.activationQueue.some(c => c.id === component.id)) {
      return;
    }

    this.activationQueue.push(component);
    
    // Sort by priority
    this.activationQueue.sort((a, b) => {
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
   * Process activation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.activationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.activationQueue.length > 0 && 
             this.activeActivations.size < this.config.maxConcurrent) {
        
        const component = this.activationQueue.shift();
        if (component && !component.activated && this.areDependenciesSatisfied(component)) {
          this.activateComponent(component);
        }
      }
    } finally {
      this.isProcessing = false;
      
      // Schedule next processing if queue is not empty
      if (this.activationQueue.length > 0) {
        this.scheduleNextProcessing();
      }
    }
  }

  /**
   * Schedule next queue processing
   */
  private scheduleNextProcessing(): void {
    if (this.config.useIdleCallback && window.requestIdleCallback) {
      window.requestIdleCallback(
        () => this.processQueue(),
        { timeout: this.config.idleTimeout }
      );
      this.metrics.idleCallbacksUsed++;
    } else {
      setTimeout(() => this.processQueue(), 16); // Next frame
    }
  }

  /**
   * Activate a component
   */
  private async activateComponent(component: LazyComponent): Promise<void> {
    if (component.activated || this.activeActivations.has(component.id)) {
      return;
    }

    this.activeActivations.add(component.id);
    const startTime = performance.now();

    try {
      // Check cache first
      const cacheKey = `component-${component.id}`;
      let result = this.getCached(cacheKey);

      if (!result) {
        // Progressive enhancement check
        if (this.config.progressiveEnhancement && !this.isEnhancementSupported(component)) {
          console.warn(`Progressive enhancement not supported for component ${component.id}`);
          return;
        }

        // Execute activator
        result = await component.activator();
        
        // Cache result if enabled
        if (this.config.cacheResults) {
          this.setCached(cacheKey, result);
          component.cached = true;
        }
      }

      component.activated = true;
      this.metrics.activatedComponents++;
      this.metrics.pendingComponents = this.metrics.totalComponents - this.metrics.activatedComponents;

      // Update average activation time
      const activationTime = performance.now() - startTime;
      this.metrics.averageActivationTime = 
        (this.metrics.averageActivationTime + activationTime) / 2;

      // Stop observing this component
      this.intersectionObserver?.unobserve(component.element);

    } catch (error) {
      console.error(`Failed to activate component ${component.id}:`, error);
    } finally {
      this.activeActivations.delete(component.id);
      
      // Continue processing queue
      if (this.activationQueue.length > 0) {
        this.scheduleNextProcessing();
      }
    }
  }

  /**
   * Check if component dependencies are satisfied
   */
  private areDependenciesSatisfied(component: LazyComponent): boolean {
    return component.dependencies.every(depId => {
      const dependency = this.components.get(depId);
      return dependency?.activated || false;
    });
  }

  /**
   * Check if progressive enhancement is supported
   */
  private isEnhancementSupported(component: LazyComponent): boolean {
    // Basic feature detection
    const requiredFeatures = [
      'IntersectionObserver',
      'ResizeObserver',
      'requestAnimationFrame'
    ];

    return requiredFeatures.every(feature => feature in window);
  }

  /**
   * Find component by element
   */
  private findComponentByElement(element: Element): LazyComponent | undefined {
    return Array.from(this.components.values())
      .find(component => component.element === element);
  }

  /**
   * Generate unique component ID
   */
  private generateId(): string {
    return `lazy-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): LazyMetrics {
    return {
      totalComponents: 0,
      activatedComponents: 0,
      pendingComponents: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageActivationTime: 0,
      idleCallbacksUsed: 0
    };
  }
}

/**
 * Lazy evaluation decorators and utilities
 */
export class LazyUtils {
  /**
   * Create a lazy-loaded image
   */
  static lazyImage(
    img: HTMLImageElement,
    src: string,
    options: { placeholder?: string; fadeIn?: boolean } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Set placeholder
      if (options.placeholder) {
        img.src = options.placeholder;
      }

      // Create new image for loading
      const loader = new Image();
      
      loader.onload = () => {
        img.src = src;
        
        if (options.fadeIn) {
          img.style.opacity = '0';
          img.style.transition = 'opacity 0.3s ease';
          
          requestAnimationFrame(() => {
            img.style.opacity = '1';
          });
        }
        
        resolve();
      };
      
      loader.onerror = reject;
      loader.src = src;
    });
  }

  /**
   * Create a lazy-loaded script
   */
  static lazyScript(src: string, options: { async?: boolean; defer?: boolean } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer || false;
      
      script.onload = () => resolve();
      script.onerror = reject;
      
      document.head.appendChild(script);
    });
  }

  /**
   * Create a lazy-loaded CSS
   */
  static lazyCSS(href: string, media: string = 'all'): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print'; // Load as print to avoid blocking
      
      link.onload = () => {
        link.media = media; // Switch to target media
        resolve();
      };
      
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  /**
   * Lazy function execution with memoization
   */
  static lazy<T>(fn: () => T): () => T {
    let cached: T;
    let executed = false;
    
    return () => {
      if (!executed) {
        cached = fn();
        executed = true;
      }
      return cached;
    };
  }

  /**
   * Debounced lazy execution
   */
  static lazyDebounced<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: number;
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          resolve(fn(...args));
        }, delay);
      });
    };
  }
}
