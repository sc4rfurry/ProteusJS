/**
 * Custom Test Matchers
 * Extends Vitest with additional assertion methods
 */

import { expect } from 'vitest';

// Extend Vitest matchers
interface CustomMatchers<R = unknown> {
  toBeOneOf(expected: any[]): R;
  toBeValidCSS(): R;
  toBeValidClamp(): R;
  toHaveValidFontSize(): R;
  toHaveValidLineHeight(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// Custom matcher: toBeOneOf
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },

  // Custom matcher: toBeValidCSS
  toBeValidCSS(received: string) {
    const isValid = typeof received === 'string' && 
                   received.length > 0 && 
                   !received.includes('undefined') &&
                   !received.includes('NaN');
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be valid CSS`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be valid CSS (no undefined/NaN values)`,
        pass: false,
      };
    }
  },

  // Custom matcher: toBeValidClamp
  toBeValidClamp(received: string) {
    const clampRegex = /^clamp\(\s*[\d.]+(?:px|rem|em|%),\s*[\d.]+(?:px|rem|em|%|\s*\+\s*[\d.]+vw),\s*[\d.]+(?:px|rem|em|%)\s*\)$/;
    const isValid = clampRegex.test(received);
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be a valid clamp function`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid clamp function (clamp(min, preferred, max))`,
        pass: false,
      };
    }
  },

  // Custom matcher: toHaveValidFontSize
  toHaveValidFontSize(received: Element) {
    const computedStyle = window.getComputedStyle(received);
    const fontSize = parseFloat(computedStyle.fontSize);
    const isValid = !isNaN(fontSize) && fontSize > 0;
    
    if (isValid) {
      return {
        message: () => `expected element not to have valid font size`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have valid font size (got ${computedStyle.fontSize})`,
        pass: false,
      };
    }
  },

  // Custom matcher: toHaveValidLineHeight
  toHaveValidLineHeight(received: Element) {
    const computedStyle = window.getComputedStyle(received);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const isValid = !isNaN(lineHeight) && lineHeight > 0;
    
    if (isValid) {
      return {
        message: () => `expected element not to have valid line height`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have valid line height (got ${computedStyle.lineHeight})`,
        pass: false,
      };
    }
  },
});

export {};
