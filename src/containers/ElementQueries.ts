/**
 * Element Queries for ProteusJS
 * Advanced container-based queries with complex logic support
 */

import type { ElementQuery } from '../types';
import { BreakpointSystem } from './BreakpointSystem';

export interface QueryCondition {
  property: 'width' | 'height' | 'aspect-ratio' | 'content-size' | 'orientation';
  operator: 'min' | 'max' | 'exact' | 'range';
  value: number | string | [number, number];
  unit?: string;
}

export interface QueryRule {
  conditions: QueryCondition[];
  logic: 'and' | 'or';
  callback?: (matches: boolean, element: Element) => void;
  cssClass?: string;
  cssProperties?: Record<string, string>;
}

export interface QueryResult {
  matches: boolean;
  matchedConditions: QueryCondition[];
  failedConditions: QueryCondition[];
  element: Element;
  timestamp: number;
}

export class ElementQueries {
  private queries: Map<Element, QueryRule[]> = new Map();
  private lastResults: Map<Element, QueryResult[]> = new Map();
  private breakpointSystem: BreakpointSystem;

  constructor(breakpointSystem: BreakpointSystem) {
    this.breakpointSystem = breakpointSystem;
  }

  /**
   * Add element query rule
   */
  public addQuery(
    element: Element,
    rule: QueryRule
  ): () => void {
    if (!this.queries.has(element)) {
      this.queries.set(element, []);
    }
    
    const rules = this.queries.get(element)!;
    rules.push(rule);

    // Initial evaluation
    this.evaluateElement(element);

    // Return removal function
    return () => this.removeQuery(element, rule);
  }

  /**
   * Remove specific query rule
   */
  public removeQuery(element: Element, rule: QueryRule): boolean {
    const rules = this.queries.get(element);
    if (!rules) return false;

    const index = rules.indexOf(rule);
    if (index === -1) return false;

    rules.splice(index, 1);
    
    if (rules.length === 0) {
      this.queries.delete(element);
      this.lastResults.delete(element);
    } else {
      this.evaluateElement(element);
    }

    return true;
  }

  /**
   * Remove all queries for element
   */
  public removeAllQueries(element: Element): boolean {
    const hadQueries = this.queries.has(element);
    this.queries.delete(element);
    this.lastResults.delete(element);
    return hadQueries;
  }

  /**
   * Evaluate all queries for an element
   */
  public evaluateElement(element: Element): QueryResult[] {
    const rules = this.queries.get(element);
    if (!rules || rules.length === 0) return [];

    const dimensions = this.getElementDimensions(element);
    const results: QueryResult[] = [];

    rules.forEach(rule => {
      const result = this.evaluateRule(element, rule, dimensions);
      results.push(result);
      
      // Apply effects if query matches
      if (result.matches) {
        this.applyQueryEffects(element, rule);
      } else {
        this.removeQueryEffects(element, rule);
      }

      // Call callback if provided
      if (rule.callback) {
        rule.callback(result.matches, element);
      }
    });

    this.lastResults.set(element, results);
    return results;
  }

  /**
   * Evaluate all elements
   */
  public evaluateAll(): Map<Element, QueryResult[]> {
    const allResults = new Map<Element, QueryResult[]>();
    
    this.queries.forEach((rules, element) => {
      const results = this.evaluateElement(element);
      allResults.set(element, results);
    });

    return allResults;
  }

  /**
   * Get last evaluation results for element
   */
  public getLastResults(element: Element): QueryResult[] {
    return this.lastResults.get(element) || [];
  }

  /**
   * Check if any query matches for element
   */
  public hasMatches(element: Element): boolean {
    const results = this.getLastResults(element);
    return results.some(result => result.matches);
  }

  /**
   * Get matching queries for element
   */
  public getMatches(element: Element): QueryResult[] {
    const results = this.getLastResults(element);
    return results.filter(result => result.matches);
  }

  /**
   * Create query from CSS-like syntax
   */
  public parseQuery(queryString: string): QueryRule {
    // Parse CSS-like query syntax: "(min-width: 300px) and (max-height: 500px)"
    const conditions: QueryCondition[] = [];
    let logic: 'and' | 'or' = 'and';

    // Simple parser for basic queries
    const conditionRegex = /\(([^)]+)\)/g;
    const matches = Array.from(queryString.matchAll(conditionRegex));
    
    matches.forEach(match => {
      const conditionStr = match[1]!.trim();
      const condition = this.parseCondition(conditionStr);
      if (condition) {
        conditions.push(condition);
      }
    });

    // Detect logic operator
    if (queryString.includes(' or ')) {
      logic = 'or';
    }

