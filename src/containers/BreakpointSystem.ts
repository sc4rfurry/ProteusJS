/**
 * Breakpoint System for ProteusJS
 * Manages responsive breakpoint definitions and calculations
 */

import type { BreakpointConfig } from '../types';

export interface BreakpointDefinition {
  name: string;
  value: number; // in pixels
  unit: string;
  originalValue: string | number;
  active: boolean;
}

export interface BreakpointMatch {
  name: string;
  matches: boolean;
  value: number;
  dimension: number;
}

export class BreakpointSystem {
  private breakpoints: Map<string, BreakpointDefinition> = new Map();
  private sortedBreakpoints: BreakpointDefinition[] = [];

  constructor(breakpoints: BreakpointConfig = {}) {
    this.setBreakpoints(breakpoints);
  }

  /**
   * Set breakpoints configuration
   */
  public setBreakpoints(breakpoints: BreakpointConfig): void {
    this.breakpoints.clear();
    
    Object.entries(breakpoints).forEach(([name, value]) => {
      const definition = this.parseBreakpoint(name, value);
      this.breakpoints.set(name, definition);
    });

    this.updateSortedBreakpoints();
  }

  /**
   * Add or update a single breakpoint
   */
  public setBreakpoint(name: string, value: string | number): void {
    const definition = this.parseBreakpoint(name, value);
    this.breakpoints.set(name, definition);
    this.updateSortedBreakpoints();
  }

  /**
   * Remove a breakpoint
   */
  public removeBreakpoint(name: string): boolean {
    const removed = this.breakpoints.delete(name);
    if (removed) {
      this.updateSortedBreakpoints();
    }
    return removed;
  }

  /**
   * Get breakpoint definition
   */
  public getBreakpoint(name: string): BreakpointDefinition | undefined {
    return this.breakpoints.get(name);
  }

