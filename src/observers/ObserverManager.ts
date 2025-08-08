/**
 * Observer Manager for ProteusJS
 * Manages ResizeObserver and IntersectionObserver instances efficiently
 */

import type { ResizeCallback, IntersectionCallback } from '../types';
import { ResizeObserverPolyfill } from './ResizeObserverPolyfill';
import { IntersectionObserverPolyfill } from './IntersectionObserverPolyfill';

export interface ObserverEntry {
  element: Element;
  callback: ResizeCallback | IntersectionCallback;
  options?: ResizeObserverOptions | IntersectionObserverInit;
}

export class ObserverManager {
  private resizeObservers: Map<string, ResizeObserver> = new Map();
  private intersectionObservers: Map<string, IntersectionObserver> = new Map();
  private resizeEntries: Map<Element, ObserverEntry> = new Map();
  private intersectionEntries: Map<Element, ObserverEntry> = new Map();
  private isPolyfillMode: boolean = false;

  constructor() {
    this.checkPolyfillNeeds();
  }

  /**
   * Observe element for resize changes
   */
  public observeResize(
    element: Element, 
    callback: ResizeCallback, 
    options?: ResizeObserverOptions
  ): () => void {
    const observerKey = this.getResizeObserverKey(options);
    let observer = this.resizeObservers.get(observerKey);

    if (!observer) {
      observer = this.createResizeObserver(options);
      this.resizeObservers.set(observerKey, observer);
    }

    // Store entry for cleanup
    const entry: ObserverEntry = {
      element,
      callback: callback as any,
      ...(options && { options })
    };
    this.resizeEntries.set(element, entry);

    // Start observing
    observer.observe(element, options);

    // Return unobserve function
    return () => this.unobserveResize(element);
  }

  /**
   * Observe element for intersection changes
   */
  public observeIntersection(
    element: Element,
    callback: IntersectionCallback,
    options?: IntersectionObserverInit
  ): () => void {
    const observerKey = this.getIntersectionObserverKey(options);
    let observer = this.intersectionObservers.get(observerKey);

    if (!observer) {
      observer = this.createIntersectionObserver(callback, options);
      this.intersectionObservers.set(observerKey, observer);
    }

    // Store entry for cleanup
    const entry: ObserverEntry = {
      element,
      callback: callback as any,
      ...(options && { options })
    };
    this.intersectionEntries.set(element, entry);

    // Start observing
    observer.observe(element);

    // Return unobserve function
    return () => this.unobserveIntersection(element);
  }

  /**
   * Stop observing element for resize changes
   */
  public unobserveResize(element: Element): void {
    const entry = this.resizeEntries.get(element);
    if (!entry) return;

    const observerKey = this.getResizeObserverKey(entry.options as ResizeObserverOptions);
    const observer = this.resizeObservers.get(observerKey);
    
    if (observer) {
      observer.unobserve(element);
    }

    this.resizeEntries.delete(element);
    this.cleanupResizeObserver(observerKey);
  }

  /**
   * Stop observing element for intersection changes
   */
  public unobserveIntersection(element: Element): void {
    const entry = this.intersectionEntries.get(element);
    if (!entry) return;

    const observerKey = this.getIntersectionObserverKey(entry.options as IntersectionObserverInit);
    const observer = this.intersectionObservers.get(observerKey);
    
    if (observer) {
      observer.unobserve(element);
    }

    this.intersectionEntries.delete(element);
    this.cleanupIntersectionObserver(observerKey);
  }

  /**
   * Get total number of observed elements
   */
  public getObservedElementCount(): number {
    return this.resizeEntries.size + this.intersectionEntries.size;
  }

  /**
   * Get number of active observers
   */
  public getObserverCount(): number {
    return this.resizeObservers.size + this.intersectionObservers.size;
  }

  /**
   * Check if element is being observed for resize
   */
  public isObservingResize(element: Element): boolean {
    return this.resizeEntries.has(element);
  }

  /**
   * Check if element is being observed for intersection
   */
  public isObservingIntersection(element: Element): boolean {
    return this.intersectionEntries.has(element);
  }