    return { conditions, logic };
  }

  /**
   * Get query statistics
   */
  public getStats(): object {
    const totalElements = this.queries.size;
    const totalQueries = Array.from(this.queries.values())
      .reduce((sum, rules) => sum + rules.length, 0);
    
    const matchingElements = Array.from(this.lastResults.entries())
      .filter(([element, results]) => results.some(r => r.matches))
      .length;

    return {
      totalElements,
      totalQueries,
      matchingElements,
      averageQueriesPerElement: totalElements > 0 ? totalQueries / totalElements : 0
    };
  }

  /**
   * Clear all queries
   */
  public clear(): void {
    // Remove effects from all elements
    this.queries.forEach((rules, element) => {
      rules.forEach(rule => {
        this.removeQueryEffects(element, rule);
      });
    });

    this.queries.clear();
    this.lastResults.clear();
  }

  /**
   * Evaluate a single rule against element dimensions
   */
  private evaluateRule(
    element: Element,
    rule: QueryRule,
    dimensions: ElementDimensions
  ): QueryResult {
    const matchedConditions: QueryCondition[] = [];
    const failedConditions: QueryCondition[] = [];

    rule.conditions.forEach(condition => {
      const matches = this.evaluateCondition(condition, dimensions);
      if (matches) {
        matchedConditions.push(condition);
      } else {
        failedConditions.push(condition);
      }
    });

    let overallMatch: boolean;
    if (rule.logic === 'and') {
      overallMatch = failedConditions.length === 0;
    } else {
      overallMatch = matchedConditions.length > 0;
    }

    return {
      matches: overallMatch,
      matchedConditions,
      failedConditions,
      element,
      timestamp: Date.now()
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: QueryCondition,
    dimensions: ElementDimensions
  ): boolean {
    const { property, operator, value } = condition;
    let targetValue: number;

    switch (property) {
      case 'width':
        targetValue = dimensions.width;
        break;
      case 'height':
        targetValue = dimensions.height;
        break;
      case 'aspect-ratio':
        targetValue = dimensions.aspectRatio;
        break;
      case 'content-size':
        targetValue = dimensions.contentSize;
        break;
      case 'orientation':
        targetValue = dimensions.width > dimensions.height ? 1 : 0; // 1 for landscape, 0 for portrait
        break;
      default:
        return false;
    }

    switch (operator) {
      case 'min':
        return targetValue >= (value as number);
      case 'max':
        return targetValue <= (value as number);
      case 'exact':
        return Math.abs(targetValue - (value as number)) < 1;
      case 'range':
        const [min, max] = value as [number, number];
        return targetValue >= min && targetValue <= max;
      default:
        return false;
    }
  }

  /**
   * Parse condition string
   */
  private parseCondition(conditionStr: string): QueryCondition | null {
    // Parse conditions like "min-width: 300px", "aspect-ratio: 16/9"
    const parts = conditionStr.split(':').map(s => s.trim());
    if (parts.length !== 2) return null;

    const [propertyOperator, valueStr] = parts;
    
    // Parse property and operator
    let property: QueryCondition['property'];
    let operator: QueryCondition['operator'];

    if (propertyOperator!.startsWith('min-')) {
      operator = 'min';
      property = propertyOperator!.substring(4) as any;
    } else if (propertyOperator!.startsWith('max-')) {
      operator = 'max';
      property = propertyOperator!.substring(4) as any;
    } else {
      operator = 'exact';
      property = propertyOperator! as any;
    }

    // Parse value
    let value: number | string | [number, number];
    
    if (property === 'aspect-ratio' && valueStr!.includes('/')) {
      const [w, h] = valueStr!.split('/').map(Number);
      value = w! / h!;
    } else if (valueStr!.includes('-')) {
      // Range value like "300-500"
      const [min, max] = valueStr!.split('-').map(s => parseFloat(s));
      value = [min!, max!];
      operator = 'range';
    } else {
      value = parseFloat(valueStr!);
    }

    return { property, operator, value };
  }

  /**
   * Get element dimensions
   */
  private getElementDimensions(element: Element): ElementDimensions {
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    return {
      width,
      height,
      aspectRatio: height > 0 ? width / height : 0,
      contentSize: Math.sqrt(width * height), // Geometric mean
      orientation: width > height ? 'landscape' : 'portrait'
    };
  }

  /**
   * Apply query effects (CSS classes, properties)
   */
  private applyQueryEffects(element: Element, rule: QueryRule): void {
    const htmlElement = element as HTMLElement;

    // Apply CSS class
    if (rule.cssClass) {
      htmlElement.classList.add(rule.cssClass);
    }

    // Apply CSS properties
    if (rule.cssProperties) {
      Object.entries(rule.cssProperties).forEach(([property, value]) => {
        htmlElement.style.setProperty(property, value);
      });
    }
  }

  /**
   * Remove query effects
   */
  private removeQueryEffects(element: Element, rule: QueryRule): void {
    const htmlElement = element as HTMLElement;

    // Remove CSS class
    if (rule.cssClass) {
      htmlElement.classList.remove(rule.cssClass);
    }

    // Remove CSS properties
    if (rule.cssProperties) {
      Object.keys(rule.cssProperties).forEach(property => {
        htmlElement.style.removeProperty(property);
      });
    }
  }
}

interface ElementDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  contentSize: number;
  orientation: 'landscape' | 'portrait';
}
