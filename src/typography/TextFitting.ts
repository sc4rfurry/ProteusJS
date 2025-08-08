/**
 * Text Fitting Algorithms for ProteusJS
 * Dynamic text sizing for optimal readability and layout
 */

export interface FittingConfig {
  mode: 'single-line' | 'multi-line' | 'overflow-aware';
  minSize: number;
  maxSize: number;
  unit: 'px' | 'rem' | 'em';
  precision: number;
  maxIterations: number;
  lineHeight?: number;
  wordBreak?: 'normal' | 'break-all' | 'keep-all';
  overflow?: 'hidden' | 'ellipsis' | 'clip';
}

export interface FittingResult {
  fontSize: number;
  lineHeight: number;
  actualLines: number;
  overflow: boolean;
  iterations: number;
  success: boolean;
}

export class TextFitting {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  /**
   * Fit text to container with optimal sizing
   */
  public fitText(
    element: Element,
    text: string,
    containerWidth: number,
    containerHeight: number,
    config: FittingConfig
  ): FittingResult {
    const computedStyle = getComputedStyle(element);
    
    switch (config.mode) {
      case 'single-line':
        return this.fitSingleLine(text, containerWidth, config, computedStyle);
      case 'multi-line':
        return this.fitMultiLine(text, containerWidth, containerHeight, config, computedStyle);
      case 'overflow-aware':
        return this.fitOverflowAware(text, containerWidth, containerHeight, config, computedStyle);
      default:
        throw new Error(`Unknown fitting mode: ${config.mode}`);
    }
  }

  /**
   * Apply fitting result to element
   */
  public applyFitting(element: Element, result: FittingResult, config: FittingConfig): void {
    const htmlElement = element as HTMLElement;
    
    htmlElement.style.fontSize = `${result.fontSize}${config.unit}`;
    htmlElement.style.lineHeight = result.lineHeight.toString();
    
    if (config.mode === 'overflow-aware' && result.overflow) {
      htmlElement.style.overflow = config.overflow || 'hidden';
      if (config.overflow === 'ellipsis') {
        htmlElement.style.textOverflow = 'ellipsis';
        htmlElement.style.whiteSpace = 'nowrap';
      }
    }
  }

  /**
   * Measure text dimensions
   */
  public measureText(
    text: string,
    fontSize: number,
    fontFamily: string,
    fontWeight: string = 'normal'
  ): { width: number; height: number } {
    this.context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = this.context.measureText(text);
    
    return {
      width: metrics.width,
      height: fontSize * 1.2 // Approximate line height
    };
  }

  /**
   * Calculate optimal font size for single line
   */
  private fitSingleLine(
    text: string,
    containerWidth: number,
    config: FittingConfig,
    computedStyle: CSSStyleDeclaration
  ): FittingResult {
    const fontFamily = computedStyle.fontFamily;
    const fontWeight = computedStyle.fontWeight;
    
    let minSize = config.minSize;
    let maxSize = config.maxSize;
    let iterations = 0;
    let bestSize = minSize;
    
    // Binary search for optimal size
    while (maxSize - minSize > config.precision && iterations < config.maxIterations) {
      const testSize = (minSize + maxSize) / 2;
      const measurement = this.measureText(text, testSize, fontFamily, fontWeight);
      
      if (measurement.width <= containerWidth) {
        bestSize = testSize;
        minSize = testSize;
      } else {
        maxSize = testSize;
      }
      
      iterations++;
    }
    
    const finalMeasurement = this.measureText(text, bestSize, fontFamily, fontWeight);
    
    return {
      fontSize: bestSize,
      lineHeight: config.lineHeight || 1.2,
      actualLines: 1,
      overflow: finalMeasurement.width > containerWidth,
      iterations,
      success: finalMeasurement.width <= containerWidth
    };
  }

  /**
   * Calculate optimal font size for multi-line text
   */
  private fitMultiLine(
    text: string,
    containerWidth: number,
    containerHeight: number,
    config: FittingConfig,
    computedStyle: CSSStyleDeclaration
  ): FittingResult {
    const fontFamily = computedStyle.fontFamily;
    const fontWeight = computedStyle.fontWeight;
    const lineHeight = config.lineHeight || 1.4;
    
    let minSize = config.minSize;
    let maxSize = config.maxSize;
    let iterations = 0;
    let bestSize = minSize;
    let bestLines = 0;
    
    while (maxSize - minSize > config.precision && iterations < config.maxIterations) {
      const testSize = (minSize + maxSize) / 2;
      const lines = this.calculateLines(text, testSize, containerWidth, fontFamily, fontWeight);
      const totalHeight = lines * testSize * lineHeight;
      
      if (totalHeight <= containerHeight) {
        bestSize = testSize;
        bestLines = lines;
        minSize = testSize;
      } else {
        maxSize = testSize;
      }
      
      iterations++;
    }
    
    const finalLines = this.calculateLines(text, bestSize, containerWidth, fontFamily, fontWeight);
    const finalHeight = finalLines * bestSize * lineHeight;
    
    return {
      fontSize: bestSize,
      lineHeight,
      actualLines: finalLines,
      overflow: finalHeight > containerHeight,
      iterations,
      success: finalHeight <= containerHeight
    };
  }

