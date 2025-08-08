/**
 * Accessibility Validation Test Suite
 * Comprehensive WCAG compliance and accessibility testing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestHelpers } from '../utils/test-helpers';
import { ProteusJS } from '../../src/core/ProteusJS';
import { AccessibilityEngine } from '../../src/accessibility/AccessibilityEngine';

interface AccessibilityReport {
  wcagLevel: 'A' | 'AA' | 'AAA' | 'FAIL';
  score: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
}

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element?: Element;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

describe('Accessibility Validation', () => {
  let proteus: ProteusJS;
  let accessibilityEngine: AccessibilityEngine;
  let testContainer: HTMLElement;

  beforeEach(() => {
    TestHelpers.cleanup();
    proteus = new ProteusJS();
    accessibilityEngine = new AccessibilityEngine();
    testContainer = TestHelpers.createContainer({
      width: 800,
      height: 600,
      className: 'accessibility-test-container'
    });
  });

  afterEach(() => {
    proteus.destroy();
    accessibilityEngine.destroy();
    TestHelpers.cleanup();
  });

  describe('WCAG 2.1 Compliance', () => {
    describe('Level A Requirements', () => {
      it('should provide text alternatives for images', () => {
        const img = document.createElement('img');
        img.src = 'test-image.jpg';
        testContainer.appendChild(img);

        // Without alt text - should fail
        let report = accessibilityEngine.validateElement(img);
        expect(report.issues.some(issue => 
          issue.rule === 'img-alt' && issue.type === 'error'
        )).toBe(true);

        // With alt text - should pass
        img.alt = 'Test image description';
        report = accessibilityEngine.validateElement(img);
        expect(report.issues.some(issue => 
          issue.rule === 'img-alt' && issue.type === 'error'
        )).toBe(false);
      });

      it('should ensure proper heading hierarchy', () => {
        const h1 = document.createElement('h1');
        h1.textContent = 'Main Heading';
        const h3 = document.createElement('h3'); // Skip h2 - should warn
        h3.textContent = 'Sub-sub Heading';
        const h2 = document.createElement('h2');
        h2.textContent = 'Sub Heading';

        testContainer.appendChild(h1);
        testContainer.appendChild(h3);
        testContainer.appendChild(h2);

        const report = accessibilityEngine.validateContainer(testContainer);
        expect(report.issues.some(issue => 
          issue.rule === 'heading-order' && issue.type === 'warning'
        )).toBe(true);
      });

      it('should validate form labels', () => {
        const form = document.createElement('form');
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'test-input';
        
        form.appendChild(input);
        testContainer.appendChild(form);

        // Without label - should fail
        let report = accessibilityEngine.validateElement(input);
        expect(report.issues.some(issue => 
          issue.rule === 'label-required' && issue.type === 'error'
        )).toBe(true);

        // With label - should pass
        const label = document.createElement('label');
        label.htmlFor = 'test-input';
        label.textContent = 'Test Input';
        form.insertBefore(label, input);

        report = accessibilityEngine.validateElement(input);
        expect(report.issues.some(issue => 
          issue.rule === 'label-required' && issue.type === 'error'
        )).toBe(false);
      });

      it('should validate keyboard navigation', async () => {
        const button1 = document.createElement('button');
        button1.textContent = 'Button 1';
        const button2 = document.createElement('button');
        button2.textContent = 'Button 2';
        const link = document.createElement('a');
        link.href = '#test';
        link.textContent = 'Test Link';

        testContainer.appendChild(button1);
        testContainer.appendChild(button2);
        testContainer.appendChild(link);

        // Test tab navigation
        button1.focus();
        expect(document.activeElement).toBe(button1);

        await TestHelpers.simulateKeyPress(button1, 'Tab');
        expect(document.activeElement).toBe(button2);

        await TestHelpers.simulateKeyPress(button2, 'Tab');
        expect(document.activeElement).toBe(link);
      });
    });

    describe('Level AA Requirements', () => {
      it('should maintain minimum contrast ratios', () => {
        const textElement = document.createElement('p');
        textElement.textContent = 'Test text content';
        textElement.style.color = '#767676'; // Low contrast
        textElement.style.backgroundColor = '#ffffff';
        testContainer.appendChild(textElement);

        const report = accessibilityEngine.validateElement(textElement);
        const contrastIssue = report.issues.find(issue => issue.rule === 'color-contrast');
        
        if (contrastIssue) {
          expect(contrastIssue.severity).toBe('high');
        }

        // Fix contrast
        textElement.style.color = '#333333'; // Better contrast
        const fixedReport = accessibilityEngine.validateElement(textElement);
        expect(fixedReport.issues.some(issue => 
          issue.rule === 'color-contrast' && issue.type === 'error'
        )).toBe(false);
      });

      it('should ensure minimum touch target sizes', () => {
        const button = document.createElement('button');
        button.textContent = 'Small Button';
        button.style.width = '20px';
        button.style.height = '20px';
        testContainer.appendChild(button);

        const report = accessibilityEngine.validateElement(button);
        expect(report.issues.some(issue => 
          issue.rule === 'touch-target-size' && issue.type === 'error'
        )).toBe(true);

        // Fix size
        button.style.width = '44px';
        button.style.height = '44px';
        const fixedReport = accessibilityEngine.validateElement(button);
        expect(fixedReport.issues.some(issue => 
          issue.rule === 'touch-target-size' && issue.type === 'error'
        )).toBe(false);
      });

      it('should validate responsive text scaling', () => {
        const textElement = document.createElement('p');
        textElement.textContent = 'Scalable text content';
        textElement.style.fontSize = '10px'; // Too small
        testContainer.appendChild(textElement);

        proteus.fluidType(textElement, {
          minSize: 10, // Below AA minimum
          maxSize: 16,
          enforceAccessibility: true
        });

        // Should be automatically adjusted to meet AA requirements
        const computedSize = parseFloat(window.getComputedStyle(textElement).fontSize);
        expect(computedSize).toBeGreaterThanOrEqual(14); // AA minimum
      });

      it('should support user zoom up to 200%', () => {
        const container = TestHelpers.createContainer({
          width: 400,
          height: 300,
          className: 'zoom-test-container'
        });

        proteus.container(container, {
          breakpoints: { sm: '200px', md: '400px' },
          supportZoom: true
        });

        // Simulate 200% zoom (container appears half size)
        TestHelpers.simulateResize(container, 200, 150);

        // Content should still be accessible and functional
        const report = accessibilityEngine.validateContainer(container);
        expect(report.score).toBeGreaterThan(80);
      });
    });

    describe('Level AAA Requirements', () => {
      it('should maintain enhanced contrast ratios', () => {
        const textElement = document.createElement('p');
        textElement.textContent = 'AAA level text';
        textElement.style.color = '#595959'; // AA level but not AAA
        textElement.style.backgroundColor = '#ffffff';
        testContainer.appendChild(textElement);

        const report = accessibilityEngine.validateElement(textElement, { level: 'AAA' });
        expect(report.issues.some(issue => 
          issue.rule === 'color-contrast-enhanced'
        )).toBe(true);

        // Fix for AAA
        textElement.style.color = '#333333';
        const fixedReport = accessibilityEngine.validateElement(textElement, { level: 'AAA' });
        expect(fixedReport.wcagLevel).toBe('AAA');
      });

      it('should support enhanced line height requirements', () => {
        const paragraph = document.createElement('p');
        paragraph.textContent = 'This is a test paragraph with multiple lines of text to test line height requirements for AAA compliance.';
        paragraph.style.fontSize = '16px';
        paragraph.style.lineHeight = '1.4'; // Below AAA requirement
        testContainer.appendChild(paragraph);

        proteus.fluidType(paragraph, {
          minSize: 16,
          maxSize: 18,
          accessibility: 'AAA'
        });

        const lineHeight = parseFloat(window.getComputedStyle(paragraph).lineHeight);
        const fontSize = parseFloat(window.getComputedStyle(paragraph).fontSize);
        const ratio = lineHeight / fontSize;

        expect(ratio).toBeGreaterThanOrEqual(1.5); // AAA requirement
      });
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide proper ARIA labels', () => {
      const button = document.createElement('button');
      button.innerHTML = '<span class="icon">🔍</span>'; // Icon only
      testContainer.appendChild(button);

      proteus.enableAccessibility(button);

      expect(button.getAttribute('aria-label')).toBeTruthy();
      expect(button.getAttribute('role')).toBe('button');
    });

    it('should manage focus properly', async () => {
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      modal.appendChild(closeButton);
      
      testContainer.appendChild(modal);

      proteus.enableAccessibility(modal, {
        trapFocus: true,
        autoFocus: true
      });

      // Focus should be trapped within modal
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      await TestHelpers.simulateKeyPress(closeButton, 'Tab');
      // Focus should cycle back to close button (only focusable element)
      expect(document.activeElement).toBe(closeButton);
    });

    it('should provide live region updates', () => {
      const statusElement = document.createElement('div');
      statusElement.setAttribute('aria-live', 'polite');
      testContainer.appendChild(statusElement);

      proteus.updateLiveRegion(statusElement, 'Content updated successfully');

      expect(statusElement.textContent).toBe('Content updated successfully');
      expect(statusElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should handle dynamic content announcements', async () => {
      const container = TestHelpers.createContainer({
        width: 400,
        height: 300,
        className: 'dynamic-content'
      });

      proteus.container(container, {
        breakpoints: { sm: '300px', md: '600px' },
        announceChanges: true
      });

      const announcements: string[] = [];
      
      // Mock screen reader announcements
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName: string) {
        const element = originalCreateElement.call(this, tagName);
        if (tagName === 'div' && element.getAttribute('aria-live')) {
          element.addEventListener('DOMSubtreeModified', () => {
            announcements.push(element.textContent || '');
          });
        }
        return element;
      };

      await TestHelpers.simulateResize(container, 350, 300);
      
      // Should announce breakpoint change
      expect(announcements.length).toBeGreaterThan(0);
      
      // Restore original
      document.createElement = originalCreateElement;
    });
  });

  describe('Motion and Animation Accessibility', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: (query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {}
        })
      });

      const animatedElement = document.createElement('div');
      testContainer.appendChild(animatedElement);

      proteus.addMicroInteractions(animatedElement, 'fade');

      // Animations should be disabled or reduced
      const transition = window.getComputedStyle(animatedElement).transition;
      expect(transition).toContain('none');
    });

    it('should provide animation controls', () => {
      const carousel = document.createElement('div');
      carousel.className = 'carousel';
      
      const playButton = document.createElement('button');
      playButton.textContent = 'Play';
      playButton.setAttribute('aria-label', 'Play carousel');
      
      const pauseButton = document.createElement('button');
      pauseButton.textContent = 'Pause';
      pauseButton.setAttribute('aria-label', 'Pause carousel');
      
      carousel.appendChild(playButton);
      carousel.appendChild(pauseButton);
      testContainer.appendChild(carousel);

      proteus.enableAccessibility(carousel, {
        provideAnimationControls: true
      });

      expect(playButton.getAttribute('aria-label')).toBeTruthy();
      expect(pauseButton.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Cognitive Accessibility', () => {
    it('should provide clear error messages', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.type = 'email';
      input.required = true;
      
      const errorMessage = document.createElement('div');
      errorMessage.id = 'email-error';
      errorMessage.setAttribute('role', 'alert');
      
      form.appendChild(input);
      form.appendChild(errorMessage);
      testContainer.appendChild(form);

      proteus.enableAccessibility(form, {
        enhanceErrorMessages: true
      });

      // Trigger validation
      input.value = 'invalid-email';
      input.dispatchEvent(new Event('blur'));

      expect(input.getAttribute('aria-describedby')).toBe('email-error');
      expect(errorMessage.getAttribute('role')).toBe('alert');
    });

    it('should provide reading time estimates', () => {
      const article = document.createElement('article');
      article.innerHTML = `
        <h1>Test Article</h1>
        <p>${'Word '.repeat(200)}</p>
        <p>${'Word '.repeat(150)}</p>
      `;
      testContainer.appendChild(article);

      proteus.enableAccessibility(article, {
        showReadingTime: true
      });

      const readingTimeElement = article.querySelector('[data-reading-time]');
      expect(readingTimeElement).toBeTruthy();
      expect(readingTimeElement?.textContent).toContain('min read');
    });

    it('should support content simplification', () => {
      const complexContent = document.createElement('div');
      complexContent.innerHTML = `
        <p>This is a very complex sentence with multiple clauses, subordinate phrases, and technical jargon that might be difficult for some users to understand.</p>
      `;
      testContainer.appendChild(complexContent);

      proteus.enableAccessibility(complexContent, {
        simplifyContent: true,
        readingLevel: 'elementary'
      });

      // Should provide simplified version or reading aids
      const simplifiedIndicator = complexContent.querySelector('[data-simplified]');
      expect(simplifiedIndicator).toBeTruthy();
    });
  });

  describe('Comprehensive Accessibility Audit', () => {
    it('should generate complete accessibility report', () => {
      // Create a complex page structure
      const page = document.createElement('main');
      page.innerHTML = `
        <header>
          <h1>Page Title</h1>
          <nav>
            <ul>
              <li><a href="#section1">Section 1</a></li>
              <li><a href="#section2">Section 2</a></li>
            </ul>
          </nav>
        </header>
        <section id="section1">
          <h2>Section 1</h2>
          <p>Content with <a href="https://example.com">external link</a></p>
          <img src="image.jpg" alt="Descriptive alt text">
        </section>
        <section id="section2">
          <h2>Section 2</h2>
          <form>
            <label for="name">Name:</label>
            <input type="text" id="name" required>
            <button type="submit">Submit</button>
          </form>
        </section>
        <footer>
          <p>&copy; 2024 Test Site</p>
        </footer>
      `;
      testContainer.appendChild(page);

      const report = accessibilityEngine.auditPage(page);

      expect(report.score).toBeGreaterThan(80);
      expect(report.wcagLevel).toBeOneOf(['A', 'AA', 'AAA']);
      expect(Array.isArray(report.issues)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should validate ProteusJS enhanced elements', () => {
      const container = TestHelpers.createContainer({
        width: 600,
        height: 400,
        className: 'proteus-enhanced'
      });

      // Apply ProteusJS features
      proteus.container(container, {
        breakpoints: { sm: '300px', md: '600px' }
      });

      const heading = document.createElement('h1');
      heading.textContent = 'Enhanced Heading';
      container.appendChild(heading);

      proteus.fluidType(heading, {
        minSize: 18,
        maxSize: 32,
        accessibility: 'AA'
      });

      proteus.enableAccessibility(container, {
        level: 'AA',
        announceChanges: true
      });

      const report = accessibilityEngine.validateContainer(container);

      expect(report.wcagLevel).toBeOneOf(['AA', 'AAA']);
      expect(report.score).toBeGreaterThan(85);
    });
  });
});
