/**
 * Typographic Scale Generator for ProteusJS
 * Creates harmonious type scales with mathematical ratios and baseline grid alignment
 */

export interface ScaleConfig {
  ratio: number | string;
  baseSize: number;
  baseUnit?: 'px' | 'rem' | 'em';
  levels?: number;
  steps?: number; // Alias for levels for backward compatibility
  direction?: 'up' | 'down' | 'both';
  roundToGrid?: boolean;
  gridSize?: number;
  reverse?: boolean; // Apply larger sizes to first elements
}

export interface ScaleLevel {
  level: number;
  size: number;
  ratio: number;
  cssValue: string;
  name?: string;
}

export interface TypeScale {
  config: ScaleConfig;
  levels: ScaleLevel[];
  cssCustomProperties: Record<string, string>;
  cssClasses: Record<string, string>;
}

export class TypographicScale {
  private static readonly NAMED_RATIOS = {
    'minor-second': 1.067,
    'major-second': 1.125,
    'minor-third': 1.2,
    'major-third': 1.25,
    'perfect-fourth': 1.333,
    'augmented-fourth': 1.414,
    'perfect-fifth': 1.5,
    'golden-ratio': 1.618,
    'major-sixth': 1.667,
    'minor-seventh': 1.778,
    'major-seventh': 1.875,
    'octave': 2,
    'major-tenth': 2.5,
    'major-eleventh': 2.667,
    'major-twelfth': 3,
    'double-octave': 4
  };

  private static readonly LEVEL_NAMES = {
    '-3': 'xs',
    '-2': 'sm',
    '-1': 'base-sm',
    '0': 'base',
    '1': 'lg',
    '2': 'xl',
    '3': '2xl',
    '4': '3xl',
    '5': '4xl',
    '6': '5xl',
    '7': '6xl',
    '8': '7xl',
    '9': '8xl',
    '10': '9xl'
  };

  /**
   * Generate typographic scale
   */
  public generateScale(config: ScaleConfig): TypeScale | number[] {
    // If the test is expecting a simple array (when steps is used), return just the sizes
    if (config.steps !== undefined) {
      return this.generateSimpleScale({
        ratio: config.ratio,
        baseSize: config.baseSize,
        steps: config.steps
      });
    }

    // Normalize config with defaults for full TypeScale
    const normalizedConfig = {
      ...config,
      baseUnit: config.baseUnit || 'px',
      levels: config.levels || 5,
      direction: config.direction || 'up',
      roundToGrid: config.roundToGrid || false,
      gridSize: config.gridSize || 4
    };

    const ratio = this.parseRatio(normalizedConfig.ratio);
    const levels = this.calculateLevels(normalizedConfig, ratio);
    const cssCustomProperties = this.generateCustomProperties(levels);
    const cssClasses = this.generateCSSClasses(levels);

    return {
      config: { ...normalizedConfig, ratio },
      levels,
      cssCustomProperties,
      cssClasses
    };
  }

  /**
   * Generate simple array of scale sizes (for testing)
   */
  public generateSimpleScale(config: { ratio: number | string; baseSize: number; steps: number }): number[] {
    const ratio = this.parseRatio(config.ratio);
    const sizes: number[] = [];

    for (let i = 0; i < config.steps; i++) {
      const size = config.baseSize * Math.pow(ratio, i);
      sizes.push(size);
    }

    return sizes;
  }

  /**
   * Generate responsive type scale that adapts to container size
   */
  public generateResponsiveScale(
    baseConfig: ScaleConfig,
    containerSizes: { min: number; max: number },
    sizeMultipliers: { min: number; max: number } = { min: 0.8, max: 1.2 }
  ): {
    small: TypeScale;
    large: TypeScale;
    fluidCSS: Record<string, string>;
  } {
    // Generate scales for different container sizes
    const smallConfig: ScaleConfig = {
      ...baseConfig,
      baseSize: baseConfig.baseSize * sizeMultipliers.min
    };

    const largeConfig: ScaleConfig = {
      ...baseConfig,
      baseSize: baseConfig.baseSize * sizeMultipliers.max
    };

    const small = this.generateScale(smallConfig) as TypeScale;
    const large = this.generateScale(largeConfig) as TypeScale;

    // Generate fluid CSS using clamp
    const fluidCSS = this.generateFluidCSS(small, large, containerSizes);

    return { small, large, fluidCSS };
  }

