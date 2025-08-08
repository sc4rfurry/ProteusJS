/**
 * ContainerBreakpoints - Breakpoint management system for container queries
 * Handles breakpoint registration, monitoring, and callback execution
 */

import { logger } from '../utils/Logger';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';

export interface BreakpointMap {
  [key: string]: string;
}

export interface BreakpointConfig {
  element: Element;
  breakpoints: BreakpointMap;
  callback?: BreakpointCallback;
  currentBreakpoint?: string;
  parsedBreakpoints: ParsedBreakpoint[];
}

export interface ParsedBreakpoint {
  name: string;
  value: number;
  unit: string;
  type: 'min' | 'max';
  originalValue: string;
}

export interface BreakpointCallbackData {
  width: number;
  height: number;
  breakpoint: string;
  previousBreakpoint?: string;
  element: Element;
}

export type BreakpointCallback = (breakpoint: string, data: BreakpointCallbackData) => void;

export class ContainerBreakpoints {
  private breakpoints: Map<string, BreakpointConfig> = new Map();
  private observer: ResizeObserver | null = null;
  private idCounter: number = 0;
  private cssRules: Map<string, CSSStyleSheet> = new Map();
  private performanceMonitor?: PerformanceMonitor;
  private performanceMetrics: {
    evaluationTimes: number[];
    averageTime: number;
    totalEvaluations: number;
  } = {
    evaluationTimes: [],
    averageTime: 0,
    totalEvaluations: 0
  };

  constructor() {
    this.setupResizeObserver();
    this.setupPerformanceMonitoring();
    this.injectBaseCSS();
  }

  /**
   * Set performance monitor for integration
   */
  public setPerformanceMonitor(monitor: PerformanceMonitor): void {
    this.performanceMonitor = monitor;
  }

  /**
   * Register breakpoints for a container element (alias for register)
   */
  public registerContainer(
    element: Element,
    breakpoints: BreakpointMap,
    callback?: BreakpointCallback
  ): string {
    return this.register(element, breakpoints, callback);
  }

  /**
   * Register breakpoints for a container element
   */
  public register(
    element: Element,
    breakpoints: BreakpointMap,
    callback?: BreakpointCallback
  ): string {
    const id = this.generateId();
    
    try {
      const parsedBreakpoints = this.parseBreakpoints(breakpoints);
      const config: BreakpointConfig = {
        element,
        breakpoints,
        ...(callback && { callback }),
        parsedBreakpoints
      };

      this.breakpoints.set(id, config);

      // Start observing the element
      if (this.observer) {
        this.observer.observe(element);
      }

      // Set initial breakpoint
      this.updateBreakpoint(id);

      return id;
    } catch (error) {
      logger.error('Failed to register breakpoints', error);
      return '';
    }
  }

  /**
   * Update container breakpoints (alias for updateElement)
   */
  public updateContainer(element: Element): void {
    this.updateElement(element);
  }

  /**
   * Unregister breakpoints for an element
   */
  public unregister(id: string): void {
    const config = this.breakpoints.get(id);
    if (!config) return;

    // Stop observing the element if no other configs use it
    const elementStillUsed = Array.from(this.breakpoints.values())
      .some(c => c !== config && c.element === config.element);

    if (!elementStillUsed && this.observer) {
      this.observer.unobserve(config.element);
    }

    // Remove CSS classes
    this.removeBreakpointClasses(config.element, config.parsedBreakpoints);

    this.breakpoints.delete(id);
  }

  /**
   * Get current breakpoint for a registered element
   */
  public getCurrentBreakpoint(id: string): string | null {
    const config = this.breakpoints.get(id);
    return config?.currentBreakpoint || null;
  }

  /**
   * Update breakpoints for a specific element
   */
  public updateElement(element: Element): void {
    for (const [id, config] of this.breakpoints) {
      if (config.element === element) {
        this.updateBreakpoint(id);
      }
    }
  }

  /**
   * Get all registered breakpoint configurations
   */
  public getAllConfigs(): Map<string, BreakpointConfig> {
    return new Map(this.breakpoints);
  }

  // destroy method moved to end of class with enhanced functionality

  /**
   * Setup ResizeObserver to monitor element size changes
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      logger.warn('ResizeObserver not supported. Container breakpoints may not work correctly.');
      return;
    }

    this.observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.updateElement(entry.target);
      }
    });
  }

  /**
   * Generate unique ID for breakpoint registration
   */
  private generateId(): string {
    return `proteus-breakpoint-${++this.idCounter}-${Date.now()}`;
  }

