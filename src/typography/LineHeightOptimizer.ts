/**
 * Smart Line Height Optimization for ProteusJS
 * Dynamic line-height optimization for optimal readability
 */

export interface LineHeightConfig {
  baseFontSize: number;
  baseLineHeight: number;
  minLineHeight: number;
  maxLineHeight: number;
  language: string;
  contentType: 'heading' | 'body' | 'caption' | 'code' | 'display';
  accessibility: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface OptimizationResult {
  lineHeight: number;
  ratio: number;
  reasoning: string[];
  accessibility: {
    wcagCompliant: boolean;
    readabilityScore: number;
  };
}

export class LineHeightOptimizer {
  private static readonly LANGUAGE_ADJUSTMENTS = {
    'en': 1.0,      // English baseline
    'zh': 1.1,      // Chinese - needs more space
    'ja': 1.1,      // Japanese - needs more space
    'ko': 1.1,      // Korean - needs more space
    'ar': 1.05,     // Arabic - slightly more space
    'hi': 1.05,     // Hindi - slightly more space
    'th': 1.15,     // Thai - needs significant space
    'vi': 1.05,     // Vietnamese - slightly more space
    'de': 0.98,     // German - can be slightly tighter
    'fr': 1.0,      // French - baseline
    'es': 1.0,      // Spanish - baseline
    'it': 1.0,      // Italian - baseline
    'pt': 1.0,      // Portuguese - baseline
    'ru': 1.02,     // Russian - slightly more space
    'default': 1.0
  };

  private static readonly CONTENT_TYPE_RATIOS = {
    'heading': { min: 1.0, optimal: 1.2, max: 1.4 },
    'body': { min: 1.3, optimal: 1.5, max: 1.8 },
    'caption': { min: 1.2, optimal: 1.4, max: 1.6 },
    'code': { min: 1.2, optimal: 1.4, max: 1.6 },
    'display': { min: 0.9, optimal: 1.1, max: 1.3 }
  };

  private static readonly DENSITY_MULTIPLIERS = {
    'compact': 0.9,
    'comfortable': 1.0,
    'spacious': 1.1
  };

  /**
   * Calculate optimal line height
   */
  public calculateOptimalLineHeight(
    fontSize: number,
    lineLength: number,
    containerWidth: number,
    config: LineHeightConfig
  ): OptimizationResult {
    const reasoning: string[] = [];
    let lineHeight = config.baseLineHeight;

    // 1. Base ratio for content type
    const contentRatios = LineHeightOptimizer.CONTENT_TYPE_RATIOS[config.contentType];
    lineHeight = contentRatios.optimal;
    reasoning.push(`Base ratio for ${config.contentType}: ${lineHeight}`);

    // 2. Font size adjustment
    const sizeAdjustment = this.calculateSizeAdjustment(fontSize, config.baseFontSize);
    lineHeight *= sizeAdjustment;
    reasoning.push(`Font size adjustment (${fontSize}px): ×${sizeAdjustment.toFixed(3)}`);

    // 3. Line length adjustment
    const lengthAdjustment = this.calculateLineLengthAdjustment(lineLength, fontSize);
    lineHeight *= lengthAdjustment;
    reasoning.push(`Line length adjustment (${lineLength} chars): ×${lengthAdjustment.toFixed(3)}`);

    // 4. Language adjustment
    const langCode = config.language?.split('-')[0]?.toLowerCase() || 'en';
    const languageMultiplier = LineHeightOptimizer.LANGUAGE_ADJUSTMENTS[langCode as keyof typeof LineHeightOptimizer.LANGUAGE_ADJUSTMENTS] || LineHeightOptimizer.LANGUAGE_ADJUSTMENTS.default;
    lineHeight *= languageMultiplier;
    if (languageMultiplier !== 1.0) {
      reasoning.push(`Language adjustment (${langCode}): ×${languageMultiplier}`);
    }

    // 5. Density adjustment
    const densityMultiplier = LineHeightOptimizer.DENSITY_MULTIPLIERS[config.density];
    lineHeight *= densityMultiplier;
    reasoning.push(`Density adjustment (${config.density}): ×${densityMultiplier}`);

    // 6. Container width adjustment
    const widthAdjustment = this.calculateWidthAdjustment(containerWidth, fontSize);
    lineHeight *= widthAdjustment;
    if (widthAdjustment !== 1.0) {
      reasoning.push(`Container width adjustment: ×${widthAdjustment.toFixed(3)}`);
    }

    // 7. Accessibility adjustments
    if (config.accessibility) {
      const accessibilityAdjustment = this.calculateAccessibilityAdjustment(lineHeight, config);
      lineHeight = accessibilityAdjustment.lineHeight;
      if (accessibilityAdjustment.adjusted) {
        reasoning.push(`Accessibility adjustment: ${accessibilityAdjustment.reason}`);
      }
    }

    // 8. Clamp to bounds
    const originalLineHeight = lineHeight;
    lineHeight = Math.max(config.minLineHeight, Math.min(config.maxLineHeight, lineHeight));
    if (lineHeight !== originalLineHeight) {
      reasoning.push(`Clamped to bounds: ${config.minLineHeight}-${config.maxLineHeight}`);
    }

    // Calculate accessibility metrics
    const accessibility = this.calculateAccessibilityMetrics(lineHeight, fontSize, config);

    return {
      lineHeight: Math.round(lineHeight * 1000) / 1000, // Round to 3 decimal places
      ratio: lineHeight,
      reasoning,
      accessibility
    };
  }