  /**
   * Get all breakpoints
   */
  public getAllBreakpoints(): BreakpointDefinition[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Get sorted breakpoints (smallest to largest)
   */
  public getSortedBreakpoints(): BreakpointDefinition[] {
    return [...this.sortedBreakpoints];
  }

  /**
   * Calculate active breakpoints for given dimensions
   */
  public calculateActiveBreakpoints(
    width: number,
    height: number,
    containerType: 'inline-size' | 'size' | 'block-size' = 'inline-size'
  ): string[] {
    const dimension = this.getRelevantDimension(width, height, containerType);
    const active: string[] = [];

    this.sortedBreakpoints.forEach(bp => {
      if (dimension >= bp.value) {
        active.push(bp.name);
      }
    });

    return active;
  }

  /**
   * Get breakpoint matches for given dimensions
   */
  public getBreakpointMatches(
    width: number,
    height: number,
    containerType: 'inline-size' | 'size' | 'block-size' = 'inline-size'
  ): BreakpointMatch[] {
    const dimension = this.getRelevantDimension(width, height, containerType);
    
    return this.sortedBreakpoints.map(bp => ({
      name: bp.name,
      matches: dimension >= bp.value,
      value: bp.value,
      dimension
    }));
  }

  /**
   * Get the current active breakpoint (largest matching)
   */
  public getCurrentBreakpoint(
    width: number,
    height: number,
    containerType: 'inline-size' | 'size' | 'block-size' = 'inline-size'
  ): string | null {
    const active = this.calculateActiveBreakpoints(width, height, containerType);
    return active.length > 0 ? active[active.length - 1]! : null;
  }

  /**
   * Check if a specific breakpoint is active
   */
  public isBreakpointActive(
    name: string,
    width: number,
    height: number,
    containerType: 'inline-size' | 'size' | 'block-size' = 'inline-size'
  ): boolean {
    const bp = this.breakpoints.get(name);
    if (!bp) return false;

    const dimension = this.getRelevantDimension(width, height, containerType);
    return dimension >= bp.value;
  }

  /**
   * Get breakpoint range (min-max values)
   */
  public getBreakpointRange(name: string): { min: number; max: number | null } | null {
    const bp = this.breakpoints.get(name);
    if (!bp) return null;

    const index = this.sortedBreakpoints.findIndex(b => b.name === name);
    if (index === -1) return null;

    const min = bp.value;
    const max = index < this.sortedBreakpoints.length - 1
      ? this.sortedBreakpoints[index + 1]!.value - 1
      : null;

    return { min, max };
  }

  /**
   * Generate CSS media queries for breakpoints
   */
  public generateMediaQueries(): Record<string, string> {
    const queries: Record<string, string> = {};

    this.sortedBreakpoints.forEach((bp) => {
      const range = this.getBreakpointRange(bp.name);
      if (!range) return;

      let query = `(min-width: ${range.min}px)`;
      if (range.max !== null) {
        query += ` and (max-width: ${range.max}px)`;
      }

      queries[bp.name] = query;
    });

    return queries;
  }

  /**
   * Generate CSS container queries
   */
  public generateContainerQueries(containerName?: string): Record<string, string> {
    const queries: Record<string, string> = {};
    const container = containerName ? `${containerName} ` : '';

    this.sortedBreakpoints.forEach((bp) => {
      const range = this.getBreakpointRange(bp.name);
      if (!range) return;

      let query = `@container ${container}(min-width: ${range.min}px)`;
      if (range.max !== null) {
        query += ` and (max-width: ${range.max}px)`;
      }

      queries[bp.name] = query;
    });

    return queries;
  }

  /**
   * Validate breakpoint configuration
   */
  public validateBreakpoints(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate values
    const values = new Map<number, string[]>();
    this.breakpoints.forEach((bp, name) => {
      if (!values.has(bp.value)) {
        values.set(bp.value, []);
      }
      values.get(bp.value)!.push(name);
    });

    values.forEach((names, value) => {
      if (names.length > 1) {
        errors.push(`Duplicate breakpoint value ${value}px for: ${names.join(', ')}`);
      }
    });

    // Check for invalid values
    this.breakpoints.forEach((bp, name) => {
      if (bp.value < 0) {
        errors.push(`Invalid negative value for breakpoint "${name}": ${bp.value}px`);
      }
      if (!isFinite(bp.value)) {
        errors.push(`Invalid value for breakpoint "${name}": ${bp.originalValue}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get breakpoint statistics
   */
  public getStats(): object {
    const values = this.sortedBreakpoints.map(bp => bp.value);
    return {
      count: this.breakpoints.size,
      smallest: values[0] || 0,
      largest: values[values.length - 1] || 0,
      average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      units: Array.from(new Set(this.sortedBreakpoints.map(bp => bp.unit))),
      names: this.sortedBreakpoints.map(bp => bp.name)
    };
  }

  /**
   * Parse breakpoint value into definition
   */
  private parseBreakpoint(name: string, value: string | number): BreakpointDefinition {
    let pixelValue: number;
    let unit: string;
    const originalValue = value;

    if (typeof value === 'number') {
      pixelValue = value;
      unit = 'px';
    } else {
      const match = value.match(/^(\d*\.?\d+)(px|em|rem|%|vw|vh)?$/);
      if (!match) {
        console.warn(`ProteusJS: Invalid breakpoint value "${value}" for "${name}". Using 0px.`);
        pixelValue = 0;
        unit = 'px';
      } else {
        const numValue = parseFloat(match[1]!);
        unit = match[2] || 'px';
        
        // Convert to pixels
        switch (unit) {
          case 'px':
            pixelValue = numValue;
            break;
          case 'em':
          case 'rem':
            pixelValue = numValue * 16; // Assume 16px base
            break;
          case '%':
            pixelValue = (numValue / 100) * window.innerWidth;
            break;
          case 'vw':
            pixelValue = (numValue / 100) * window.innerWidth;
            break;
          case 'vh':
            pixelValue = (numValue / 100) * window.innerHeight;
            break;
          default:
            pixelValue = numValue;
            unit = 'px';
        }
      }
    }

    return {
      name,
      value: pixelValue,
      unit,
      originalValue,
      active: false
    };
  }

  /**
   * Update sorted breakpoints array
   */
  private updateSortedBreakpoints(): void {
    this.sortedBreakpoints = Array.from(this.breakpoints.values())
      .sort((a, b) => a.value - b.value);
  }

  /**
   * Get relevant dimension based on container type
   */
  private getRelevantDimension(
    width: number,
    height: number,
    containerType: 'inline-size' | 'size' | 'block-size'
  ): number {
    switch (containerType) {
      case 'inline-size':
        return width;
      case 'block-size':
        return height;
      case 'size':
        return Math.min(width, height);
      default:
        return width;
    }
  }
}