  /**
   * Parse breakpoint values into standardized format
   */
  private parseBreakpoints(breakpoints: BreakpointMap): ParsedBreakpoint[] {
    const parsed: ParsedBreakpoint[] = [];

    for (const [name, value] of Object.entries(breakpoints)) {
      try {
        const parsedValue = this.parseBreakpointValue(value);
        parsed.push({
          name,
          value: parsedValue.value,
          unit: parsedValue.unit,
          type: parsedValue.type,
          originalValue: value
        });
      } catch (error) {
        logger.warn(`Invalid breakpoint value "${value}" for "${name}"`, error);
      }
    }

    // Sort by value (ascending)
    parsed.sort((a, b) => a.value - b.value);

    return parsed;
  }

  /**
   * Parse individual breakpoint value
   */
  private parseBreakpointValue(value: string): { value: number; unit: string; type: 'min' | 'max' } {
    // Handle media query syntax like "(max-width: 200px)" or "(min-width: 400px)"
    const mediaQueryMatch = value.match(/\((min|max)-width:\s*(\d+(?:\.\d+)?)(px|em|rem|%|vw|vh|ch|cw|cmin|cmax)?\)/);

    if (mediaQueryMatch) {
      const type = mediaQueryMatch[1] as 'min' | 'max';
      const numericValue = parseFloat(mediaQueryMatch[2]!);
      const unit = mediaQueryMatch[3] || 'px';

      return { value: numericValue, unit, type };
    }

    // Handle simple numeric values like "200px"
    const simpleMatch = value.match(/^(\d+(?:\.\d+)?)(px|em|rem|%|vw|vh|ch|cw|cmin|cmax)?$/);

    if (!simpleMatch) {
      throw new Error(`Invalid breakpoint value: ${value}`);
    }

    const numericValue = parseFloat(simpleMatch[1]!);
    const unit = simpleMatch[2] || 'px';

    // Convert relative units to pixels for comparison
    let pixelValue = numericValue;

    switch (unit) {
      case 'em':
      case 'rem':
        pixelValue = numericValue * 16; // Assume 16px base font size
        break;
      case 'vw':
        pixelValue = (numericValue / 100) * window.innerWidth;
        break;
      case 'vh':
        pixelValue = (numericValue / 100) * window.innerHeight;
        break;
      case '%':
        // For percentage, we'll need the parent element context
        // For now, treat as pixels
        pixelValue = numericValue;
        break;
      case 'px':
      default:
        pixelValue = numericValue;
        break;
    }

    return { value: pixelValue, unit, type: 'min' }; // Default to min-width for simple values
  }

  /**
   * Update breakpoint for a specific configuration
   */
  private updateBreakpoint(id: string): void {
    const config = this.breakpoints.get(id);
    if (!config) return;

    const rect = config.element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Determine current breakpoint
    const currentBreakpoint = this.determineBreakpoint(width, config.parsedBreakpoints);
    const previousBreakpoint = config.currentBreakpoint;

    // Record performance metrics
    if (this.performanceMonitor) {
      this.performanceMonitor.recordOperation();
    }

    // Only update if breakpoint changed
    if (currentBreakpoint !== previousBreakpoint) {
      config.currentBreakpoint = currentBreakpoint;

      // Update CSS classes
      this.updateBreakpointClasses(config.element, currentBreakpoint, config.parsedBreakpoints);

      // Call callback if provided
      if (config.callback) {
        try {
          // Create callback data object with core properties
          const callbackData: any = {
            width,
            height,
            breakpoint: currentBreakpoint
          };

          // Add optional properties only if they exist
          if (previousBreakpoint) {
            callbackData.previousBreakpoint = previousBreakpoint;
          }

          // Add element reference for advanced use cases
          callbackData.element = config.element;

          config.callback(currentBreakpoint, callbackData);
        } catch (error) {
          logger.error('Error in breakpoint callback', error);
        }
      }

      // Dispatch custom event
      this.dispatchBreakpointEvent(config.element, currentBreakpoint, {
        width,
        height,
        breakpoint: currentBreakpoint,
        ...(previousBreakpoint && { previousBreakpoint }),
        element: config.element
      });
    }
  }

  /**
   * Determine which breakpoint applies to the current width
   */
  private determineBreakpoint(width: number, breakpoints: ParsedBreakpoint[]): string {
    let activeBreakpoint = 'default';

    // Separate min-width and max-width breakpoints
    const minWidthBreakpoints = breakpoints.filter(bp => bp.type === 'min');
    const maxWidthBreakpoints = breakpoints.filter(bp => bp.type === 'max');

    // For min-width breakpoints, find the largest one that matches
    // (iterate in reverse order since they're sorted ascending)
    for (let i = minWidthBreakpoints.length - 1; i >= 0; i--) {
      const breakpoint = minWidthBreakpoints[i];
      if (breakpoint && width >= breakpoint.value) {
        activeBreakpoint = breakpoint.name;
        break;
      }
    }

    // For max-width breakpoints, find the first one that matches
    // (iterate in normal order since they're sorted ascending)
    for (const breakpoint of maxWidthBreakpoints) {
      if (width <= breakpoint.value) {
        return breakpoint.name; // Max-width takes precedence
      }
    }

    return activeBreakpoint;
  }

