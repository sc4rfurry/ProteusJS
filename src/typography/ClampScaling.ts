/**
 * Clamp-Based Scaling System for ProteusJS
 * Implements intelligent font scaling using CSS clamp() with JavaScript fallbacks
 */

export interface ScalingConfig {
  minSize: number;
  maxSize: number;
  minContainer: number;
  maxContainer: number;
  unit: 'px' | 'rem' | 'em';
  containerUnit: 'px' | 'cw' | 'ch' | 'cmin' | 'cmax';
  curve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'custom';
  customCurve?: (progress: number) => number;
}

export interface ScalingResult {
  clampValue: string;
  fallbackValue: string;
  currentSize: number;
  progress: number;
  isNative: boolean;
}

export class ClampScaling {
  private supportsClamp: boolean;
  private supportsContainerUnits: boolean;

  constructor() {
    this.supportsClamp = this.checkClampSupport();
    this.supportsContainerUnits = this.checkContainerUnitSupport();
  }

  /**
   * Create clamp-based scaling value
   */
  public createScaling(config: ScalingConfig): ScalingResult {
    const {
      minSize,
      maxSize,
      minContainer,
      maxContainer,
      unit,
      containerUnit,
      curve
    } = config;

    // Validate configuration to prevent NaN
    const containerRange = maxContainer - minContainer;
    const sizeRange = maxSize - minSize;

    if (containerRange <= 0) {
      console.warn('Invalid container range, using fallback scaling');
      return {
        clampValue: `${minSize}${unit}`,
        fallbackValue: `${minSize}${unit}`,
        currentSize: minSize,
        progress: 0,
        isNative: false
      };
    }

    // Calculate slope and y-intercept for linear scaling
    const slope = sizeRange / containerRange;
    const yIntercept = minSize - slope * minContainer;

    let clampValue: string;
    let fallbackValue: string;

    if (this.supportsClamp && (this.supportsContainerUnits || containerUnit === 'px')) {
      // Use native CSS clamp
      const preferredValue = this.createPreferredValue(
        yIntercept,
        slope,
        unit,
        containerUnit,
        curve,
        config
      );
      
      clampValue = `clamp(${minSize}${unit}, ${preferredValue}, ${maxSize}${unit})`;
      fallbackValue = `${minSize}${unit}`;
    } else {
      // Use JavaScript fallback
      clampValue = `var(--proteus-font-size, ${minSize}${unit})`;
      fallbackValue = `${minSize}${unit}`;
    }

    return {
      clampValue,
      fallbackValue,
      currentSize: minSize,
      progress: 0,
      isNative: this.supportsClamp
    };
  }

  /**
   * Calculate current font size for given container size
   */
  public calculateSize(
    containerSize: number,
    config: ScalingConfig
  ): number {
    const {
      minSize,
      maxSize,
      minContainer,
      maxContainer,
      curve,
      customCurve
    } = config;

    // Clamp container size to valid range
    const clampedSize = Math.max(minContainer, Math.min(maxContainer, containerSize));
    
    // Calculate progress (0-1)
    const progress = (clampedSize - minContainer) / (maxContainer - minContainer);
    
    // Apply easing curve
    const easedProgress = this.applyCurve(progress, curve, customCurve);
    
    // Calculate final size
    const size = minSize + (maxSize - minSize) * easedProgress;
    
    return Math.max(minSize, Math.min(maxSize, size));
  }

  /**
   * Apply scaling to element
   */
  public applyScaling(
    element: Element,
    containerSize: number,
    config: ScalingConfig
  ): void {
    const htmlElement = element as HTMLElement;
    const result = this.createScaling(config);

    if (result.isNative) {
      // Use CSS clamp
      htmlElement.style.fontSize = result.clampValue;
    } else {
      // Use JavaScript calculation
      const calculatedSize = this.calculateSize(containerSize, config);
      htmlElement.style.setProperty('--proteus-font-size', `${calculatedSize}${config.unit}`);
      htmlElement.style.fontSize = result.clampValue;
    }
  }

  /**
   * Create responsive scaling for multiple breakpoints
   */
  public createMultiBreakpointScaling(
    breakpoints: Array<{
      container: number;
      size: number;
    }>,
    unit: 'px' | 'rem' | 'em' = 'rem',
    containerUnit: 'px' | 'cw' | 'ch' | 'cmin' | 'cmax' = 'cw'
  ): string {
    if (breakpoints.length < 2) {
      throw new Error('At least 2 breakpoints required for multi-breakpoint scaling');
    }

    // Sort breakpoints by container size
    const sorted = [...breakpoints].sort((a, b) => a.container - b.container);
    
    // Create clamp values for each segment
    const clampValues: string[] = [];
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]!;
      const next = sorted[i + 1]!;

