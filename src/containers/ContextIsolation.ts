/**
 * Context Isolation for ProteusJS
 * Prevents interference between nested containers and manages cascade resolution
 */

export interface ContainerContext {
  element: Element;
  level: number;
  parent: ContainerContext | null;
  children: Set<ContainerContext>;
  isolated: boolean;
  namespace: string;
}

export interface IsolationConfig {
  autoIsolate: boolean;
  maxNestingLevel: number;
  conflictResolution: 'parent-wins' | 'child-wins' | 'explicit';
  namespacePrefix: string;
}

export class ContextIsolation {
  private contexts: Map<Element, ContainerContext> = new Map();
  private namespaceCounter: number = 0;
  private config: IsolationConfig;

  constructor(config: Partial<IsolationConfig> = {}) {
    this.config = {
      autoIsolate: true,
      maxNestingLevel: 10,
      conflictResolution: 'child-wins',
      namespacePrefix: 'proteus-ctx',
      ...config
    };
  }

  /**
   * Create isolated context for container
   */
  public createContext(element: Element, isolated: boolean = true): ContainerContext {
    // Check if context already exists
    let context = this.contexts.get(element);
    if (context) {
      context.isolated = isolated;
      return context;
    }

    // Find parent context
    const parent = this.findParentContext(element);
    const level = parent ? parent.level + 1 : 0;

    // Check nesting level
    if (level > this.config.maxNestingLevel) {
      console.warn(
        `ProteusJS: Maximum nesting level (${this.config.maxNestingLevel}) exceeded for container`
      );
    }

    // Create new context
    context = {
      element,
      level,
      parent,
      children: new Set(),
      isolated: isolated || this.config.autoIsolate,
      namespace: this.generateNamespace()
    };

    this.contexts.set(element, context);

    // Update parent-child relationships
    if (parent) {
      parent.children.add(context);
    }

    // Apply isolation if needed
    if (context.isolated) {
      this.applyIsolation(context);
    }

    return context;
  }

  /**
   * Remove context and clean up
   */
  public removeContext(element: Element): boolean {
    const context = this.contexts.get(element);
    if (!context) return false;

    // Remove from parent's children
    if (context.parent) {
      context.parent.children.delete(context);
    }

    // Reparent children to this context's parent
    context.children.forEach(child => {
      child.parent = context.parent;
      if (context.parent) {
        context.parent.children.add(child);
      }
    });

    // Remove isolation
    this.removeIsolation(context);

    this.contexts.delete(element);
    return true;
  }

  /**
   * Get context for element
   */
  public getContext(element: Element): ContainerContext | undefined {
    return this.contexts.get(element);
  }

  /**
   * Check if element has isolated context
   */
  public isIsolated(element: Element): boolean {
    const context = this.contexts.get(element);
    return context?.isolated || false;
  }

  /**
   * Get all contexts at specific level
   */
  public getContextsAtLevel(level: number): ContainerContext[] {
    return Array.from(this.contexts.values()).filter(ctx => ctx.level === level);
  }

  /**
   * Get root contexts (level 0)
   */
  public getRootContexts(): ContainerContext[] {
    return this.getContextsAtLevel(0);
  }

  /**
   * Get context hierarchy for element
   */
  public getHierarchy(element: Element): ContainerContext[] {
    const context = this.contexts.get(element);
    if (!context) return [];

    const hierarchy: ContainerContext[] = [];
    let current: ContainerContext | null = context;

    while (current) {
      hierarchy.unshift(current);
      current = current.parent;
    }

    return hierarchy;
  }

  /**
   * Resolve conflicts between nested containers
   */
  public resolveConflicts(
    element: Element,
    property: string,
    values: Map<ContainerContext, any>
  ): any {
    const context = this.contexts.get(element);
    if (!context || values.size === 0) return undefined;

    switch (this.config.conflictResolution) {
      case 'parent-wins':
        return this.resolveParentWins(context, values);
      case 'child-wins':
        return this.resolveChildWins(context, values);
      case 'explicit':
        return this.resolveExplicit(context, values);
      default:
        return values.values().next().value;
    }
  }

  /**
   * Generate scoped CSS selector for context
   */
  public getScopedSelector(context: ContainerContext, selector: string): string {
    if (!context.isolated) return selector;
    
    const namespace = `[data-${context.namespace}]`;
    
    // If selector is a simple class or ID, scope it
    if (selector.startsWith('.') || selector.startsWith('#')) {
      return `${namespace} ${selector}`;
    }
    
    // For complex selectors, prepend namespace
    return `${namespace} ${selector}`;
  }

