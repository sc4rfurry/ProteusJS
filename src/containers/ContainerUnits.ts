/**
 * Container Units System for ProteusJS
 * Implements CSS-like container units (cw, ch, cmin, cmax, cqi, cqb)
 */

import type { ContainerUnit } from '../types';

export interface ContainerDimensions {
  width: number;
  height: number;
  inlineSize: number;
  blockSize: number;
}

export interface UnitCalculation {
  value: number;
  unit: ContainerUnit;
  pixelValue: number;
  containerDimensions: ContainerDimensions;
}

export class ContainerUnits {
  private containerDimensions: Map<Element, ContainerDimensions> = new Map();
  private unitProperties: Map<Element, Set<string>> = new Map();

  /**
   * Update container dimensions for an element
   */
  public updateDimensions(element: Element, dimensions: ContainerDimensions): void {
    this.containerDimensions.set(element, dimensions);
    this.updateUnitProperties(element);
  }

  /**
   * Calculate container unit value in pixels
   */
  public calculateUnit(
    element: Element,
    value: number,
    unit: ContainerUnit
  ): number {
    const dimensions = this.containerDimensions.get(element);
    if (!dimensions) {
      console.warn('ProteusJS: No container dimensions found for element');
      return 0;
    }

    switch (unit) {
      case 'cw':
        return (value / 100) * dimensions.width;
      case 'ch':
        return (value / 100) * dimensions.height;
      case 'cmin':
        return (value / 100) * Math.min(dimensions.width, dimensions.height);
      case 'cmax':
        return (value / 100) * Math.max(dimensions.width, dimensions.height);
      case 'cqi':
        return (value / 100) * dimensions.inlineSize;
      case 'cqb':
        return (value / 100) * dimensions.blockSize;
      default:
        return 0;
    }
  }

  /**
   * Parse container unit string (e.g., "50cw", "25ch")
   */
  public parseUnit(unitString: string): { value: number; unit: ContainerUnit } | null {
    const match = unitString.match(/^(\d*\.?\d+)(cw|ch|cmin|cmax|cqi|cqb)$/);
    if (!match) return null;

    return {
      value: parseFloat(match[1]!),
      unit: match[2]! as ContainerUnit
    };
  }

  /**
   * Convert container unit to pixels for specific element
   */
  public toPixels(element: Element, unitString: string): number {
    const parsed = this.parseUnit(unitString);
    if (!parsed) return 0;

    return this.calculateUnit(element, parsed.value, parsed.unit);
  }

  /**
   * Apply container units to element styles
   */
  public applyUnits(element: Element, styles: Record<string, string>): void {
    const htmlElement = element as HTMLElement;
    const appliedProperties = new Set<string>();

    Object.entries(styles).forEach(([property, value]) => {
      const convertedValue = this.convertUnitsInValue(element, value);
      if (convertedValue !== value) {
        htmlElement.style.setProperty(property, convertedValue);
        appliedProperties.add(property);
      }
    });

    // Track applied properties for cleanup
    if (appliedProperties.size > 0) {
      if (!this.unitProperties.has(element)) {
        this.unitProperties.set(element, new Set());
      }
      appliedProperties.forEach(prop => {
        this.unitProperties.get(element)!.add(prop);
      });
    }
  }

  /**
   * Remove container unit styles from element
   */
  public removeUnits(element: Element): void {
    const htmlElement = element as HTMLElement;
    const properties = this.unitProperties.get(element);
    
    if (properties) {
      properties.forEach(property => {
        htmlElement.style.removeProperty(property);
      });
      this.unitProperties.delete(element);
    }
  }

  /**
   * Generate CSS custom properties for container units
   */
  public generateCustomProperties(element: Element): Record<string, string> {
    const dimensions = this.containerDimensions.get(element);
    if (!dimensions) return {};

    return {
      '--cw': `${dimensions.width / 100}px`,
      '--ch': `${dimensions.height / 100}px`,
      '--cmin': `${Math.min(dimensions.width, dimensions.height) / 100}px`,
      '--cmax': `${Math.max(dimensions.width, dimensions.height) / 100}px`,
      '--cqi': `${dimensions.inlineSize / 100}px`,
      '--cqb': `${dimensions.blockSize / 100}px`
    };
  }

  /**
   * Apply custom properties to element
   */
  public applyCustomProperties(element: Element): void {
    const htmlElement = element as HTMLElement;
    const properties = this.generateCustomProperties(element);
    
    Object.entries(properties).forEach(([property, value]) => {
      htmlElement.style.setProperty(property, value);
    });
  }