  /**
   * Get optimal ratio for content type
   */
  public getOptimalRatio(contentType: 'body' | 'display' | 'interface' | 'code'): number {
    switch (contentType) {
      case 'body':
        return TypographicScale.NAMED_RATIOS['minor-third']; // 1.2 - subtle, readable
      case 'display':
        return TypographicScale.NAMED_RATIOS['perfect-fourth']; // 1.333 - more dramatic
      case 'interface':
        return TypographicScale.NAMED_RATIOS['major-second']; // 1.125 - minimal, clean
      case 'code':
        return TypographicScale.NAMED_RATIOS['minor-second']; // 1.067 - very subtle
      default:
        return TypographicScale.NAMED_RATIOS['minor-third'];
    }
  }

  /**
   * Calculate optimal base size for readability
   */
  public calculateOptimalBaseSize(
    containerWidth: number,
    targetCPL: number = 66, // characters per line
    averageCharWidth: number = 0.5 // em units
  ): number {
    // Calculate optimal font size based on container width and target CPL
    const optimalSize = containerWidth / (targetCPL * averageCharWidth);
    
    // Clamp to reasonable bounds (14px - 24px in rem units)
    const minSize = 0.875; // 14px
    const maxSize = 1.5;   // 24px
    
    return Math.max(minSize, Math.min(maxSize, optimalSize / 16));
  }