      const config: ScalingConfig = {
        minSize: current.size,
        maxSize: next.size,
        minContainer: current.container,
        maxContainer: next.container,
        unit,
        containerUnit,
        curve: 'linear'
      };
      
      const result = this.createScaling(config);
      clampValues.push(result.clampValue);
    }
    
    // Combine with CSS max() for proper breakpoint handling
    return clampValues.length === 1
      ? clampValues[0]!
      : `max(${clampValues.join(', ')})`;
  }

  /**
   * Generate optimal scaling configuration
   */
  public generateOptimalConfig(
    _element: Element,
    targetSizes: { small: number; large: number },
    containerSizes: { small: number; large: number },
    options: {
      unit?: 'px' | 'rem' | 'em';
      accessibility?: boolean;
      readability?: boolean;
    } = {}
  ): ScalingConfig {
    const { unit = 'rem', accessibility = true, readability = true } = options;
    
    let { small: minSize, large: maxSize } = targetSizes;
    const { small: minContainer, large: maxContainer } = containerSizes;

    // Apply accessibility constraints
    if (accessibility) {
      // Ensure minimum readable size (WCAG guidelines)
      const minReadableSize = unit === 'px' ? 16 : 1; // 16px or 1rem
      minSize = Math.max(minSize, minReadableSize);
      
      // Limit maximum size to prevent overwhelming text
      const maxReadableSize = unit === 'px' ? 72 : 4.5; // 72px or 4.5rem
      maxSize = Math.min(maxSize, maxReadableSize);
    }

    // Apply readability constraints
    if (readability) {
      // Ensure reasonable scaling ratio (not too aggressive)
      const maxRatio = 2.5;
      if (maxSize / minSize > maxRatio) {
        maxSize = minSize * maxRatio;
      }
    }

    return {
      minSize,
      maxSize,
      minContainer,
      maxContainer,
      unit,
      containerUnit: 'cw',
      curve: 'ease-out' // Slightly slower scaling at larger sizes
    };
  }

  /**
   * Validate scaling configuration
   */
  public validateConfig(config: ScalingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.minSize >= config.maxSize) {
      errors.push('minSize must be less than maxSize');
    }

    if (config.minContainer >= config.maxContainer) {
      errors.push('minContainer must be less than maxContainer');
    }

    if (config.minSize <= 0) {
      errors.push('minSize must be positive');
    }

    if (config.minContainer <= 0) {
      errors.push('minContainer must be positive');
    }

    // Check for reasonable scaling ratios
    const sizeRatio = config.maxSize / config.minSize;
    if (sizeRatio > 5) {
      errors.push('Size ratio is very large (>5x), consider reducing for better readability');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create preferred value for clamp function
   */
  private createPreferredValue(
    yIntercept: number,
    slope: number,
    unit: string,
    containerUnit: string,
    curve: ScalingConfig['curve'],
    _config: ScalingConfig
  ): string {
    // Validate inputs to prevent NaN
    if (!isFinite(yIntercept) || !isFinite(slope)) {
      console.warn('Invalid scaling values detected, using fallback');
      return `1${unit}`; // Fallback value
    }

    if (curve === 'linear') {
      // Simple linear scaling
      const slopeValue = slope * (containerUnit === 'px' ? 1 : 100);

      // Format numbers to prevent very long decimals
      const formattedIntercept = Number(yIntercept.toFixed(3));
      const formattedSlope = Number(slopeValue.toFixed(3));

      return `${formattedIntercept}${unit} + ${formattedSlope}${containerUnit}`;
    } else {
      // For non-linear curves, we need to use CSS calc with custom properties
      // This is a simplified approach - full implementation would need more complex CSS
      const formattedIntercept = Number(yIntercept.toFixed(3));
      const formattedSlope = Number((slope * 100).toFixed(3));

      return `${formattedIntercept}${unit} + ${formattedSlope}${containerUnit}`;
    }
  }

  /**
   * Apply easing curve to progress value
   */
  private applyCurve(
    progress: number,
    curve: ScalingConfig['curve'],
    customCurve?: (progress: number) => number
  ): number {
    switch (curve) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'custom':
        return customCurve ? customCurve(progress) : progress;
      default:
        return progress;
    }
  }

  /**
   * Check if CSS clamp() is supported
   */
  private checkClampSupport(): boolean {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    return CSS.supports('font-size', 'clamp(1rem, 2vw, 2rem)');
  }

  /**
   * Check if container units are supported
   */
  private checkContainerUnitSupport(): boolean {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    return CSS.supports('font-size', '1cw');
  }
}