  /**
   * Create responsive value using container units
   */
  public createResponsiveValue(
    baseValue: number,
    unit: ContainerUnit,
    options: {
      min?: number;
      max?: number;
      scale?: number;
    } = {}
  ): string {
    const { min, max, scale = 1 } = options;
    const scaledValue = baseValue * scale;
    
    if (min !== undefined && max !== undefined) {
      return `clamp(${min}px, ${scaledValue}${unit}, ${max}px)`;
    } else if (min !== undefined) {
      return `max(${min}px, ${scaledValue}${unit})`;
    } else if (max !== undefined) {
      return `min(${scaledValue}${unit}, ${max}px)`;
    }
    
    return `${scaledValue}${unit}`;
  }

  /**
   * Get container unit statistics
   */
  public getStats(): object {
    return {
      trackedContainers: this.containerDimensions.size,
      elementsWithUnits: this.unitProperties.size,
      totalUnitProperties: Array.from(this.unitProperties.values())
        .reduce((sum, props) => sum + props.size, 0)
    };
  }

  /**
   * Clean up container data
   */
  public cleanup(element: Element): void {
    this.removeUnits(element);
    this.containerDimensions.delete(element);
  }

  /**
   * Clear all data
   */
  public clear(): void {
    // Remove all unit styles
    this.unitProperties.forEach((_properties, element) => {
      this.removeUnits(element);
    });
    
    this.containerDimensions.clear();
    this.unitProperties.clear();
  }

  /**
   * Convert container units in a CSS value string
   */
  private convertUnitsInValue(element: Element, value: string): string {
    // Match container unit patterns in the value
    const unitRegex = /(\d*\.?\d+)(cw|ch|cmin|cmax|cqi|cqb)/g;
    
    return value.replace(unitRegex, (_match, numStr, unit) => {
      const num = parseFloat(numStr);
      const pixels = this.calculateUnit(element, num, unit as ContainerUnit);
      return `${pixels}px`;
    });
  }

  /**
   * Update unit properties when dimensions change
   */
  private updateUnitProperties(element: Element): void {
    const properties = this.unitProperties.get(element);
    if (!properties) return;

    const htmlElement = element as HTMLElement;
    // const computedStyle = getComputedStyle(htmlElement); // Currently unused
    
    // Re-apply container unit styles with new dimensions
    properties.forEach(property => {
      const currentValue = htmlElement.style.getPropertyValue(property);
      if (currentValue && this.hasContainerUnits(currentValue)) {
        const convertedValue = this.convertUnitsInValue(element, currentValue);
        htmlElement.style.setProperty(property, convertedValue);
      }
    });

    // Update custom properties
    this.applyCustomProperties(element);
  }

  /**
   * Check if value contains container units
   */
  private hasContainerUnits(value: string): boolean {
    return /\d+(cw|ch|cmin|cmax|cqi|cqb)/.test(value);
  }
}

/**
 * Utility functions for container units
 */
export const containerUnitUtils = {
  /**
   * Create fluid typography using container units
   */
  createFluidType(
    minSize: number,
    maxSize: number,
    minContainer: number,
    maxContainer: number,
    unit: ContainerUnit = 'cw'
  ): string {
    const slope = (maxSize - minSize) / (maxContainer - minContainer);
    const yIntercept = minSize - slope * minContainer;
    
    return `clamp(${minSize}px, ${yIntercept}px + ${slope * 100}${unit}, ${maxSize}px)`;
  },

  /**
   * Create responsive spacing using container units
   */
  createFluidSpacing(
    baseSpacing: number,
    scale: number = 1,
    unit: ContainerUnit = 'cw'
  ): string {
    const scaledValue = baseSpacing * scale;
    return `${scaledValue}${unit}`;
  },

  /**
   * Convert viewport units to container units
   */
  convertViewportToContainer(
    value: string,
    containerWidth: number,
    containerHeight: number,
    viewportWidth: number = window.innerWidth,
    viewportHeight: number = window.innerHeight
  ): string {
    return value.replace(/(\d*\.?\d+)(vw|vh|vmin|vmax)/g, (match, numStr, unit) => {
      const num = parseFloat(numStr);
      let containerValue: number;
      let containerUnit: ContainerUnit;

      switch (unit) {
        case 'vw':
          containerValue = (num * viewportWidth) / containerWidth * 100;
          containerUnit = 'cw';
          break;
        case 'vh':
          containerValue = (num * viewportHeight) / containerHeight * 100;
          containerUnit = 'ch';
          break;
        case 'vmin':
          const vminPixels = (num / 100) * Math.min(viewportWidth, viewportHeight);
          containerValue = (vminPixels / Math.min(containerWidth, containerHeight)) * 100;
          containerUnit = 'cmin';
          break;
        case 'vmax':
          const vmaxPixels = (num / 100) * Math.max(viewportWidth, viewportHeight);
          containerValue = (vmaxPixels / Math.max(containerWidth, containerHeight)) * 100;
          containerUnit = 'cmax';
          break;
        default:
          return match;
      }

      return `${containerValue.toFixed(2)}${containerUnit}`;
    });
  }
};
