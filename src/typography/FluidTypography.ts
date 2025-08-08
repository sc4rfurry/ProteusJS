/**
 * FluidTypography - Intelligent fluid typography system
 * Provides clamp-based scaling, container-relative typography, and accessibility compliance
 */

import { logger } from '../utils/Logger';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';

export interface FluidConfig {
  minSize: number;
  maxSize: number;
  minViewport?: number;
  maxViewport?: number;
  scalingFunction?: 'linear' | 'exponential';
  accessibility?: 'none' | 'AA' | 'AAA';
  enforceAccessibility?: boolean;
  respectUserPreferences?: boolean;
}

export interface ContainerBasedConfig {
  minSize: number;
  maxSize: number;
  containerElement?: Element;
  minContainerWidth?: number;
  maxContainerWidth?: number;
  accessibility?: 'none' | 'AA' | 'AAA';
}

export interface TextFittingConfig {
  maxWidth: number;
  minSize: number;
  maxSize: number;
  allowOverflow?: boolean;
  wordBreak?: 'normal' | 'break-all' | 'keep-all';
}

export class FluidTypography {
  private appliedElements: WeakSet<Element> = new WeakSet();
  private resizeObserver: ResizeObserver | null = null;
  private containerConfigs: Map<Element, ContainerBasedConfig> = new Map();
  private performanceMonitor?: PerformanceMonitor;

  constructor() {
    this.setupResizeObserver();
  }

  /**
   * Set performance monitor for integration
   */
  public setPerformanceMonitor(monitor: PerformanceMonitor): void {
    this.performanceMonitor = monitor;
  }

  /**
   * Generate a typographic scale
   */
  public generateTypographicScale(config: {
    baseSize: number;
    ratio: number;
    steps?: number;
  }): number[] {
    const { baseSize, ratio, steps = 5 } = config;
    const scale: number[] = [];

    // Generate scale steps as array of numbers
    for (let i = 0; i < steps; i++) {
      const size = baseSize * Math.pow(ratio, i);
      scale.push(parseFloat(size.toFixed(2)));
    }

    return scale;
  }

  /**
   * Apply fluid scaling using CSS clamp()
   */
  public applyFluidScaling(element: Element, config: FluidConfig): void {
    const {
      minSize,
      maxSize,
      minViewport = 320,
      maxViewport = 1200,
      scalingFunction = 'linear',
      accessibility = 'AAA',
      enforceAccessibility = true,
      respectUserPreferences = true
    } = config;

    try {
      // Validate and adjust sizes for accessibility
      const adjustedSizes = this.enforceAccessibilityConstraints(
        minSize, 
        maxSize, 
        accessibility, 
        enforceAccessibility
      );

      // Apply user preference scaling if enabled
      const finalSizes = respectUserPreferences 
        ? this.applyUserPreferences(adjustedSizes.minSize, adjustedSizes.maxSize)
        : adjustedSizes;

      // Generate clamp() CSS value or static value for small ranges
      let fontValue: string;

      // If the size range is very small (2px or less), use static value
      if (Math.abs(finalSizes.maxSize - finalSizes.minSize) <= 2) {
        fontValue = `${finalSizes.minSize}px`;
      } else {
        fontValue = this.generateClampValue(
          finalSizes.minSize,
          finalSizes.maxSize,
          minViewport,
          maxViewport,
          scalingFunction
        );
      }

      // Apply to element
      this.applyFontSize(element, fontValue);
      this.appliedElements.add(element);

      // Record performance metrics
      if (this.performanceMonitor) {
        this.performanceMonitor.recordOperation();
      }

      // Add data attributes for debugging
      element.setAttribute('data-proteus-fluid', 'true');
      element.setAttribute('data-proteus-min-size', finalSizes.minSize.toString());
      element.setAttribute('data-proteus-max-size', finalSizes.maxSize.toString());

    } catch (error) {
      logger.error('Failed to apply fluid scaling', error);
    }
  }

