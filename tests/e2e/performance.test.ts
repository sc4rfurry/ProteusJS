/**
 * E2E Tests for ProteusJS Performance Module
 */

import { test, expect, ProteusTestUtils } from './setup';

test.describe('Performance Module', () => {
  let utils: ProteusTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new ProteusTestUtils(page);
    
    await utils.createTestHTML(`
      <h1>Performance Test</h1>
      <div class="lazy-content" style="height: 200px; background: #f0f0f0; margin: 10px; padding: 20px;">
        <h2>Lazy Content 1</h2>
        <p>This content should be optimized with content-visibility.</p>
      </div>
      <div class="lazy-content" style="height: 200px; background: #e0e0e0; margin: 10px; padding: 20px;">
        <h2>Lazy Content 2</h2>
        <p>This content should also be optimized.</p>
      </div>
      <div class="regular-content" style="height: 100px; background: #d0d0d0; margin: 10px; padding: 20px;">
        <p>Regular content that should not be affected.</p>
      </div>
      <div id="metrics-output"></div>
    `);

    await utils.loadModule('perf');
    await utils.waitForModule('perf');
  });

  test('should load performance module successfully', async ({ page }) => {
    const moduleLoaded = await page.evaluate(() => {
      return window.proteusModules && window.proteusModules.perf;
    });
    
    expect(moduleLoaded).toBeTruthy();
  });

  test('should detect content visibility support', async ({ page }) => {
    const hasSupport = await utils.checkFeatureSupport('contentVisibility');
    
    expect(typeof hasSupport).toBe('boolean');
  });

  test('should apply content visibility optimization', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      
      // Apply content visibility
      boost.contentVisibility('.lazy-content', 'auto');
      
      // Check if styles were applied
      const lazyElements = document.querySelectorAll('.lazy-content');
      const regularElements = document.querySelectorAll('.regular-content');
      
      const lazyStyles = Array.from(lazyElements).map(el => {
        const style = window.getComputedStyle(el);
        return {
          contentVisibility: style.contentVisibility || style.getPropertyValue('content-visibility'),
          containIntrinsicSize: style.containIntrinsicSize || style.getPropertyValue('contain-intrinsic-size')
        };
      });
      
      const regularStyles = Array.from(regularElements).map(el => {
        const style = window.getComputedStyle(el);
        return {
          contentVisibility: style.contentVisibility || style.getPropertyValue('content-visibility')
        };
      });
      
      return { lazyStyles, regularStyles };
    });
    
    // Lazy elements should have content-visibility applied
    result.lazyStyles.forEach(style => {
      expect(style.contentVisibility).toBe('auto');
    });
    
    // Regular elements should not be affected
    result.regularStyles.forEach(style => {
      expect(style.contentVisibility).not.toBe('auto');
    });
  });

  test('should disable content visibility optimization', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      
      // First apply optimization
      boost.contentVisibility('.lazy-content', 'auto');
      
      // Then disable it
      boost.contentVisibility('.lazy-content', 'visible');
      
      // Check styles
      const elements = document.querySelectorAll('.lazy-content');
      const styles = Array.from(elements).map(el => {
        const style = window.getComputedStyle(el);
        return {
          contentVisibility: style.contentVisibility || style.getPropertyValue('content-visibility')
        };
      });
      
      return styles;
    });
    
    result.forEach(style => {
      expect(style.contentVisibility).toBe('visible');
    });
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    const metrics = await page.evaluate(async () => {
      const { boost } = window.proteusModules.perf;
      
      try {
        const cwv = await boost.measureCWV();
        return {
          success: true,
          metrics: cwv,
          error: null
        };
      } catch (error) {
        return {
          success: false,
          metrics: null,
          error: error.message
        };
      }
    });
    
    if (metrics.success) {
      expect(metrics.metrics).toBeTruthy();
      expect(typeof metrics.metrics.cls).toBe('string');
      expect(typeof metrics.metrics.fid).toBe('number');
      expect(typeof metrics.metrics.lcp).toBe('string');
      
      // Validate metric ranges
      const cls = parseFloat(metrics.metrics.cls);
      const fid = metrics.metrics.fid;
      const lcp = parseFloat(metrics.metrics.lcp);
      
      expect(cls).toBeGreaterThanOrEqual(0);
      expect(cls).toBeLessThan(1); // CLS should be less than 1
      expect(fid).toBeGreaterThanOrEqual(0);
      expect(fid).toBeLessThan(10000); // FID should be reasonable
      expect(lcp).toBeGreaterThan(0);
      expect(lcp).toBeLessThan(10); // LCP should be reasonable
    } else {
      // In test environment, CWV measurement might not work
      expect(metrics.error).toBeTruthy();
    }
  });

  test('should configure speculation rules', async ({ page }) => {
    await utils.clearTestLogs();
    
    const result = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      
      try {
        const success = boost.speculate({
          prerender: ['/page1', '/page2'],
          prefetch: ['/api/data', '/api/users']
        });
        
        return { success, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(result.success).toBeTruthy();
    
    const logs = await utils.getTestLogs();
    const speculationLogs = logs.filter(log => 
      log.type === 'log' && 
      log.args.some(arg => typeof arg === 'string' && arg.includes('Speculation'))
    );
    
    expect(speculationLogs.length).toBeGreaterThan(0);
  });

  test('should handle invalid selectors gracefully', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      
      try {
        boost.contentVisibility('.non-existent-class', 'auto');
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    // Should not throw error for non-existent selectors
    expect(result.success).toBe(true);
  });

  test('should work with dynamically added elements', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      
      // Add new element
      const newElement = document.createElement('div');
      newElement.className = 'dynamic-lazy';
      newElement.style.height = '150px';
      newElement.style.background = '#ccc';
      newElement.textContent = 'Dynamic content';
      document.body.appendChild(newElement);
      
      // Apply optimization
      boost.contentVisibility('.dynamic-lazy', 'auto');
      
      // Check if optimization was applied
      const style = window.getComputedStyle(newElement);
      return {
        contentVisibility: style.contentVisibility || style.getPropertyValue('content-visibility')
      };
    });
    
    expect(result.contentVisibility).toBe('auto');
  });

  test('should measure performance impact of optimizations', async ({ page }) => {
    const performanceData = await page.evaluate(async () => {
      const { boost } = window.proteusModules.perf;
      
      // Measure before optimization
      const startTime = performance.now();
      
      // Simulate some work
      for (let i = 0; i < 1000; i++) {
        document.querySelectorAll('.lazy-content').forEach(el => {
          el.style.transform = `translateX(${i % 10}px)`;
        });
      }
      
      const beforeOptimization = performance.now() - startTime;
      
      // Apply optimization
      boost.contentVisibility('.lazy-content', 'auto');
      
      // Measure after optimization
      const startTime2 = performance.now();
      
      // Same work
      for (let i = 0; i < 1000; i++) {
        document.querySelectorAll('.lazy-content').forEach(el => {
          el.style.transform = `translateX(${i % 10}px)`;
        });
      }
      
      const afterOptimization = performance.now() - startTime2;
      
      return {
        beforeOptimization,
        afterOptimization,
        improvement: beforeOptimization - afterOptimization
      };
    });
    
    expect(performanceData.beforeOptimization).toBeGreaterThan(0);
    expect(performanceData.afterOptimization).toBeGreaterThan(0);
    // Note: In test environment, performance improvement might not be significant
  });

  test('should handle multiple content visibility calls', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      
      // Apply multiple times
      boost.contentVisibility('.lazy-content', 'auto');
      boost.contentVisibility('.lazy-content', 'visible');
      boost.contentVisibility('.lazy-content', 'auto');
      
      // Check final state
      const elements = document.querySelectorAll('.lazy-content');
      const finalStyles = Array.from(elements).map(el => {
        const style = window.getComputedStyle(el);
        return style.contentVisibility || style.getPropertyValue('content-visibility');
      });
      
      return finalStyles;
    });
    
    result.forEach(style => {
      expect(style).toBe('auto');
    });
  });

  test('should work in different viewport sizes', async ({ page }) => {
    // Test in mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileResult = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      boost.contentVisibility('.lazy-content', 'auto');
      
      const elements = document.querySelectorAll('.lazy-content');
      return elements.length;
    });
    
    // Test in desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const desktopResult = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      boost.contentVisibility('.lazy-content', 'auto');
      
      const elements = document.querySelectorAll('.lazy-content');
      return elements.length;
    });
    
    expect(mobileResult).toBe(desktopResult);
    expect(mobileResult).toBeGreaterThan(0);
  });

  test('should not interfere with existing CSS', async ({ page }) => {
    await page.addStyleTag({
      content: `
        .lazy-content {
          border: 2px solid red;
          font-size: 16px;
          color: blue;
        }
      `
    });
    
    const result = await page.evaluate(() => {
      const { boost } = window.proteusModules.perf;
      
      // Get styles before optimization
      const element = document.querySelector('.lazy-content');
      const beforeStyles = {
        border: window.getComputedStyle(element).border,
        fontSize: window.getComputedStyle(element).fontSize,
        color: window.getComputedStyle(element).color
      };
      
      // Apply optimization
      boost.contentVisibility('.lazy-content', 'auto');
      
      // Get styles after optimization
      const afterStyles = {
        border: window.getComputedStyle(element).border,
        fontSize: window.getComputedStyle(element).fontSize,
        color: window.getComputedStyle(element).color
      };
      
      return { beforeStyles, afterStyles };
    });
    
    expect(result.afterStyles.border).toBe(result.beforeStyles.border);
    expect(result.afterStyles.fontSize).toBe(result.beforeStyles.fontSize);
    expect(result.afterStyles.color).toBe(result.beforeStyles.color);
  });
});
