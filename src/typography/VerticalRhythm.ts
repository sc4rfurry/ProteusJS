/**
 * Responsive Vertical Rhythm for ProteusJS
 * Maintains consistent baseline grid and spacing ratios
 */

export interface RhythmConfig {
  baseFontSize: number;
  baseLineHeight: number;
  baselineUnit: number;
  scale: 'minor-second' | 'major-second' | 'minor-third' | 'major-third' | 'perfect-fourth' | 'golden-ratio' | number;
  precision: number;
  responsive: boolean;
  containerAware: boolean;
}

export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface RhythmResult {
  baselineGrid: number;
  spacingScale: SpacingScale;
  lineHeights: Record<string, number>;
  margins: Record<string, number>;
  paddings: Record<string, number>;
}

export class VerticalRhythm {
  private static readonly SCALE_RATIOS = {
    'minor-second': 1.067,
    'major-second': 1.125,
    'minor-third': 1.2,
    'major-third': 1.25,
    'perfect-fourth': 1.333,
    'golden-ratio': 1.618
  };

  private config: Required<RhythmConfig>;
  private baselineGrid: number;

  constructor(config: RhythmConfig) {
    const defaults = {
      baseFontSize: 16,
      baseLineHeight: 1.5,
      baselineUnit: 24, // 16px * 1.5
      scale: 'minor-third' as const,
      precision: 0.001,
      responsive: true,
      containerAware: false
    };
    this.config = { ...defaults, ...config };

    this.baselineGrid = this.config.baselineUnit;
  }

  /**
   * Generate complete vertical rhythm system
   */
  public generateRhythm(containerSize?: number): RhythmResult {
    // Adjust baseline for container size if container-aware
    if (this.config.containerAware && containerSize) {
      this.adjustBaselineForContainer(containerSize);
    }

    const spacingScale = this.generateSpacingScale();
    const lineHeights = this.generateLineHeights();
    const margins = this.generateMargins();
    const paddings = this.generatePaddings();

    return {
      baselineGrid: this.baselineGrid,
      spacingScale,
      lineHeights,
      margins,
      paddings
    };
  }

  /**
   * Apply rhythm to element
   */
  public applyRhythm(element: Element, rhythm: RhythmResult): void {
    const htmlElement = element as HTMLElement;
    
    // Set CSS custom properties for the rhythm system
    Object.entries(rhythm.spacingScale).forEach(([key, value]) => {
      htmlElement.style.setProperty(`--rhythm-${key}`, `${value}px`);
    });

    Object.entries(rhythm.lineHeights).forEach(([key, value]) => {
      htmlElement.style.setProperty(`--line-height-${key}`, value.toString());
    });

    Object.entries(rhythm.margins).forEach(([key, value]) => {
      htmlElement.style.setProperty(`--margin-${key}`, `${value}px`);
    });

    Object.entries(rhythm.paddings).forEach(([key, value]) => {
      htmlElement.style.setProperty(`--padding-${key}`, `${value}px`);
    });

    // Set baseline grid
    htmlElement.style.setProperty('--baseline-grid', `${rhythm.baselineGrid}px`);
  }

  /**
   * Calculate spacing that aligns to baseline grid
   */
  public toBaseline(value: number): number {
    return Math.round(value / this.baselineGrid) * this.baselineGrid;
  }

  /**
   * Calculate line height that maintains baseline alignment
   */
  public calculateBaselineLineHeight(fontSize: number): number {
    const rawLineHeight = fontSize * this.config.baseLineHeight;
    const baselineAligned = this.toBaseline(rawLineHeight);
    return baselineAligned / fontSize;
  }

  /**
   * Generate responsive spacing scale
   */
  public generateResponsiveSpacing(
    containerSizes: number[],
    scaleFactors: number[]
  ): Record<string, SpacingScale> {
    const responsiveSpacing: Record<string, SpacingScale> = {};

    containerSizes.forEach((size, index) => {
      const scaleFactor = scaleFactors[index] || 1;
      const scaledBaseline = this.baselineGrid * scaleFactor;
      
      responsiveSpacing[`container-${size}`] = {
        xs: scaledBaseline * 0.25,
        sm: scaledBaseline * 0.5,
        md: scaledBaseline,
        lg: scaledBaseline * 1.5,
        xl: scaledBaseline * 2,
        xxl: scaledBaseline * 3
      };
    });

    return responsiveSpacing;
  }

  /**
   * Create CSS for vertical rhythm
   */
  public generateCSS(rhythm: RhythmResult): string {
    let css = ':root {\n';
    
    // Baseline grid
    css += `  --baseline-grid: ${rhythm.baselineGrid}px;\n`;
    
    // Spacing scale
    Object.entries(rhythm.spacingScale).forEach(([key, value]) => {
      css += `  --rhythm-${key}: ${value}px;\n`;
    });

    // Line heights
    Object.entries(rhythm.lineHeights).forEach(([key, value]) => {
      css += `  --line-height-${key}: ${value};\n`;
    });

    // Margins
    Object.entries(rhythm.margins).forEach(([key, value]) => {
      css += `  --margin-${key}: ${value}px;\n`;
    });

    // Paddings
    Object.entries(rhythm.paddings).forEach(([key, value]) => {
      css += `  --padding-${key}: ${value}px;\n`;
    });

    css += '}\n\n';

    // Utility classes
    css += this.generateUtilityClasses(rhythm);

    return css;
  }

