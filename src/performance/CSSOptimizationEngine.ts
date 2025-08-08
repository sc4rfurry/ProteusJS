/**
 * CSS Optimization Engine for ProteusJS
 * Style deduplication, critical CSS extraction, and performance optimization
 */

import { logger } from '../utils/Logger';

export interface CSSOptimizationConfig {
  deduplication: boolean;
  criticalCSS: boolean;
  unusedStyleRemoval: boolean;
  customPropertyOptimization: boolean;
  styleInvalidationTracking: boolean;
  minification: boolean;
  autoprefixer: boolean;
  purgeUnused: boolean;
}

export interface StyleRule {
  selector: string;
  declarations: Map<string, string>;
  specificity: number;
  source: 'inline' | 'stylesheet' | 'generated';
  used: boolean;
  critical: boolean;
}

export interface OptimizationMetrics {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  rulesRemoved: number;
  duplicatesFound: number;
  customPropertiesOptimized: number;
  criticalRulesExtracted: number;
}

export class CSSOptimizationEngine {
  private config: Required<CSSOptimizationConfig>;
  private styleRules: Map<string, StyleRule> = new Map();
  private customProperties: Map<string, string> = new Map();
  private usageTracker: Map<string, number> = new Map();
  private criticalSelectors: Set<string> = new Set();
  private metrics!: OptimizationMetrics;
  private mutationObserver: MutationObserver | null = null;

  constructor(config: Partial<CSSOptimizationConfig> = {}) {
    this.config = {
      deduplication: true,
      criticalCSS: true,
      unusedStyleRemoval: true,
      customPropertyOptimization: true,
      styleInvalidationTracking: true,
      minification: true,
      autoprefixer: false,
      purgeUnused: true,
      ...config
    };

    this.metrics = this.createInitialMetrics();
    this.setupStyleTracking();
  }

  /**
   * Analyze and optimize all stylesheets
   */
  public async optimizeAll(): Promise<OptimizationMetrics> {
    const startTime = performance.now();
    
    // Extract all styles
    await this.extractAllStyles();
    
    // Apply optimizations
    if (this.config.deduplication) {
      this.deduplicateStyles();
    }
    
    if (this.config.unusedStyleRemoval) {
      this.removeUnusedStyles();
    }
    
    if (this.config.customPropertyOptimization) {
      this.optimizeCustomProperties();
    }
    
    if (this.config.criticalCSS) {
      this.extractCriticalCSS();
    }
    
    // Generate optimized CSS
    const optimizedCSS = this.generateOptimizedCSS();
    
    // Update metrics
    this.updateMetrics(optimizedCSS);
    
    const endTime = performance.now();
    console.log(`CSS optimization completed in ${endTime - startTime}ms`);
    
    return this.metrics;
  }

  /**
   * Extract critical CSS for above-the-fold content
   */
  public extractCriticalCSS(): string {
    const criticalRules: StyleRule[] = [];
    const viewportHeight = window.innerHeight;
    
    // Find elements in viewport
    const elementsInViewport = this.getElementsInViewport(viewportHeight);
    
    // Extract selectors for viewport elements
    elementsInViewport.forEach(element => {
      const selectors = this.getSelectorsForElement(element);
      selectors.forEach(selector => {
        this.criticalSelectors.add(selector);
        const rule = this.styleRules.get(selector);
        if (rule) {
          rule.critical = true;
          criticalRules.push(rule);
        }
      });
    });
    
    this.metrics.criticalRulesExtracted = criticalRules.length;
    
    return this.rulesToCSS(criticalRules);
  }

