/**
 * Smart Content Reordering for ProteusJS
 * Priority-based reordering with accessibility and FLIP animations
 */

export interface ReorderConfig {
  priorities: Map<Element, number>;
  breakpoints: Record<string, ReorderRule[]>;
  accessibility: boolean;
  animations: boolean;
  focusManagement: boolean;
  preserveTabOrder: boolean;
  animationDuration: number;
  easing: string;
}

export interface ReorderRule {
  selector: string;
  priority: number;
  condition?: 'min-width' | 'max-width' | 'aspect-ratio';
  value?: number;
  action: 'move-first' | 'move-last' | 'move-before' | 'move-after' | 'hide' | 'show';
  target?: string;
}

export interface FLIPState {
  element: Element;
  first: DOMRect;
  last: DOMRect;
  invert: { x: number; y: number };
  play: boolean;
}

export interface ReorderState {
  originalOrder: Element[];
  currentOrder: Element[];
  activeRules: ReorderRule[];
  focusedElement: Element | null;
  animating: boolean;
  flipStates: Map<Element, FLIPState>;
}

export class ContentReordering {
  private element: Element;
  private config: Required<ReorderConfig>;
  private state: ReorderState;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  constructor(element: Element, config: Partial<ReorderConfig> = {}) {
    this.element = element;
    this.config = {
      priorities: new Map(),
      breakpoints: {},
      accessibility: true,
      animations: true,
      focusManagement: true,
      preserveTabOrder: true,
      animationDuration: 300,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      ...config
    };

    this.state = this.createInitialState();
    this.setupReordering();
  }

  /**
   * Activate content reordering
   */
  public activate(): void {
    this.captureOriginalOrder();
    this.applyReordering();
    this.setupObservers();
  }

  /**
   * Deactivate and restore original order
   */
  public deactivate(): void {
    this.cleanupObservers();
    this.restoreOriginalOrder();
  }

  /**
   * Update reordering configuration
   */
  public updateConfig(newConfig: Partial<ReorderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyReordering();
  }

  /**
   * Set element priority
   */
  public setPriority(element: Element, priority: number): void {
    this.config.priorities.set(element, priority);
    this.applyReordering();
  }

  /**
   * Add reorder rule
   */
  public addRule(breakpoint: string, rule: ReorderRule): void {
    if (!this.config.breakpoints[breakpoint]) {
      this.config.breakpoints[breakpoint] = [];
    }
    this.config.breakpoints[breakpoint].push(rule);
    this.applyReordering();
  }

  /**
   * Get current reorder state
   */
  public getState(): ReorderState {
    return { ...this.state };
  }

  /**
   * Manually reorder elements
   */
  public reorder(newOrder: Element[]): void {
    if (this.config.animations) {
      this.animateReorder(newOrder);
    } else {
      this.applyOrder(newOrder);
    }
  }

  /**
   * Restore original order
   */
  public restoreOriginalOrder(): void {
    this.reorder(this.state.originalOrder);
  }

  /**
   * Setup initial reordering
   */
  private setupReordering(): void {
    this.captureOriginalOrder();
  }

  /**
   * Capture the original DOM order
   */
  private captureOriginalOrder(): void {
    this.state.originalOrder = Array.from(this.element.children);
    this.state.currentOrder = [...this.state.originalOrder];
  }

  /**
   * Apply reordering based on current configuration
   */
  private applyReordering(): void {
    const containerWidth = this.element.getBoundingClientRect().width;
    const activeRules = this.getActiveRules(containerWidth);
    
    this.state.activeRules = activeRules;
    
    // Calculate new order
    const newOrder = this.calculateNewOrder(activeRules);
    
    // Apply reordering
    if (this.config.animations && !this.arraysEqual(newOrder, this.state.currentOrder)) {
      this.animateReorder(newOrder);
    } else {
      this.applyOrder(newOrder);
    }
  }