  /**
   * Validate rhythm consistency
   */
  public validateRhythm(rhythm: RhythmResult): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if all spacing values align to baseline
    Object.entries(rhythm.spacingScale).forEach(([key, value]) => {
      if (value % rhythm.baselineGrid !== 0) {
        issues.push(`Spacing ${key} (${value}px) doesn't align to baseline grid (${rhythm.baselineGrid}px)`);
      }
    });

    // Check if margins align to baseline
    Object.entries(rhythm.margins).forEach(([key, value]) => {
      if (value % rhythm.baselineGrid !== 0) {
        issues.push(`Margin ${key} (${value}px) doesn't align to baseline grid`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate spacing scale based on ratio
   */
  private generateSpacingScale(): SpacingScale {
    const ratio = typeof this.config.scale === 'number' 
      ? this.config.scale 
      : VerticalRhythm.SCALE_RATIOS[this.config.scale];

    const base = this.baselineGrid;

    return {
      xs: this.toBaseline(base / (ratio * ratio)), // base / ratio²
      sm: this.toBaseline(base / ratio),           // base / ratio
      md: base,                                    // base
      lg: this.toBaseline(base * ratio),           // base * ratio
      xl: this.toBaseline(base * ratio * ratio),   // base * ratio²
      xxl: this.toBaseline(base * ratio * ratio * ratio) // base * ratio³
    };
  }

  /**
   * Generate line heights for different text sizes
   */
  private generateLineHeights(): Record<string, number> {
    return {
      'tight': 1.2,
      'normal': 1.5,
      'relaxed': 1.75,
      'loose': 2.0
    };
  }

  /**
   * Generate margin scale
   */
  private generateMargins(): Record<string, number> {
    const spacingScale = this.generateSpacingScale();
    
    return {
      'none': 0,
      'xs': spacingScale.xs,
      'sm': spacingScale.sm,
      'md': spacingScale.md,
      'lg': spacingScale.lg,
      'xl': spacingScale.xl,
      'auto': -1 // Special value for auto margins
    };
  }

  /**
   * Generate padding scale
   */
  private generatePaddings(): Record<string, number> {
    const spacingScale = this.generateSpacingScale();
    
    return {
      'none': 0,
      'xs': spacingScale.xs,
      'sm': spacingScale.sm,
      'md': spacingScale.md,
      'lg': spacingScale.lg,
      'xl': spacingScale.xl
    };
  }

  /**
   * Adjust baseline for container size
   */
  private adjustBaselineForContainer(containerSize: number): void {
    // Scale baseline based on container size
    // Smaller containers get smaller baseline, larger containers get larger baseline
    const scaleFactor = Math.max(0.75, Math.min(1.5, containerSize / 800));
    this.baselineGrid = Math.round(this.config.baselineUnit * scaleFactor);
  }

  /**
   * Generate utility CSS classes
   */
  private generateUtilityClasses(rhythm: RhythmResult): string {
    let css = '';

    // Spacing utilities
    Object.entries(rhythm.spacingScale).forEach(([key, value]) => {
      css += `.m-${key} { margin: ${value}px; }\n`;
      css += `.mt-${key} { margin-top: ${value}px; }\n`;
      css += `.mr-${key} { margin-right: ${value}px; }\n`;
      css += `.mb-${key} { margin-bottom: ${value}px; }\n`;
      css += `.ml-${key} { margin-left: ${value}px; }\n`;
      css += `.mx-${key} { margin-left: ${value}px; margin-right: ${value}px; }\n`;
      css += `.my-${key} { margin-top: ${value}px; margin-bottom: ${value}px; }\n`;
      
      css += `.p-${key} { padding: ${value}px; }\n`;
      css += `.pt-${key} { padding-top: ${value}px; }\n`;
      css += `.pr-${key} { padding-right: ${value}px; }\n`;
      css += `.pb-${key} { padding-bottom: ${value}px; }\n`;
      css += `.pl-${key} { padding-left: ${value}px; }\n`;
      css += `.px-${key} { padding-left: ${value}px; padding-right: ${value}px; }\n`;
      css += `.py-${key} { padding-top: ${value}px; padding-bottom: ${value}px; }\n`;
    });

    // Line height utilities
    Object.entries(rhythm.lineHeights).forEach(([key, value]) => {
      css += `.leading-${key} { line-height: ${value}; }\n`;
    });

    // Baseline alignment utilities
    css += '.baseline-align { ';
    css += `background-image: linear-gradient(to bottom, transparent ${rhythm.baselineGrid - 1}px, rgba(255, 0, 0, 0.1) ${rhythm.baselineGrid - 1}px, rgba(255, 0, 0, 0.1) ${rhythm.baselineGrid}px, transparent ${rhythm.baselineGrid}px); `;
    css += `background-size: 100% ${rhythm.baselineGrid}px; `;
    css += '}\n';

    return css;
  }

  /**
   * Create responsive vertical rhythm
   */
  public createResponsiveRhythm(
    element: Element,
    containerSizes: number[],
    scaleFactors: number[]
  ): () => void {
    const updateRhythm = () => {
      const containerWidth = element.getBoundingClientRect().width;
      
      // Find appropriate scale factor
      let scaleFactor = 1;
      for (let i = 0; i < containerSizes.length; i++) {
        if (containerWidth >= containerSizes[i]!) {
          scaleFactor = scaleFactors[i] || 1;
        }
      }

      // Generate rhythm for current container size
      const rhythm = this.generateRhythm(containerWidth);
      this.applyRhythm(element, rhythm);
    };

    // Initial application
    updateRhythm();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateRhythm();
    });

    resizeObserver.observe(element);

    // Return cleanup function
    return () => {
      resizeObserver.disconnect();
    };
  }
}
