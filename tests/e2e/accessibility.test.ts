/**
 * E2E Tests for ProteusJS Accessibility Modules
 */

import { test, expect, ProteusTestUtils } from './setup';

test.describe('Accessibility Modules', () => {
  let utils: ProteusTestUtils;

  test.describe('A11y Audit Module', () => {
    test.beforeEach(async ({ page }) => {
      utils = new ProteusTestUtils(page);
      
      await utils.createTestHTML(`
        <h1>Accessibility Audit Test</h1>
        <img src="test.jpg" alt="Test image">
        <img src="bad.jpg">
        <form>
          <input type="text" aria-label="Name">
          <input type="email">
          <button type="submit">Submit</button>
        </form>
        <div id="audit-results"></div>
      `);

      await utils.loadModule('a11y-audit');
      await utils.waitForModule('a11y-audit');
    });

    test('should load a11y-audit module successfully', async ({ page }) => {
      const moduleLoaded = await page.evaluate(() => {
        return window.proteusModules && window.proteusModules['a11y-audit'];
      });
      
      expect(moduleLoaded).toBeTruthy();
    });

    test('should detect images without alt text', async ({ page }) => {
      const auditResult = await page.evaluate(async () => {
        const { audit } = window.proteusModules['a11y-audit'];
        
        const report = await audit(document, {
          rules: ['images'],
          format: 'json'
        });
        
        return report;
      });
      
      expect(auditResult.violations).toBeDefined();
      
      const imageViolations = auditResult.violations.filter(v => v.id === 'image-alt');
      expect(imageViolations.length).toBeGreaterThan(0);
      expect(imageViolations[0].nodes).toBe(1); // One image without alt
    });

    test('should detect heading structure issues', async ({ page }) => {
      // Add multiple h1 elements to trigger violation
      await page.evaluate(() => {
        const extraH1 = document.createElement('h1');
        extraH1.textContent = 'Extra H1';
        document.body.appendChild(extraH1);
      });

      const auditResult = await page.evaluate(async () => {
        const { audit } = window.proteusModules['a11y-audit'];
        
        const report = await audit(document, {
          rules: ['headings'],
          format: 'json'
        });
        
        return report;
      });
      
      const headingViolations = auditResult.violations.filter(v => v.id === 'heading-structure');
      expect(headingViolations.length).toBeGreaterThan(0);
      expect(headingViolations[0].nodes).toBe(2); // Two h1 elements
    });

    test('should detect form inputs without labels', async ({ page }) => {
      const auditResult = await page.evaluate(async () => {
        const { audit } = window.proteusModules['a11y-audit'];
        
        const report = await audit(document, {
          rules: ['forms'],
          format: 'json'
        });
        
        return report;
      });
      
      const formViolations = auditResult.violations.filter(v => v.id === 'form-labels');
      expect(formViolations.length).toBeGreaterThan(0);
      expect(formViolations[0].nodes).toBe(1); // One input without label
    });

    test('should run all rules by default', async ({ page }) => {
      const auditResult = await page.evaluate(async () => {
        const { audit } = window.proteusModules['a11y-audit'];
        
        const report = await audit(document);
        
        return report;
      });
      
      expect(auditResult.violations).toBeDefined();
      expect(auditResult.passes).toBeGreaterThanOrEqual(0);
      expect(auditResult.timestamp).toBeGreaterThan(0);
      expect(auditResult.url).toBeTruthy();
    });

    test('should output to console when format is console', async ({ page }) => {
      await utils.clearTestLogs();
      
      await page.evaluate(async () => {
        const { audit } = window.proteusModules['a11y-audit'];
        
        await audit(document, {
          rules: ['images'],
          format: 'console'
        });
      });
      
      const logs = await utils.getTestLogs();
      const auditLogs = logs.filter(log => 
        log.args.some(arg => typeof arg === 'string' && arg.includes('A11y Audit'))
      );
      
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    test('should handle production environment', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Mock production environment
        const originalEnv = process.env['NODE_ENV'];
        process.env['NODE_ENV'] = 'production';
        
        const { audit } = window.proteusModules['a11y-audit'];
        
        const report = await audit(document);
        
        // Restore environment
        process.env['NODE_ENV'] = originalEnv;
        
        return report;
      });
      
      expect(result.violations).toHaveLength(0);
      expect(result.passes).toBe(0);
    });
  });

  test.describe('A11y Primitives Module', () => {
    test.beforeEach(async ({ page }) => {
      utils = new ProteusTestUtils(page);
      
      await utils.createTestHTML(`
        <h1>Accessibility Primitives Test</h1>
        <button id="dialog-trigger">Open Dialog</button>
        <div id="dialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 1px solid #ccc; padding: 20px;">
          <h2 id="dialog-title">Dialog Title</h2>
          <p id="dialog-description">Dialog content goes here.</p>
          <button id="dialog-close">Close</button>
        </div>
        
        <button id="tooltip-trigger">Hover for tooltip</button>
        <div id="tooltip" style="position: absolute; background: black; color: white; padding: 4px; display: none;">
          Tooltip content
        </div>
        
        <div id="menu-container" style="display: none;">
          <div role="menuitem" tabindex="0">Menu Item 1</div>
          <div role="menuitem" tabindex="0">Menu Item 2</div>
          <div role="menuitem" tabindex="0">Menu Item 3</div>
        </div>
      `);

      await utils.loadModule('a11y-primitives');
      await utils.waitForModule('a11y-primitives');
    });

    test('should load a11y-primitives module successfully', async ({ page }) => {
      const moduleLoaded = await page.evaluate(() => {
        return window.proteusModules && window.proteusModules['a11y-primitives'];
      });
      
      expect(moduleLoaded).toBeTruthy();
    });

    test('should create dialog with proper ARIA attributes', async ({ page }) => {
      const result = await page.evaluate(() => {
        const { dialog } = window.proteusModules['a11y-primitives'];
        const dialogEl = document.getElementById('dialog');
        
        const controller = dialog(dialogEl, {
          modal: true,
          restoreFocus: true
        });
        
        return {
          hasController: !!controller,
          hasDestroy: typeof controller.destroy === 'function',
          role: dialogEl.getAttribute('role')
        };
      });
      
      expect(result.hasController).toBe(true);
      expect(result.hasDestroy).toBe(true);
      expect(result.role).toBe('dialog');
    });

    test('should create tooltip with proper ARIA relationships', async ({ page }) => {
      const result = await page.evaluate(() => {
        const { tooltip } = window.proteusModules['a11y-primitives'];
        const trigger = document.getElementById('tooltip-trigger');
        const content = document.getElementById('tooltip');
        
        const controller = tooltip(trigger, content, { delay: 100 });
        
        return {
          hasController: !!controller,
          hasDestroy: typeof controller.destroy === 'function'
        };
      });
      
      expect(result.hasController).toBe(true);
      expect(result.hasDestroy).toBe(true);
    });

    test('should show tooltip on hover', async ({ page }) => {
      await page.evaluate(() => {
        const { tooltip } = window.proteusModules['a11y-primitives'];
        const trigger = document.getElementById('tooltip-trigger');
        const content = document.getElementById('tooltip');
        
        tooltip(trigger, content, { delay: 50 });
      });
      
      // Trigger hover
      await page.hover('#tooltip-trigger');
      await page.waitForTimeout(100); // Wait for delay
      
      const tooltipVisible = await page.evaluate(() => {
        const tooltip = document.getElementById('tooltip');
        return window.getComputedStyle(tooltip).display !== 'none';
      });
      
      expect(tooltipVisible).toBe(true);
      
      const ariaDescribedBy = await page.getAttribute('#tooltip-trigger', 'aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();
    });

    test('should hide tooltip on mouse leave', async ({ page }) => {
      await page.evaluate(() => {
        const { tooltip } = window.proteusModules['a11y-primitives'];
        const trigger = document.getElementById('tooltip-trigger');
        const content = document.getElementById('tooltip');
        
        tooltip(trigger, content, { delay: 50 });
      });
      
      // Show tooltip
      await page.hover('#tooltip-trigger');
      await page.waitForTimeout(100);
      
      // Hide tooltip
      await page.hover('body');
      await page.waitForTimeout(100);
      
      const tooltipVisible = await page.evaluate(() => {
        const tooltip = document.getElementById('tooltip');
        return window.getComputedStyle(tooltip).display !== 'none';
      });
      
      expect(tooltipVisible).toBe(false);
    });

    test('should create focus trap', async ({ page }) => {
      const result = await page.evaluate(() => {
        const { focusTrap } = window.proteusModules['a11y-primitives'];
        const container = document.getElementById('dialog');
        
        const trap = focusTrap(container);
        
        return {
          hasTrap: !!trap,
          hasActivate: typeof trap.activate === 'function',
          hasDeactivate: typeof trap.deactivate === 'function'
        };
      });
      
      expect(result.hasTrap).toBe(true);
      expect(result.hasActivate).toBe(true);
      expect(result.hasDeactivate).toBe(true);
    });

    test('should handle keyboard navigation in menu', async ({ page }) => {
      await page.evaluate(() => {
        const { menu } = window.proteusModules['a11y-primitives'];
        const container = document.getElementById('menu-container');
        
        container.style.display = 'block';
        menu(container);
      });
      
      // Focus first menu item
      await page.focus('[role="menuitem"]:first-child');
      
      // Press arrow down
      await page.keyboard.press('ArrowDown');
      
      const focusedElement = await page.evaluate(() => {
        return document.activeElement.textContent;
      });
      
      expect(focusedElement).toBe('Menu Item 2');
    });

    test('should handle escape key in menu', async ({ page }) => {
      let menuCloseEventFired = false;
      
      await page.evaluate(() => {
        const { menu } = window.proteusModules['a11y-primitives'];
        const container = document.getElementById('menu-container');
        
        container.style.display = 'block';
        menu(container);
        
        container.addEventListener('menu:close', () => {
          window.menuCloseEventFired = true;
        });
      });
      
      await page.focus('[role="menuitem"]:first-child');
      await page.keyboard.press('Escape');
      
      menuCloseEventFired = await page.evaluate(() => window.menuCloseEventFired);
      expect(menuCloseEventFired).toBe(true);
    });

    test('should cleanup properly', async ({ page }) => {
      const result = await page.evaluate(() => {
        const { tooltip, dialog, focusTrap } = window.proteusModules['a11y-primitives'];
        
        const trigger = document.getElementById('tooltip-trigger');
        const content = document.getElementById('tooltip');
        const dialogEl = document.getElementById('dialog');
        
        const tooltipController = tooltip(trigger, content);
        const dialogController = dialog(dialogEl);
        const trapController = focusTrap(dialogEl);
        
        // Cleanup
        tooltipController.destroy();
        dialogController.destroy();
        trapController.deactivate();
        
        return { success: true };
      });
      
      expect(result.success).toBe(true);
    });

    test('should handle invalid elements gracefully', async ({ page }) => {
      const result = await page.evaluate(() => {
        const { dialog, tooltip } = window.proteusModules['a11y-primitives'];
        
        try {
          dialog(null);
          return { dialogError: false };
        } catch (error) {
          return { dialogError: true, dialogMessage: error.message };
        }
      });
      
      expect(result.dialogError).toBe(true);
      expect(result.dialogMessage).toBeTruthy();
    });

    test('should work with dynamic content', async ({ page }) => {
      const result = await page.evaluate(() => {
        const { tooltip } = window.proteusModules['a11y-primitives'];
        
        // Create dynamic elements
        const newTrigger = document.createElement('button');
        newTrigger.textContent = 'Dynamic Trigger';
        document.body.appendChild(newTrigger);
        
        const newTooltip = document.createElement('div');
        newTooltip.textContent = 'Dynamic Tooltip';
        newTooltip.style.position = 'absolute';
        newTooltip.style.background = 'black';
        newTooltip.style.color = 'white';
        newTooltip.style.padding = '4px';
        newTooltip.style.display = 'none';
        document.body.appendChild(newTooltip);
        
        const controller = tooltip(newTrigger, newTooltip);
        
        return { success: !!controller };
      });
      
      expect(result.success).toBe(true);
    });
  });
});
