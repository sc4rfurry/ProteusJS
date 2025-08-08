/**
 * Debounce and throttle utilities for ProteusJS
 * Optimizes performance by controlling function execution frequency
 */

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): T & { cancel: () => void; flush: () => ReturnType<T> | undefined } {
  const { leading = false, trailing = true, maxWait } = options;

  let timeoutId: number | null = null;
  let maxTimeoutId: number | null = null;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  let result: ReturnType<T> | undefined;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args) as ReturnType<T>;
    return result!;
  }

  function leadingEdge(time: number): ReturnType<T> {
    lastInvokeTime = time;
    timeoutId = window.setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result!;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): ReturnType<T> | undefined {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = window.setTimeout(timerExpired, remainingWait(time));
    return undefined;
  }

  function trailingEdge(time: number): ReturnType<T> | undefined {
    timeoutId = null;
    
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
  }

  function flush(): ReturnType<T> | undefined {
    return timeoutId === null ? result : trailingEdge(Date.now());
  }

  function debounced(this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = window.setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === null) {
      timeoutId = window.setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  
  return debounced as T & { cancel: () => void; flush: () => ReturnType<T> | undefined };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): T & { cancel: () => void; flush: () => ReturnType<T> | undefined } {
  const { leading = true, trailing = true } = options;
  return debounce(func, wait, { leading, trailing, maxWait: wait });
}

/**
 * Request animation frame based throttle
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  func: T
): T & { cancel: () => void } {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;

  function throttled(this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;
    lastThis = this;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          func.apply(lastThis, lastArgs);
          lastArgs = undefined;
          lastThis = undefined;
        }
      });
    }
  }

  function cancel(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = undefined;
    lastThis = undefined;
  }

  throttled.cancel = cancel;
  
  return throttled as T & { cancel: () => void };
}

/**
 * Idle callback based debounce
 */
export function idleDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  timeout: number = 5000
): T & { cancel: () => void } {
  let idleId: number | null = null;
  let timeoutId: number | null = null;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;

  function debounced(this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;
    lastThis = this;
    
    // Cancel previous calls
    if (idleId !== null) {
      cancelIdleCallback(idleId);
      idleId = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Try to use idle callback
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(() => {
        idleId = null;
        if (lastArgs) {
          func.apply(lastThis, lastArgs);
          lastArgs = undefined;
          lastThis = undefined;
        }
      }, { timeout });
    } else {
      // Fallback to setTimeout
      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        if (lastArgs) {
          func.apply(lastThis, lastArgs);
          lastArgs = undefined;
          lastThis = undefined;
        }
      }, 16); // ~60fps fallback
    }
  }

  function cancel(): void {
    if (idleId !== null) {
      cancelIdleCallback(idleId);
      idleId = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = undefined;
    lastThis = undefined;
  }

  debounced.cancel = cancel;
  
  return debounced as T & { cancel: () => void };
}
