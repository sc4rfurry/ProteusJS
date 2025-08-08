/**
 * ResizeObserver Polyfill for ProteusJS
 * Provides ResizeObserver functionality for browsers that don't support it
 */

export interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize?: ResizeObserverSize[];
  contentBoxSize?: ResizeObserverSize[];
  devicePixelContentBoxSize?: ResizeObserverSize[];
}

export interface ResizeObserverSize {
  inlineSize: number;
  blockSize: number;
}

export type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;

export class ResizeObserverPolyfill {
  private callback: ResizeObserverCallback;
  private observedElements: Map<Element, { lastWidth: number; lastHeight: number }> = new Map();
  private rafId: number | null = null;
  private isObserving: boolean = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  /**
   * Start observing an element for resize changes
   */
  public observe(element: Element, options?: ResizeObserverOptions): void {
    if (this.observedElements.has(element)) return;

    const rect = element.getBoundingClientRect();
    this.observedElements.set(element, {
      lastWidth: rect.width,
      lastHeight: rect.height
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
    this.checkForChanges();
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
   * Check for size changes in observed elements
   */
  private checkForChanges(): void {
    if (!this.isObserving) return;

    const changedEntries: ResizeObserverEntry[] = [];

    this.observedElements.forEach((lastSize, element) => {
      // Check if element is still in DOM
      if (!document.contains(element)) {
        this.observedElements.delete(element);
        return;
      }

      const rect = element.getBoundingClientRect();
      const currentWidth = rect.width;
      const currentHeight = rect.height;

      if (currentWidth !== lastSize.lastWidth || currentHeight !== lastSize.lastHeight) {
        // Update stored size
        this.observedElements.set(element, {
          lastWidth: currentWidth,
          lastHeight: currentHeight
        });

        // Create entry
        const entry: ResizeObserverEntry = {
          target: element,
          contentRect: this.createDOMRectReadOnly(rect),
          contentBoxSize: [{
            inlineSize: currentWidth,
            blockSize: currentHeight
          }],
          borderBoxSize: [{
            inlineSize: currentWidth,
            blockSize: currentHeight
          }]
        };

        changedEntries.push(entry);
      }
    });

    // Call callback if there are changes
    if (changedEntries.length > 0) {
      try {
        this.callback(changedEntries);
      } catch (error) {
        console.error('ResizeObserver callback error:', error);
      }
    }

    // Schedule next check
    if (this.isObserving) {
      this.rafId = requestAnimationFrame(() => this.checkForChanges());
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
(ResizeObserverPolyfill as any).isSupported = (): boolean => {
  return typeof ResizeObserver !== 'undefined';
};