  /**
   * Apply line height optimization to element
   */
  public applyOptimization(
    element: Element,
    result: OptimizationResult,
    config: LineHeightConfig
  ): void {
    const htmlElement = element as HTMLElement;
    htmlElement.style.lineHeight = result.lineHeight.toString();

    // Add data attributes for debugging
    if (config.accessibility) {
      htmlElement.setAttribute('data-proteus-line-height', result.lineHeight.toString());
      htmlElement.setAttribute('data-proteus-wcag-compliant', result.accessibility.wcagCompliant.toString());
    }
  }

  /**
   * Create responsive line height optimization
   */
  public createResponsiveOptimization(
    element: Element,
    config: LineHeightConfig
  ): () => void {
    const updateLineHeight = () => {
      const computedStyle = getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const containerWidth = element.getBoundingClientRect().width;
      
      // Estimate line length based on average character width
      const averageCharWidth = fontSize * 0.5; // Approximate
      const lineLength = Math.floor(containerWidth / averageCharWidth);

      const result = this.calculateOptimalLineHeight(
        fontSize,
        lineLength,
        containerWidth,
        config
      );

      this.applyOptimization(element, result, config);
    };

    // Initial optimization
    updateLineHeight();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateLineHeight();
    });

    resizeObserver.observe(element);

    // Return cleanup function
    return () => {
      resizeObserver.disconnect();
    };
  }

  /**
   * Calculate font size adjustment factor
   */
  private calculateSizeAdjustment(fontSize: number, baseFontSize: number): number {
    const ratio = fontSize / baseFontSize;
    
    // Smaller fonts need relatively larger line heights
    // Larger fonts can have relatively smaller line heights
    if (ratio < 1) {
      return 1 + (1 - ratio) * 0.2; // Up to 20% increase for small fonts
    } else if (ratio > 1) {
      return 1 - Math.min((ratio - 1) * 0.1, 0.15); // Up to 15% decrease for large fonts
    }
    
    return 1;
  }

  /**
   * Calculate line length adjustment factor
   */
  private calculateLineLengthAdjustment(lineLength: number, fontSize: number): number {
    // Optimal line length is 45-75 characters
    const optimalMin = 45;
    const optimalMax = 75;
    
    if (lineLength < optimalMin) {
      // Short lines can have tighter line height
      return 0.95;
    } else if (lineLength > optimalMax) {
      // Long lines need more line height for readability
      const excess = lineLength - optimalMax;
      return 1 + Math.min(excess * 0.002, 0.2); // Up to 20% increase
    }
    
    return 1;
  }

  /**
   * Calculate container width adjustment factor
   */
  private calculateWidthAdjustment(containerWidth: number, fontSize: number): number {
    // Very narrow containers need slightly more line height
    const minComfortableWidth = fontSize * 20; // 20em
    
    if (containerWidth < minComfortableWidth) {
      const ratio = containerWidth / minComfortableWidth;
      return 1 + (1 - ratio) * 0.1; // Up to 10% increase
    }
    
    return 1;
  }

  /**
   * Calculate accessibility adjustments
   */
  private calculateAccessibilityAdjustment(
    lineHeight: number,
    config: LineHeightConfig
  ): { lineHeight: number; adjusted: boolean; reason: string } {
    // WCAG 2.1 AA requires line height to be at least 1.5 times the font size for body text
    const wcagMinimum = config.contentType === 'body' ? 1.5 : 1.3;
    
    if (lineHeight < wcagMinimum) {
      return {
        lineHeight: wcagMinimum,
        adjusted: true,
        reason: `WCAG compliance requires minimum ${wcagMinimum}`
      };
    }
    
    return {
      lineHeight,
      adjusted: false,
      reason: ''
    };
  }

  /**
   * Calculate accessibility metrics
   */
  private calculateAccessibilityMetrics(
    lineHeight: number,
    fontSize: number,
    config: LineHeightConfig
  ): { wcagCompliant: boolean; readabilityScore: number } {
    const wcagMinimum = config.contentType === 'body' ? 1.5 : 1.3;
    const wcagCompliant = lineHeight >= wcagMinimum;
    
    // Calculate readability score (0-100)
    let score = 50; // Base score
    
    // Line height contribution (40 points max)
    const optimalRatio = LineHeightOptimizer.CONTENT_TYPE_RATIOS[config.contentType].optimal;
    const heightDiff = Math.abs(lineHeight - optimalRatio);
    const heightScore = Math.max(0, 40 - (heightDiff * 100));
    score += heightScore;
    
    // WCAG compliance bonus (10 points)
    if (wcagCompliant) {
      score += 10;
    }
    
    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
      wcagCompliant,
      readabilityScore: Math.round(score)
    };
  }

  /**
   * Get optimal configuration for language and content type
   */
  public static getOptimalConfig(
    language: string,
    contentType: LineHeightConfig['contentType'],
    accessibility: boolean = true
  ): Partial<LineHeightConfig> {
    const contentRatios = this.CONTENT_TYPE_RATIOS[contentType];
    
    return {
      baseFontSize: 16,
      baseLineHeight: contentRatios.optimal,
      minLineHeight: contentRatios.min,
      maxLineHeight: contentRatios.max,
      language,
      contentType,
      accessibility,
      density: 'comfortable'
    };
  }
}