  /**
   * Get active rules for current container width
   */
  private getActiveRules(containerWidth: number): ReorderRule[] {
    const activeRules: ReorderRule[] = [];
    
    Object.entries(this.config.breakpoints).forEach(([breakpoint, rules]) => {
      const breakpointWidth = parseInt(breakpoint);
      
      if (containerWidth >= breakpointWidth) {
        activeRules.push(...rules);
      }
    });
    
    return activeRules;
  }

  /**
   * Calculate new element order
   */
  private calculateNewOrder(rules: ReorderRule[]): Element[] {
    let newOrder = [...this.state.originalOrder];
    
    // Apply priority-based sorting first
    if (this.config.priorities.size > 0) {
      newOrder.sort((a, b) => {
        const priorityA = this.config.priorities.get(a) || 0;
        const priorityB = this.config.priorities.get(b) || 0;
        return priorityA - priorityB;
      });
    }
    
    // Apply rules
    rules.forEach(rule => {
      const elements = Array.from(this.element.querySelectorAll(rule.selector));
      
      elements.forEach(element => {
        if (this.shouldApplyRule(rule)) {
          newOrder = this.applyRule(newOrder, element, rule);
        }
      });
    });
    
    return newOrder;
  }

  /**
   * Check if rule should be applied
   */
  private shouldApplyRule(rule: ReorderRule): boolean {
    if (!rule.condition || !rule.value) return true;
    
    const containerRect = this.element.getBoundingClientRect();
    
    switch (rule.condition) {
      case 'min-width':
        return containerRect.width >= rule.value;
      case 'max-width':
        return containerRect.width <= rule.value;
      case 'aspect-ratio':
        return (containerRect.width / containerRect.height) >= rule.value;
      default:
        return true;
    }
  }

  /**
   * Apply a single reorder rule
   */
  private applyRule(order: Element[], element: Element, rule: ReorderRule): Element[] {
    const currentIndex = order.indexOf(element);
    if (currentIndex === -1) return order;
    
    const newOrder = [...order];
    newOrder.splice(currentIndex, 1); // Remove element
    
    switch (rule.action) {
      case 'move-first':
        newOrder.unshift(element);
        break;
      case 'move-last':
        newOrder.push(element);
        break;
      case 'move-before':
        if (rule.target) {
          const targetElement = this.element.querySelector(rule.target);
          const targetIndex = newOrder.indexOf(targetElement as Element);
          if (targetIndex !== -1) {
            newOrder.splice(targetIndex, 0, element);
          } else {
            newOrder.push(element);
          }
        }
        break;
      case 'move-after':
        if (rule.target) {
          const targetElement = this.element.querySelector(rule.target);
          const targetIndex = newOrder.indexOf(targetElement as Element);
          if (targetIndex !== -1) {
            newOrder.splice(targetIndex + 1, 0, element);
          } else {
            newOrder.push(element);
          }
        }
        break;
      case 'hide':
        (element as HTMLElement).style.display = 'none';
        newOrder.push(element); // Keep in DOM but hidden
        break;
      case 'show':
        (element as HTMLElement).style.display = '';
        newOrder.push(element);
        break;
      default:
        newOrder.push(element);
    }
    
    return newOrder;
  }

