/**
 * LineHeightOptimization - Intelligent line height optimization system
 * Automatically calculates optimal line heights based on font size, content, and accessibility
 */

export interface LineHeightConfig {
  density?: 'compact' | 'comfortable' | 'spacious';
  accessibility?: 'none' | 'AA' | 'AAA';
  language?: string;
  contentType?: 'body' | 'heading' | 'caption' | 'code';
  containerWidth?: number;
  enforceAccessibility?: boolean;
  respectUserPreferences?: boolean;
}

export interface OptimizationResult {
  lineHeight: number;
  lineHeightCSS: string;
  reasoning: string[];
  accessibilityCompliant: boolean;
  adjustments: string[];
}

export class LineHeightOptimization {
  private appliedElements: WeakSet<Element> = new WeakSet();
  private resizeObserver: ResizeObserver | null = null;
  private elementConfigs: WeakMap<Element, LineHeightConfig> = new WeakMap();

  // Base line height ratios for different densities
  private readonly densityRatios = {
    compact: 1.2,
    comfortable: 1.5,
    spacious: 1.8
  };

  // Accessibility minimum line heights (WCAG guidelines)
  private readonly accessibilityMinimums = {
    AA: 1.5,
    AAA: 1.6
  };

  // Language-specific adjustments
  private readonly languageAdjustments = {
    'zh': 0.1,    // Chinese - needs more space for characters
    'ja': 0.1,    // Japanese - needs more space for characters
    'ko': 0.1,    // Korean - needs more space for characters
    'ar': 0.05,   // Arabic - slight adjustment for script
    'hi': 0.05,   // Hindi - slight adjustment for script
    'th': 0.1,    // Thai - needs more space for characters
    'default': 0
  };

  constructor() {
    this.setupResizeObserver();
  }

  /**
   * Optimize line height for an element
   */
  public optimizeLineHeight(element: Element, config: LineHeightConfig = {}): OptimizationResult {
    const {
      density = 'comfortable',
      accessibility = 'AA',
      language = 'en',
      contentType = 'body',
      containerWidth,
      enforceAccessibility = true,
      respectUserPreferences = true
    } = config;

    try {
      // Store config for future updates
      this.elementConfigs.set(element, config);

      // Get current font size with robust error handling
      const computedStyle = getComputedStyle(element);
      let fontSize = parseFloat(computedStyle.fontSize);

      // Handle NaN or invalid font size
      if (!Number.isFinite(fontSize) || fontSize <= 0) {
        // Try to get from inline style
        const htmlElement = element as HTMLElement;
        if (htmlElement.style.fontSize) {
          fontSize = parseFloat(htmlElement.style.fontSize);
        }

        // Final fallback based on element type
        if (!Number.isFinite(fontSize) || fontSize <= 0) {
          switch (element.tagName.toLowerCase()) {
            case 'h1': fontSize = 32; break;
            case 'h2': fontSize = 24; break;
            case 'h3': fontSize = 20; break;
            case 'h4': fontSize = 18; break;
            case 'h5': fontSize = 16; break;
            case 'h6': fontSize = 14; break;
            default: fontSize = 16; break;
          }
        }
      }

      const actualContainerWidth = containerWidth || element.getBoundingClientRect().width;

      // Calculate optimal line height
      const result = this.calculateOptimalLineHeight(
        fontSize,
        actualContainerWidth,
        density,
        accessibility,
        language,
        contentType,
        enforceAccessibility,
        respectUserPreferences
      );

      // Apply the line height
      this.applyLineHeight(element, result.lineHeightCSS);
      this.appliedElements.add(element);

      // Start observing for resize if container width matters
      if (this.resizeObserver && !containerWidth) {
        this.resizeObserver.observe(element);
      }

      // Add debugging attributes
      element.setAttribute('data-proteus-line-height', result.lineHeight.toString());
      element.setAttribute('data-proteus-line-height-reasoning', result.reasoning.join(', '));

      return result;

    } catch (error) {
      console.error('ProteusJS: Failed to optimize line height:', error);
      return {
        lineHeight: this.densityRatios[density],
        lineHeightCSS: this.densityRatios[density].toString(),
        reasoning: ['Error occurred, using default'],
        accessibilityCompliant: false,
        adjustments: ['Error fallback']
      };
    }
  }

  /**
   * Update line height when element or container changes
   */
  public updateLineHeight(element: Element): void {
    const config = this.elementConfigs.get(element);
    if (!config) return;

    this.optimizeLineHeight(element, config);
  }