  /**
   * Disconnect all observers and clean up
   */
  public destroy(): void {
    // Disconnect all resize observers
    this.resizeObservers.forEach(observer => observer.disconnect());
    this.resizeObservers.clear();
    this.resizeEntries.clear();

    // Disconnect all intersection observers
    this.intersectionObservers.forEach(observer => observer.disconnect());
    this.intersectionObservers.clear();
    this.intersectionEntries.clear();
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): object {
    return {
      isPolyfillMode: this.isPolyfillMode,
      resizeObservers: this.resizeObservers.size,
      intersectionObservers: this.intersectionObservers.size,
      resizeEntries: this.resizeEntries.size,
      intersectionEntries: this.intersectionEntries.size,
      totalObservedElements: this.getObservedElementCount(),
      totalObservers: this.getObserverCount()
    };
  }

  /**
   * Check if polyfills are needed and set up accordingly
   */
  private checkPolyfillNeeds(): void {
    if (typeof ResizeObserver === 'undefined') {
      this.setupResizeObserverPolyfill();
      this.isPolyfillMode = true;
    }

    if (typeof IntersectionObserver === 'undefined') {
      this.setupIntersectionObserverPolyfill();
      this.isPolyfillMode = true;
    }
  }

  /**
   * Set up ResizeObserver polyfill
   */
  private setupResizeObserverPolyfill(): void {
    (globalThis as any).ResizeObserver = ResizeObserverPolyfill;
  }

  /**
   * Set up IntersectionObserver polyfill
   */
  private setupIntersectionObserverPolyfill(): void {
    (globalThis as any).IntersectionObserver = IntersectionObserverPolyfill;
  }

  /**
   * Create a new ResizeObserver instance
   */
  private createResizeObserver(_options?: ResizeObserverOptions): ResizeObserver {
    return new ResizeObserver((entries) => {
      entries.forEach(entry => {
        const storedEntry = this.resizeEntries.get(entry.target);
        if (storedEntry) {
          (storedEntry.callback as ResizeCallback)(entry);
        }
      });
    });
  }

  /**
   * Create a new IntersectionObserver instance
   */
  private createIntersectionObserver(
    _callback: IntersectionCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const storedEntry = this.intersectionEntries.get(entry.target);
        if (storedEntry) {
          (storedEntry.callback as IntersectionCallback)(entry);
        }
      });
    }, options);
  }

  /**
   * Generate key for ResizeObserver based on options
   */
  private getResizeObserverKey(options?: ResizeObserverOptions): string {
    if (!options) return 'default';
    return `box:${options.box || 'content-box'}`;
  }

  /**
   * Generate key for IntersectionObserver based on options
   */
  private getIntersectionObserverKey(options?: IntersectionObserverInit): string {
    if (!options) return 'default';
    
    const root = options.root ? 'custom' : 'viewport';
    const rootMargin = options.rootMargin || '0px';
    const threshold = Array.isArray(options.threshold) 
      ? options.threshold.join(',') 
      : (options.threshold || 0).toString();
    
    return `${root}:${rootMargin}:${threshold}`;
  }

  /**
   * Clean up ResizeObserver if no longer needed
   */
  private cleanupResizeObserver(observerKey: string): void {
    const hasElements = Array.from(this.resizeEntries.values()).some(
      entry => this.getResizeObserverKey(entry.options as ResizeObserverOptions) === observerKey
    );

    if (!hasElements) {
      const observer = this.resizeObservers.get(observerKey);
      if (observer) {
        observer.disconnect();
        this.resizeObservers.delete(observerKey);
      }
    }
  }

  /**
   * Clean up IntersectionObserver if no longer needed
   */
  private cleanupIntersectionObserver(observerKey: string): void {
    const hasElements = Array.from(this.intersectionEntries.values()).some(
      entry => this.getIntersectionObserverKey(entry.options as IntersectionObserverInit) === observerKey
    );

    if (!hasElements) {
      const observer = this.intersectionObservers.get(observerKey);
      if (observer) {
        observer.disconnect();
        this.intersectionObservers.delete(observerKey);
      }
    }
  }
}
