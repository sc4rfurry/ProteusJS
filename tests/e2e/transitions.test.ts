/**
 * E2E Tests for ProteusJS View Transitions Module
 */

import { test, expect, ProteusTestUtils } from './setup';

test.describe('View Transitions Module', () => {
  let utils: ProteusTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new ProteusTestUtils(page);
    
    await utils.createTestHTML(`
      <h1>View Transitions Test</h1>
      <div id="content" class="content">
        <p>Initial content</p>
      </div>
      <button id="transition-btn">Trigger Transition</button>
      <button id="theme-btn">Toggle Theme</button>
      <div id="status" class="status"></div>
    `);

    await utils.loadModule('transitions');
    await utils.waitForModule('transitions');
  });

  test('should load transitions module successfully', async ({ page }) => {
    const moduleLoaded = await page.evaluate(() => {
      return window.proteusModules && window.proteusModules.transitions;
    });
    
    expect(moduleLoaded).toBeTruthy();
  });

  test('should detect native View Transitions API support', async ({ page }) => {
    const hasNativeSupport = await utils.checkFeatureSupport('viewTransitions');
    const moduleSupport = await page.evaluate(() => {
      return window.proteusModules.transitions.hasNativeSupport?.() || false;
    });
    
    expect(typeof hasNativeSupport).toBe('boolean');
    expect(typeof moduleSupport).toBe('boolean');
  });

  test('should execute basic transition', async ({ page }) => {
    await utils.clearTestLogs();
    
    const transitionResult = await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      let executed = false;
      const result = await transition(() => {
        document.getElementById('content').textContent = 'Updated content';
        executed = true;
      });
      
      return { executed, result: !!result };
    });
    
    expect(transitionResult.executed).toBe(true);
    expect(transitionResult.result).toBe(true);
    
    const contentText = await page.textContent('#content');
    expect(contentText).toBe('Updated content');
  });

  test('should handle transition with custom name', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      return await transition(() => {
        document.body.classList.toggle('dark-theme');
      }, { name: 'theme-change' });
    });
    
    expect(result).toBeTruthy();
    
    const hasDarkTheme = await page.evaluate(() => {
      return document.body.classList.contains('dark-theme');
    });
    
    expect(hasDarkTheme).toBe(true);
  });

  test('should handle transition errors gracefully', async ({ page }) => {
    await utils.clearTestLogs();
    
    const result = await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      try {
        await transition(() => {
          throw new Error('Test error');
        });
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    // Should handle errors gracefully
    expect(result.success).toBe(false);
    expect(result.error).toContain('Test error');
  });

  test('should work with DOM mutations', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      const initialCount = document.querySelectorAll('p').length;
      
      await transition(() => {
        const newP = document.createElement('p');
        newP.textContent = 'New paragraph';
        document.getElementById('content').appendChild(newP);
      });
      
      const finalCount = document.querySelectorAll('p').length;
      
      return { initialCount, finalCount };
    });
    
    expect(result.finalCount).toBe(result.initialCount + 1);
  });

  test('should handle multiple rapid transitions', async ({ page }) => {
    const results = await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      const results = [];
      
      // Fire multiple transitions rapidly
      for (let i = 0; i < 3; i++) {
        const result = await transition(() => {
          document.getElementById('status').textContent = `Transition ${i + 1}`;
        });
        results.push(!!result);
      }
      
      return results;
    });
    
    expect(results).toHaveLength(3);
    results.forEach(result => expect(result).toBe(true));
    
    const finalStatus = await page.textContent('#status');
    expect(finalStatus).toBe('Transition 3');
  });

  test('should work with CSS class changes', async ({ page }) => {
    await page.addStyleTag({
      content: `
        .content { background: white; transition: background 0.3s; }
        .content.highlighted { background: yellow; }
      `
    });
    
    const result = await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      const element = document.getElementById('content');
      const initialClasses = element.className;
      
      await transition(() => {
        element.classList.add('highlighted');
      });
      
      const finalClasses = element.className;
      
      return { initialClasses, finalClasses };
    });
    
    expect(result.finalClasses).toContain('highlighted');
    expect(result.initialClasses).not.toContain('highlighted');
  });

  test('should maintain accessibility during transitions', async ({ page }) => {
    await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      // Add ARIA live region
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.id = 'live-region';
      document.body.appendChild(liveRegion);
      
      await transition(() => {
        liveRegion.textContent = 'Content updated';
      });
    });
    
    const liveRegionText = await page.textContent('#live-region');
    expect(liveRegionText).toBe('Content updated');
    
    const ariaLive = await page.getAttribute('#live-region', 'aria-live');
    expect(ariaLive).toBe('polite');
  });

  test('should handle fallback when native API unavailable', async ({ page }) => {
    // Mock absence of native API
    await page.evaluate(() => {
      delete document.startViewTransition;
    });
    
    const result = await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      let callbackExecuted = false;
      await transition(() => {
        callbackExecuted = true;
        document.getElementById('content').textContent = 'Fallback content';
      });
      
      return callbackExecuted;
    });
    
    expect(result).toBe(true);
    
    const contentText = await page.textContent('#content');
    expect(contentText).toBe('Fallback content');
  });

  test('should measure transition performance', async ({ page }) => {
    const performanceData = await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      const startTime = performance.now();
      
      await transition(() => {
        // Simulate some work
        for (let i = 0; i < 1000; i++) {
          document.getElementById('content').style.opacity = Math.random().toString();
        }
        document.getElementById('content').style.opacity = '1';
      });
      
      const endTime = performance.now();
      
      return {
        duration: endTime - startTime,
        timestamp: Date.now()
      };
    });
    
    expect(performanceData.duration).toBeGreaterThan(0);
    expect(performanceData.duration).toBeLessThan(1000); // Should complete within 1 second
    expect(performanceData.timestamp).toBeGreaterThan(0);
  });

  test('should not interfere with existing page styles', async ({ page }) => {
    await page.addStyleTag({
      content: `
        body { font-family: 'Test Font', sans-serif; }
        .content { color: red; }
      `
    });
    
    const initialStyles = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      const content = window.getComputedStyle(document.getElementById('content'));
      
      return {
        bodyFont: body.fontFamily,
        contentColor: content.color
      };
    });
    
    await page.evaluate(async () => {
      const { transition } = window.proteusModules.transitions;
      
      await transition(() => {
        document.getElementById('content').textContent = 'Style test';
      });
    });
    
    const finalStyles = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      const content = window.getComputedStyle(document.getElementById('content'));
      
      return {
        bodyFont: body.fontFamily,
        contentColor: content.color
      };
    });
    
    expect(finalStyles.bodyFont).toBe(initialStyles.bodyFont);
    expect(finalStyles.contentColor).toBe(initialStyles.contentColor);
  });
});