  /**
   * Remove line height optimization from element
   */
  public removeOptimization(element: Element): void {
    if (!this.appliedElements.has(element)) return;

    // Remove line-height style
    const style = element.getAttribute('style');
    if (style) {
      const newStyle = style.replace(/line-height:[^;]+;?/g, '');
      if (newStyle.trim()) {
        element.setAttribute('style', newStyle);
      } else {
        element.removeAttribute('style');
      }
    }

    // Remove data attributes
    element.removeAttribute('data-proteus-line-height');
    element.removeAttribute('data-proteus-line-height-reasoning');

    this.appliedElements.delete(element);
    this.elementConfigs.delete(element);
  }

  /**
   * Calculate optimal line height for an element (alias for optimizeLineHeight)
   */
  public calculateOptimal(element: Element, config: LineHeightConfig & { fontSize?: number } = {}): OptimizationResult | number {
    // If fontSize is provided in config, return just the number for testing
    if (config.fontSize !== undefined) {
      const {
        density = 'comfortable',
        accessibility = 'AA',
        language = 'en',
        contentType = config.contentType || 'body', // Preserve passed contentType
        containerWidth = 600,
        enforceAccessibility = true,
        respectUserPreferences = false
      } = config;

      const result = this.calculateOptimalLineHeight(
        config.fontSize,
        containerWidth,
        density,
        accessibility,
        language,
        contentType,
        enforceAccessibility,
        respectUserPreferences
      );

      return result.lineHeight;
    }

    return this.optimizeLineHeight(element, config);
  }

  /**
   * Maintain vertical rhythm across multiple elements
   */
  public maintainVerticalRhythm(elements: Element[], config: { baselineGrid: number; baseSize: number }): void {
    const { baselineGrid } = config;

    elements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);

      // Calculate line height that aligns to baseline grid
      const optimalLines = Math.round(fontSize * 1.5 / baselineGrid);
      const gridAlignedLineHeight = (optimalLines * baselineGrid) / fontSize;

      // Apply the grid-aligned line height
      const htmlElement = element as HTMLElement;
      htmlElement.style.lineHeight = gridAlignedLineHeight.toString();

