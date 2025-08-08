/**
 * Responsive Spacing System for ProteusJS
 * Fluid spacing with proportional scaling and accessibility compliance
 */

export interface SpacingConfig {
  baseSize: number;
  scale: 'minor-second' | 'major-second' | 'minor-third' | 'major-third' | 'perfect-fourth' | 'golden-ratio' | number;
  density: 'compact' | 'comfortable' | 'spacious';
  containerAware: boolean;
  accessibility: boolean;
  touchTargets: boolean;
  minTouchSize: number;
  maxSpacing: number;
  responsive: boolean;
  breakpoints?: Record<string, Partial<SpacingConfig>>;
}

export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface TouchTargetConfig {
  minSize: number;
  preferredSize: number;
  spacing: number;
  interactive: boolean;
}

export interface SpacingState {
  currentScale: SpacingScale;
  containerSize: number;
  scaleFactor: number;
  touchCompliant: boolean;
  appliedSpacing: Map<Element, string>;
}

export class SpacingSystem {
  private element: Element;
  private config: Required<SpacingConfig>;
  private state: SpacingState;
  private resizeObserver: ResizeObserver | null = null;

  private static readonly SCALE_RATIOS = {
    'minor-second': 1.067,
    'major-second': 1.125,
    'minor-third': 1.2,
    'major-third': 1.25,
    'perfect-fourth': 1.333,
    'golden-ratio': 1.618
  };

  private static readonly DENSITY_MULTIPLIERS = {
    'compact': 0.8,
    'comfortable': 1.0,
    'spacious': 1.25
  };

  private static readonly WCAG_MIN_TOUCH_SIZE = 44; // pixels

  constructor(element: Element, config: Partial<SpacingConfig> = {}) {
    this.element = element;
    this.config = {
      baseSize: 16,
      scale: 'minor-third',
      density: 'comfortable',
      containerAware: true,
      accessibility: true,
      touchTargets: true,
      minTouchSize: SpacingSystem.WCAG_MIN_TOUCH_SIZE,
      maxSpacing: 128,
      responsive: true,
      breakpoints: {},
      ...config
    };

    this.state = this.createInitialState();
    this.setupSpacing();
  }

  /**
   * Activate the spacing system
   */
  public activate(): void {
    this.calculateSpacing();
    this.applySpacing();
    this.setupObservers();
  }

  /**
   * Deactivate and clean up
   */
  public deactivate(): void {
    this.cleanupObservers();
    this.removeSpacing();
  }

  /**
   * Update spacing configuration
   */
  public updateConfig(newConfig: Partial<SpacingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.activate();
  }

  /**
   * Get current spacing state
   */
  public getState(): SpacingState {
    return { ...this.state };
  }

  /**
   * Apply spacing to specific element
   */
  public applyToElement(element: Element, spacingType: keyof SpacingScale): void {
    const spacing = this.state.currentScale[spacingType];
    const htmlElement = element as HTMLElement;
    
    htmlElement.style.setProperty('--spacing', `${spacing}px`);
    this.state.appliedSpacing.set(element, spacingType);
  }

  /**
   * Apply margin spacing
   */
  public applyMargin(element: Element, spacing: keyof SpacingScale | number): void {
    const value = typeof spacing === 'number' ? spacing : this.state.currentScale[spacing];
    const htmlElement = element as HTMLElement;
    
    htmlElement.style.margin = `${value}px`;
  }

  /**
   * Apply padding spacing
   */
  public applyPadding(element: Element, spacing: keyof SpacingScale | number): void {
    const value = typeof spacing === 'number' ? spacing : this.state.currentScale[spacing];
    const htmlElement = element as HTMLElement;
    
    htmlElement.style.padding = `${value}px`;
  }

  /**
   * Apply gap spacing (for flex/grid)
   */
  public applyGap(element: Element, spacing: keyof SpacingScale | number): void {
    const value = typeof spacing === 'number' ? spacing : this.state.currentScale[spacing];
    const htmlElement = element as HTMLElement;
    
    htmlElement.style.gap = `${value}px`;
  }