  /**
   * Apply container-based typography scaling
   */
  public applyContainerBasedScaling(element: Element, config: ContainerBasedConfig): void {
    try {
      const container = config.containerElement || this.findNearestContainer(element);
      if (!container) {
        logger.warn('No container found for container-based scaling');
        return;
      }

      // Store config for resize updates
      this.containerConfigs.set(element, config);

      // Start observing container
      if (this.resizeObserver) {
        this.resizeObserver.observe(container);
      }

      // Apply initial scaling
      this.updateContainerBasedScaling(element, container, config);

      this.appliedElements.add(element);

    } catch (error) {
      logger.error('Failed to apply container-based scaling', error);
    }
  }

  /**
   * Fit text to container width
   */
  public fitTextToContainer(element: Element, config: TextFittingConfig): void {
    const {
      maxWidth,
      minSize,
      maxSize,
      allowOverflow = false,
      wordBreak = 'normal'
    } = config;

    try {
      // Measure text width at different sizes
      const optimalSize = this.calculateOptimalTextSize(element, maxWidth, minSize, maxSize);

      // Apply the calculated size
      this.applyFontSize(element, `${optimalSize}px`);

      // Handle overflow
      if (!allowOverflow) {
        const htmlElement = element as HTMLElement;
        htmlElement.style.overflow = 'hidden';
        htmlElement.style.textOverflow = 'ellipsis';
        htmlElement.style.wordBreak = wordBreak;
      }

      this.appliedElements.add(element);

    } catch (error) {
      logger.error('Failed to fit text to container', error);
    }
  }

  /**
   * Remove fluid typography from element
   */
  public removeFluidScaling(element: Element): void {
    if (!this.appliedElements.has(element)) return;

    // Remove font-size style
    const style = element.getAttribute('style');
    if (style) {
      const newStyle = style.replace(/font-size:[^;]+;?/g, '');
      if (newStyle.trim()) {
        element.setAttribute('style', newStyle);
      } else {
        element.removeAttribute('style');
      }
    }

    // Remove data attributes
    element.removeAttribute('data-proteus-fluid');
    element.removeAttribute('data-proteus-min-size');
    element.removeAttribute('data-proteus-max-size');

    this.appliedElements.delete(element);
    this.containerConfigs.delete(element);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.containerConfigs = new Map();
  }

  /**
   * Setup ResizeObserver for container-based scaling
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      logger.warn('ResizeObserver not supported. Container-based typography may not work correctly.');
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.handleContainerResize(entry.target);
      }
    });
  }

  /**
   * Handle container resize for container-based scaling
   */
  private handleContainerResize(container: Element): void {
    // Find all elements using this container
    for (const [element, config] of this.containerConfigs) {
      const elementContainer = config.containerElement || this.findNearestContainer(element);
      if (elementContainer === container) {
        this.updateContainerBasedScaling(element, container, config);
      }
    }
  }

  /**
   * Update container-based scaling when container resizes
   */
  private updateContainerBasedScaling(
    element: Element, 
    container: Element, 
    config: ContainerBasedConfig
  ): void {
    const containerWidth = container.getBoundingClientRect().width;
    const {
      minSize,
      maxSize,
      minContainerWidth = 300,
      maxContainerWidth = 800,
      accessibility = 'AA'
    } = config;

    // Calculate scale factor based on container width
    const scaleFactor = Math.max(0, Math.min(1, 
      (containerWidth - minContainerWidth) / (maxContainerWidth - minContainerWidth)
    ));

    // Calculate font size
    let fontSize = minSize + (maxSize - minSize) * scaleFactor;

    // Apply accessibility constraints
    const adjustedSizes = this.enforceAccessibilityConstraints(fontSize, fontSize, accessibility, true);
    fontSize = adjustedSizes.minSize;

    // Apply to element
    this.applyFontSize(element, `${fontSize}px`);
  }

