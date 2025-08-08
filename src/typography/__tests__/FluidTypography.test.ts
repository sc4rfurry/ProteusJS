/**
 * FluidTypography Test Suite
 * Comprehensive tests for fluid typography system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FluidTypography, FluidConfig, ContainerBasedConfig } from '../FluidTypography';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('FluidTypography', () => {
  let fluidTypography: FluidTypography;
  let testElement: HTMLElement;

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Create test element
    testElement = document.createElement('p');
    testElement.textContent = 'Test typography content';
    testElement.style.fontSize = '16px';
    document.body.appendChild(testElement);

    fluidTypography = new FluidTypography();

    // Mock getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal'
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    fluidTypography.destroy();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Fluid Scaling', () => {
    it('should apply fluid scaling with clamp()', () => {
      const config: FluidConfig = {
        minSize: 14,
        maxSize: 24,
        minViewport: 320,
        maxViewport: 1200
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      expect(testElement.style.fontSize).toContain('clamp(');
      expect(testElement.getAttribute('data-proteus-fluid')).toBe('true');
      expect(testElement.getAttribute('data-proteus-min-size')).toBe('14');
      expect(testElement.getAttribute('data-proteus-max-size')).toBe('24');
    });

    it('should enforce accessibility constraints', () => {
      const config: FluidConfig = {
        minSize: 10, // Below WCAG AA minimum
        maxSize: 20,
        accessibility: 'AA',
        enforceAccessibility: true
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      // Should be adjusted to meet WCAG AA minimum (14px)
      expect(testElement.getAttribute('data-proteus-min-size')).toBe('14');
    });

    it('should respect user preferences', () => {
      // Mock root font size to simulate user preference
      vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
        if (element === document.documentElement) {
          return { fontSize: '20px' } as CSSStyleDeclaration; // User increased font size
        }
        return {
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal',
          fontStyle: 'normal'
        } as CSSStyleDeclaration;
      });

      const config: FluidConfig = {
        minSize: 16,
        maxSize: 24,
        respectUserPreferences: true
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      // Font sizes should be scaled by user preference (20/16 = 1.25)
      expect(testElement.getAttribute('data-proteus-min-size')).toBe('20'); // 16 * 1.25
      expect(testElement.getAttribute('data-proteus-max-size')).toBe('30'); // 24 * 1.25
    });

    it('should generate linear clamp values correctly', () => {
      const config: FluidConfig = {
        minSize: 16,
        maxSize: 24,
        minViewport: 320,
        maxViewport: 1200,
        scalingFunction: 'linear'
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      const fontSize = testElement.style.fontSize;
      expect(fontSize).toMatch(/clamp\(16px,.*,24px\)/);
    });

    it('should handle exponential scaling', () => {
      const config: FluidConfig = {
        minSize: 16,
        maxSize: 32,
        minViewport: 320,
        maxViewport: 1200,
        scalingFunction: 'exponential'
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      const fontSize = testElement.style.fontSize;
      expect(fontSize).toContain('clamp(');
      expect(fontSize).toContain('16px');
      expect(fontSize).toContain('32px');
    });
  });

  describe('Container-Based Scaling', () => {
    let containerElement: HTMLElement;

    beforeEach(() => {
      containerElement = document.createElement('div');
      containerElement.style.width = '600px';
      containerElement.style.height = '400px';
      containerElement.appendChild(testElement);
      document.body.appendChild(containerElement);

      // Mock getBoundingClientRect for container
      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        width: 600,
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 600,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);
    });

    it('should apply container-based scaling', () => {
      const config: ContainerBasedConfig = {
        minSize: 14,
        maxSize: 24,
        containerElement,
        minContainerWidth: 300,
        maxContainerWidth: 800
      };

      fluidTypography.applyContainerBasedScaling(testElement, config);
      
      // Container width is 600px, should scale between min and max
      const fontSize = parseFloat(testElement.style.fontSize);
      expect(fontSize).toBeGreaterThan(14);
      expect(fontSize).toBeLessThan(24);
    });

    it('should find nearest container automatically', () => {
      const config: ContainerBasedConfig = {
        minSize: 14,
        maxSize: 24,
        minContainerWidth: 300,
        maxContainerWidth: 800
      };

      fluidTypography.applyContainerBasedScaling(testElement, config);
      
      // Should find the container element automatically
      expect(testElement.style.fontSize).toBeTruthy();
    });

    it('should update on container resize', () => {
      const config: ContainerBasedConfig = {
        minSize: 14,
        maxSize: 24,
        containerElement,
        minContainerWidth: 300,
        maxContainerWidth: 800
      };

      fluidTypography.applyContainerBasedScaling(testElement, config);
      
      const initialFontSize = testElement.style.fontSize;
      
      // Simulate container resize
      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 400,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);

      // Trigger resize update
      fluidTypography['handleContainerResize'](containerElement);
      
      expect(testElement.style.fontSize).not.toBe(initialFontSize);
    });
  });

  describe('Text Fitting', () => {
    beforeEach(() => {
      // Mock getBoundingClientRect for text measurement
      const mockGetBoundingClientRect = vi.fn();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      
      // Return different widths based on font size
      mockGetBoundingClientRect.mockImplementation(function(this: Element) {
        const fontSize = parseFloat(this.style.fontSize || '16');
        const textLength = this.textContent?.length || 0;
        return {
          width: fontSize * textLength * 0.6, // Approximate character width
          height: fontSize * 1.2,
          top: 0,
          left: 0,
          bottom: fontSize * 1.2,
          right: fontSize * textLength * 0.6,
          x: 0,
          y: 0,
          toJSON: () => ({})
        } as DOMRect;
      });
    });

    it('should fit text to container width', () => {
      const config = {
        maxWidth: 200,
        minSize: 12,
        maxSize: 24
      };

      fluidTypography.fitTextToContainer(testElement, config);
      
      const fontSize = parseFloat(testElement.style.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(12);
      expect(fontSize).toBeLessThanOrEqual(24);
    });

    it('should handle overflow settings', () => {
      const config = {
        maxWidth: 100,
        minSize: 12,
        maxSize: 24,
        allowOverflow: false,
        wordBreak: 'break-all' as const
      };

      fluidTypography.fitTextToContainer(testElement, config);
      
      expect(testElement.style.overflow).toBe('hidden');
      expect(testElement.style.textOverflow).toBe('ellipsis');
      expect(testElement.style.wordBreak).toBe('break-all');
    });

    it('should calculate optimal text size correctly', () => {
      testElement.textContent = 'Short text';
      
      const config = {
        maxWidth: 300,
        minSize: 12,
        maxSize: 48
      };

      fluidTypography.fitTextToContainer(testElement, config);
      
      // Should find a size that fits within the width
      const fontSize = parseFloat(testElement.style.fontSize);
      expect(fontSize).toBeGreaterThan(12);
    });
  });

  describe('Element Management', () => {
    it('should remove fluid scaling', () => {
      const config: FluidConfig = {
        minSize: 14,
        maxSize: 24
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      expect(testElement.style.fontSize).toBeTruthy();
      expect(testElement.getAttribute('data-proteus-fluid')).toBe('true');
      
      fluidTypography.removeFluidScaling(testElement);
      
      expect(testElement.style.fontSize).toBeFalsy();
      expect(testElement.getAttribute('data-proteus-fluid')).toBeNull();
    });

    it('should handle elements without applied scaling', () => {
      expect(() => {
        fluidTypography.removeFluidScaling(testElement);
      }).not.toThrow();
    });

    it('should clean up resources on destroy', () => {
      const config: FluidConfig = {
        minSize: 14,
        maxSize: 24
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      expect(() => {
        fluidTypography.destroy();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing container gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Remove element from DOM to simulate missing container
      testElement.remove();
      
      const config: ContainerBasedConfig = {
        minSize: 14,
        maxSize: 24
      };

      expect(() => {
        fluidTypography.applyContainerBasedScaling(testElement, config);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No container found')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle errors in scaling gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error by providing invalid config
      const config = null as any;

      expect(() => {
        fluidTypography.applyFluidScaling(testElement, config);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle empty text content', () => {
      testElement.textContent = '';
      
      const config = {
        maxWidth: 200,
        minSize: 12,
        maxSize: 24
      };

      expect(() => {
        fluidTypography.fitTextToContainer(testElement, config);
      }).not.toThrow();
      
      expect(parseFloat(testElement.style.fontSize)).toBe(12); // Should use minimum
    });
  });

  describe('Accessibility Compliance', () => {
    it('should enforce WCAG AA compliance', () => {
      const config: FluidConfig = {
        minSize: 10, // Below WCAG AA minimum
        maxSize: 20,
        accessibility: 'AA',
        enforceAccessibility: true
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      const minSize = parseFloat(testElement.getAttribute('data-proteus-min-size') || '0');
      expect(minSize).toBeGreaterThanOrEqual(14); // WCAG AA minimum
    });

    it('should enforce WCAG AAA compliance', () => {
      const config: FluidConfig = {
        minSize: 12, // Below WCAG AAA minimum
        maxSize: 20,
        accessibility: 'AAA',
        enforceAccessibility: true
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      const minSize = parseFloat(testElement.getAttribute('data-proteus-min-size') || '0');
      expect(minSize).toBeGreaterThanOrEqual(16); // WCAG AAA minimum
    });

    it('should allow bypassing accessibility constraints', () => {
      const config: FluidConfig = {
        minSize: 10,
        maxSize: 20,
        accessibility: 'AA',
        enforceAccessibility: false
      };

      fluidTypography.applyFluidScaling(testElement, config);
      
      const minSize = parseFloat(testElement.getAttribute('data-proteus-min-size') || '0');
      expect(minSize).toBe(10); // Should not be enforced
    });
  });
});
