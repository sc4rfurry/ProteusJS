/**
 * MVP Integration Test Suite
 * Comprehensive tests for all MVP features working together
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmartContainers } from '../containers/SmartContainers';
import { ContainerBreakpoints } from '../containers/ContainerBreakpoints';
import { FluidTypography } from '../typography/FluidTypography';
import { LineHeightOptimization } from '../typography/LineHeightOptimization';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';
import { AdaptiveGrid } from '../layout/AdaptiveGrid';

// Mock browser APIs
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(() => callback(performance.now()), 16);
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024
  },
  configurable: true
});

describe('MVP Integration Tests', () => {
  let smartContainers: SmartContainers;
  let containerBreakpoints: ContainerBreakpoints;
  let fluidTypography: FluidTypography;
  let lineHeightOptimization: LineHeightOptimization;
  let performanceMonitor: PerformanceMonitor;
  let testContainer: HTMLElement;
  let testContent: HTMLElement;

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Create test structure
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    testContainer.style.width = '600px';
    testContainer.style.height = '400px';
    testContainer.style.display = 'grid';
    
    testContent = document.createElement('div');
    testContent.innerHTML = `
      <h1>Test Heading</h1>
      <p>This is a test paragraph with some content to demonstrate the MVP functionality.</p>
      <div class="grid-item">Item 1</div>
      <div class="grid-item">Item 2</div>
      <div class="grid-item">Item 3</div>
    `;
    
    testContainer.appendChild(testContent);
    document.body.appendChild(testContainer);

    // Initialize all systems
    smartContainers = new SmartContainers();
    containerBreakpoints = new ContainerBreakpoints();
    fluidTypography = new FluidTypography();
    lineHeightOptimization = new LineHeightOptimization();
    performanceMonitor = new PerformanceMonitor();

    // Mock getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      display: 'grid'
    } as CSSStyleDeclaration);

    // Mock getBoundingClientRect
    vi.spyOn(testContainer, 'getBoundingClientRect').mockReturnValue({
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

  afterEach(() => {
    smartContainers.destroy();
    containerBreakpoints.destroy();
    fluidTypography.destroy();
    lineHeightOptimization.destroy();
    performanceMonitor.stop();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Complete MVP Workflow', () => {
    it('should initialize all systems without errors', () => {
      expect(() => {
        smartContainers.startMonitoring();
        performanceMonitor.start();
      }).not.toThrow();
    });

    it('should detect containers and apply breakpoints', async () => {
      // Start monitoring
      smartContainers.startMonitoring();
      
      // Detect containers
      const containers = await smartContainers.detectContainers();
      
      expect(containers.length).toBeGreaterThan(0);
      
      // Find our test container
      const testContainerInfo = containers.find(c => c.element === testContainer);
      expect(testContainerInfo).toBeDefined();
      expect(testContainerInfo?.type).toBe('grid');
      
      // Register breakpoints
      const breakpointId = containerBreakpoints.register(testContainer, {
        sm: '400px',
        md: '600px',
        lg: '800px'
      });
      
      expect(breakpointId).toBeTruthy();
      
      // Check current breakpoint
      const currentBreakpoint = containerBreakpoints.getCurrentBreakpoint(breakpointId);
      expect(currentBreakpoint).toBe('md'); // 600px width
    });

    it('should apply fluid typography with accessibility compliance', () => {
      const heading = testContent.querySelector('h1') as HTMLElement;
      const paragraph = testContent.querySelector('p') as HTMLElement;
      
      // Apply fluid typography
      fluidTypography.applyFluidScaling(heading, {
        minSize: 18,
        maxSize: 32,
        accessibility: 'AA',
        enforceAccessibility: true
      });
      
      fluidTypography.applyFluidScaling(paragraph, {
        minSize: 14,
        maxSize: 18,
        accessibility: 'AA',
        enforceAccessibility: true
      });
      
      // Check that typography was applied
      expect(heading.style.fontSize).toContain('clamp(');
      expect(paragraph.style.fontSize).toContain('clamp(');
      
      // Check accessibility compliance
      expect(heading.getAttribute('data-proteus-min-size')).toBe('18'); // Should meet WCAG AA
      expect(paragraph.getAttribute('data-proteus-min-size')).toBe('14'); // Should meet WCAG AA
    });

    it('should optimize line heights intelligently', () => {
      const heading = testContent.querySelector('h1') as HTMLElement;
      const paragraph = testContent.querySelector('p') as HTMLElement;
      
      // Optimize line heights
      const headingResult = lineHeightOptimization.optimizeLineHeight(heading, {
        contentType: 'heading',
        accessibility: 'AA',
        enforceAccessibility: true
      });
      
      const paragraphResult = lineHeightOptimization.optimizeLineHeight(paragraph, {
        contentType: 'body',
        accessibility: 'AA',
        enforceAccessibility: true
      });
      
      // Check that line heights were applied
      expect(heading.style.lineHeight).toBeTruthy();
      expect(paragraph.style.lineHeight).toBeTruthy();
      
      // Check accessibility compliance
      expect(headingResult.accessibilityCompliant).toBe(true);
      expect(paragraphResult.accessibilityCompliant).toBe(true);
      
      // Headings should have tighter line height than body text
      expect(headingResult.lineHeight).toBeLessThan(paragraphResult.lineHeight);
    });

    it('should monitor performance and provide metrics', async () => {
      performanceMonitor.start();
      
      // Simulate some operations
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordOperation();
      }
      
      // Update metrics
      performanceMonitor.updateMetrics();
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.frameRate).toBeGreaterThan(0);
      expect(metrics.memoryUsage.used).toBeGreaterThan(0);
      expect(metrics.domNodes).toBeGreaterThan(0);
      expect(metrics.operationsPerSecond).toBeGreaterThanOrEqual(0);
    });

    it('should handle container resize and update all systems', () => {
      const breakpointCallback = vi.fn();
      
      // Set up systems
      const breakpointId = containerBreakpoints.register(testContainer, {
        sm: '400px',
        md: '600px',
        lg: '800px'
      }, breakpointCallback);
      
      const heading = testContent.querySelector('h1') as HTMLElement;
      fluidTypography.applyContainerBasedScaling(heading, {
        minSize: 18,
        maxSize: 32,
        containerElement: testContainer,
        minContainerWidth: 300,
        maxContainerWidth: 900
      });
      
      // Simulate container resize
      vi.spyOn(testContainer, 'getBoundingClientRect').mockReturnValue({
        width: 800,
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);
      
      // Update systems
      containerBreakpoints.updateElement(testContainer);
      smartContainers.updateContainer(testContainer);
      
      // Check that breakpoint changed
      const newBreakpoint = containerBreakpoints.getCurrentBreakpoint(breakpointId);
      expect(newBreakpoint).toBe('lg'); // 800px width
      
      // Check that callback was called
      expect(breakpointCallback).toHaveBeenCalled();
    });

    it('should provide performance recommendations', () => {
      performanceMonitor.start();
      
      // Simulate poor performance
      performanceMonitor['metrics'].frameRate = 30; // Below target
      performanceMonitor['metrics'].memoryUsage.percentage = 90; // High memory
      performanceMonitor['metrics'].domNodes = 6000; // Many nodes
      
      const recommendations = performanceMonitor.getRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('DOM manipulations'))).toBe(true);
      expect(recommendations.some(r => r.includes('Memory usage'))).toBe(true);
      expect(recommendations.some(r => r.includes('DOM tree'))).toBe(true);
    });

    it('should handle errors gracefully across all systems', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test error handling in each system
      expect(() => {
        fluidTypography.applyFluidScaling(null as any, {} as any);
      }).not.toThrow();
      
      expect(() => {
        lineHeightOptimization.optimizeLineHeight(null as any, {} as any);
      }).not.toThrow();
      
      expect(() => {
        containerBreakpoints.register(null as any, {} as any);
      }).not.toThrow();
      
      // Should have logged errors but not thrown
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should clean up resources properly', () => {
      // Start all systems
      smartContainers.startMonitoring();
      performanceMonitor.start();
      
      const heading = testContent.querySelector('h1') as HTMLElement;
      fluidTypography.applyFluidScaling(heading, { minSize: 16, maxSize: 24 });
      lineHeightOptimization.optimizeLineHeight(heading);
      
      const breakpointId = containerBreakpoints.register(testContainer, { md: '600px' });
      
      // Clean up
      expect(() => {
        smartContainers.destroy();
        containerBreakpoints.destroy();
        fluidTypography.destroy();
        lineHeightOptimization.destroy();
        performanceMonitor.stop();
      }).not.toThrow();
      
      // Check that resources were cleaned up
      expect(smartContainers.getMetrics().activeContainers).toBe(0);
      expect(containerBreakpoints.getMetrics().totalRegistrations).toBe(0);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle a complete e-commerce product grid', async () => {
      // Create a product grid structure
      const productGrid = document.createElement('div');
      productGrid.className = 'product-grid';
      productGrid.style.width = '800px';
      productGrid.style.display = 'grid';
      
      // Add product items
      for (let i = 0; i < 12; i++) {
        const product = document.createElement('div');
        product.className = 'product-item';
        product.innerHTML = `
          <h3>Product ${i + 1}</h3>
          <p>Product description that should scale with container size.</p>
          <span class="price">$${(i + 1) * 10}</span>
        `;
        productGrid.appendChild(product);
      }
      
      document.body.appendChild(productGrid);
      
      // Apply ProteusJS features
      const containers = await smartContainers.detectContainers();
      const gridContainer = containers.find(c => c.element === productGrid);
      expect(gridContainer).toBeDefined();
      
      // Set up responsive breakpoints
      containerBreakpoints.register(productGrid, {
        mobile: '320px',
        tablet: '768px',
        desktop: '1024px'
      });
      
      // Apply typography to all products
      const headings = productGrid.querySelectorAll('h3');
      const descriptions = productGrid.querySelectorAll('p');
      
      headings.forEach(heading => {
        fluidTypography.applyFluidScaling(heading as HTMLElement, {
          minSize: 16,
          maxSize: 20,
          accessibility: 'AA'
        });
      });
      
      descriptions.forEach(desc => {
        fluidTypography.applyFluidScaling(desc as HTMLElement, {
          minSize: 14,
          maxSize: 16,
          accessibility: 'AA'
        });
      });
      
      // Create adaptive grid
      const grid = new AdaptiveGrid(productGrid, {
        minColumnWidth: 200,
        maxColumns: 4,
        gap: 16,
        responsive: true
      });
      
      grid.activate();
      
      // Verify everything is working
      expect(productGrid.style.display).toBe('grid');
      expect(headings[0].style.fontSize).toContain('clamp(');
      expect(descriptions[0].style.fontSize).toContain('clamp(');
    });

    it('should handle responsive dashboard layout', async () => {
      // Create dashboard structure
      const dashboard = document.createElement('div');
      dashboard.className = 'dashboard';
      dashboard.style.width = '1200px';
      dashboard.style.display = 'grid';
      
      const sidebar = document.createElement('aside');
      sidebar.className = 'sidebar';
      sidebar.innerHTML = '<h2>Navigation</h2><nav>Menu items</nav>';
      
      const main = document.createElement('main');
      main.className = 'main-content';
      main.innerHTML = `
        <h1>Dashboard Title</h1>
        <div class="metrics">
          <div class="metric-card">
            <h3>Revenue</h3>
            <p class="metric-value">$125,000</p>
          </div>
          <div class="metric-card">
            <h3>Users</h3>
            <p class="metric-value">1,250</p>
          </div>
        </div>
      `;
      
      dashboard.appendChild(sidebar);
      dashboard.appendChild(main);
      document.body.appendChild(dashboard);
      
      // Apply ProteusJS features
      const containers = await smartContainers.detectContainers();
      expect(containers.length).toBeGreaterThan(0);
      
      // Set up breakpoints for responsive behavior
      containerBreakpoints.register(dashboard, {
        mobile: '768px',
        desktop: '1024px'
      }, (breakpoint) => {
        if (breakpoint === 'mobile') {
          dashboard.style.gridTemplateColumns = '1fr';
        } else {
          dashboard.style.gridTemplateColumns = '250px 1fr';
        }
      });
      
      // Apply typography optimization
      const title = main.querySelector('h1') as HTMLElement;
      const metricValues = main.querySelectorAll('.metric-value') as NodeListOf<HTMLElement>;
      
      fluidTypography.applyFluidScaling(title, {
        minSize: 24,
        maxSize: 36,
        accessibility: 'AA'
      });
      
      metricValues.forEach(value => {
        fluidTypography.applyFluidScaling(value, {
          minSize: 20,
          maxSize: 28,
          accessibility: 'AA'
        });
      });
      
      // Verify responsive behavior
      expect(dashboard.style.gridTemplateColumns).toBeTruthy();
      expect(title.style.fontSize).toContain('clamp(');
    });
  });

  describe('Performance Validation', () => {
    it('should maintain sub-60ms response times', async () => {
      performanceMonitor.start();
      
      const startTime = performance.now();
      
      // Perform typical operations
      await smartContainers.detectContainers();
      
      const heading = testContent.querySelector('h1') as HTMLElement;
      fluidTypography.applyFluidScaling(heading, { minSize: 16, maxSize: 24 });
      lineHeightOptimization.optimizeLineHeight(heading);
      
      containerBreakpoints.register(testContainer, { md: '600px' });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Should complete within performance target
      expect(responseTime).toBeLessThan(60); // 60ms target
    });

    it('should handle high-frequency updates efficiently', () => {
      performanceMonitor.start();
      
      const startTime = performance.now();
      
      // Simulate rapid container resizes
      for (let i = 0; i < 100; i++) {
        smartContainers.updateContainer(testContainer);
        containerBreakpoints.updateElement(testContainer);
        performanceMonitor.recordOperation();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle 100 updates efficiently
      expect(totalTime).toBeLessThan(100); // 1ms per operation average
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.operationsPerSecond).toBeGreaterThan(0);
    });
  });
});
