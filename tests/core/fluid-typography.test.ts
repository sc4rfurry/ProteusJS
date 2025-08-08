/**
 * Fluid Typography Test Suite
 * Tests typography scaling, accessibility, and responsive behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestHelpers } from '../utils/test-helpers';
import { FluidTypography } from '../../src/typography/FluidTypography';
import { TypographicScale } from '../../src/typography/TypographicScale';
import { LineHeightOptimization } from '../../src/typography/LineHeightOptimization';

describe('Fluid Typography System', () => {
  let fluidTypography: FluidTypography;
  let typographicScale: TypographicScale;
  let lineHeightOptimization: LineHeightOptimization;
  let typographyElements: ReturnType<typeof TestHelpers.createTypographyElements>;

  beforeEach(() => {
    TestHelpers.cleanup();
    fluidTypography = new FluidTypography();
    typographicScale = new TypographicScale();
    lineHeightOptimization = new LineHeightOptimization();
    typographyElements = TestHelpers.createTypographyElements();
  });

  afterEach(() => {
    fluidTypography.destroy();
    typographicScale.destroy();
    lineHeightOptimization.destroy();
    TestHelpers.cleanup();
  });

  describe('Fluid Scaling', () => {
    it('should apply clamp-based scaling correctly', () => {
      const { heading } = typographyElements;
      
      fluidTypography.applyFluidScaling(heading, {
        minSize: 18,
        maxSize: 48,
        minViewport: 320,
        maxViewport: 1200
      });
      
      const fontSize = window.getComputedStyle(heading).fontSize;
      expect(fontSize).toContain('clamp');
      expect(fontSize).toContain('18px');
      expect(fontSize).toContain('48px');
    });

    it('should scale typography based on container size', async () => {
      const { heading, container } = typographyElements;
      
      fluidTypography.applyContainerBasedScaling(heading, {
        minSize: 16,
        maxSize: 32,
        containerElement: container
      });
      
      // Test at different container sizes
      await TestHelpers.simulateResize(container, 400, 300);
      let fontSize = parseFloat(window.getComputedStyle(heading).fontSize);
      const smallSize = fontSize;
      
      await TestHelpers.simulateResize(container, 800, 600);
      fontSize = parseFloat(window.getComputedStyle(heading).fontSize);
      const largeSize = fontSize;
      
      expect(largeSize).toBeGreaterThan(smallSize);
      expect(smallSize).toBeGreaterThanOrEqual(16);
      expect(largeSize).toBeLessThanOrEqual(32);
    });

    it('should maintain aspect ratio in scaling', () => {
      const { heading, paragraph } = typographyElements;
      
      fluidTypography.applyFluidScaling(heading, {
        minSize: 24,
        maxSize: 48,
        minViewport: 320,
        maxViewport: 1200
      });
      
      fluidTypography.applyFluidScaling(paragraph, {
        minSize: 16,
        maxSize: 24,
        minViewport: 320,
        maxViewport: 1200
      });
      
      const headingSize = (global as any).parseCSSValue(window.getComputedStyle(heading).fontSize);
      const paragraphSize = (global as any).parseCSSValue(window.getComputedStyle(paragraph).fontSize);
      
      // Heading should be larger than paragraph
      expect(headingSize).toBeGreaterThan(paragraphSize);
    });

    it('should support different scaling functions', () => {
      const { heading } = typographyElements;
      
      // Test linear scaling
      fluidTypography.applyFluidScaling(heading, {
        minSize: 18,
        maxSize: 36,
        scalingFunction: 'linear'
      });
      
      expect(window.getComputedStyle(heading).fontSize).toContain('clamp');
      
      // Test exponential scaling
      fluidTypography.applyFluidScaling(heading, {
        minSize: 18,
        maxSize: 36,
        scalingFunction: 'exponential'
      });
      
      expect(window.getComputedStyle(heading).fontSize).toBeDefined();
    });
  });

  describe('Typographic Scale', () => {
    it('should generate scale based on ratio', () => {
      const scale = typographicScale.generateScale({
        baseSize: 16,
        ratio: 1.25, // Major third
        steps: 5
      });
      
      expect(scale).toHaveLength(5);
      expect(scale[0]).toBe(16); // Base size
      expect(scale[1]).toBeCloseTo(20); // 16 * 1.25
      expect(scale[2]).toBeCloseTo(25); // 16 * 1.25^2
    });

    it('should support named ratios', () => {
      const goldenScale = typographicScale.generateScale({
        baseSize: 16,
        ratio: 'golden-ratio',
        steps: 3
      });
      
      const minorThirdScale = typographicScale.generateScale({
        baseSize: 16,
        ratio: 'minor-third',
        steps: 3
      });
      
      expect(goldenScale).toHaveLength(3);
      expect(minorThirdScale).toHaveLength(3);
      expect(goldenScale[1]).not.toBe(minorThirdScale[1]);
    });

    it('should apply scale to elements', () => {
      const { container } = typographyElements;
      
      // Create heading hierarchy
      const h1 = document.createElement('h1');
      const h2 = document.createElement('h2');
      const h3 = document.createElement('h3');
      const p = document.createElement('p');
      
      container.appendChild(h1);
      container.appendChild(h2);
      container.appendChild(h3);
      container.appendChild(p);
      
      typographicScale.applyToElements([h1, h2, h3, p], {
        baseSize: 16,
        ratio: 1.25,
        reverse: true // Larger elements get larger sizes
      });
      
      const h1Size = parseFloat(window.getComputedStyle(h1).fontSize);
      const h2Size = parseFloat(window.getComputedStyle(h2).fontSize);
      const h3Size = parseFloat(window.getComputedStyle(h3).fontSize);
      const pSize = parseFloat(window.getComputedStyle(p).fontSize);
      
      expect(h1Size).toBeGreaterThan(h2Size);
      expect(h2Size).toBeGreaterThan(h3Size);
      expect(h3Size).toBeGreaterThan(pSize);
    });
  });

  describe('Line Height Optimization', () => {
    it('should calculate optimal line height for readability', () => {
      const { paragraph } = typographyElements;
      
      const optimalLineHeight = lineHeightOptimization.calculateOptimal(paragraph, {
        fontSize: 16,
        contentType: 'body-text'
      });
      
      expect(optimalLineHeight).toBeGreaterThan(1.2);
      expect(optimalLineHeight).toBeLessThan(1.8);
    });

    it('should adjust line height based on font size', () => {
      const { heading, paragraph } = typographyElements;
      
      const headingLineHeight = lineHeightOptimization.calculateOptimal(heading, {
        fontSize: 32,
        contentType: 'heading',
        accessibility: 'none' // Allow tighter line height for visual hierarchy
      });

      const paragraphLineHeight = lineHeightOptimization.calculateOptimal(paragraph, {
        fontSize: 16,
        contentType: 'body-text',
        accessibility: 'AA' // Maintain accessibility for body text
      });
      
      // Larger text typically needs tighter line height
      expect(headingLineHeight).toBeLessThan(paragraphLineHeight);
    });

    it('should maintain vertical rhythm', () => {
      const { container } = typographyElements;
      
      const elements = [
        document.createElement('h1'),
        document.createElement('h2'),
        document.createElement('p'),
        document.createElement('p')
      ];
      
      elements.forEach(el => {
        el.textContent = 'Sample text content';
        container.appendChild(el);
      });
      
      lineHeightOptimization.maintainVerticalRhythm(elements, {
        baselineGrid: 24,
        baseSize: 16
      });
      
      // Check that line heights maintain rhythm
      elements.forEach(el => {
        const lineHeight = parseFloat(window.getComputedStyle(el).lineHeight);
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        const actualLineHeight = lineHeight * fontSize;
        
        // Should be multiple of baseline grid
        expect(actualLineHeight % 24).toBeCloseTo(0, 1);
      });
    });

    it('should handle accessibility requirements', () => {
      const { paragraph } = typographyElements;
      
      const accessibleLineHeight = lineHeightOptimization.calculateOptimal(paragraph, {
        fontSize: 16,
        contentType: 'body-text',
        accessibility: 'AAA'
      });
      
      // WCAG AAA requires minimum 1.5 line height
      expect(accessibleLineHeight).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('Text Fitting', () => {
    it('should fit text to container width', () => {
      const { heading, container } = typographyElements;
      heading.textContent = 'This is a very long heading that should be fitted to the container width';
      
      fluidTypography.fitTextToContainer(heading, {
        maxWidth: 300,
        minSize: 12,
        maxSize: 24
      });
      
      const fontSize = parseFloat(window.getComputedStyle(heading).fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(12);
      expect(fontSize).toBeLessThanOrEqual(24);
    });

    it('should handle overflow gracefully', () => {
      const { paragraph, container } = typographyElements;
      paragraph.textContent = 'A'.repeat(1000); // Very long text
      
      fluidTypography.fitTextToContainer(paragraph, {
        maxWidth: 200,
        minSize: 8,
        maxSize: 16,
        allowOverflow: false
      });
      
      const computedStyle = window.getComputedStyle(paragraph);
      expect(computedStyle.overflow).toBe('hidden');
      expect(computedStyle.textOverflow).toBe('ellipsis');
    });
  });

  describe('Performance', () => {
    it('should apply typography changes within performance budget', async () => {
      const { heading, paragraph } = typographyElements;
      
      const { duration } = await TestHelpers.measurePerformance(() => {
        fluidTypography.applyFluidScaling(heading, {
          minSize: 18,
          maxSize: 48
        });
        
        fluidTypography.applyFluidScaling(paragraph, {
          minSize: 14,
          maxSize: 18
        });
      });
      
      expect(duration).toBeLessThan(16); // 60fps budget
    });

    it('should handle multiple elements efficiently', async () => {
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement('p');
        el.textContent = 'Sample text';
        document.body.appendChild(el);
        return el;
      });
      
      const { duration } = await TestHelpers.measurePerformance(() => {
        elements.forEach(el => {
          fluidTypography.applyFluidScaling(el, {
            minSize: 14,
            maxSize: 18
          });
        });
      });
      
      expect(duration).toBeLessThan(50); // Should handle 100 elements quickly
    });

    it('should not cause memory leaks', async () => {
      const { hasLeak } = await TestHelpers.testMemoryLeaks(() => {
        const el = document.createElement('p');
        document.body.appendChild(el);
        
        fluidTypography.applyFluidScaling(el, {
          minSize: 14,
          maxSize: 18
        });
        
        el.remove();
      }, 50);
      
      expect(hasLeak).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should maintain minimum font sizes for accessibility', () => {
      const { paragraph } = typographyElements;
      
      fluidTypography.applyFluidScaling(paragraph, {
        minSize: 8, // Below accessibility minimum
        maxSize: 16,
        enforceAccessibility: true
      });
      
      const fontSize = parseFloat(window.getComputedStyle(paragraph).fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(12); // Should be enforced to minimum
    });

    it('should support user font size preferences', () => {
      const { paragraph } = typographyElements;
      
      // Mock user preference for larger text
      Object.defineProperty(document.documentElement, 'style', {
        value: { fontSize: '20px' },
        writable: true
      });
      
      fluidTypography.applyFluidScaling(paragraph, {
        minSize: 16,
        maxSize: 24,
        respectUserPreferences: true
      });
      
      // Should scale relative to user preference
      const fontSize = (global as any).parseCSSValue(window.getComputedStyle(paragraph).fontSize);
      expect(fontSize).toBeGreaterThan(16);
    });

    it('should provide sufficient contrast with background', () => {
      const { paragraph } = typographyElements;
      paragraph.style.backgroundColor = '#ffffff';
      paragraph.style.color = '#000000';
      
      const accessibility = TestHelpers.testAccessibility(paragraph);
      expect(accessibility.hasProperContrast).toBe(true);
    });
  });
});