  /**
   * Generate CSS clamp() value
   */
  private generateClampValue(
    minSize: number,
    maxSize: number,
    minViewport: number,
    maxViewport: number,
    scalingFunction: 'linear' | 'exponential'
  ): string {
    // Validate inputs to prevent NaN
    if (!Number.isFinite(minSize) || !Number.isFinite(maxSize) ||
        !Number.isFinite(minViewport) || !Number.isFinite(maxViewport)) {
      logger.warn('Invalid numeric inputs for clamp calculation');
      return `${Number.isFinite(minSize) ? minSize : 16}px`; // Fallback to static size
    }

    if (minViewport >= maxViewport) {
      logger.warn('Invalid viewport range: minViewport must be less than maxViewport');
      return `${minSize}px`; // Fallback to static size
    }

    if (minSize >= maxSize) {
      logger.warn('Invalid size range: minSize must be less than maxSize');
      return `${minSize}px`; // Fallback to static size
    }

    if (scalingFunction === 'exponential') {
      // For exponential scaling, use a more complex calculation
      const midSize = Math.sqrt(minSize * maxSize);
      const midViewport = Math.sqrt(minViewport * maxViewport);

      // Ensure we don't divide by zero
      const viewportDiff = midViewport - minViewport;
      if (viewportDiff === 0) {
        return `${minSize}px`;
      }

      return `clamp(${minSize}px, ${minSize}px + (${midSize - minSize}) * ((100vw - ${minViewport}px) / ${viewportDiff}px), ${maxSize}px)`;
    }

    // Linear scaling (default)
    const viewportRange = maxViewport - minViewport;
    const sizeRange = maxSize - minSize;

    // Ensure we don't divide by zero
    if (viewportRange === 0) {
      return `${minSize}px`;
    }

    // Calculate slope (change in size per viewport unit)
    const slope = sizeRange / viewportRange;

    // Calculate y-intercept (size when viewport is 0)
    const yIntercept = minSize - slope * minViewport;

    // Validate calculated values
    if (!Number.isFinite(slope) || !Number.isFinite(yIntercept)) {
      logger.warn('Invalid clamp calculation, falling back to static size');
      return `${minSize}px`;
    }

    // Generate the clamp value with proper units
    return `clamp(${minSize}px, ${yIntercept.toFixed(3)}px + ${(slope * 100).toFixed(3)}vw, ${maxSize}px)`;
  }

  /**
   * Generate linear clamp value
   */
  private generateLinearClamp(
    minSize: number,
    maxSize: number,
    minViewport: number,
    maxViewport: number
  ): string {
    const viewportRange = maxViewport - minViewport;
    const sizeRange = maxSize - minSize;
    const slope = sizeRange / viewportRange;
    const yIntercept = minSize - slope * minViewport;

    return `clamp(${minSize}px, ${yIntercept.toFixed(3)}px + ${(slope * 100).toFixed(3)}vw, ${maxSize}px)`;
  }

  /**
   * Generate exponential clamp value
   */
  private generateExponentialClamp(
    minSize: number,
    maxSize: number,
    minViewport: number,
    maxViewport: number
  ): string {
    const midSize = Math.sqrt(minSize * maxSize);
    const midViewport = Math.sqrt(minViewport * maxViewport);
    const viewportDiff = midViewport - minViewport;

    if (Math.abs(viewportDiff) < 0.001) {
      return `${minSize}px`;
    }

    const sizeChange = midSize - minSize;
    const rate = sizeChange / viewportDiff;

    return `clamp(${minSize}px, ${minSize}px + ${rate.toFixed(4)} * (100vw - ${minViewport}px), ${maxSize}px)`;
  }

  /**
   * Validate that a clamp value is properly formatted
   */
  private isValidClampValue(clampValue: string): boolean {
    // Check basic clamp format
    const clampRegex = /^clamp\(\s*[\d.]+px\s*,\s*[^,]+\s*,\s*[\d.]+px\s*\)$/;
    if (!clampRegex.test(clampValue)) {
      return false;
    }

    // Check for NaN or undefined values
    if (clampValue.includes('NaN') || clampValue.includes('undefined')) {
      return false;
    }

    return true;
  }

  /**
   * Enforce accessibility constraints on font sizes
   */
  private enforceAccessibilityConstraints(
    minSize: number,
    maxSize: number,
    level: 'none' | 'AA' | 'AAA',
    enforce: boolean
  ): { minSize: number; maxSize: number } {
    if (level === 'none' || !enforce) {
      return { minSize, maxSize };
    }

    // WCAG minimum font sizes
    const minimums = {
      AA: 14,
      AAA: 16
    };

    const minimum = minimums[level];
    
    return {
      minSize: Math.max(minSize, minimum),
      maxSize: Math.max(maxSize, minimum)
    };
  }