  /**
   * Ensure touch target compliance
   */
  public ensureTouchTargets(): void {
    if (!this.config.touchTargets) return;

    const interactiveElements = this.findInteractiveElements();
    
    interactiveElements.forEach(element => {
      this.makeTouchCompliant(element);
    });
  }

  /**
   * Generate spacing scale
   */
  public generateScale(): SpacingScale {
    const ratio = typeof this.config.scale === 'number' 
      ? this.config.scale 
      : SpacingSystem.SCALE_RATIOS[this.config.scale];

    const densityMultiplier = SpacingSystem.DENSITY_MULTIPLIERS[this.config.density];
    const containerMultiplier = this.calculateContainerMultiplier();
    
    const baseSize = this.config.baseSize * densityMultiplier * containerMultiplier;

    return {
      xs: Math.round(baseSize / (ratio * ratio)), // base / ratio²
      sm: Math.round(baseSize / ratio),           // base / ratio
      md: Math.round(baseSize),                   // base
      lg: Math.round(baseSize * ratio),           // base * ratio
      xl: Math.round(baseSize * ratio * ratio),   // base * ratio²
      xxl: Math.min(Math.round(baseSize * ratio * ratio * ratio), this.config.maxSpacing) // base * ratio³
    };
  }

  /**
   * Calculate optimal spacing for content
   */
  public calculateOptimalSpacing(contentType: 'text' | 'interactive' | 'layout' | 'component'): keyof SpacingScale {
    switch (contentType) {
      case 'text':
        return this.config.density === 'compact' ? 'sm' : 'md';
      case 'interactive':
        return this.config.accessibility ? 'lg' : 'md';
      case 'layout':
        return this.config.density === 'spacious' ? 'xl' : 'lg';
      case 'component':
        return 'md';
      default:
        return 'md';
    }
  }