  /**
   * Update CSS classes on element based on current breakpoint
   */
  private updateBreakpointClasses(
    element: Element, 
    currentBreakpoint: string, 
    breakpoints: ParsedBreakpoint[]
  ): void {
    // Remove all existing breakpoint classes
    this.removeBreakpointClasses(element, breakpoints);

    // Add current breakpoint class
    element.classList.add(`proteus-${currentBreakpoint}`);
    element.setAttribute('data-proteus-breakpoint', currentBreakpoint);
    element.setAttribute('data-container', currentBreakpoint); // For test compatibility
  }

  /**
   * Remove all breakpoint classes from element
   */
  private removeBreakpointClasses(element: Element, breakpoints: ParsedBreakpoint[]): void {
    for (const breakpoint of breakpoints) {
      element.classList.remove(`proteus-${breakpoint.name}`);
    }
    element.removeAttribute('data-proteus-breakpoint');
    element.removeAttribute('data-container'); // Remove test compatibility attribute
  }

  /**
   * Dispatch custom breakpoint change event
   */
  private dispatchBreakpointEvent(
    element: Element,
    _breakpoint: string,
    data: BreakpointCallbackData
  ): void {
    const event = new CustomEvent('proteus:breakpoint-change', {
      detail: data,
      bubbles: true
    });

    element.dispatchEvent(event);
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): {
    totalRegistrations: number;
    activeElements: number;
    averageBreakpoints: number;
    breakpointDistribution: Record<string, number>;
  } {
    const configs = Array.from(this.breakpoints.values());
    const breakpointDistribution: Record<string, number> = {};

    configs.forEach(config => {
      config.parsedBreakpoints.forEach(bp => {
        breakpointDistribution[bp.name] = (breakpointDistribution[bp.name] || 0) + 1;
      });
    });

    const averageBreakpoints = configs.length > 0
      ? configs.reduce((sum, c) => sum + c.parsedBreakpoints.length, 0) / configs.length
      : 0;

    return {
      totalRegistrations: configs.length,
      activeElements: new Set(configs.map(c => c.element)).size,
      averageBreakpoints,
      breakpointDistribution
    };
  }

  /**
   * Register multiple breakpoint sets at once
   */
  public registerMultiple(
    registrations: Array<{
      element: Element;
      breakpoints: BreakpointMap;
      callback?: BreakpointCallback;
    }>
  ): string[] {
    return registrations.map(reg =>
      this.register(reg.element, reg.breakpoints, reg.callback)
    );
  }

  /**
   * Unregister all breakpoints for an element
   */
  public unregisterElement(element: Element): void {
    const idsToRemove: string[] = [];

    for (const [id, config] of this.breakpoints) {
      if (config.element === element) {
        idsToRemove.push(id);
      }
    }

    idsToRemove.forEach(id => this.unregister(id));
  }

  /**
   * Get all active breakpoints across all elements
   */
  public getAllActiveBreakpoints(): Array<{
    id: string;
    element: Element;
    breakpoint: string;
    width: number;
    height: number;
  }> {
    const active: Array<{
      id: string;
      element: Element;
      breakpoint: string;
      width: number;
      height: number;
    }> = [];

    for (const [id, config] of this.breakpoints) {
      if (config.currentBreakpoint) {
        const rect = config.element.getBoundingClientRect();
        active.push({
          id,
          element: config.element,
          breakpoint: config.currentBreakpoint,
          width: rect.width,
          height: rect.height
        });
      }
    }

    return active;
  }

  /**
   * Force update all breakpoints
   */
  public updateAll(): void {
    for (const id of this.breakpoints.keys()) {
      this.updateBreakpoint(id);
    }
  }