  /**
   * Animate reordering using FLIP technique
   */
  private animateReorder(newOrder: Element[]): void {
    if (this.state.animating) return;
    
    this.state.animating = true;
    
    // FLIP: First - record initial positions
    const flipStates = new Map<Element, FLIPState>();
    this.state.currentOrder.forEach(element => {
      flipStates.set(element, {
        element,
        first: element.getBoundingClientRect(),
        last: { x: 0, y: 0, width: 0, height: 0 } as DOMRect,
        invert: { x: 0, y: 0 },
        play: false
      });
    });
    
    // Preserve focus
    const focusedElement = this.preserveFocus();
    
    // FLIP: Last - apply new order and record final positions
    this.applyOrder(newOrder);
    
    flipStates.forEach((flipState, element) => {
      flipState.last = element.getBoundingClientRect();
      
      // FLIP: Invert - calculate the difference
      flipState.invert = {
        x: flipState.first.left - flipState.last.left,
        y: flipState.first.top - flipState.last.top
      };
      
      // Apply initial transform
      if (flipState.invert.x !== 0 || flipState.invert.y !== 0) {
        (element as HTMLElement).style.transform = 
          `translate(${flipState.invert.x}px, ${flipState.invert.y}px)`;
        flipState.play = true;
      }
    });
    
    // FLIP: Play - animate to final positions
    requestAnimationFrame(() => {
      flipStates.forEach((flipState, element) => {
        if (flipState.play) {
          const htmlElement = element as HTMLElement;
          htmlElement.style.transition = 
            `transform ${this.config.animationDuration}ms ${this.config.easing}`;
          htmlElement.style.transform = 'translate(0, 0)';
        }
      });
      
      // Clean up after animation
      setTimeout(() => {
        flipStates.forEach((flipState, element) => {
          const htmlElement = element as HTMLElement;
          htmlElement.style.transition = '';
          htmlElement.style.transform = '';
        });
        
        this.state.animating = false;
        
        // Restore focus
        this.restoreFocus(focusedElement);
        
        // Update accessibility
        if (this.config.accessibility) {
          this.updateAccessibility();
        }
      }, this.config.animationDuration);
    });
    
    this.state.flipStates = flipStates;
  }

  /**
   * Apply new order without animation
   */
  private applyOrder(newOrder: Element[]): void {
    const fragment = document.createDocumentFragment();
    
    newOrder.forEach(element => {
      fragment.appendChild(element);
    });
    
    this.element.appendChild(fragment);
    this.state.currentOrder = newOrder;
  }

  /**
   * Preserve focus during reordering
   */
  private preserveFocus(): Element | null {
    if (!this.config.focusManagement) return null;
    
    const focusedElement = document.activeElement;
    if (focusedElement && this.element.contains(focusedElement)) {
      this.state.focusedElement = focusedElement;
      return focusedElement;
    }
    
    return null;
  }

  /**
   * Restore focus after reordering
   */
  private restoreFocus(focusedElement: Element | null): void {
    if (!this.config.focusManagement || !focusedElement) return;
    
    // Check if element is still focusable
    if (document.contains(focusedElement)) {
      (focusedElement as HTMLElement).focus();
    }
  }

  /**
   * Update accessibility attributes
   */
  private updateAccessibility(): void {
    if (!this.config.accessibility) return;
    
    // Update tab order if preserveTabOrder is enabled
    if (this.config.preserveTabOrder) {
      this.updateTabOrder();
    }
    
    // Announce changes to screen readers
    this.announceChanges();
  }

  /**
   * Update tab order to match visual order
   */
  private updateTabOrder(): void {
    const focusableElements = this.state.currentOrder.filter(element => {
      const htmlElement = element as HTMLElement;
      return htmlElement.tabIndex >= 0 || this.isFocusable(element);
    });
    
    focusableElements.forEach((element, index) => {
      (element as HTMLElement).tabIndex = index + 1;
    });
  }

  /**
   * Check if element is focusable
   */
  private isFocusable(element: Element): boolean {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[contenteditable="true"]'
    ];
    
    return focusableSelectors.some(selector => element.matches(selector));
  }

  /**
   * Announce changes to screen readers
   */
  private announceChanges(): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    announcement.textContent = 'Content order has been updated';
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Check if two arrays are equal
   */
  private arraysEqual(a: Element[], b: Element[]): boolean {
    return a.length === b.length && a.every((element, index) => element === b[index]);
  }

  /**
   * Setup observers
   */
  private setupObservers(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.applyReordering();
    });
    this.resizeObserver.observe(this.element);
    
    this.mutationObserver = new MutationObserver(() => {
      this.captureOriginalOrder();
      this.applyReordering();
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
   * Create initial state
   */
  private createInitialState(): ReorderState {
    return {
      originalOrder: [],
      currentOrder: [],
      activeRules: [],
      focusedElement: null,
      animating: false,
      flipStates: new Map()
    };
  }
}