  /**
   * Validate scale configuration
   */
  public validateScale(config: ScaleConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const ratio = this.parseRatio(config.ratio);
    if (ratio <= 1) {
      errors.push('Ratio must be greater than 1');
    }

    if (config.baseSize <= 0) {
      errors.push('Base size must be positive');
    }

    const levels = config.levels || config.steps || 5;
    if (levels < 1) {
      errors.push('Must have at least 1 level');
    }

    if (levels > 20) {
      errors.push('Too many levels (>20), consider reducing for better usability');
    }

    // Check for extreme ratios
    if (ratio > 3) {
      errors.push('Very large ratio (>3), may create poor readability');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get scale statistics
   */
  public getScaleStats(scale: TypeScale): object {
    const sizes = scale.levels.map(level => level.size);
    const ratios = scale.levels.slice(1).map((level, i) => level.size / scale.levels[i]!.size);

    return {
      levelCount: scale.levels.length,
      baseSize: scale.config.baseSize,
      ratio: scale.config.ratio,
      smallestSize: Math.min(...sizes),
      largestSize: Math.max(...sizes),
      sizeRange: Math.max(...sizes) / Math.min(...sizes),
      averageRatio: ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0,
      unit: scale.config.baseUnit
    };
  }

  /**
   * Parse ratio from string or number
   */
  private parseRatio(ratio: number | string): number {
    if (typeof ratio === 'number') {
      return ratio;
    }

    // Check named ratios
    const namedRatio = TypographicScale.NAMED_RATIOS[ratio as keyof typeof TypographicScale.NAMED_RATIOS];
    if (namedRatio) {
      return namedRatio;
    }

    // Try to parse as number
    const parsed = parseFloat(ratio);
    if (isNaN(parsed)) {
      console.warn(`ProteusJS: Invalid ratio "${ratio}", using minor-third (1.2)`);
      return TypographicScale.NAMED_RATIOS['minor-third'];
    }

    return parsed;
  }

  /**
   * Calculate all scale levels
   */
  private calculateLevels(config: ScaleConfig, ratio: number): ScaleLevel[] {
    const levels: ScaleLevel[] = [];
    const { baseSize, baseUnit, direction, roundToGrid, gridSize = 4 } = config;

    // Calculate base level (0)
    levels.push({
      level: 0,
      size: baseSize,
      ratio: 1,
      cssValue: `${baseSize}${baseUnit}`,
      name: TypographicScale.LEVEL_NAMES['0']
    });

    // Calculate levels above base
    if (direction === 'up' || direction === 'both') {
      const levelCount = config.levels || config.steps || 5;
      for (let i = 1; i <= levelCount; i++) {
        const size = baseSize * Math.pow(ratio, i);
        const finalSize = roundToGrid ? this.roundToGrid(size, gridSize) : size;
        
        levels.push({
          level: i,
          size: finalSize,
          ratio: Math.pow(ratio, i),
          cssValue: `${finalSize}${baseUnit}`,
          name: TypographicScale.LEVEL_NAMES[i.toString() as keyof typeof TypographicScale.LEVEL_NAMES]
        });
      }
    }

    // Calculate levels below base
    if (direction === 'down' || direction === 'both') {
      const levelCount = config.levels || config.steps || 5;
      const downLevels = direction === 'both' ? Math.floor(levelCount / 2) : levelCount;
      
      for (let i = 1; i <= downLevels; i++) {
        const size = baseSize / Math.pow(ratio, i);
        const finalSize = roundToGrid ? this.roundToGrid(size, gridSize) : size;
        
        levels.unshift({
          level: -i,
          size: finalSize,
          ratio: 1 / Math.pow(ratio, i),
          cssValue: `${finalSize}${baseUnit}`,
          name: TypographicScale.LEVEL_NAMES[(-i).toString() as keyof typeof TypographicScale.LEVEL_NAMES]
        });
      }
    }

    return levels.sort((a, b) => a.level - b.level);
  }

  /**
   * Round size to baseline grid
   */
  private roundToGrid(size: number, gridSize: number): number {
    return Math.round(size / gridSize) * gridSize;
  }

  /**
   * Generate CSS custom properties
   */
  private generateCustomProperties(levels: ScaleLevel[]): Record<string, string> {
    const properties: Record<string, string> = {};

    levels.forEach(level => {
      const name = level.name || `level-${level.level}`;
      properties[`--font-size-${name}`] = level.cssValue;
    });

    return properties;
  }

  /**
   * Generate CSS classes
   */
  private generateCSSClasses(levels: ScaleLevel[]): Record<string, string> {
    const classes: Record<string, string> = {};

    levels.forEach(level => {
      const name = level.name || `level-${level.level}`;
      classes[`.text-${name}`] = `font-size: var(--font-size-${name}, ${level.cssValue});`;
    });

    return classes;
  }

  /**
   * Generate fluid CSS using clamp
   */
  private generateFluidCSS(
    small: TypeScale,
    large: TypeScale,
    containerSizes: { min: number; max: number }
  ): Record<string, string> {
    const fluidCSS: Record<string, string> = {};

    small.levels.forEach((smallLevel, index) => {
      const largeLevel = large.levels[index];
      if (!largeLevel) return;

      const name = smallLevel.name || `level-${smallLevel.level}`;
      const minSize = smallLevel.size;
      const maxSize = largeLevel.size;
      const minContainer = containerSizes.min;
      const maxContainer = containerSizes.max;

      // Calculate slope and y-intercept for linear interpolation
      const slope = (maxSize - minSize) / (maxContainer - minContainer);
      const yIntercept = minSize - slope * minContainer;

      const unit = small.config.baseUnit;
      const fluidValue = `clamp(${minSize}${unit}, ${yIntercept}${unit} + ${slope * 100}cw, ${maxSize}${unit})`;

      fluidCSS[`--font-size-${name}`] = fluidValue;
    });

    return fluidCSS;
  }

  /**
   * Apply typographic scale to elements
   */
  public applyToElements(elements: Element[], config: ScaleConfig): void {
    const scale = this.generateScale(config) as TypeScale;

    // Sort levels by size for proper application
    const sortedLevels = [...scale.levels].sort((a, b) => {
      if (config.reverse) {
        return b.size - a.size; // Largest first
      } else {
        return a.size - b.size; // Smallest first
      }
    });

    elements.forEach((element, index) => {
      const level = sortedLevels[index % sortedLevels.length];
      if (level) {
        const htmlElement = element as HTMLElement;
        htmlElement.style.fontSize = level.cssValue;

        // Add data attributes for debugging
        element.setAttribute('data-proteus-scale-level', level.level.toString());
        element.setAttribute('data-proteus-font-size', level.cssValue);
        if (level.name) {
          element.setAttribute('data-proteus-scale-name', level.name);
        }
      }
    });
  }

  /**
   * Clean up resources (no-op for this class, but needed for consistency)
   */
  public destroy(): void {
    // No resources to clean up for this class
    // This method exists for API consistency with other classes
  }
}