  /**
   * Setup performance monitoring for container queries
   */
  private setupPerformanceMonitoring(): void {
    // Monitor performance metrics
    setInterval(() => {
      if (this.performanceMetrics.evaluationTimes.length > 0) {
        this.performanceMetrics.averageTime =
          this.performanceMetrics.evaluationTimes.reduce((a, b) => a + b, 0) /
          this.performanceMetrics.evaluationTimes.length;

        // Log performance warnings
        if (this.performanceMetrics.averageTime > 5) {
          logger.warn(`Container query evaluation taking ${this.performanceMetrics.averageTime.toFixed(2)}ms on average`);
        }

        // Reset metrics periodically
        if (this.performanceMetrics.evaluationTimes.length > 100) {
          this.performanceMetrics.evaluationTimes = this.performanceMetrics.evaluationTimes.slice(-50);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Inject base CSS for container query functionality
   */
  private injectBaseCSS(): void {
    const style = document.createElement('style');
    style.id = 'proteus-container-queries';
    style.textContent = `
      /* Base container query styles */
      [data-proteus-container] {
        container-type: inline-size;
        position: relative;
      }

      /* Performance optimizations */
      [data-proteus-container] * {
        contain: layout style;
      }

      /* Responsive utility classes */
      .proteus-container-small { /* Applied when container is small */ }
      .proteus-container-medium { /* Applied when container is medium */ }
      .proteus-container-large { /* Applied when container is large */ }

      /* Transition support */
      [data-proteus-container] {
        transition: all 0.2s ease-out;
      }

      /* Debug mode styles */
      [data-proteus-debug="true"] {
        outline: 2px dashed rgba(255, 0, 0, 0.3);
        position: relative;
      }

      [data-proteus-debug="true"]::before {
        content: attr(data-proteus-breakpoint);
        position: absolute;
        top: 0;
        left: 0;
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        font-family: monospace;
        z-index: 9999;
        pointer-events: none;
      }
    `;

    // Only inject if not already present
    if (!document.getElementById('proteus-container-queries')) {
      document.head.appendChild(style);
    }
  }

  /**
   * Generate responsive CSS classes for a container
   */
  public generateResponsiveCSS(elementId: string, breakpoints: BreakpointMap): void {
    const cssRules: string[] = [];

    Object.entries(breakpoints).forEach(([name, query]) => {
      // Generate container query CSS
      const containerQuery = this.parseContainerQuery(query);
      if (containerQuery) {
        cssRules.push(`
          @container (${containerQuery}) {
            [data-proteus-id="${elementId}"] {
              --proteus-breakpoint: "${name}";
            }

            [data-proteus-id="${elementId}"] .proteus-${name} {
              display: block;
            }

            [data-proteus-id="${elementId}"] .proteus-not-${name} {
              display: none;
            }
          }
        `);
      }
    });

    // Inject CSS if we have rules
    if (cssRules.length > 0) {
      this.injectContainerCSS(elementId, cssRules.join('\n'));
    }
  }

  /**
   * Parse container query string
   */
  private parseContainerQuery(query: string): string | null {
    // Convert media query syntax to container query syntax
    const containerQuery = query
      .replace(/max-width/g, 'max-inline-size')
      .replace(/min-width/g, 'min-inline-size')
      .replace(/width/g, 'inline-size')
      .replace(/max-height/g, 'max-block-size')
      .replace(/min-height/g, 'min-block-size')
      .replace(/height/g, 'block-size');

    return containerQuery;
  }

  /**
   * Inject container-specific CSS
   */
  private injectContainerCSS(elementId: string, css: string): void {
    const styleId = `proteus-container-${elementId}`;
    let style = document.getElementById(styleId) as HTMLStyleElement;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = css;

    // Store reference for cleanup
    if (style.sheet) {
      this.cssRules.set(elementId, style.sheet);
    }
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetric(evaluationTime: number): void {
    this.performanceMetrics.evaluationTimes.push(evaluationTime);
    this.performanceMetrics.totalEvaluations++;

    // Keep only recent measurements
    if (this.performanceMetrics.evaluationTimes.length > 100) {
      this.performanceMetrics.evaluationTimes.shift();
    }
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Enable debug mode for container queries
   */
  public enableDebugMode(enable: boolean = true): void {
    this.breakpoints.forEach((config) => {
      const element = config.element as HTMLElement;
      if (enable) {
        element.setAttribute('data-proteus-debug', 'true');
      } else {
        element.removeAttribute('data-proteus-debug');
      }
    });
  }

  /**
   * Cleanup resources when destroying
   */
  public destroy(): void {
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clean up CSS rules
    this.cssRules.forEach((_, elementId) => {
      const styleElement = document.getElementById(`proteus-container-${elementId}`);
      if (styleElement) {
        styleElement.remove();
      }
    });

    // Clear maps
    this.breakpoints.clear();
    this.cssRules.clear();

    // Remove base CSS
    const baseStyle = document.getElementById('proteus-container-queries');
    if (baseStyle) {
      baseStyle.remove();
    }
  }
}
