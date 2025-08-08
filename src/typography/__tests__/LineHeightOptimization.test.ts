/**
 * LineHeightOptimization Test Suite
 * Comprehensive tests for line height optimization system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LineHeightOptimization, LineHeightConfig } from '../LineHeightOptimization';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('LineHeightOptimization', () => {
  let lineHeightOptimization: LineHeightOptimization;
  let testElement: HTMLElement;

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Create test element
    testElement = document.createElement('p');
    testElement.textContent = 'This is a test paragraph with some content to test line height optimization.';
    testElement.style.fontSize = '16px';
    document.body.appendChild(testElement);

    lineHeightOptimization = new LineHeightOptimization();

    // Mock getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif'
    } as CSSStyleDeclaration);

    // Mock getBoundingClientRect
    vi.spyOn(testElement, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);
  });

  afterEach(() => {
    lineHeightOptimization.destroy();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Basic Line Height Optimization', () => {
    it('should optimize line height with default settings', () => {
      const result = lineHeightOptimization.optimizeLineHeight(testElement);
      
      expect(result.lineHeight).toBeGreaterThan(1);
      expect(result.lineHeightCSS).toBeTruthy();
      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(testElement.style.lineHeight).toBe(result.lineHeightCSS);
    });

    it('should apply different density settings', () => {
      const compactResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        density: 'compact'
      });
      
      const spaciousResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        density: 'spacious'
      });
      
      expect(compactResult.lineHeight).toBeLessThan(spaciousResult.lineHeight);
    });

    it('should add debugging attributes', () => {
      const result = lineHeightOptimization.optimizeLineHeight(testElement);
      
      expect(testElement.getAttribute('data-proteus-line-height')).toBe(
        result.lineHeight.toString()
      );
      expect(testElement.getAttribute('data-proteus-line-height-reasoning')).toBeTruthy();
    });
  });

  describe('Content Type Adjustments', () => {
    it('should adjust for heading content', () => {
      const headingResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        contentType: 'heading'
      });
      
      const bodyResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        contentType: 'body'
      });
      
      expect(headingResult.lineHeight).toBeLessThan(bodyResult.lineHeight);
      expect(headingResult.adjustments).toContain(
        expect.stringContaining('Content type (heading)')
      );
    });

    it('should adjust for code content', () => {
      const codeResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        contentType: 'code'
      });
      
      const bodyResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        contentType: 'body'
      });
      
      expect(codeResult.lineHeight).toBeGreaterThan(bodyResult.lineHeight);
      expect(codeResult.adjustments).toContain(
        expect.stringContaining('Content type (code)')
      );
    });

    it('should adjust for caption content', () => {
      const captionResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        contentType: 'caption'
      });
      
      const bodyResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        contentType: 'body'
      });
      
      expect(captionResult.lineHeight).toBeLessThan(bodyResult.lineHeight);
    });
  });

  describe('Language-Specific Adjustments', () => {
    it('should adjust for Chinese language', () => {
      const chineseResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        language: 'zh-CN'
      });
      
      const englishResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        language: 'en'
      });
      
      expect(chineseResult.lineHeight).toBeGreaterThan(englishResult.lineHeight);
      expect(chineseResult.adjustments).toContain(
        expect.stringContaining('Language (zh)')
      );
    });

    it('should adjust for Japanese language', () => {
      const japaneseResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        language: 'ja'
      });
      
      const englishResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        language: 'en'
      });
      
      expect(japaneseResult.lineHeight).toBeGreaterThan(englishResult.lineHeight);
    });

    it('should handle unknown languages gracefully', () => {
      const unknownResult = lineHeightOptimization.optimizeLineHeight(testElement, {
        language: 'unknown-lang'
      });
      
      expect(unknownResult.lineHeight).toBeGreaterThan(0);
      expect(unknownResult.adjustments).not.toContain(
        expect.stringContaining('Language (unknown-lang)')
      );
    });
  });

  describe('Line Length Adjustments', () => {
    it('should adjust for very short lines', () => {
      // Mock narrow container
      vi.spyOn(testElement, 'getBoundingClientRect').mockReturnValue({
        width: 100, // Very narrow
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);

      const result = lineHeightOptimization.optimizeLineHeight(testElement);
      
      expect(result.adjustments).toContain(
        expect.stringContaining('Line length')
      );
    });

    it('should adjust for very long lines', () => {
      // Mock very wide container
      vi.spyOn(testElement, 'getBoundingClientRect').mockReturnValue({
        width: 1200, // Very wide
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 1200,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);

      const result = lineHeightOptimization.optimizeLineHeight(testElement);
      
      expect(result.adjustments).toContain(
        expect.stringContaining('Line length')
      );
    });
  });

  describe('Font Size Adjustments', () => {
    it('should adjust for small font sizes', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        fontSize: '10px', // Very small
        fontFamily: 'Arial, sans-serif'
      } as CSSStyleDeclaration);

      const result = lineHeightOptimization.optimizeLineHeight(testElement);
      
      expect(result.adjustments).toContain(
        expect.stringContaining('Font size (10px)')
      );
    });

    it('should adjust for large font sizes', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        fontSize: '32px', // Very large
        fontFamily: 'Arial, sans-serif'
      } as CSSStyleDeclaration);

      const result = lineHeightOptimization.optimizeLineHeight(testElement);
      
      expect(result.adjustments).toContain(
        expect.stringContaining('Font size (32px)')
      );
    });
  });

  describe('Accessibility Compliance', () => {
    it('should enforce WCAG AA compliance', () => {
      const config: LineHeightConfig = {
        density: 'compact', // Would normally result in low line height
        accessibility: 'AA',
        enforceAccessibility: true
      };

      const result = lineHeightOptimization.optimizeLineHeight(testElement, config);
      
      expect(result.lineHeight).toBeGreaterThanOrEqual(1.5); // WCAG AA minimum
      expect(result.accessibilityCompliant).toBe(true);
    });

    it('should enforce WCAG AAA compliance', () => {
      const config: LineHeightConfig = {
        density: 'compact',
        accessibility: 'AAA',
        enforceAccessibility: true
      };

      const result = lineHeightOptimization.optimizeLineHeight(testElement, config);
      
      expect(result.lineHeight).toBeGreaterThanOrEqual(1.6); // WCAG AAA minimum
      expect(result.accessibilityCompliant).toBe(true);
    });

    it('should allow bypassing accessibility constraints', () => {
      const config: LineHeightConfig = {
        density: 'compact',
        accessibility: 'AA',
        enforceAccessibility: false
      };

      const result = lineHeightOptimization.optimizeLineHeight(testElement, config);
      
      // Should not enforce minimum if disabled
      expect(result.lineHeight).toBeLessThan(1.5);
    });

    it('should mark non-compliant results', () => {
      const config: LineHeightConfig = {
        density: 'compact',
        accessibility: 'AAA',
        enforceAccessibility: true
      };

      const result = lineHeightOptimization.optimizeLineHeight(testElement, config);
      
      if (result.lineHeight < 1.6) {
        expect(result.accessibilityCompliant).toBe(false);
      } else {
        expect(result.accessibilityCompliant).toBe(true);
      }
    });
  });

  describe('User Preferences', () => {
    it('should respect user line spacing preferences', () => {
      // Mock CSS custom property for user preferences
      vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
        if (element === document.documentElement) {
          return {
            getPropertyValue: (prop: string) => {
              if (prop === '--user-line-spacing') return '1.2';
              return '';
            }
          } as CSSStyleDeclaration;
        }
        return {
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif'
        } as CSSStyleDeclaration;
      });

      const result = lineHeightOptimization.optimizeLineHeight(testElement, {
        respectUserPreferences: true
      });
      
      expect(result.adjustments).toContain(
        expect.stringContaining('User preferences')
      );
    });

    it('should handle missing user preferences gracefully', () => {
      const result = lineHeightOptimization.optimizeLineHeight(testElement, {
        respectUserPreferences: true
      });
      
      expect(result.lineHeight).toBeGreaterThan(0);
    });
  });

  describe('Element Management', () => {
    it('should update line height when element changes', () => {
      const config: LineHeightConfig = {
        density: 'comfortable'
      };

      lineHeightOptimization.optimizeLineHeight(testElement, config);
      const initialLineHeight = testElement.style.lineHeight;
      
      // Change element size
      vi.spyOn(testElement, 'getBoundingClientRect').mockReturnValue({
        width: 800, // Much wider
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);

      lineHeightOptimization.updateLineHeight(testElement);
      
      expect(testElement.style.lineHeight).not.toBe(initialLineHeight);
    });

    it('should remove optimization', () => {
      lineHeightOptimization.optimizeLineHeight(testElement);
      
      expect(testElement.style.lineHeight).toBeTruthy();
      expect(testElement.getAttribute('data-proteus-line-height')).toBeTruthy();
      
      lineHeightOptimization.removeOptimization(testElement);
      
      expect(testElement.style.lineHeight).toBeFalsy();
      expect(testElement.getAttribute('data-proteus-line-height')).toBeNull();
    });

    it('should handle elements without optimization', () => {
      expect(() => {
        lineHeightOptimization.removeOptimization(testElement);
      }).not.toThrow();
      
      expect(() => {
        lineHeightOptimization.updateLineHeight(testElement);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error by providing invalid config
      const config = null as any;

      const result = lineHeightOptimization.optimizeLineHeight(testElement, config);
      
      expect(result.lineHeight).toBeGreaterThan(0);
      expect(result.reasoning).toContain('Error occurred, using default');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should clean up resources on destroy', () => {
      lineHeightOptimization.optimizeLineHeight(testElement);
      
      expect(() => {
        lineHeightOptimization.destroy();
      }).not.toThrow();
    });
  });

  describe('Precision and Rounding', () => {
    it('should round line height to reasonable precision', () => {
      const result = lineHeightOptimization.optimizeLineHeight(testElement);
      
      // Should be rounded to 3 decimal places
      const decimalPlaces = (result.lineHeight.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(3);
    });

    it('should provide detailed reasoning', () => {
      const result = lineHeightOptimization.optimizeLineHeight(testElement, {
        density: 'comfortable',
        contentType: 'body',
        language: 'en',
        accessibility: 'AA'
      });
      
      expect(result.reasoning.length).toBeGreaterThan(1);
      expect(result.reasoning[0]).toContain('comfortable density');
    });
  });
});