  /**
   * Generate scoped CSS rules for context
   */
  public generateScopedCSS(context: ContainerContext, css: string): string {
    if (!context.isolated) return css;

    const namespace = `[data-${context.namespace}]`;
    
    // Simple CSS scoping - prepend namespace to selectors
    return css.replace(/([^{}]+)\s*{/g, (match, selector) => {
      const trimmedSelector = selector.trim();
      if (trimmedSelector.startsWith('@')) {
        // Don't scope at-rules
        return match;
      }
      return `${namespace} ${trimmedSelector} {`;
    });
  }

  /**
   * Check for potential conflicts
   */
  public detectConflicts(): Array<{
    elements: Element[];
    property: string;
    contexts: ContainerContext[];
  }> {
    const conflicts: Array<{
      elements: Element[];
      property: string;
      contexts: ContainerContext[];
    }> = [];

    // This would need to be integrated with the actual style system
    // For now, return empty array as placeholder
    return conflicts;
  }

  /**
   * Get isolation statistics
   */
  public getStats(): object {
    const contexts = Array.from(this.contexts.values());
    const isolated = contexts.filter(ctx => ctx.isolated);
    const levels = new Map<number, number>();

    contexts.forEach(ctx => {
      levels.set(ctx.level, (levels.get(ctx.level) || 0) + 1);
    });

    return {
      totalContexts: contexts.length,
      isolatedContexts: isolated.length,
      maxLevel: Math.max(...contexts.map(ctx => ctx.level), 0),
      contextsByLevel: Object.fromEntries(levels),
      averageChildren: contexts.length > 0 
        ? contexts.reduce((sum, ctx) => sum + ctx.children.size, 0) / contexts.length 
        : 0
    };
  }

  /**
   * Clear all contexts
   */
  public clear(): void {
    // Remove isolation from all contexts
    this.contexts.forEach(context => {
      this.removeIsolation(context);
    });

    this.contexts.clear();
    this.namespaceCounter = 0;
  }

  /**
   * Find parent context by traversing DOM
   */
  private findParentContext(element: Element): ContainerContext | null {
    let parent = element.parentElement;
    
    while (parent) {
      const context = this.contexts.get(parent);
      if (context) return context;
      parent = parent.parentElement;
    }
    
    return null;
  }

  /**
   * Generate unique namespace
   */
  private generateNamespace(): string {
    return `${this.config.namespacePrefix}-${++this.namespaceCounter}`;
  }

  /**
   * Apply isolation to context
   */
  private applyIsolation(context: ContainerContext): void {
    const element = context.element as HTMLElement;
    
    // Add namespace data attribute
    element.setAttribute(`data-${context.namespace}`, '');
    
    // Add CSS containment if supported
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('contain', 'layout style')) {
      element.style.contain = 'layout style';
    }
    
    // Create isolated stacking context
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }
  }

  /**
   * Remove isolation from context
   */
  private removeIsolation(context: ContainerContext): void {
    const element = context.element as HTMLElement;
    
    // Remove namespace data attribute
    element.removeAttribute(`data-${context.namespace}`);
    
    // Remove CSS containment
    element.style.removeProperty('contain');
    
    // Note: We don't remove position as it might have been set by user
  }

  /**
   * Resolve conflicts with parent-wins strategy
   */
  private resolveParentWins(
    context: ContainerContext,
    values: Map<ContainerContext, any>
  ): any {
    // Find the highest level (closest to root) context with a value
    let winner: ContainerContext | null = null;
    let minLevel = Infinity;

    values.forEach((value, ctx) => {
      if (ctx.level < minLevel) {
        minLevel = ctx.level;
        winner = ctx;
      }
    });

    return winner ? values.get(winner) : undefined;
  }

  /**
   * Resolve conflicts with child-wins strategy
   */
  private resolveChildWins(
    context: ContainerContext,
    values: Map<ContainerContext, any>
  ): any {
    // Find the lowest level (furthest from root) context with a value
    let winner: ContainerContext | null = null;
    let maxLevel = -1;

    values.forEach((value, ctx) => {
      if (ctx.level > maxLevel) {
        maxLevel = ctx.level;
        winner = ctx;
      }
    });

    return winner ? values.get(winner) : undefined;
  }

  /**
   * Resolve conflicts with explicit strategy
   */
  private resolveExplicit(
    context: ContainerContext,
    values: Map<ContainerContext, any>
  ): any {
    // Only use values from isolated contexts
    const isolatedValues = new Map<ContainerContext, any>();
    
    values.forEach((value, ctx) => {
      if (ctx.isolated) {
        isolatedValues.set(ctx, value);
      }
    });

    if (isolatedValues.size === 0) {
      return values.values().next().value;
    }

    // Use child-wins for isolated contexts
    return this.resolveChildWins(context, isolatedValues);
  }
}
