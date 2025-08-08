/**
 * IntersectionObserver Polyfill for ProteusJS
 * Provides IntersectionObserver functionality for browsers that don't support it
 */

export interface IntersectionObserverEntry {
  target: Element;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  intersectionRatio: number;
  isIntersecting: boolean;
  time: number;
}

export type IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => void;

export class IntersectionObserverPolyfill {
  public root: Element | null;
  public rootMargin: string;
  public thresholds: number[];
  
  private callback: IntersectionObserverCallback;
  private observedElements: Map<Element, { lastRatio: number; wasIntersecting: boolean }> = new Map();
  private rafId: number | null = null;
  private isObserving: boolean = false;
  private parsedRootMargin: { top: number; right: number; bottom: number; left: number };

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.root = (options?.root instanceof Element ? options.root : null);
    this.rootMargin = options?.rootMargin || '0px';
    this.thresholds = this.normalizeThresholds(options?.threshold);
    this.parsedRootMargin = this.parseRootMargin(this.rootMargin);
  }

  /**
   * Start observing an element
   */
  public observe(element: Element): void {
    if (this.observedElements.has(element)) return;

    this.observedElements.set(element, {
      lastRatio: 0,
      wasIntersecting: false
    });

    if (!this.isObserving) {
      this.startObserving();
    }
  }

  /**
   * Stop observing an element
   */
  public unobserve(element: Element): void {
    this.observedElements.delete(element);

    if (this.observedElements.size === 0) {
      this.stopObserving();
    }
  }

  /**
   * Disconnect all observations
   */
  public disconnect(): void {
    this.observedElements.clear();
    this.stopObserving();
  }

  /**
   * Start the polling mechanism
   */
  private startObserving(): void {
    if (this.isObserving) return;
    
    this.isObserving = true;
    this.checkForIntersections();
  }

  /**
   * Stop the polling mechanism
   */
  private stopObserving(): void {
    if (!this.isObserving) return;
    
    this.isObserving = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Check for intersection changes
   */
  private checkForIntersections(): void {
    if (!this.isObserving) return;

    const changedEntries: IntersectionObserverEntry[] = [];
    const rootBounds = this.getRootBounds();

    this.observedElements.forEach((lastState, element) => {
      // Check if element is still in DOM
      if (!document.contains(element)) {
        this.observedElements.delete(element);
        return;
      }

      const targetRect = element.getBoundingClientRect();
      const intersectionRect = this.calculateIntersection(targetRect, rootBounds);
      const intersectionRatio = this.calculateIntersectionRatio(targetRect, intersectionRect);
      const isIntersecting = intersectionRatio > 0;

      // Check if we should trigger callback
      const shouldTrigger = this.shouldTriggerCallback(
        intersectionRatio,
        lastState.lastRatio,
        isIntersecting,
        lastState.wasIntersecting
      );

      if (shouldTrigger) {
        // Update stored state
        this.observedElements.set(element, {
          lastRatio: intersectionRatio,
          wasIntersecting: isIntersecting
        });

        // Create entry
        const entry: IntersectionObserverEntry = {
          target: element,
          boundingClientRect: this.createDOMRectReadOnly(targetRect),
          intersectionRect: this.createDOMRectReadOnly(intersectionRect),
          rootBounds: rootBounds ? this.createDOMRectReadOnly(rootBounds) : null,
          intersectionRatio,
          isIntersecting,
          time: performance.now()
        };

        changedEntries.push(entry);
      }
    });

    // Call callback if there are changes
    if (changedEntries.length > 0) {
      try {
        this.callback(changedEntries);
      } catch (error) {
        console.error('IntersectionObserver callback error:', error);
      }
    }

    // Schedule next check
    if (this.isObserving) {
      this.rafId = requestAnimationFrame(() => this.checkForIntersections());
    }
  }

  /**
   * Get root bounds with margin applied
   */
  private getRootBounds(): DOMRect {
    const rootElement = this.root || document.documentElement;
    const rect = rootElement.getBoundingClientRect();
    
    return new DOMRect(
      rect.left - this.parsedRootMargin.left,
      rect.top - this.parsedRootMargin.top,
      rect.width + this.parsedRootMargin.left + this.parsedRootMargin.right,
      rect.height + this.parsedRootMargin.top + this.parsedRootMargin.bottom
    );
  }

  /**
   * Calculate intersection rectangle
   */
  private calculateIntersection(targetRect: DOMRect, rootBounds: DOMRect): DOMRect {
    const left = Math.max(targetRect.left, rootBounds.left);
    const top = Math.max(targetRect.top, rootBounds.top);
    const right = Math.min(targetRect.right, rootBounds.right);
    const bottom = Math.min(targetRect.bottom, rootBounds.bottom);

    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);

    return new DOMRect(left, top, width, height);
  }

  /**
   * Calculate intersection ratio
   */
  private calculateIntersectionRatio(targetRect: DOMRect, intersectionRect: DOMRect): number {
    const targetArea = targetRect.width * targetRect.height;
    if (targetArea === 0) return 0;

    const intersectionArea = intersectionRect.width * intersectionRect.height;
    return intersectionArea / targetArea;
  }

  /**
   * Check if callback should be triggered based on thresholds
   */
  private shouldTriggerCallback(
    currentRatio: number,
    lastRatio: number,
    isIntersecting: boolean,
    wasIntersecting: boolean
  ): boolean {
    // Always trigger on first observation
    if (lastRatio === 0 && !wasIntersecting) {
      return true;
    }

    // Check if intersection state changed
    if (isIntersecting !== wasIntersecting) {
      return true;
    }

    // Check if any threshold was crossed
    for (const threshold of this.thresholds) {
      if ((lastRatio < threshold && currentRatio >= threshold) ||
          (lastRatio > threshold && currentRatio <= threshold)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Normalize threshold values
   */
  private normalizeThresholds(threshold?: number | number[]): number[] {
    if (threshold === undefined) return [0];
    if (typeof threshold === 'number') return [threshold];
    return threshold.slice().sort((a, b) => a - b);
  }

  /**
   * Parse root margin string
   */
  private parseRootMargin(margin: string): { top: number; right: number; bottom: number; left: number } {
    const values = margin.split(/\s+/).map(value => {
      const num = parseFloat(value);
      return value.endsWith('%') ? (num / 100) * window.innerHeight : num;
    });

    switch (values.length) {
      case 1: return { top: values[0]!, right: values[0]!, bottom: values[0]!, left: values[0]! };
      case 2: return { top: values[0]!, right: values[1]!, bottom: values[0]!, left: values[1]! };
      case 3: return { top: values[0]!, right: values[1]!, bottom: values[2]!, left: values[1]! };
      case 4: return { top: values[0]!, right: values[1]!, bottom: values[2]!, left: values[3]! };
      default: return { top: 0, right: 0, bottom: 0, left: 0 };
    }
  }

  /**
   * Create a DOMRectReadOnly-like object
   */
  private createDOMRectReadOnly(rect: DOMRect): DOMRectReadOnly {
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      toJSON: () => ({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left
      })
    };
  }
}

// Add static method for feature detection
(IntersectionObserverPolyfill as any).isSupported = (): boolean => {
  return typeof IntersectionObserver !== 'undefined';
};
