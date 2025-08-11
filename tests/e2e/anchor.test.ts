/**
 * E2E Tests for ProteusJS Anchor Positioning Module
 */

import { test, expect, ProteusTestUtils, TEST_DATA } from './setup';

test.describe('Anchor Positioning Module', () => {
  let utils: ProteusTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new ProteusTestUtils(page);
    
    await utils.createTestHTML(`
      <h1>Anchor Positioning Test</h1>
      <div style="padding: 100px;">
        <button id="anchor-btn" style="margin: 50px;">Anchor Button</button>
        <div id="tooltip" style="position: absolute; background: black; color: white; padding: 8px; border-radius: 4px; opacity: 0; pointer-events: none;">
          Tooltip content
        </div>
        <div id="dropdown" style="position: absolute; background: white; border: 1px solid #ccc; padding: 10px; display: none;">
          <div>Menu Item 1</div>
          <div>Menu Item 2</div>
        </div>
      </div>
      <div id="status"></div>
    `);

    await utils.loadModule('anchor');
    await utils.waitForModule('anchor');
  });

  test('should load anchor module successfully', async ({ page }) => {
    const moduleLoaded = await page.evaluate(() => {
      return window.proteusModules && window.proteusModules.anchor;
    });
    
    expect(moduleLoaded).toBeTruthy();
  });

  test('should detect native anchor positioning support', async ({ page }) => {
    const hasNativeSupport = await utils.checkFeatureSupport('anchorPositioning');
    
    expect(typeof hasNativeSupport).toBe('boolean');
  });

  test('should create tether controller', async ({ page }) => {
    const controller = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      const controller = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 8
      });
      
      return {
        hasUpdate: typeof controller.update === 'function',
        hasDestroy: typeof controller.destroy === 'function'
      };
    });
    
    expect(controller.hasUpdate).toBe(true);
    expect(controller.hasDestroy).toBe(true);
  });

  test('should position element relative to anchor', async ({ page }) => {
    const positions = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      const controller = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 8
      });
      
      controller.update();
      
      const anchorRect = anchor.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      return {
        anchor: { top: anchorRect.top, left: anchorRect.left, width: anchorRect.width, height: anchorRect.height },
        tooltip: { top: tooltipRect.top, left: tooltipRect.left, width: tooltipRect.width, height: tooltipRect.height }
      };
    });
    
    // Tooltip should be positioned above the anchor
    expect(positions.tooltip.top).toBeLessThan(positions.anchor.top);
    
    // Tooltip should be horizontally centered relative to anchor
    const anchorCenter = positions.anchor.left + positions.anchor.width / 2;
    const tooltipCenter = positions.tooltip.left + positions.tooltip.width / 2;
    expect(Math.abs(anchorCenter - tooltipCenter)).toBeLessThan(5); // Allow 5px tolerance
  });

  test('should handle different placements', async ({ page }) => {
    for (const placement of TEST_DATA.anchorPlacements) {
      const result = await page.evaluate((placement) => {
        const { tether } = window.proteusModules.anchor;
        const tooltip = document.getElementById('tooltip');
        const anchor = document.getElementById('anchor-btn');
        
        const controller = tether(tooltip, {
          anchor: anchor,
          placement: placement,
          offset: 8
        });
        
        controller.update();
        
        const anchorRect = anchor.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        return {
          placement,
          anchorRect: { top: anchorRect.top, left: anchorRect.left, bottom: anchorRect.bottom, right: anchorRect.right },
          tooltipRect: { top: tooltipRect.top, left: tooltipRect.left, bottom: tooltipRect.bottom, right: tooltipRect.right }
        };
      }, placement);
      
      // Verify positioning based on placement
      switch (placement) {
        case 'top':
          expect(result.tooltipRect.bottom).toBeLessThanOrEqual(result.anchorRect.top);
          break;
        case 'bottom':
          expect(result.tooltipRect.top).toBeGreaterThanOrEqual(result.anchorRect.bottom);
          break;
        case 'left':
          expect(result.tooltipRect.right).toBeLessThanOrEqual(result.anchorRect.left);
          break;
        case 'right':
          expect(result.tooltipRect.left).toBeGreaterThanOrEqual(result.anchorRect.right);
          break;
      }
    }
  });

  test('should update position when anchor moves', async ({ page }) => {
    const initialPosition = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      const controller = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 8
      });
      
      controller.update();
      
      return {
        top: tooltip.style.top,
        left: tooltip.style.left
      };
    });
    
    // Move the anchor
    await page.evaluate(() => {
      const anchor = document.getElementById('anchor-btn');
      anchor.style.marginLeft = '200px';
    });
    
    const updatedPosition = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      // Get existing controller (in real usage, you'd store the reference)
      const controller = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 8
      });
      
      controller.update();
      
      return {
        top: tooltip.style.top,
        left: tooltip.style.left
      };
    });
    
    expect(updatedPosition.left).not.toBe(initialPosition.left);
  });

  test('should handle offset correctly', async ({ page }) => {
    const positions = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      const controller1 = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 0
      });
      controller1.update();
      const pos1 = { top: parseFloat(tooltip.style.top), left: parseFloat(tooltip.style.left) };
      
      const controller2 = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 20
      });
      controller2.update();
      const pos2 = { top: parseFloat(tooltip.style.top), left: parseFloat(tooltip.style.left) };
      
      return { pos1, pos2 };
    });
    
    // With offset, tooltip should be further from anchor
    expect(positions.pos2.top).toBeLessThan(positions.pos1.top);
  });

  test('should work with scroll events', async ({ page }) => {
    // Add scrollable content
    await page.evaluate(() => {
      document.body.style.height = '2000px';
    });
    
    const initialPosition = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      const controller = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 8
      });
      
      controller.update();
      
      return tooltip.getBoundingClientRect().top;
    });
    
    // Scroll the page
    await page.evaluate(() => window.scrollTo(0, 100));
    
    const scrolledPosition = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      const controller = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 8
      });
      
      controller.update();
      
      return tooltip.getBoundingClientRect().top;
    });
    
    // Position should change with scroll
    expect(scrolledPosition).not.toBe(initialPosition);
  });

  test('should handle cleanup properly', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      const controller = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 8
      });
      
      controller.update();
      const positionedTop = tooltip.style.top;
      
      controller.destroy();
      
      return {
        hadPosition: !!positionedTop,
        destroySuccessful: true
      };
    });
    
    expect(result.hadPosition).toBe(true);
    expect(result.destroySuccessful).toBe(true);
  });

  test('should handle invalid anchor element', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      
      try {
        const controller = tether(tooltip, {
          anchor: null,
          placement: 'top',
          offset: 8
        });
        return { success: false, error: null };
      } catch (error) {
        return { success: true, error: error.message };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.error).toBeTruthy();
  });

  test('should work with dynamic content', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { tether } = window.proteusModules.anchor;
      
      // Create dynamic elements
      const newAnchor = document.createElement('button');
      newAnchor.textContent = 'Dynamic Anchor';
      newAnchor.style.margin = '20px';
      document.body.appendChild(newAnchor);
      
      const newTooltip = document.createElement('div');
      newTooltip.textContent = 'Dynamic Tooltip';
      newTooltip.style.position = 'absolute';
      newTooltip.style.background = 'blue';
      newTooltip.style.color = 'white';
      newTooltip.style.padding = '4px';
      document.body.appendChild(newTooltip);
      
      const controller = tether(newTooltip, {
        anchor: newAnchor,
        placement: 'bottom',
        offset: 5
      });
      
      controller.update();
      
      const positioned = !!(newTooltip.style.top && newTooltip.style.left);
      
      return { positioned };
    });
    
    expect(result.positioned).toBe(true);
  });

  test('should maintain performance with frequent updates', async ({ page }) => {
    const performanceData = await page.evaluate(async () => {
      const { tether } = window.proteusModules.anchor;
      const tooltip = document.getElementById('tooltip');
      const anchor = document.getElementById('anchor-btn');
      
      const controller = tether(tooltip, {
        anchor: anchor,
        placement: 'top',
        offset: 8
      });
      
      const startTime = performance.now();
      
      // Perform many updates
      for (let i = 0; i < 100; i++) {
        controller.update();
      }
      
      const endTime = performance.now();
      
      return {
        duration: endTime - startTime,
        updatesPerSecond: 100 / ((endTime - startTime) / 1000)
      };
    });
    
    expect(performanceData.duration).toBeLessThan(1000); // Should complete within 1 second
    expect(performanceData.updatesPerSecond).toBeGreaterThan(50); // Should handle at least 50 updates/second
  });
});
