/**
 * Enhanced Flexbox System for ProteusJS
 * Container query integration with intelligent flex calculations
 */

export interface FlexboxConfig {
  direction: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap: 'nowrap' | 'wrap' | 'wrap-reverse' | 'auto';
  justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap: number | 'fluid';
  responsive: boolean;
  autoWrap: boolean;
  minItemWidth?: number;
  maxItemWidth?: number;
  itemGrowRatio?: number;
  itemShrinkRatio?: number;
  breakpoints?: Record<string, Partial<FlexboxConfig>>;
}

export interface FlexItemConfig {
  grow: number;
  shrink: number;
  basis: string | number;
  order?: number;
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  responsive?: boolean;
}

export interface FlexboxState {
  containerWidth: number;
  containerHeight: number;
  itemCount: number;
  wrappedLines: number;
  optimalItemWidth: number;
  actualGap: number;
  overflow: boolean;
}

export class FlexboxEnhancer {
  private element: Element;
  private config: Required<FlexboxConfig>;
  private state: FlexboxState;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  constructor(element: Element, config: Partial<FlexboxConfig> = {}) {
    this.element = element;
    this.config = {
      direction: 'row',
      wrap: 'auto',
      justify: 'flex-start',
      align: 'stretch',
      gap: 16,
      responsive: true,
      autoWrap: true,
      minItemWidth: 200,
      maxItemWidth: 800,
      itemGrowRatio: 1,
      itemShrinkRatio: 1,
      breakpoints: {},
      ...config
    };

    this.state = this.createInitialState();
    this.setupFlexbox();
  }

  /**
   * Activate the enhanced flexbox
   */
  public activate(): void {
    this.updateFlexbox();
    this.setupObservers();
  }

  /**
   * Deactivate and clean up
   */
  public deactivate(): void {
    this.cleanupObservers();
    this.removeFlexboxStyles();
  }

  /**
   * Update flexbox configuration
   */
  public updateConfig(newConfig: Partial<FlexboxConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateFlexbox();
  }

  /**
   * Get current flexbox state
   */
  public getState(): FlexboxState {
    return { ...this.state };
  }

  /**
   * Configure individual flex item
   */
  public configureItem(item: Element, config: FlexItemConfig): void {
    const htmlItem = item as HTMLElement;
    
    htmlItem.style.flexGrow = config.grow.toString();
    htmlItem.style.flexShrink = config.shrink.toString();
    htmlItem.style.flexBasis = typeof config.basis === 'number' 
      ? `${config.basis}px` 
      : config.basis;
    
    if (config.order !== undefined) {
      htmlItem.style.order = config.order.toString();
    }
    
    if (config.alignSelf) {
      htmlItem.style.alignSelf = config.alignSelf;
    }
  }

  /**
   * Auto-configure all flex items
   */
  public autoConfigureItems(): void {
    const items = Array.from(this.element.children) as HTMLElement[];
    const optimalConfig = this.calculateOptimalItemConfig();
    
    items.forEach(item => {
      this.configureItem(item, optimalConfig);
    });
  }

  /**
   * Detect if wrapping is needed
   */
  public shouldWrap(): boolean {
    if (!this.config.autoWrap) return this.config.wrap === 'wrap';
    
    const containerWidth = this.element.getBoundingClientRect().width;
    const itemCount = this.element.children.length;
    const gap = this.getGapValue();
    const minItemWidth = this.config.minItemWidth || 200;
    
    const totalMinWidth = (itemCount * minItemWidth) + (gap * (itemCount - 1));
    return totalMinWidth > containerWidth;
  }

  /**
   * Calculate optimal space distribution
   */
  public calculateSpaceDistribution(): {
    itemWidth: number;
    gap: number;
    remainingSpace: number;
  } {
    const containerWidth = this.element.getBoundingClientRect().width;
    const itemCount = this.element.children.length;
    const gap = this.getGapValue();
    
    if (this.shouldWrap()) {
      // Calculate for wrapped layout
      const itemsPerLine = this.calculateItemsPerLine();
      const availableWidth = containerWidth - (gap * (itemsPerLine - 1));
      const itemWidth = availableWidth / itemsPerLine;
      
      return {
        itemWidth,
        gap,
        remainingSpace: 0
      };
    } else {
      // Calculate for single line
      const totalGapSpace = gap * (itemCount - 1);
      const availableWidth = containerWidth - totalGapSpace;
      const itemWidth = availableWidth / itemCount;
      
      return {
        itemWidth,
        gap,
        remainingSpace: Math.max(0, containerWidth - (itemCount * itemWidth + totalGapSpace))
      };
    }
  }

  /**
   * Calculate items per line for wrapped layout
   */
  public calculateItemsPerLine(): number {
    const containerWidth = this.element.getBoundingClientRect().width;
    const minItemWidth = this.config.minItemWidth || 200;
    const gap = this.getGapValue();
    
    // Binary search for optimal items per line
    let min = 1;
    let max = this.element.children.length;
    let optimal = 1;
    
    while (min <= max) {
      const mid = Math.floor((min + max) / 2);
      const totalWidth = (mid * minItemWidth) + (gap * (mid - 1));
      
      if (totalWidth <= containerWidth) {
        optimal = mid;
        min = mid + 1;
      } else {
        max = mid - 1;
      }
    }
    
    return optimal;
  }