  /**
   * Apply user preference scaling
   */
  private applyUserPreferences(minSize: number, maxSize: number): { minSize: number; maxSize: number } {
    try {
      // Get user's preferred font size from root element
      const rootFontSizeStr = getComputedStyle(document.documentElement).fontSize;
      const rootFontSize = parseFloat(rootFontSizeStr || '16');
      const defaultFontSize = 16; // Browser default

      // Validate the root font size
      if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) {
        logger.warn('Invalid root font size, using default scaling');
        return { minSize, maxSize };
      }

      const userScale = rootFontSize / defaultFontSize;

      // Validate the scale factor
      if (!Number.isFinite(userScale) || userScale <= 0) {
        logger.warn('Invalid user scale factor, using default scaling');
        return { minSize, maxSize };
      }

      const scaledMinSize = minSize * userScale;
      const scaledMaxSize = maxSize * userScale;

      // Validate the scaled values
      if (!Number.isFinite(scaledMinSize) || !Number.isFinite(scaledMaxSize)) {
        logger.warn('Invalid scaled sizes, using default scaling');
        return { minSize, maxSize };
      }

      return {
        minSize: scaledMinSize,
        maxSize: scaledMaxSize
      };
    } catch (error) {
      logger.warn('Error applying user preferences, using default scaling', error);
      return { minSize, maxSize };
    }
  }

  /**
   * Apply font size to element
   */
  private applyFontSize(element: Element, fontSize: string): void {
    const htmlElement = element as HTMLElement;
    htmlElement.style.fontSize = fontSize;
  }

  /**
   * Safely get computed font size with fallbacks
   */
  private getComputedFontSize(element: Element): number {
    try {
      const computedStyle = getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);

      // Return valid number or fallback
      if (Number.isFinite(fontSize) && fontSize > 0) {
        return fontSize;
      }

      // Try to get from inline style
      const htmlElement = element as HTMLElement;
      if (htmlElement.style.fontSize) {
        const inlineSize = parseFloat(htmlElement.style.fontSize);
        if (Number.isFinite(inlineSize) && inlineSize > 0) {
          return inlineSize;
        }
      }

      // Default fallback
      return 16;
    } catch (error) {
      logger.warn('Failed to get computed font size, using fallback', error);
      return 16;
    }
  }

  /**
   * Find the nearest container element
   */
  private findNearestContainer(element: Element): Element | null {
    let current = element.parentElement;
    
    while (current) {
      const style = getComputedStyle(current);
      
      // Look for elements that are likely containers
      if (
        style.display.includes('grid') ||
        style.display.includes('flex') ||
        style.display === 'block' ||
        current.matches('main, article, section, aside, div, header, footer')
      ) {
        return current;
      }
      
      current = current.parentElement;
    }
    
    return document.body;
  }

  /**
   * Calculate optimal text size to fit within width
   */
  private calculateOptimalTextSize(
    element: Element,
    maxWidth: number,
    minSize: number,
    maxSize: number
  ): number {
    const text = element.textContent || '';
    if (!text.trim()) return minSize;

    // Create a temporary element for measurement
    const temp = document.createElement('span');
    temp.style.visibility = 'hidden';
    temp.style.position = 'absolute';
    temp.style.whiteSpace = 'nowrap';
    temp.textContent = text;
    
    // Copy relevant styles with fallbacks
    const computedStyle = getComputedStyle(element);
    temp.style.fontFamily = computedStyle.fontFamily || 'Arial, sans-serif';
    temp.style.fontWeight = computedStyle.fontWeight || 'normal';
    temp.style.fontStyle = computedStyle.fontStyle || 'normal';
    
    document.body.appendChild(temp);

    try {
      // Binary search for optimal size
      let low = minSize;
      let high = maxSize;
      let optimalSize = minSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        temp.style.fontSize = `${mid}px`;
        
        const width = temp.getBoundingClientRect().width;
        
        if (width <= maxWidth) {
          optimalSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      return optimalSize;
    } finally {
      document.body.removeChild(temp);
    }
  }

  /**
   * Production-grade font optimization with performance considerations
   */
  public optimizeFontPerformance(element: Element): void {
    const htmlElement = element as HTMLElement;

    // Optimize line height based on font size
    this.optimizeLineHeightForElement(element);

    // Apply font loading optimization
    this.optimizeFontLoading(element);

    // Add performance hints
    this.addPerformanceHints(element);

    // Apply font smoothing
    this.applyFontSmoothing(htmlElement);
  }

  /**
   * Enhanced line height optimization for better readability
   */
  private optimizeLineHeightForElement(element: Element): void {
    const fontSize = this.getComputedFontSize(element);

    if (!Number.isFinite(fontSize) || fontSize <= 0) return;

    // Calculate optimal line height based on font size and content type
    let optimalLineHeight: number;

    if (fontSize <= 14) {
      optimalLineHeight = 1.7; // Better readability for small text
    } else if (fontSize <= 18) {
      optimalLineHeight = 1.6; // Standard body text
    } else if (fontSize <= 24) {
      optimalLineHeight = 1.4; // Balanced for medium text
    } else if (fontSize <= 32) {
      optimalLineHeight = 1.3; // Headings
    } else {
      optimalLineHeight = 1.2; // Large headings
    }

    // Apply WCAG AAA line height requirements (minimum 1.5)
    optimalLineHeight = Math.max(optimalLineHeight, 1.5);

    (element as HTMLElement).style.lineHeight = optimalLineHeight.toString();
  }

  /**
   * Optimize font loading for performance
   */
  private optimizeFontLoading(element: Element): void {
    const htmlElement = element as HTMLElement;
    const computedStyle = window.getComputedStyle(element);
    const fontFamily = computedStyle.fontFamily;

    // Add font-display: swap for better loading performance
    if (fontFamily && !this.isSystemFont(fontFamily)) {
      htmlElement.style.setProperty('font-display', 'swap');
    }
  }

  /**
   * Check if font is a system font
   */
  private isSystemFont(fontFamily: string): boolean {
    const systemFonts = [
      'system-ui', '-apple-system', 'BlinkMacSystemFont',
      'Segoe UI', 'Roboto', 'Arial', 'sans-serif', 'serif', 'monospace'
    ];

    return systemFonts.some(font => fontFamily.toLowerCase().includes(font.toLowerCase()));
  }

  /**
   * Add performance hints for better rendering
   */
  private addPerformanceHints(element: Element): void {
    const htmlElement = element as HTMLElement;

    // Add will-change hint for elements that will be animated
    if (this.isAnimatedElement(element)) {
      htmlElement.style.willChange = 'font-size';
    }

    // Add contain hint for better layout performance
    htmlElement.style.contain = 'layout style';
  }

  /**
   * Check if element is likely to be animated
   */
  private isAnimatedElement(element: Element): boolean {
    const computedStyle = window.getComputedStyle(element);
    return computedStyle.transition.includes('font-size') ||
           computedStyle.animation !== 'none' ||
           element.hasAttribute('data-proteus-animated');
  }

  /**
   * Apply font smoothing for better text rendering
   */
  private applyFontSmoothing(element: HTMLElement): void {
    // Apply font smoothing for better text rendering
    element.style.setProperty('-webkit-font-smoothing', 'antialiased');
    element.style.setProperty('-moz-osx-font-smoothing', 'grayscale');

    // Add text rendering optimization
    element.style.setProperty('text-rendering', 'optimizeLegibility');
  }

  /**
   * Record performance metrics for monitoring
   */
  public recordPerformanceMetrics(element: Element, clampValue: string): void {
    const startTime = performance.now();

    // Measure font application time
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Store metrics for performance monitoring
      if (typeof (window as any).proteusMetrics === 'undefined') {
        (window as any).proteusMetrics = {
          fontApplicationTimes: [],
          averageRenderTime: 0
        };
      }

      const metrics = (window as any).proteusMetrics;
      metrics.fontApplicationTimes.push(renderTime);

      // Keep only last 100 measurements
      if (metrics.fontApplicationTimes.length > 100) {
        metrics.fontApplicationTimes.shift();
      }

      // Calculate average
      metrics.averageRenderTime = metrics.fontApplicationTimes.reduce((a: number, b: number) => a + b, 0) / metrics.fontApplicationTimes.length;

      // Log performance warnings
      if (renderTime > 16) { // More than one frame
        const elementTag = element.tagName.toLowerCase();
        logger.warn(`Slow font application detected: ${renderTime.toFixed(2)}ms for ${elementTag} with clamp: ${clampValue}`);
      }
    });
  }
}
