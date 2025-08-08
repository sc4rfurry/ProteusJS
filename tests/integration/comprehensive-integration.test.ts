/**
 * Comprehensive Integration Tests for ProteusJS
 * Tests the complete system working together
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProteusJS } from '../../src/index';
import { FluidTypography } from '../../src/typography/FluidTypography';
import { ContainerBreakpoints } from '../../src/containers/ContainerBreakpoints';
import { PerformanceMonitor } from '../../src/performance/PerformanceMonitor';
import { AccessibilityEngine } from '../../src/accessibility/AccessibilityEngine';
import { BrowserCompatibility } from '../../src/compatibility/BrowserCompatibility';

describe('ProteusJS Comprehensive Integration', () => {
  let proteus: ProteusJS;
  let container: HTMLElement;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    container.innerHTML = `
      <div class="test-container" style="width: 800px;">
        <h1 class="test-heading">Test Heading</h1>
        <p class="test-paragraph">Test paragraph with some content for testing.</p>
        <div class="test-card" style="width: 300px;">
          <h2>Card Title</h2>
          <p>Card content</p>
          <button>Action Button</button>
        </div>
        <img src="test.jpg" alt="Test image" />
        <input type="text" placeholder="Test input" />
      </div>
    `;
    document.body.appendChild(container);

    // Initialize ProteusJS
    proteus = new ProteusJS({
      fluidTypography: {
        enabled: true,
        minViewport: 320,
        maxViewport: 1200,
        accessibility: {
          respectUserPreferences: true,
          minFontSize: 16
        }
      },
      containerQueries: {
        enabled: true
      },
      performance: {
        enableCaching: true,
        debounceResize: 50
      },
      accessibility: {
        level: 'AA',
        announceChanges: true
      }
    });
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    if (proteus) {
      proteus.destroy();
    }
  });

  describe('System Initialization', () => {
    it('should initialize all subsystems correctly', async () => {
      await proteus.initialize();

      expect(proteus.typography).toBeInstanceOf(FluidTypography);
      expect(proteus.containers).toBeInstanceOf(ContainerBreakpoints);
      expect(proteus.performance).toBeInstanceOf(PerformanceMonitor);
      expect(proteus.accessibility).toBeInstanceOf(AccessibilityEngine);
      expect(proteus.compatibility).toBeInstanceOf(BrowserCompatibility);
    });

    it('should apply default configurations', async () => {
      await proteus.initialize();

      const config = proteus.getConfiguration();
      expect(config.fluidTypography.enabled).toBe(true);
      expect(config.containerQueries.enabled).toBe(true);
      expect(config.performance.enableCaching).toBe(true);
      expect(config.accessibility.level).toBe('AA');
    });

    it('should detect browser capabilities', async () => {
      await proteus.initialize();

      const compatibility = proteus.compatibility.getCompatibilityReport();
      expect(compatibility.browser).toBeDefined();
      expect(compatibility.features).toBeDefined();
      expect(compatibility.browser.name).toBeTruthy();
      expect(compatibility.browser.version).toBeTruthy();
    });
  });

  describe('Fluid Typography Integration', () => {
    it('should apply fluid typography to elements', async () => {
      await proteus.initialize();

      const heading = container.querySelector('.test-heading') as HTMLElement;
      proteus.typography.applyFluidScaling(heading, {
        minSize: 24,
        maxSize: 48
      });

      const computedStyle = window.getComputedStyle(heading);
      expect(computedStyle.fontSize).toContain('clamp');
    });

    it('should respect accessibility constraints', async () => {
      await proteus.initialize();

      const paragraph = container.querySelector('.test-paragraph') as HTMLElement;
      proteus.typography.applyFluidScaling(paragraph, {
        minSize: 12, // Below minimum
        maxSize: 18
      });

      const computedStyle = window.getComputedStyle(paragraph);
      const fontSize = parseFloat(computedStyle.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(16); // Should be enforced to minimum
    });

    it('should generate typographic scales', async () => {
      await proteus.initialize();

      const scale = proteus.typography.generateTypographicScale({
        baseSize: 16,
        ratio: 1.25,
        steps: 5
      });

      expect(scale).toHaveLength(5);
      expect(scale[0]).toBe(16);
      expect(scale[1]).toBeCloseTo(20);
      expect(scale[4]).toBeCloseTo(39.06);
    });
  });

  describe('Container Queries Integration', () => {
    it('should register and evaluate container queries', async () => {
      await proteus.initialize();

      const card = container.querySelector('.test-card') as HTMLElement;
      proteus.containers.registerContainer(card, {
        'small': '(max-width: 200px)',
        'medium': '(min-width: 201px) and (max-width: 400px)',
        'large': '(min-width: 401px)'
      });

      // Simulate container resize
      card.style.width = '150px';
      proteus.containers.updateContainer(card);

      expect(card.getAttribute('data-container')).toBe('small');
    });

    it('should apply responsive classes based on container size', async () => {
      await proteus.initialize();

      const card = container.querySelector('.test-card') as HTMLElement;
      proteus.containers.registerContainer(card, {
        'compact': '(max-width: 250px)',
        'expanded': '(min-width: 251px)'
      });

      // Test compact size
      card.style.width = '200px';
      proteus.containers.updateContainer(card);
      expect(card.getAttribute('data-container')).toBe('compact');

      // Test expanded size
      card.style.width = '400px';
      proteus.containers.updateContainer(card);
      expect(card.getAttribute('data-container')).toBe('expanded');
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should monitor performance metrics', async () => {
      await proteus.initialize();

      proteus.performance.startMonitoring();

      // Simulate some operations
      for (let i = 0; i < 10; i++) {
        proteus.typography.applyFluidScaling(
          container.querySelector('.test-heading') as HTMLElement,
          { minSize: 20 + i, maxSize: 40 + i }
        );
      }

      const metrics = proteus.performance.getMetrics();
      expect(metrics.operationsPerSecond).toBeGreaterThan(0);
      expect(metrics.averageFPS).toBeGreaterThan(0);
    });

    it('should detect performance bottlenecks', async () => {
      await proteus.initialize();

      proteus.performance.startMonitoring();

      // Create performance bottleneck
      const heavyOperation = () => {
        for (let i = 0; i < 100000; i++) {
          document.createElement('div');
        }
      };

      heavyOperation();

      const report = proteus.performance.generatePerformanceReport();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Accessibility Integration', () => {
    it('should validate WCAG compliance', async () => {
      await proteus.initialize();

      const report = proteus.accessibility.generateComplianceReport();
      
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.level).toBe('AA');
      expect(Array.isArray(report.violations)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should detect accessibility violations', async () => {
      await proteus.initialize();

      // Create accessibility violation
      const badImage = document.createElement('img');
      badImage.src = 'test.jpg';
      // No alt attribute - should be flagged
      container.appendChild(badImage);

      const report = proteus.accessibility.generateComplianceReport();
      const imageViolations = report.violations.filter(v => 
        v.type === 'text-alternatives' && v.element === badImage
      );
      
      expect(imageViolations.length).toBeGreaterThan(0);
    });

    it('should auto-fix common issues', async () => {
      await proteus.initialize();

      // Create fixable issue
      const input = container.querySelector('input') as HTMLInputElement;
      input.removeAttribute('placeholder');
      input.setAttribute('aria-label', ''); // Empty label

      proteus.accessibility.autoFixIssues();

      // Should have been fixed
      expect(input.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Cross-System Integration', () => {
    it('should coordinate between typography and accessibility', async () => {
      await proteus.initialize();

      const heading = container.querySelector('.test-heading') as HTMLElement;
      
      // Apply fluid typography
      proteus.typography.applyFluidScaling(heading, {
        minSize: 20,
        maxSize: 40
      });

      // Check accessibility compliance
      const report = proteus.accessibility.generateComplianceReport();
      const contrastViolations = report.violations.filter(v => 
        v.type === 'color-contrast' && v.element === heading
      );

      // Should not have contrast violations for properly sized text
      expect(contrastViolations.length).toBe(0);
    });

    it('should coordinate between containers and performance', async () => {
      await proteus.initialize();

      const card = container.querySelector('.test-card') as HTMLElement;
      
      // Register container with performance monitoring
      proteus.performance.startMonitoring();
      proteus.containers.registerContainer(card, {
        'small': '(max-width: 300px)',
        'large': '(min-width: 301px)'
      });

      // Simulate multiple updates
      for (let i = 0; i < 50; i++) {
        card.style.width = `${200 + i * 2}px`;
        proteus.containers.updateContainer(card);
      }

      const metrics = proteus.performance.getMetrics();
      expect(metrics.operationsPerSecond).toBeGreaterThan(0);
    });

    it('should handle browser compatibility gracefully', async () => {
      await proteus.initialize();

      const compatibility = proteus.compatibility.getCompatibilityReport();
      
      // Should work regardless of browser support
      expect(compatibility.browser.supported).toBeDefined();
      
      // Should provide fallbacks for unsupported features
      if (!compatibility.features.containerQueries) {
        expect(compatibility.polyfills.some(p => p.name.includes('container'))).toBe(true);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid configurations gracefully', async () => {
      const invalidProteus = new ProteusJS({
        fluidTypography: {
          minViewport: -100, // Invalid
          maxViewport: 50    // Invalid (less than min)
        }
      });

      // Should not throw
      expect(async () => {
        await invalidProteus.initialize();
      }).not.toThrow();

      invalidProteus.destroy();
    });

    it('should recover from DOM manipulation errors', async () => {
      await proteus.initialize();

      // Remove element while ProteusJS is using it
      const heading = container.querySelector('.test-heading') as HTMLElement;
      proteus.typography.applyFluidScaling(heading, {
        minSize: 20,
        maxSize: 40
      });

      heading.remove();

      // Should not throw when trying to update removed element
      expect(() => {
        proteus.typography.applyFluidScaling(heading, {
          minSize: 24,
          maxSize: 48
        });
      }).not.toThrow();
    });

    it('should handle missing dependencies gracefully', async () => {
      // Mock missing browser APIs
      const originalResizeObserver = window.ResizeObserver;
      delete (window as any).ResizeObserver;

      await proteus.initialize();

      // Should still work with fallbacks
      const card = container.querySelector('.test-card') as HTMLElement;
      expect(() => {
        proteus.containers.registerContainer(card, {
          'small': '(max-width: 300px)'
        });
      }).not.toThrow();

      // Restore
      (window as any).ResizeObserver = originalResizeObserver;
    });
  });

  describe('Performance Under Load', () => {
    it('should handle many elements efficiently', async () => {
      await proteus.initialize();

      // Create many elements
      const elements: HTMLElement[] = [];
      for (let i = 0; i < 100; i++) {
        const element = document.createElement('div');
        element.textContent = `Element ${i}`;
        container.appendChild(element);
        elements.push(element);
      }

      proteus.performance.startMonitoring();
      const startTime = performance.now();

      // Apply fluid typography to all elements
      elements.forEach((element, index) => {
        proteus.typography.applyFluidScaling(element, {
          minSize: 14 + (index % 4),
          maxSize: 20 + (index % 4)
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);

      const metrics = proteus.performance.getMetrics();
      expect(metrics.averageFPS).toBeGreaterThan(30); // Should maintain good FPS
    });
  });
});