  /**
   * Setup initial flexbox styles
   */
  private setupFlexbox(): void {
    const htmlElement = this.element as HTMLElement;
    htmlElement.style.display = 'flex';
    this.applyFlexboxStyles();
  }

  /**
   * Update flexbox layout
   */
  private updateFlexbox(): void {
    const containerRect = this.element.getBoundingClientRect();
    const activeConfig = this.getActiveConfig(containerRect.width);
    
    // Update state
    this.state = {
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
      itemCount: this.element.children.length,
      wrappedLines: this.calculateWrappedLines(),
      optimalItemWidth: this.calculateSpaceDistribution().itemWidth,
      actualGap: this.getGapValue(),
      overflow: this.checkOverflow()
    };
    
    // Apply styles with active config
    this.applyFlexboxStyles(activeConfig);
    
    // Auto-configure items if enabled
    if (this.config.autoWrap) {
      this.autoConfigureItems();
    }
  }

  /**
   * Apply flexbox styles
   */
  private applyFlexboxStyles(config: Required<FlexboxConfig> = this.config): void {
    const htmlElement = this.element as HTMLElement;
    
    htmlElement.style.flexDirection = config.direction;
    htmlElement.style.flexWrap = config.wrap === 'auto' 
      ? (this.shouldWrap() ? 'wrap' : 'nowrap')
      : config.wrap;
    htmlElement.style.justifyContent = config.justify;
    htmlElement.style.alignItems = config.align;
    htmlElement.style.gap = `${this.getGapValue()}px`;
  }

  /**
   * Calculate optimal item configuration
   */
  private calculateOptimalItemConfig(): FlexItemConfig {
    const spaceDistribution = this.calculateSpaceDistribution();
    const isWrapped = this.shouldWrap();
    
    return {
      grow: isWrapped ? 0 : this.config.itemGrowRatio,
      shrink: this.config.itemShrinkRatio,
      basis: isWrapped ? `${spaceDistribution.itemWidth}px` : 'auto',
      alignSelf: 'auto'
    };
  }

  /**
   * Calculate number of wrapped lines
   */
  private calculateWrappedLines(): number {
    if (!this.shouldWrap()) return 1;
    
    const itemsPerLine = this.calculateItemsPerLine();
    return Math.ceil(this.element.children.length / itemsPerLine);
  }

  /**
   * Check if content overflows
   */
  private checkOverflow(): boolean {
    const containerWidth = this.element.getBoundingClientRect().width;
    const spaceDistribution = this.calculateSpaceDistribution();
    const totalRequiredWidth = this.element.children.length * spaceDistribution.itemWidth + 
                              (this.element.children.length - 1) * spaceDistribution.gap;
    
    return totalRequiredWidth > containerWidth && !this.shouldWrap();
  }

  /**
   * Get active configuration based on container width
   */
  private getActiveConfig(containerWidth: number): Required<FlexboxConfig> {
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
   * Get gap value in pixels
   */
  private getGapValue(): number {
    if (this.config.gap === 'fluid') {
      const containerWidth = this.element.getBoundingClientRect().width;
      return Math.max(8, Math.min(32, containerWidth * 0.02));
    }
    return this.config.gap as number;
  }

  /**
   * Setup observers for responsive behavior
   */
  private setupObservers(): void {
    if (!this.config.responsive) return;
    
    this.resizeObserver = new ResizeObserver(() => {
      this.updateFlexbox();
    });
    this.resizeObserver.observe(this.element);
    
    this.mutationObserver = new MutationObserver(() => {
      this.updateFlexbox();
    });
    this.mutationObserver.observe(this.element, {
      childList: true,
      subtree: false
    });
  }

  /**
   * Clean up observers
   */
  private cleanupObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  /**
   * Remove flexbox styles
   */
  private removeFlexboxStyles(): void {
    const htmlElement = this.element as HTMLElement;
    
    htmlElement.style.removeProperty('display');
    htmlElement.style.removeProperty('flex-direction');
    htmlElement.style.removeProperty('flex-wrap');
    htmlElement.style.removeProperty('justify-content');
    htmlElement.style.removeProperty('align-items');
    htmlElement.style.removeProperty('gap');
    
    // Remove item styles
    Array.from(this.element.children).forEach(child => {
      const htmlChild = child as HTMLElement;
      htmlChild.style.removeProperty('flex-grow');
      htmlChild.style.removeProperty('flex-shrink');
      htmlChild.style.removeProperty('flex-basis');
      htmlChild.style.removeProperty('order');
      htmlChild.style.removeProperty('align-self');
    });
  }

  /**
   * Create initial state
   */
  private createInitialState(): FlexboxState {
    return {
      containerWidth: 0,
      containerHeight: 0,
      itemCount: 0,
      wrappedLines: 1,
      optimalItemWidth: 0,
      actualGap: 16,
      overflow: false
    };
  }
}
