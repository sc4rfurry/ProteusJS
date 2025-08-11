/**
 * @sc4rfurryx/proteusjs-schedule
 * Scheduler API utilities for performance optimization
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

// Types
export interface TaskOptions {
  priority?: 'user-blocking' | 'user-visible' | 'background';
  delay?: number;
  signal?: AbortSignal | undefined;
}

export interface ChunkOptions {
  chunkSize?: number;
  yieldInterval?: number;
  priority?: TaskOptions['priority'];
  onProgress?: (completed: number, total: number) => void;
}

export interface SchedulerYieldOptions {
  priority?: TaskOptions['priority'];
}

// Feature detection
const hasScheduler = typeof window !== 'undefined' && 'scheduler' in window;
const hasPostTask = hasScheduler && 'postTask' in (window as any).scheduler;
const hasYield = hasScheduler && 'yield' in (window as any).scheduler;
const hasIsInputPending = typeof navigator !== 'undefined' && 'scheduling' in navigator && 'isInputPending' in (navigator as any).scheduling;

/**
 * Schedule a task with the Scheduler API or fallback to setTimeout
 */
export function postTask<T>(
  callback: () => T | Promise<T>,
  options: TaskOptions = {}
): Promise<T> {
  if (hasPostTask) {
    return (window as any).scheduler.postTask(callback, {
      priority: options.priority || 'user-visible',
      delay: options.delay,
      signal: options.signal
    });
  } else {
    // Fallback to setTimeout with priority simulation
    return new Promise((resolve, reject) => {
      const delay = options.delay || getPriorityDelay(options.priority);
      const timeoutId = setTimeout(async () => {
        try {
          const result = await callback();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
      
      // Handle abort signal
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new DOMException('Task was aborted', 'AbortError'));
        });
      }
    });
  }
}

/**
 * Yield control to the browser with scheduler.yield or fallback
 */
export async function yieldToMain(options: SchedulerYieldOptions = {}): Promise<void> {
  if (hasYield) {
    return (window as any).scheduler.yield(options);
  } else {
    // Fallback using MessageChannel for better yielding
    return new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port2.onmessage = () => resolve();
      channel.port1.postMessage(null);
    });
  }
}

/**
 * Check if input is pending (user interaction waiting)
 */
export function isInputPending(): boolean {
  if (hasIsInputPending) {
    return (navigator as any).scheduling.isInputPending();
  }
  // Fallback: always assume input might be pending for safety
  return false;
}

/**
 * Process an array of items in chunks with yielding
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R | Promise<R>,
  options: ChunkOptions = {}
): Promise<R[]> {
  const {
    chunkSize = 10,
    yieldInterval = 5,
    priority = 'user-visible',
    onProgress
  } = options;
  
  const results: R[] = [];
  let processedCount = 0;
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    // Process chunk
    for (let j = 0; j < chunk.length; j++) {
      const item = chunk[j];
      if (item !== undefined) {
        const result = await processor(item, i + j);
        results.push(result);
      }
      processedCount++;
      
      // Report progress
      if (onProgress) {
        onProgress(processedCount, items.length);
      }
    }
    
    // Yield after processing chunk if more items remain
    if (i + chunkSize < items.length) {
      // Check if we should yield based on input pending or interval
      if (processedCount % (chunkSize * yieldInterval) === 0 || isInputPending()) {
        await yieldToMain({ priority });
      }
    }
  }
  
  return results;
}

/**
 * Run a long task with automatic yielding
 */
export async function runWithYielding<T>(
  task: () => T | Promise<T>,
  options: {
    yieldInterval?: number;
    priority?: TaskOptions['priority'];
    shouldYield?: () => boolean;
  } = {}
): Promise<T> {
  const {
    yieldInterval = 5,
    priority = 'user-visible',
    shouldYield = () => isInputPending()
  } = options;
  
  let yieldCounter = 0;
  
  // Wrap the task to add yielding points
  const wrappedTask = async (): Promise<T> => {
    const originalSetTimeout = window.setTimeout;
    
    // Override setTimeout to add yield points
    (window as any).setTimeout = async (callback: Function, delay: number = 0) => {
      yieldCounter++;
      
      if (yieldCounter % yieldInterval === 0 || shouldYield()) {
        await yieldToMain({ priority });
      }
      
      return originalSetTimeout(callback, delay);
    };
    
    try {
      const result = await task();
      return result;
    } finally {
      // Restore original setTimeout
      window.setTimeout = originalSetTimeout;
    }
  };
  
  return wrappedTask();
}

/**
 * Create a scheduler-aware debounced function
 */
export function debounceWithScheduler<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: TaskOptions = {}
): T {
  let timeoutId: number | undefined;
  let abortController: AbortController | undefined;
  
  return ((...args: Parameters<T>) => {
    // Cancel previous execution
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (abortController) {
      abortController.abort();
    }
    
    abortController = new AbortController();
    
    timeoutId = window.setTimeout(() => {
      postTask(() => func(...args), {
        ...options,
        signal: abortController?.signal
      });
    }, delay);
  }) as T;
}

/**
 * Create a scheduler-aware throttled function
 */
export function throttleWithScheduler<T extends (...args: any[]) => any>(
  func: T,
  interval: number,
  options: TaskOptions = {}
): T {
  let lastExecution = 0;
  let timeoutId: number | undefined;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecution;
    
    if (timeSinceLastExecution >= interval) {
      lastExecution = now;
      postTask(() => func(...args), options);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = window.setTimeout(() => {
        lastExecution = Date.now();
        postTask(() => func(...args), options);
      }, interval - timeSinceLastExecution);
    }
  }) as T;
}

/**
 * Schedule a task to run when the browser is idle
 */
export function runWhenIdle<T>(
  callback: () => T | Promise<T>,
  options: { timeout?: number; priority?: TaskOptions['priority'] } = {}
): Promise<T> {
  const { timeout = 5000, priority = 'background' } = options;
  
  if ('requestIdleCallback' in window) {
    return new Promise((resolve, reject) => {
      (window as any).requestIdleCallback(
        async () => {
          try {
            const result = await callback();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        { timeout }
      );
    });
  } else {
    // Fallback to postTask with background priority
    return postTask(callback, { priority, delay: 0 });
  }
}

/**
 * Get priority-based delay for fallback scheduling
 */
function getPriorityDelay(priority?: TaskOptions['priority']): number {
  switch (priority) {
    case 'user-blocking':
      return 0;
    case 'user-visible':
      return 5;
    case 'background':
      return 100;
    default:
      return 5;
  }
}

/**
 * Check if Scheduler API is supported
 */
export function isSchedulerSupported(): boolean {
  return hasScheduler;
}

/**
 * Check if scheduler.postTask is supported
 */
export function isPostTaskSupported(): boolean {
  return hasPostTask;
}

/**
 * Check if scheduler.yield is supported
 */
export function isYieldSupported(): boolean {
  return hasYield;
}

/**
 * Check if isInputPending is supported
 */
export function isInputPendingSupported(): boolean {
  return hasIsInputPending;
}

/**
 * Get scheduler capabilities
 */
export function getSchedulerCapabilities() {
  return {
    scheduler: hasScheduler,
    postTask: hasPostTask,
    yield: hasYield,
    isInputPending: hasIsInputPending,
    requestIdleCallback: 'requestIdleCallback' in window
  };
}