  /**
   * Remove unused CSS rules
   */
  public removeUnusedStyles(): void {
    if (!this.config.purgeUnused) return;
    
    let removedCount = 0;
    
    this.styleRules.forEach((rule, selector) => {
      if (!rule.used && !rule.critical) {
        // Check if selector matches any element in DOM
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) {
            this.styleRules.delete(selector);
            removedCount++;
          }
        } catch (error) {
          // Invalid selector, remove it
          this.styleRules.delete(selector);
          removedCount++;
        }
      }
    });
    
    this.metrics.rulesRemoved = removedCount;
  }

  /**
   * Deduplicate identical style rules
   */
  public deduplicateStyles(): void {
    const declarationGroups = new Map<string, string[]>();
    let duplicatesFound = 0;
    
    // Group rules by declarations
    this.styleRules.forEach((rule, selector) => {
      const declarationsKey = this.serializeDeclarations(rule.declarations);
      
      if (!declarationGroups.has(declarationsKey)) {
        declarationGroups.set(declarationsKey, []);
      }
      
      declarationGroups.get(declarationsKey)!.push(selector);
    });
    
    // Merge duplicate rules
    declarationGroups.forEach((selectors) => {
      if (selectors.length > 1) {
        duplicatesFound += selectors.length - 1;
        
        // Keep the first rule and merge selectors
        const primarySelector = selectors[0]!;
        const primaryRule = this.styleRules.get(primarySelector)!;
        
        // Create combined selector
        const combinedSelector = selectors.join(', ');
        
        // Remove individual rules
        selectors.forEach(selector => {
          this.styleRules.delete(selector);
        });
        
        // Add combined rule
        this.styleRules.set(combinedSelector, {
          ...primaryRule,
          selector: combinedSelector
        });
      }
    });
    
    this.metrics.duplicatesFound = duplicatesFound;
  }

  /**
   * Optimize CSS custom properties
   */
  public optimizeCustomProperties(): void {
    let optimizedCount = 0;
    
    // Find all custom property declarations
    this.styleRules.forEach(rule => {
      rule.declarations.forEach((value, property) => {
        if (property.startsWith('--')) {
          this.customProperties.set(property, value);
        }
      });
    });
    
    // Optimize custom property usage
    this.customProperties.forEach((value, property) => {
      const usage = this.findCustomPropertyUsage(property);
      
      if (usage.length === 1) {
        // Inline single-use custom properties
        const targetRule = usage[0]!;
        const targetProperty = this.findPropertyUsingCustomProperty(targetRule, property);

        if (targetProperty && targetRule) {
          targetRule.declarations.set(targetProperty, value);
          targetRule.declarations.delete(property);
          optimizedCount++;
        }
      }
    });
    
    this.metrics.customPropertiesOptimized = optimizedCount;
  }

  /**
   * Track style invalidations
   */
  public trackStyleInvalidations(): void {
    if (!this.config.styleInvalidationTracking) return;

    try {
      // Monitor DOM mutations that might affect styles
      if (typeof MutationObserver !== 'undefined' && document && document.body) {
        this.mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.type === 'attributes' &&
                (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
              this.handleStyleInvalidation(mutation.target as Element);
            }
          });
        });

        // Ensure document.body exists before observing
        if (document.body && this.mutationObserver && typeof this.mutationObserver.observe === 'function') {
          this.mutationObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'style'],
            subtree: true
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to setup style invalidation tracking:', error);
    }
  }

  /**
   * Generate optimized CSS string
   */
  public generateOptimizedCSS(): string {
    const rules = Array.from(this.styleRules.values());
    
    // Sort rules by specificity and source
    rules.sort((a, b) => {
      if (a.critical !== b.critical) {
        return a.critical ? -1 : 1; // Critical rules first
      }
      return a.specificity - b.specificity;
    });
    
    return this.rulesToCSS(rules);
  }

  /**
   * Get optimization metrics
   */
  public getMetrics(): OptimizationMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear optimization cache
   */
  public clearCache(): void {
    this.styleRules.clear();
    this.customProperties.clear();
    this.usageTracker.clear();
    this.criticalSelectors.clear();
    this.metrics = this.createInitialMetrics();
  }

  /**
   * Destroy the optimization engine
   */
  public destroy(): void {
    this.mutationObserver?.disconnect();
    this.clearCache();
  }

  /**
   * Extract all styles from document
   */
  private async extractAllStyles(): Promise<void> {
    const originalSize = this.calculateCurrentCSSSize();
    this.metrics.originalSize = originalSize;
    
    // Extract from stylesheets
    for (const stylesheet of document.styleSheets) {
      try {
        await this.extractFromStylesheet(stylesheet);
      } catch (error) {
        console.warn('Could not access stylesheet:', error);
      }
    }
    
    // Extract inline styles
    this.extractInlineStyles();
  }

  /**
   * Extract styles from a stylesheet
   */
  private async extractFromStylesheet(stylesheet: CSSStyleSheet): Promise<void> {
    try {
      const rules = stylesheet.cssRules;
      
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        
        if (rule instanceof CSSStyleRule) {
          this.extractStyleRule(rule, 'stylesheet');
        } else if (rule instanceof CSSMediaRule) {
          // Handle media queries
          for (let j = 0; j < rule.cssRules.length; j++) {
            const mediaRule = rule.cssRules[j];
            if (mediaRule instanceof CSSStyleRule) {
              this.extractStyleRule(mediaRule, 'stylesheet');
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting from stylesheet:', error);
    }
  }

  /**
   * Extract a single style rule
   */
  private extractStyleRule(rule: CSSStyleRule, source: 'inline' | 'stylesheet' | 'generated'): void {
    const selector = rule.selectorText;
    const declarations = new Map<string, string>();
    
    // Extract declarations
    for (let i = 0; i < rule.style.length; i++) {
      const property = rule.style[i]!;
      const value = rule.style.getPropertyValue(property);
      declarations.set(property, value);
    }
    
    const styleRule: StyleRule = {
      selector,
      declarations,
      specificity: this.calculateSpecificity(selector),
      source,
      used: false,
      critical: false
    };
    
    this.styleRules.set(selector, styleRule);
  }

  /**
   * Extract inline styles
   */
  private extractInlineStyles(): void {
    const elementsWithStyle = document.querySelectorAll('[style]');
    
    elementsWithStyle.forEach(element => {
      const style = (element as HTMLElement).style;
      const declarations = new Map<string, string>();
      
      for (let i = 0; i < style.length; i++) {
        const property = style[i];
        if (property) {
          const value = style.getPropertyValue(property);
          declarations.set(property, value);
        }
      }
      
      if (declarations.size > 0) {
        const selector = this.generateSelectorForElement(element);
        
        const styleRule: StyleRule = {
          selector,
          declarations,
          specificity: 1000, // Inline styles have high specificity
          source: 'inline',
          used: true,
          critical: this.isElementInViewport(element)
        };
        
        this.styleRules.set(selector, styleRule);
      }
    });
  }

  /**
   * Calculate CSS specificity
   */
  private calculateSpecificity(selector: string): number {
    let specificity = 0;
    
    // Count IDs
    specificity += (selector.match(/#/g) || []).length * 100;
    
    // Count classes, attributes, and pseudo-classes
    specificity += (selector.match(/\.|:|\[/g) || []).length * 10;
    
    // Count elements and pseudo-elements
    specificity += (selector.match(/[a-zA-Z]/g) || []).length;
    
    return specificity;
  }

  /**
   * Get elements in viewport
   */
  private getElementsInViewport(viewportHeight: number): Element[] {
    const elements: Element[] = [];
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      if (this.isElementInViewport(element, viewportHeight)) {
        elements.push(element);
      }
    });
    
    return elements;
  }

  /**
   * Check if element is in viewport
   */
  private isElementInViewport(element: Element, viewportHeight?: number): boolean {
    const rect = element.getBoundingClientRect();
    const height = viewportHeight || window.innerHeight;
    
    return rect.top < height && rect.bottom > 0;
  }

  /**
   * Get selectors that match an element
   */
  private getSelectorsForElement(element: Element): string[] {
    const selectors: string[] = [];
    
    this.styleRules.forEach((rule, selector) => {
      try {
        if (element.matches(selector)) {
          selectors.push(selector);
          rule.used = true;
        }
      } catch (error) {
        // Invalid selector
      }
    });
    
    return selectors;
  }

  /**
   * Generate selector for element
   */
  private generateSelectorForElement(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  /**
   * Convert rules to CSS string
   */
  private rulesToCSS(rules: StyleRule[]): string {
    let css = '';
    
    rules.forEach(rule => {
      css += `${rule.selector} {\n`;
      
      rule.declarations.forEach((value, property) => {
        css += `  ${property}: ${value};\n`;
      });
      
      css += '}\n\n';
    });
    
    if (this.config.minification) {
      css = this.minifyCSS(css);
    }
    
    return css;
  }

  /**
   * Minify CSS
   */
  private minifyCSS(css: string): string {
    return css
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/{\s*/g, '{')
      .replace(/}\s*/g, '}')
      .replace(/:\s*/g, ':')
      .replace(/;\s*/g, ';')
      .trim();
  }

  /**
   * Serialize declarations for comparison
   */
  private serializeDeclarations(declarations: Map<string, string>): string {
    const sorted = Array.from(declarations.entries()).sort();
    return JSON.stringify(sorted);
  }

  /**
   * Find custom property usage
   */
  private findCustomPropertyUsage(property: string): StyleRule[] {
    const usage: StyleRule[] = [];
    
    this.styleRules.forEach(rule => {
      rule.declarations.forEach(value => {
        if (value.includes(`var(${property})`)) {
          usage.push(rule);
        }
      });
    });
    
    return usage;
  }

  /**
   * Find property using custom property
   */
  private findPropertyUsingCustomProperty(rule: StyleRule, customProperty: string): string | null {
    for (const [property, value] of rule.declarations) {
      if (value.includes(`var(${customProperty})`)) {
        return property;
      }
    }
    return null;
  }

  /**
   * Handle style invalidation
   */
  private handleStyleInvalidation(element: Element): void {
    const selectors = this.getSelectorsForElement(element);
    
    selectors.forEach(selector => {
      const count = this.usageTracker.get(selector) || 0;
      this.usageTracker.set(selector, count + 1);
    });
  }

  /**
   * Calculate current CSS size
   */
  private calculateCurrentCSSSize(): number {
    let size = 0;
    
    for (const stylesheet of document.styleSheets) {
      try {
        const rules = stylesheet.cssRules;
        for (let i = 0; i < rules.length; i++) {
          size += rules[i]!.cssText.length;
        }
      } catch (error) {
        // Can't access external stylesheets
      }
    }
    
    return size;
  }

  /**
   * Update optimization metrics
   */
  private updateMetrics(optimizedCSS: string): void {
    this.metrics.optimizedSize = optimizedCSS.length;
    this.metrics.compressionRatio = this.metrics.originalSize > 0 
      ? (this.metrics.originalSize - this.metrics.optimizedSize) / this.metrics.originalSize
      : 0;
  }

  /**
   * Setup style tracking
   */
  private setupStyleTracking(): void {
    if (this.config.styleInvalidationTracking) {
      // Delay tracking setup to allow DOM to settle
      setTimeout(() => {
        this.trackStyleInvalidations();
      }, 100);
    }
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): OptimizationMetrics {
    return {
      originalSize: 0,
      optimizedSize: 0,
      compressionRatio: 0,
      rulesRemoved: 0,
      duplicatesFound: 0,
      customPropertiesOptimized: 0,
      criticalRulesExtracted: 0
    };
  }
}