  /**
   * Calculate optimal font size with overflow awareness
   */
  private fitOverflowAware(
    text: string,
    containerWidth: number,
    containerHeight: number,
    config: FittingConfig,
    computedStyle: CSSStyleDeclaration
  ): FittingResult {
    // First try multi-line fitting
    const multiLineResult = this.fitMultiLine(text, containerWidth, containerHeight, config, computedStyle);
    
    if (multiLineResult.success) {
      return multiLineResult;
    }
    
    // If multi-line doesn't fit, try single-line with ellipsis
    const singleLineResult = this.fitSingleLine(text, containerWidth, config, computedStyle);
    
    // Calculate how many lines we can fit at this font size
    const lineHeight = config.lineHeight || 1.4;
    const maxLines = Math.floor(containerHeight / (singleLineResult.fontSize * lineHeight));
    
    return {
      fontSize: singleLineResult.fontSize,
      lineHeight,
      actualLines: Math.min(maxLines, 1),
      overflow: true,
      iterations: singleLineResult.iterations,
      success: maxLines >= 1
    };
  }

  /**
   * Calculate number of lines for given text and font size
   */
  private calculateLines(
    text: string,
    fontSize: number,
    containerWidth: number,
    fontFamily: string,
    fontWeight: string
  ): number {
    this.context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    
    const words = text.split(/\s+/);
    let lines = 1;
    let currentLineWidth = 0;
    
    for (const word of words) {
      const wordWidth = this.context.measureText(`${word  } `).width;
      
      if (currentLineWidth + wordWidth > containerWidth) {
        lines++;
        currentLineWidth = wordWidth;
      } else {
        currentLineWidth += wordWidth;
      }
    }
    
    return lines;
  }

  /**
   * Get optimal configuration for content type
   */
  public static getOptimalConfig(contentType: 'heading' | 'body' | 'caption' | 'button'): Partial<FittingConfig> {
    switch (contentType) {
      case 'heading':
        return {
          mode: 'single-line',
          minSize: 18,
          maxSize: 48,
          precision: 0.5,
          maxIterations: 20,
          lineHeight: 1.2
        };
      case 'body':
        return {
          mode: 'multi-line',
          minSize: 14,
          maxSize: 20,
          precision: 0.25,
          maxIterations: 15,
          lineHeight: 1.5
        };
      case 'caption':
        return {
          mode: 'overflow-aware',
          minSize: 12,
          maxSize: 16,
          precision: 0.25,
          maxIterations: 10,
          lineHeight: 1.3,
          overflow: 'ellipsis'
        };
      case 'button':
        return {
          mode: 'single-line',
          minSize: 14,
          maxSize: 18,
          precision: 0.25,
          maxIterations: 10,
          lineHeight: 1,
          overflow: 'ellipsis'
        };
      default:
        return {};
    }
  }

  /**
   * Create responsive text fitting
   */
  public createResponsiveFitting(
    element: Element,
    configs: Array<{
      containerSize: number;
      config: FittingConfig;
    }>
  ): void {
    const htmlElement = element as HTMLElement;
    const text = element.textContent || '';
    
    // Sort configs by container size
    const sortedConfigs = configs.sort((a, b) => a.containerSize - b.containerSize);
    
    // Create resize observer to update fitting
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const containerHeight = entry.contentRect.height;
        
        // Find appropriate config
        let activeConfig = sortedConfigs[0]!.config;
        for (const { containerSize, config } of sortedConfigs) {
          if (containerWidth >= containerSize) {
            activeConfig = config;
          }
        }
        
        // Apply fitting
        const result = this.fitText(element, text, containerWidth, containerHeight, activeConfig);
        this.applyFitting(element, result, activeConfig);
      }
    });
    
    resizeObserver.observe(element);
    
    // Store observer for cleanup
    (htmlElement as any)._proteusTextFittingObserver = resizeObserver;
  }

  /**
   * Remove responsive text fitting
   */
  public removeResponsiveFitting(element: Element): void {
    const htmlElement = element as HTMLElement;
    const observer = (htmlElement as any)._proteusTextFittingObserver;
    
    if (observer) {
      observer.disconnect();
      delete (htmlElement as any)._proteusTextFittingObserver;
    }
  }
}
