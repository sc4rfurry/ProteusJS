/**
 * E2E Test Setup for ProteusJS
 * Comprehensive testing for all features and browser compatibility
 */

import { test as base, expect } from '@playwright/test';

// Extend base test with ProteusJS utilities
export const test = base.extend({
  // Auto-setup for ProteusJS testing
  page: async ({ page }, use) => {
    // Add ProteusJS to global scope for testing
    await page.addInitScript(() => {
      // Mock console methods for testing
      window.testLogs = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.log = (...args) => {
        window.testLogs.push({ type: 'log', args });
        originalLog(...args);
      };
      
      console.warn = (...args) => {
        window.testLogs.push({ type: 'warn', args });
        originalWarn(...args);
      };
      
      console.error = (...args) => {
        window.testLogs.push({ type: 'error', args });
        originalError(...args);
      };
    });

    await use(page);
  }
});

export { expect };

// Test utilities
export class ProteusTestUtils {
  constructor(private page: any) {}

  // Load ProteusJS modules
  async loadModule(moduleName: string) {
    return await this.page.evaluate(async (name) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import * as module from '/dist/modules/${name}.esm.js';
        window.proteusModules = window.proteusModules || {};
        window.proteusModules.${name} = module;
      `;
      document.head.appendChild(script);
      
      // Wait for module to load
      await new Promise(resolve => setTimeout(resolve, 100));
    }, moduleName);
  }

  // Check if browser supports feature
  async checkFeatureSupport(feature: string) {
    return await this.page.evaluate((featureName) => {
      switch (featureName) {
        case 'viewTransitions':
          return 'startViewTransition' in document;
        case 'anchorPositioning':
          return CSS.supports('anchor-name', '--test');
        case 'containerQueries':
          return CSS.supports('container-type', 'inline-size');
        case 'contentVisibility':
          return CSS.supports('content-visibility', 'auto');
        default:
          return false;
      }
    }, feature);
  }

  // Get console logs from test
  async getTestLogs() {
    return await this.page.evaluate(() => window.testLogs || []);
  }

  // Clear test logs
  async clearTestLogs() {
    await this.page.evaluate(() => {
      window.testLogs = [];
    });
  }

  // Wait for ProteusJS module to be available
  async waitForModule(moduleName: string, timeout = 5000) {
    await this.page.waitForFunction(
      (name) => window.proteusModules && window.proteusModules[name],
      moduleName,
      { timeout }
    );
  }

  // Create test HTML structure
  async createTestHTML(html: string) {
    await this.page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ProteusJS E2E Test</title>
        <style>
          body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
          .test-container { max-width: 800px; margin: 0 auto; }
          .hidden { display: none; }
          .visible { display: block; }
        </style>
      </head>
      <body>
        <div class="test-container">
          ${html}
        </div>
      </body>
      </html>
    `);
  }

  // Measure performance metrics
  async measurePerformance() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
  }

  // Check for accessibility violations
  async checkA11y() {
    return await this.page.evaluate(() => {
      const violations = [];
      
      // Check for images without alt text
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      if (imagesWithoutAlt.length > 0) {
        violations.push({
          rule: 'image-alt',
          count: imagesWithoutAlt.length,
          message: 'Images without alt text found'
        });
      }
      
      // Check for multiple h1 elements
      const h1Elements = document.querySelectorAll('h1');
      if (h1Elements.length !== 1) {
        violations.push({
          rule: 'heading-structure',
          count: h1Elements.length,
          message: `Expected 1 h1 element, found ${h1Elements.length}`
        });
      }
      
      // Check for form inputs without labels
      const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
      if (unlabeledInputs.length > 0) {
        violations.push({
          rule: 'form-labels',
          count: unlabeledInputs.length,
          message: 'Form inputs without labels found'
        });
      }
      
      return violations;
    });
  }

  // Simulate user interactions
  async simulateHover(selector: string) {
    await this.page.hover(selector);
    await this.page.waitForTimeout(100); // Allow for hover effects
  }

  async simulateKeyboard(key: string) {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(50);
  }

  // Check CSS property values
  async getCSSProperty(selector: string, property: string) {
    return await this.page.evaluate(
      ({ sel, prop }) => {
        const element = document.querySelector(sel);
        if (!element) return null;
        return window.getComputedStyle(element).getPropertyValue(prop);
      },
      { sel: selector, prop: property }
    );
  }

  // Wait for animation to complete
  async waitForAnimation(selector: string, timeout = 1000) {
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return true;
        
        const animations = element.getAnimations();
        return animations.length === 0 || animations.every(anim => anim.playState === 'finished');
      },
      selector,
      { timeout }
    );
  }

  // Check if element is visible in viewport
  async isInViewport(selector: string) {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    }, selector);
  }
}

// Browser compatibility test matrix
export const BROWSER_MATRIX = {
  chrome: {
    viewTransitions: true,
    anchorPositioning: true, // Chrome 125+
    containerQueries: true,
    contentVisibility: true
  },
  firefox: {
    viewTransitions: false,
    anchorPositioning: false,
    containerQueries: true,
    contentVisibility: false
  },
  safari: {
    viewTransitions: false,
    anchorPositioning: false,
    containerQueries: true,
    contentVisibility: false
  }
};

// Test data
export const TEST_DATA = {
  sampleText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  longText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
  htmlContent: '<p>Test <strong>content</strong> with <em>formatting</em>.</p>',

  // Container query test sizes
  containerSizes: [
    { width: 200, height: 150, name: 'small' },
    { width: 400, height: 300, name: 'medium' },
    { width: 800, height: 600, name: 'large' }
  ],

  // Anchor positioning test cases
  anchorPlacements: [
    'top', 'bottom', 'left', 'right'
  ],

  // Performance thresholds
  performanceThresholds: {
    domContentLoaded: 100, // ms
    loadComplete: 200,     // ms
    firstPaint: 300,       // ms
    bundleSize: 10         // KB per module
  }
};