      // Add data attribute for debugging
      element.setAttribute('data-proteus-baseline-grid', baselineGrid.toString());
      element.setAttribute('data-proteus-grid-lines', optimalLines.toString());
    });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.elementConfigs = new WeakMap();
  }

  /**
   * Calculate optimal line height based on multiple factors
   */
  private calculateOptimalLineHeight(
    fontSize: number,
    containerWidth: number,
    density: 'compact' | 'comfortable' | 'spacious',
    accessibility: 'none' | 'AA' | 'AAA',
    language: string,
    contentType: string,
    enforceAccessibility: boolean,
    respectUserPreferences: boolean
  ): OptimizationResult {
    const reasoning: string[] = [];
    const adjustments: string[] = [];

    // Validate inputs
    if (!Number.isFinite(fontSize) || fontSize <= 0) {
      fontSize = 16; // Safe fallback
      reasoning.push('Invalid fontSize, using fallback: 16px');
    }

    if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
      containerWidth = 600; // Safe fallback
      reasoning.push('Invalid containerWidth, using fallback: 600px');
    }

    // Start with base density ratio
    let lineHeight = this.densityRatios[density];
    reasoning.push(`Base ${density} density: ${lineHeight}`);

    // Adjust for content type
    const contentAdjustment = this.getContentTypeAdjustment(contentType);
    lineHeight += contentAdjustment;
    if (contentAdjustment !== 0) {
      adjustments.push(`Content type (${contentType}): ${contentAdjustment > 0 ? '+' : ''}${contentAdjustment}`);
    }

    // Adjust for language
    const langCode = language.toLowerCase().split('-')[0];
    const languageAdjustment = this.languageAdjustments[langCode as keyof typeof this.languageAdjustments] || this.languageAdjustments.default;
    lineHeight += languageAdjustment;
    if (languageAdjustment !== 0) {
      adjustments.push(`Language (${langCode}): +${languageAdjustment}`);
    }

    // Adjust for line length (characters per line)
    const lineLength = this.estimateLineLength(fontSize, containerWidth);
    const lineLengthAdjustment = this.getLineLengthAdjustment(lineLength);
    lineHeight += lineLengthAdjustment;
    if (lineLengthAdjustment !== 0) {
      adjustments.push(`Line length (${lineLength} chars): ${lineLengthAdjustment > 0 ? '+' : ''}${lineLengthAdjustment}`);
    }

    // Adjust for font size
    const fontSizeAdjustment = this.getFontSizeAdjustment(fontSize);
    lineHeight += fontSizeAdjustment;
    if (fontSizeAdjustment !== 0) {
      adjustments.push(`Font size (${fontSize}px): ${fontSizeAdjustment > 0 ? '+' : ''}${fontSizeAdjustment}`);
    }

    // Apply user preferences
    if (respectUserPreferences) {
      const userAdjustment = this.getUserPreferenceAdjustment();
      lineHeight *= userAdjustment;
      if (userAdjustment !== 1) {
        adjustments.push(`User preferences: ×${userAdjustment}`);
      }
    }

    // Enforce accessibility minimums
    let accessibilityCompliant = true;
    if (accessibility !== 'none' && enforceAccessibility) {
      const minimum = this.accessibilityMinimums[accessibility];
      if (lineHeight < minimum) {
        lineHeight = minimum;
        accessibilityCompliant = false;
        adjustments.push(`Accessibility (${accessibility}): enforced minimum ${minimum}`);
        reasoning.push(`Enforced ${accessibility} minimum: ${minimum}`);
      } else {
        reasoning.push(`${accessibility} compliant: ${lineHeight} >= ${minimum}`);
      }
    }

    // Round to reasonable precision
    lineHeight = Math.round(lineHeight * 1000) / 1000;

    return {
      lineHeight,
      lineHeightCSS: lineHeight.toString(),
      reasoning,
      accessibilityCompliant,
      adjustments
    };
  }

  /**
   * Get adjustment based on content type
   */
  private getContentTypeAdjustment(contentType: string): number {
    const adjustments: Record<string, number> = {
      body: 0,
      'body-text': 0,   // Alias for body
      heading: -0.1,    // Headings can be tighter
      caption: -0.05,   // Captions slightly tighter
      code: 0.1        // Code needs more space
    };

    return adjustments[contentType] ?? 0; // Default to 0 for unknown types
  }

  /**
   * Estimate characters per line based on font size and container width
   */
  private estimateLineLength(fontSize: number, containerWidth: number): number {
    // Rough estimate: average character width is about 0.6 * font size
    const avgCharWidth = fontSize * 0.6;
    return Math.floor(containerWidth / avgCharWidth);
  }

  /**
   * Get adjustment based on line length (optimal is 45-75 characters)
   */
  private getLineLengthAdjustment(lineLength: number): number {
    if (lineLength < 30) return 0.1;      // Very short lines need more space
    if (lineLength < 45) return 0.05;     // Short lines need slightly more space
    if (lineLength <= 75) return 0;       // Optimal range
    if (lineLength <= 100) return 0.05;   // Long lines need more space
    return 0.1;                           // Very long lines need much more space
  }

  /**
   * Get adjustment based on font size
   */
  private getFontSizeAdjustment(fontSize: number): number {
    if (fontSize < 12) return 0.1;        // Very small text needs more space
    if (fontSize < 14) return 0.05;       // Small text needs slightly more space
    if (fontSize <= 18) return 0;         // Normal range
    if (fontSize <= 24) return -0.05;     // Large text can be tighter
    return -0.1;                          // Very large text can be much tighter
  }

  /**
   * Get user preference adjustment from system settings
   */
  private getUserPreferenceAdjustment(): number {
    // Check for user's preferred line spacing
    // This could be expanded to read from CSS custom properties or localStorage
    const rootStyle = getComputedStyle(document.documentElement);
    const userLineSpacing = rootStyle.getPropertyValue('--user-line-spacing');
    
    if (userLineSpacing) {
      const adjustment = parseFloat(userLineSpacing);
      return isNaN(adjustment) ? 1 : Math.max(0.8, Math.min(2, adjustment));
    }

    return 1; // No adjustment
  }

  /**
   * Apply line height to element
   */
  private applyLineHeight(element: Element, lineHeight: string): void {
    const htmlElement = element as HTMLElement;
    htmlElement.style.lineHeight = lineHeight;
  }

  /**
   * Setup ResizeObserver for responsive line height adjustments
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      console.warn('ProteusJS: ResizeObserver not supported. Responsive line height may not work correctly.');
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (this.appliedElements.has(entry.target)) {
          this.updateLineHeight(entry.target);
        }
      }
    });
  }
}