  /**
   * Validate accessibility compliance
   */
  public validateAccessibility(): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (this.config.touchTargets) {
      const interactiveElements = this.findInteractiveElements();
      
      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const minSize = this.config.minTouchSize;
        
        if (rect.width < minSize || rect.height < minSize) {
          issues.push(`Touch target too small: ${rect.width}x${rect.height} (minimum: ${minSize}x${minSize})`);
        }
      });
    }

    // Check spacing ratios
    const scale = this.state.currentScale;
    const ratios = [
      scale.sm / scale.xs,
      scale.md / scale.sm,
      scale.lg / scale.md,
      scale.xl / scale.lg
    ];

    const inconsistentRatios = ratios.length > 0 && ratios.some(ratio => Math.abs(ratio - ratios[0]!) > 0.1);
    if (inconsistentRatios) {
      issues.push('Inconsistent spacing ratios detected');
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }

  /**
   * Setup initial spacing
   */
  private setupSpacing(): void {
    this.calculateSpacing();
  }

  /**
   * Calculate spacing values
   */
  private calculateSpacing(): void {
    const containerRect = this.element.getBoundingClientRect();
    const activeConfig = this.getActiveConfig(containerRect.width);
    
    // Update state
    this.state = {
      currentScale: this.generateScale(),
      containerSize: containerRect.width,
      scaleFactor: this.calculateContainerMultiplier(),
      touchCompliant: this.validateTouchCompliance(),
      appliedSpacing: new Map()
    };
  }

  /**
   * Apply spacing to elements
   */
  private applySpacing(): void {
    // Apply CSS custom properties
    const htmlElement = this.element as HTMLElement;
    const scale = this.state.currentScale;
    
    Object.entries(scale).forEach(([key, value]) => {
      htmlElement.style.setProperty(`--spacing-${key}`, `${value}px`);
    });

    // Apply spacing classes
    this.addSpacingCSS();

    // Ensure touch targets if enabled
    if (this.config.touchTargets) {
      this.ensureTouchTargets();
    }
  }

  /**
   * Calculate container-based multiplier
   */
  private calculateContainerMultiplier(): number {
    if (!this.config.containerAware) return 1;

    const containerWidth = this.element.getBoundingClientRect().width;
    
    // Scale spacing based on container size
    // Smaller containers get smaller spacing, larger containers get larger spacing
    const baseWidth = 800; // Reference width
    const minMultiplier = 0.75;
    const maxMultiplier = 1.5;
    
    const ratio = containerWidth / baseWidth;
    return Math.max(minMultiplier, Math.min(maxMultiplier, ratio));
  }

  /**
   * Get active configuration based on container width
   */
  private getActiveConfig(containerWidth: number): Required<SpacingConfig> {
    let activeConfig = { ...this.config };

    if (this.config.breakpoints) {
      const sortedBreakpoints = Object.entries(this.config.breakpoints)
        .map(([name, config]) => ({ name, width: parseInt(name), config }))
        .sort((a, b) => a.width - b.width);

      for (const breakpoint of sortedBreakpoints) {
        if (containerWidth >= breakpoint.width) {
          activeConfig = { ...activeConfig, ...breakpoint.config };
        }
      }
    }

    return activeConfig;
  }

  /**
   * Find interactive elements
   */
  private findInteractiveElements(): Element[] {
    const interactiveSelectors = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="link"]',
      '[onclick]'
    ].join(', ');

    return Array.from(this.element.querySelectorAll(interactiveSelectors));
  }

  /**
   * Make element touch compliant
   */
  private makeTouchCompliant(element: Element): void {
    const htmlElement = element as HTMLElement;
    const rect = element.getBoundingClientRect();
    const minSize = this.config.minTouchSize;

    if (rect.width < minSize || rect.height < minSize) {
      htmlElement.style.minWidth = `${minSize}px`;
      htmlElement.style.minHeight = `${minSize}px`;
      htmlElement.style.display = htmlElement.style.display || 'inline-block';
    }

    // Ensure adequate spacing between touch targets
    const spacing = this.state.currentScale.sm;
    htmlElement.style.margin = `${spacing / 2}px`;
  }

  /**
   * Validate touch compliance
   */
  private validateTouchCompliance(): boolean {
    if (!this.config.touchTargets) return true;

    const interactiveElements = this.findInteractiveElements();
    
    return interactiveElements.every(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= this.config.minTouchSize && rect.height >= this.config.minTouchSize;
    });
  }

  /**
   * Add spacing CSS utilities
   */
  private addSpacingCSS(): void {
    const styleId = 'proteus-spacing-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    
    const scale = this.state.currentScale;
    let css = ':root {\n';
    
    Object.entries(scale).forEach(([key, value]) => {
      css += `  --spacing-${key}: ${value}px;\n`;
    });
    
    css += '}\n\n';

    // Utility classes
    Object.entries(scale).forEach(([key, value]) => {
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
      
      css += `.gap-${key} { gap: ${value}px; }\n`;
    });

    // Touch target utilities
    css += `
      .touch-target {
        min-width: ${this.config.minTouchSize}px;
        min-height: ${this.config.minTouchSize}px;
        display: inline-block;
      }
      
      .touch-spacing {
        margin: ${this.state.currentScale.sm / 2}px;
      }
    `;

    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Setup observers
   */
  private setupObservers(): void {
    if (!this.config.responsive) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.calculateSpacing();
      this.applySpacing();
    });

    this.resizeObserver.observe(this.element);
  }

  /**
   * Clean up observers
   */
  private cleanupObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Remove spacing
   */
  private removeSpacing(): void {
    const htmlElement = this.element as HTMLElement;
    const scale = this.state.currentScale;
    
    // Remove CSS custom properties
    Object.keys(scale).forEach(key => {
      htmlElement.style.removeProperty(`--spacing-${key}`);
    });

    // Remove applied spacing
    this.state.appliedSpacing.forEach((spacingType, element) => {
      (element as HTMLElement).style.removeProperty('--spacing');
    });

    // Remove style element
    const styleElement = document.getElementById('proteus-spacing-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * Create initial state
   */
  private createInitialState(): SpacingState {
    return {
      currentScale: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48
      },
      containerSize: 0,
      scaleFactor: 1,
      touchCompliant: true,
      appliedSpacing: new Map()
    };
  }
}
