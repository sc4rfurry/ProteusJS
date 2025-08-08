/**
 * Adaptive Grid System for ProteusJS
 * Container-aware CSS Grid with auto-column calculation and masonry support
 */

export interface GridConfig {
  minColumnWidth: number;
  maxColumns: number;
  gap: number | 'fluid';
  aspectRatio?: number;
  masonry: boolean;
  autoFlow: 'row' | 'column' | 'row dense' | 'column dense';
  alignment: {
    justify: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
    align: 'start' | 'end' | 'center' | 'stretch';
  };
  responsive: boolean;
  breakpoints?: Record<string, Partial<GridConfig>>;
}

export interface GridState {
  columns: number;
  rows: number;
  gap: number;
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export class AdaptiveGrid {
  private element: Element;
  private config: Required<GridConfig>;
  private state: GridState;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  constructor(element: Element, config: Partial<GridConfig> = {}) {
    this.element = element;
    this.config = {
      minColumnWidth: 250,
      maxColumns: 12,
      gap: 16,
      aspectRatio: 1,
      masonry: false,
      autoFlow: 'row',
      alignment: {
        justify: 'stretch',
        align: 'stretch'
      },
      responsive: true,
      breakpoints: {},
      ...config
    };

    this.state = this.createInitialState();
    this.setupGrid();
  }

  /**
   * Initialize and activate the grid
   */
  public activate(): void {
    this.updateGrid();
    this.setupObservers();
  }

  /**
   * Deactivate and clean up the grid
   */
  public deactivate(): void {
    this.cleanupObservers();
    this.removeGridStyles();
  }

  /**
   * Update grid configuration
   */
  public updateConfig(newConfig: Partial<GridConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateGrid();
  }

  /**
   * Get current grid state
   */
  public getState(): GridState {
    return { ...this.state };
  }

  /**
   * Force grid recalculation
   */
  public recalculate(): void {
    this.updateGrid();
  }

  /**
   * Add items to the grid
   */
  public addItems(items: Element[]): void {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      this.prepareGridItem(item);
      fragment.appendChild(item);
    });
    this.element.appendChild(fragment);
    this.updateGrid();
  }

  /**
   * Remove items from the grid
   */
  public removeItems(items: Element[]): void {
    items.forEach(item => {
      if (item.parentNode === this.element) {
        this.element.removeChild(item);
      }
    });
    this.updateGrid();
  }

  /**
   * Get optimal column count for container width
   */
  public calculateOptimalColumns(containerWidth: number): number {
    const availableWidth = containerWidth - this.getGapValue();
    const minWidth = this.config.minColumnWidth;
    
    // Calculate maximum possible columns based on min width
    const maxPossibleColumns = Math.floor((availableWidth + this.getGapValue()) / (minWidth + this.getGapValue()));
    
    // Respect max columns limit
    return Math.min(maxPossibleColumns, this.config.maxColumns);
  }

  /**
   * Setup initial grid styles
   */
  private setupGrid(): void {
    const htmlElement = this.element as HTMLElement;
    htmlElement.style.display = 'grid';
    
    if (this.config.masonry) {
      this.setupMasonryGrid();
    } else {
      this.setupRegularGrid();
    }
  }

  /**
   * Setup regular CSS Grid
   */
  private setupRegularGrid(): void {
    const htmlElement = this.element as HTMLElement;
    
    htmlElement.style.gridAutoFlow = this.config.autoFlow;
    htmlElement.style.justifyContent = this.config.alignment.justify;
    htmlElement.style.alignContent = this.config.alignment.align;
    htmlElement.style.justifyItems = this.config.alignment.justify;
    htmlElement.style.alignItems = this.config.alignment.align;
  }

  /**
   * Setup masonry grid using CSS Grid Level 3 or fallback
   */
  private setupMasonryGrid(): void {
    const htmlElement = this.element as HTMLElement;
    
    // Check for native masonry support
    if (this.supportsMasonry()) {
      htmlElement.style.gridTemplateRows = 'masonry';
    } else {
      // Fallback to JavaScript masonry
      this.implementJavaScriptMasonry();
    }
  }

  /**
   * Update grid layout
   */
  private updateGrid(): void {
    const containerRect = this.element.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Apply responsive config if needed
    const activeConfig = this.getActiveConfig(containerWidth);
    
    // Calculate optimal columns
    const columns = this.calculateOptimalColumns(containerWidth);
    const gap = this.getGapValue();
    
    // Calculate item dimensions
    const itemWidth = (containerWidth - gap * (columns - 1)) / columns;
    const itemHeight = activeConfig.aspectRatio 
      ? itemWidth / activeConfig.aspectRatio 
      : 0; // Auto height

    // Update state
    this.state = {
      columns,
      rows: Math.ceil(this.getItemCount() / columns),
      gap,
      itemWidth,
      itemHeight,
      containerWidth,
      containerHeight
    };

    // Apply grid styles
    this.applyGridStyles();

    // Handle masonry layout
    if (activeConfig.masonry && !this.supportsMasonry()) {
      this.updateMasonryLayout();
    }
  }

  /**
   * Apply calculated grid styles
   */
  private applyGridStyles(): void {
    const htmlElement = this.element as HTMLElement;
    const { columns, gap, itemHeight } = this.state;

    // Set grid template columns
    htmlElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // Set gap
    htmlElement.style.gap = `${gap}px`;
    
    // Set row height if aspect ratio is specified
    if (itemHeight > 0) {
      htmlElement.style.gridAutoRows = `${itemHeight}px`;
    } else {
      htmlElement.style.gridAutoRows = 'auto';
    }

    // Prepare all grid items
    Array.from(this.element.children).forEach(child => {
      this.prepareGridItem(child);
    });
  }

  /**
   * Prepare individual grid item
   */
  private prepareGridItem(item: Element): void {
    const htmlItem = item as HTMLElement;
    
    // Ensure proper box-sizing
    htmlItem.style.boxSizing = 'border-box';
    
    // Handle aspect ratio for items if specified
    if (this.config.aspectRatio && !this.config.masonry) {
      htmlItem.style.aspectRatio = this.config.aspectRatio.toString();
    }
    
    // Add grid item class for styling
    htmlItem.classList.add('proteus-grid-item');
  }

  /**
   * Implement JavaScript masonry layout
   */
  private implementJavaScriptMasonry(): void {
    const items = Array.from(this.element.children) as HTMLElement[];
    const { columns, gap } = this.state;
    
    // Create column height trackers
    const columnHeights = new Array(columns).fill(0);
    
    items.forEach((item, index) => {
      // Find shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Position item
      const column = shortestColumnIndex;
      const row = Math.floor(columnHeights[shortestColumnIndex] / (this.state.itemHeight + gap));
      
      item.style.gridColumnStart = (column + 1).toString();
      item.style.gridRowStart = (row + 1).toString();
      
      // Update column height
      const itemHeight = item.getBoundingClientRect().height || this.state.itemHeight;
      columnHeights[shortestColumnIndex] += itemHeight + gap;
    });
  }

  /**
   * Update masonry layout
   */
  private updateMasonryLayout(): void {
    // Wait for layout to settle, then update masonry
    requestAnimationFrame(() => {
      this.implementJavaScriptMasonry();
    });
  }

  /**
   * Setup observers for responsive behavior
   */
  private setupObservers(): void {
    if (!this.config.responsive) return;

    // Resize observer for container size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.updateGrid();
    });
    this.resizeObserver.observe(this.element);

    // Mutation observer for content changes
    this.mutationObserver = new MutationObserver(() => {
      this.updateGrid();
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
   * Remove grid styles
   */
  private removeGridStyles(): void {
    const htmlElement = this.element as HTMLElement;
    
    // Remove grid styles
    htmlElement.style.removeProperty('display');
    htmlElement.style.removeProperty('grid-template-columns');
    htmlElement.style.removeProperty('grid-template-rows');
    htmlElement.style.removeProperty('gap');
    htmlElement.style.removeProperty('grid-auto-flow');
    htmlElement.style.removeProperty('justify-content');
    htmlElement.style.removeProperty('align-content');
    htmlElement.style.removeProperty('justify-items');
    htmlElement.style.removeProperty('align-items');
    htmlElement.style.removeProperty('grid-auto-rows');

    // Remove item styles
    Array.from(this.element.children).forEach(child => {
      const htmlChild = child as HTMLElement;
      htmlChild.style.removeProperty('grid-column-start');
      htmlChild.style.removeProperty('grid-row-start');
      htmlChild.style.removeProperty('aspect-ratio');
      htmlChild.classList.remove('proteus-grid-item');
    });
  }

  /**
   * Get active configuration based on container width
   */
  private getActiveConfig(containerWidth: number): Required<GridConfig> {
    let activeConfig = { ...this.config };

    // Apply breakpoint-specific configs
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
      // Fluid gap based on container width
      const containerWidth = this.element.getBoundingClientRect().width;
      return Math.max(8, Math.min(32, containerWidth * 0.02));
    }
    return this.config.gap as number;
  }

  /**
   * Get number of grid items
   */
  private getItemCount(): number {
    return this.element.children.length;
  }

  /**
   * Check if native masonry is supported
   */
  private supportsMasonry(): boolean {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    return CSS.supports('grid-template-rows', 'masonry');
  }

  /**
   * Create initial state
   */
  private createInitialState(): GridState {
    return {
      columns: 1,
      rows: 1,
      gap: 16,
      itemWidth: 0,
      itemHeight: 0,
      containerWidth: 0,
      containerHeight: 0
    };
  }
}
