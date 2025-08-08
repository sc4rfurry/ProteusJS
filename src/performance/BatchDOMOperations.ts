/**
 * Batch DOM Operations for ProteusJS
 * Efficient DOM manipulation with read/write separation and layout thrashing prevention
 */

export interface DOMOperation {
  id: string;
  type: 'read' | 'write';
  element: Element;
  operation: () => any;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  dependencies?: string[];
}

export interface BatchConfig {
  maxBatchSize: number;
  frameTimeLimit: number;
  separateReadWrite: boolean;
  measurePerformance: boolean;
  autoFlush: boolean;
  flushInterval: number;
}

export interface BatchMetrics {
  totalOperations: number;
  readOperations: number;
  writeOperations: number;
  batchesProcessed: number;
  averageBatchTime: number;
  layoutThrashes: number;
  preventedThrashes: number;
}

export class BatchDOMOperations {
  private config: Required<BatchConfig>;
  private readQueue: DOMOperation[] = [];
  private writeQueue: DOMOperation[] = [];
  private processingQueue: DOMOperation[] = [];
  private metrics: BatchMetrics;
  private rafId: number | null = null;
  private flushTimer: number | null = null;
  private isProcessing: boolean = false;
  private operationResults: Map<string, any> = new Map();

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: 50,
      frameTimeLimit: 16, // 60fps target
      separateReadWrite: true,
      measurePerformance: true,
      autoFlush: true,
      flushInterval: 100,
      ...config
    };

    this.metrics = this.createInitialMetrics();
    
    if (this.config.autoFlush) {
      this.startAutoFlush();
    }
  }

  /**
   * Queue a DOM read operation
   */
  public queueRead<T>(
    element: Element,
    operation: () => T,
    priority: 'high' | 'normal' | 'low' = 'normal',
    dependencies: string[] = []
  ): Promise<T> {
    const id = this.generateOperationId('read');
    
    return new Promise((resolve, reject) => {
      const domOperation: DOMOperation = {
        id,
        type: 'read',
        element,
        operation: () => {
          try {
            const result = operation();
            this.operationResults.set(id, result);
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        priority,
        timestamp: performance.now(),
        dependencies
      };

      this.readQueue.push(domOperation);
      this.scheduleProcessing();
    });
  }

  /**
   * Queue a DOM write operation
   */
  public queueWrite(
    element: Element,
    operation: () => void,
    priority: 'high' | 'normal' | 'low' = 'normal',
    dependencies: string[] = []
  ): Promise<void> {
    const id = this.generateOperationId('write');
    
    return new Promise((resolve, reject) => {
      const domOperation: DOMOperation = {
        id,
        type: 'write',
        element,
        operation: () => {
          try {
            operation();
            resolve();
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        priority,
        timestamp: performance.now(),
        dependencies
      };

      this.writeQueue.push(domOperation);
      this.scheduleProcessing();
    });
  }

  /**
   * Batch multiple style changes
   */
  public batchStyles(
    element: Element,
    styles: Record<string, string>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    return this.queueWrite(
      element,
      () => {
        const htmlElement = element as HTMLElement;
        Object.entries(styles).forEach(([property, value]) => {
          htmlElement.style.setProperty(property, value);
        });
      },
      priority
    );
  }

  /**
   * Batch multiple class changes
   */
  public batchClasses(
    element: Element,
    changes: { add?: string[]; remove?: string[]; toggle?: string[] },
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    return this.queueWrite(
      element,
      () => {
        if (changes.add) {
          element.classList.add(...changes.add);
        }
        if (changes.remove) {
          element.classList.remove(...changes.remove);
        }
        if (changes.toggle) {
          changes.toggle.forEach(className => {
            element.classList.toggle(className);
          });
        }
      },
      priority
    );
  }

  /**
   * Batch multiple attribute changes
   */
  public batchAttributes(
    element: Element,
    attributes: Record<string, string | null>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    return this.queueWrite(
      element,
      () => {
        Object.entries(attributes).forEach(([name, value]) => {
          if (value === null) {
            element.removeAttribute(name);
          } else {
            element.setAttribute(name, value);
          }
        });
      },
      priority
    );
  }

  /**
   * Read multiple properties efficiently
   */
  public batchReads<T extends Record<string, () => any>>(
    element: Element,
    readers: T,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<{ [K in keyof T]: ReturnType<T[K]> }> {
    return this.queueRead(
      element,
      () => {
        const results = {} as { [K in keyof T]: ReturnType<T[K]> };
        Object.entries(readers).forEach(([key, reader]) => {
          results[key as keyof T] = (reader as () => any)();
        });
        return results;
      },
      priority
    );
  }

  /**
   * Measure element dimensions efficiently
   */
  public measureElement(
    element: Element,
    measurements: ('width' | 'height' | 'top' | 'left' | 'right' | 'bottom')[] = ['width', 'height'],
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<Partial<DOMRect>> {
    return this.queueRead(
      element,
      () => {
        const rect = element.getBoundingClientRect();
        const result: Partial<DOMRect> = {};
        
        measurements.forEach(measurement => {
          (result as any)[measurement] = rect[measurement as keyof DOMRect];
        });
        
        return result;
      },
      priority
    );
  }

  /**
   * Force flush all queued operations
   */
  public flush(): Promise<void> {
    return new Promise((resolve) => {
      this.processOperations(true).then(() => {
        resolve();
      });
    });
  }

  /**
   * Get current batch metrics
   */
  public getMetrics(): BatchMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all queues
   */
  public clear(): void {
    this.readQueue = [];
    this.writeQueue = [];
    this.processingQueue = [];
    this.operationResults.clear();
  }

  /**
   * Destroy the batch processor
   */
  public destroy(): void {
    this.stopAutoFlush();
    this.stopProcessing();
    this.clear();
  }

  /**
   * Schedule processing of queued operations
   */
  private scheduleProcessing(): void {
    if (this.isProcessing || this.rafId) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.processOperations();
      this.rafId = null;
    });
  }

  /**
   * Process queued operations with read/write separation
   */
  private async processOperations(forceFlush: boolean = false): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      if (this.config.separateReadWrite) {
        // Process all reads first to avoid layout thrashing
        await this.processQueue(this.readQueue, 'read', forceFlush);
        
        // Then process all writes
        await this.processQueue(this.writeQueue, 'write', forceFlush);
      } else {
        // Process mixed operations (less efficient but simpler)
        const allOperations = [...this.readQueue, ...this.writeQueue];
        this.readQueue = [];
        this.writeQueue = [];
        
        await this.processQueue(allOperations, 'mixed', forceFlush);
      }

      // Update metrics
      const processingTime = performance.now() - startTime;
      this.updateMetrics(processingTime);

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a specific queue of operations
   */
  private async processQueue(
    queue: DOMOperation[],
    queueType: 'read' | 'write' | 'mixed',
    forceFlush: boolean
  ): Promise<void> {
    if (queue.length === 0) {
      return;
    }

    // Sort by priority and dependencies
    const sortedOperations = this.sortOperations(queue);
    const budget = forceFlush ? Infinity : this.config.frameTimeLimit;
    const startTime = performance.now();
    let processedCount = 0;

    for (const operation of sortedOperations) {
      // Check time budget
      const elapsed = performance.now() - startTime;
      if (!forceFlush && elapsed > budget) {
        break;
      }

      // Check dependencies
      if (!this.areDependenciesSatisfied(operation)) {
        continue;
      }

      // Check batch size limit
      if (!forceFlush && processedCount >= this.config.maxBatchSize) {
        break;
      }

      try {
        // Detect potential layout thrashing
        if (this.config.measurePerformance && this.wouldCauseLayoutThrash(operation, queueType)) {
          this.metrics.layoutThrashes++;
        }

        // Execute operation
        operation.operation();
        processedCount++;

        // Update metrics
        if (operation.type === 'read') {
          this.metrics.readOperations++;
        } else {
          this.metrics.writeOperations++;
        }

      } catch (error) {
        console.error('Error processing DOM operation:', error);
      }

      // Remove from queue
      const index = queue.indexOf(operation);
      if (index > -1) {
        queue.splice(index, 1);
      }
    }

    this.metrics.totalOperations += processedCount;
  }

  /**
   * Sort operations by priority and dependencies
   */
  private sortOperations(operations: DOMOperation[]): DOMOperation[] {
    return operations.sort((a, b) => {
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
   * Check if operation dependencies are satisfied
   */
  private areDependenciesSatisfied(operation: DOMOperation): boolean {
    if (!operation.dependencies || operation.dependencies.length === 0) {
      return true;
    }

    return operation.dependencies.every(depId => 
      this.operationResults.has(depId)
    );
  }

  /**
   * Detect potential layout thrashing
   */
  private wouldCauseLayoutThrash(operation: DOMOperation, queueType: string): boolean {
    // Simplified heuristic: write after read in same frame might cause thrashing
    if (queueType === 'mixed' && operation.type === 'write') {
      const recentReads = this.processingQueue.filter(op => 
        op.type === 'read' && 
        performance.now() - op.timestamp < 16
      );
      
      return recentReads.length > 0;
    }

    return false;
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(type: string): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = window.setInterval(() => {
      if (this.readQueue.length > 0 || this.writeQueue.length > 0) {
        this.scheduleProcessing();
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Stop processing
   */
  private stopProcessing(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(processingTime: number): void {
    this.metrics.batchesProcessed++;
    this.metrics.averageBatchTime = 
      (this.metrics.averageBatchTime + processingTime) / 2;

    // Calculate prevented thrashes (simplified)
    if (this.config.separateReadWrite) {
      const potentialThrashes = Math.min(this.readQueue.length, this.writeQueue.length);
      this.metrics.preventedThrashes += potentialThrashes;
    }
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): BatchMetrics {
    return {
      totalOperations: 0,
      readOperations: 0,
      writeOperations: 0,
      batchesProcessed: 0,
      averageBatchTime: 0,
      layoutThrashes: 0,
      preventedThrashes: 0
    };
  }
}
