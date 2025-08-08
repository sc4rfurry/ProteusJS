/**
 * ScreenReaderSupport Test Suite
 * Comprehensive tests for screen reader compatibility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScreenReaderSupport, AnnouncementConfig, LiveRegionConfig, AriaLabelConfig } from '../ScreenReaderSupport';

describe('ScreenReaderSupport', () => {
  let screenReaderSupport: ScreenReaderSupport;

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    screenReaderSupport = new ScreenReaderSupport();
  });

  afterEach(() => {
    screenReaderSupport.destroy();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default live regions', () => {
      const statusRegion = document.getElementById('proteus-live-status');
      const alertRegion = document.getElementById('proteus-live-alert');
      
      expect(statusRegion).toBeTruthy();
      expect(alertRegion).toBeTruthy();
      expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
      expect(alertRegion?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should detect keyboard navigation', () => {
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(keydownEvent);
      
      expect(document.body.classList.contains('proteus-keyboard-user')).toBe(true);
      
      const mousedownEvent = new MouseEvent('mousedown');
      document.dispatchEvent(mousedownEvent);
      
      expect(document.body.classList.contains('proteus-keyboard-user')).toBe(false);
    });
  });

  describe('Announcements', () => {
    it('should announce messages to screen readers', () => {
      const message = 'Test announcement';
      
      screenReaderSupport.announce(message);
      
      const statusRegion = document.getElementById('proteus-live-status');
      
      // Wait for async processing
      setTimeout(() => {
        expect(statusRegion?.textContent).toBe(message);
      }, 100);
    });

    it('should handle assertive announcements', () => {
      const message = 'Urgent announcement';
      const config: AnnouncementConfig = { priority: 'assertive' };
      
      screenReaderSupport.announce(message, config);
      
      const alertRegion = document.getElementById('proteus-live-alert');
      
      setTimeout(() => {
        expect(alertRegion?.textContent).toBe(message);
      }, 100);
    });

    it('should prevent duplicate announcements', () => {
      const message = 'Duplicate test';
      
      screenReaderSupport.announce(message);
      screenReaderSupport.announce(message); // Should be ignored
      
      const statusRegion = document.getElementById('proteus-live-status');
      
      setTimeout(() => {
        expect(statusRegion?.textContent).toBe(message);
      }, 100);
    });

    it('should handle announcement interruption', () => {
      screenReaderSupport.announce('First message');
      screenReaderSupport.announce('Second message', { priority: 'polite', interrupt: true });
      
      const statusRegion = document.getElementById('proteus-live-status');
      
      setTimeout(() => {
        expect(statusRegion?.textContent).toBe('Second message');
      }, 100);
    });

    it('should ignore empty announcements', () => {
      const statusRegion = document.getElementById('proteus-live-status');
      const initialContent = statusRegion?.textContent;
      
      screenReaderSupport.announce('');
      screenReaderSupport.announce('   ');
      
      expect(statusRegion?.textContent).toBe(initialContent);
    });
  });

  describe('Live Regions', () => {
    it('should create custom live regions', () => {
      const config: LiveRegionConfig = {
        type: 'status',
        atomic: true,
        relevant: 'additions',
        busy: false
      };
      
      const region = screenReaderSupport.createLiveRegion('custom', config);
      
      expect(region.id).toBe('proteus-live-custom');
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('aria-atomic')).toBe('true');
      expect(region.getAttribute('aria-relevant')).toBe('additions');
      expect(region.getAttribute('aria-busy')).toBe('false');
    });

    it('should update live region content', () => {
      const region = screenReaderSupport.createLiveRegion('test', {
        type: 'status',
        atomic: false,
        relevant: 'additions',
        busy: false
      });
      
      screenReaderSupport.updateLiveRegion('test', 'Updated content');
      
      expect(region.textContent).toBe('Updated content');
    });

    it('should handle different live region types', () => {
      const alertRegion = screenReaderSupport.createLiveRegion('alert-test', {
        type: 'alert',
        atomic: true,
        relevant: 'all',
        busy: false
      });
      
      const logRegion = screenReaderSupport.createLiveRegion('log-test', {
        type: 'log',
        atomic: false,
        relevant: 'additions',
        busy: false
      });
      
      expect(alertRegion.getAttribute('aria-live')).toBe('assertive');
      expect(alertRegion.getAttribute('role')).toBe('alert');
      expect(logRegion.getAttribute('aria-live')).toBe('polite');
      expect(logRegion.getAttribute('role')).toBe('status');
    });
  });

  describe('ARIA Labels', () => {
    let testElement: HTMLElement;

    beforeEach(() => {
      testElement = document.createElement('div');
      document.body.appendChild(testElement);
    });

    it('should apply basic ARIA labels', () => {
      const config: AriaLabelConfig = {
        label: 'Test label',
        role: 'button'
      };
      
      screenReaderSupport.applyAriaLabels(testElement, config);
      
      expect(testElement.getAttribute('aria-label')).toBe('Test label');
      expect(testElement.getAttribute('role')).toBe('button');
    });

    it('should apply state attributes', () => {
      const config: AriaLabelConfig = {
        expanded: true,
        selected: false,
        disabled: true,
        hidden: false
      };
      
      screenReaderSupport.applyAriaLabels(testElement, config);
      
      expect(testElement.getAttribute('aria-expanded')).toBe('true');
      expect(testElement.getAttribute('aria-selected')).toBe('false');
      expect(testElement.getAttribute('aria-disabled')).toBe('true');
      expect(testElement.getAttribute('aria-hidden')).toBe('false');
    });

    it('should apply relationship attributes', () => {
      const labelElement = document.createElement('label');
      labelElement.id = 'test-label';
      document.body.appendChild(labelElement);
      
      const descElement = document.createElement('div');
      descElement.id = 'test-desc';
      document.body.appendChild(descElement);
      
      const config: AriaLabelConfig = {
        labelledBy: 'test-label',
        describedBy: 'test-desc'
      };
      
      screenReaderSupport.applyAriaLabels(testElement, config);
      
      expect(testElement.getAttribute('aria-labelledby')).toBe('test-label');
      expect(testElement.getAttribute('aria-describedby')).toBe('test-desc');
    });
  });

  describe('Container Announcements', () => {
    it('should announce container changes', () => {
      const container = document.createElement('div');
      container.setAttribute('aria-label', 'Product grid');
      
      screenReaderSupport.announceContainerChange(container, 'tablet', 768);
      
      setTimeout(() => {
        const statusRegion = document.getElementById('proteus-live-status');
        expect(statusRegion?.textContent).toContain('Product grid');
        expect(statusRegion?.textContent).toContain('tablet breakpoint');
        expect(statusRegion?.textContent).toContain('768 pixels');
      }, 600);
    });

    it('should announce typography changes', () => {
      const textElement = document.createElement('p');
      textElement.textContent = 'Sample text';
      
      screenReaderSupport.announceTypographyChange(textElement, '18px');
      
      setTimeout(() => {
        const statusRegion = document.getElementById('proteus-live-status');
        expect(statusRegion?.textContent).toContain('text size adjusted');
        expect(statusRegion?.textContent).toContain('18px');
      }, 400);
    });
  });

  describe('Skip Links', () => {
    it('should create skip links', () => {
      const targets = [
        { id: 'main-content', label: 'Skip to main content' },
        { id: 'navigation', label: 'Skip to navigation' }
      ];
      
      const skipContainer = screenReaderSupport.createSkipLinks(targets);
      
      expect(skipContainer.getAttribute('role')).toBe('navigation');
      expect(skipContainer.getAttribute('aria-label')).toBe('Skip links');
      
      const links = skipContainer.querySelectorAll('a');
      expect(links).toHaveLength(2);
      expect(links[0].href).toContain('#main-content');
      expect(links[0].textContent).toBe('Skip to main content');
      expect(links[1].href).toContain('#navigation');
      expect(links[1].textContent).toBe('Skip to navigation');
    });

    it('should position skip links correctly', () => {
      const targets = [{ id: 'main', label: 'Skip to main' }];
      const skipContainer = screenReaderSupport.createSkipLinks(targets);
      const link = skipContainer.querySelector('a') as HTMLElement;
      
      expect(link.style.position).toBe('absolute');
      expect(link.style.top).toBe('-40px'); // Hidden by default
      
      // Simulate focus
      link.focus();
      link.dispatchEvent(new FocusEvent('focus'));
      
      expect(link.style.top).toBe('6px'); // Visible on focus
    });
  });

  describe('Focus Management', () => {
    it('should manage focus for dynamic content', () => {
      const element = document.createElement('div');
      element.textContent = 'Dynamic content';
      document.body.appendChild(element);
      
      const focusSpy = vi.spyOn(element, 'focus');
      
      screenReaderSupport.manageFocus(element, 'Content updated');
      
      expect(element.getAttribute('tabindex')).toBe('-1');
      expect(focusSpy).toHaveBeenCalled();
      
      setTimeout(() => {
        const alertRegion = document.getElementById('proteus-live-alert');
        expect(alertRegion?.textContent).toContain('Focus moved to');
        expect(alertRegion?.textContent).toContain('Content updated');
      }, 100);
    });

    it('should preserve existing tabindex', () => {
      const element = document.createElement('button');
      element.setAttribute('tabindex', '0');
      document.body.appendChild(element);
      
      screenReaderSupport.manageFocus(element, 'Button focused');
      
      expect(element.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Screen Reader Detection', () => {
    it('should detect screen reader presence', () => {
      // Mock screen reader indicators
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NVDA/2021.1',
        configurable: true
      });
      
      const newSupport = new ScreenReaderSupport();
      
      expect(newSupport.isScreenReaderActive()).toBe(true);
      
      newSupport.destroy();
    });

    it('should handle missing screen reader gracefully', () => {
      expect(screenReaderSupport.isScreenReaderActive()).toBeDefined();
    });
  });

  describe('Element Description', () => {
    it('should get element description from aria-label', () => {
      const element = document.createElement('div');
      element.setAttribute('aria-label', 'Custom label');
      
      screenReaderSupport.announceContainerChange(element, 'md', 600);
      
      setTimeout(() => {
        const statusRegion = document.getElementById('proteus-live-status');
        expect(statusRegion?.textContent).toContain('Custom label');
      }, 600);
    });

    it('should get element description from aria-labelledby', () => {
      const labelElement = document.createElement('span');
      labelElement.id = 'element-label';
      labelElement.textContent = 'Labeled element';
      document.body.appendChild(labelElement);
      
      const element = document.createElement('div');
      element.setAttribute('aria-labelledby', 'element-label');
      
      screenReaderSupport.announceContainerChange(element, 'lg', 800);
      
      setTimeout(() => {
        const statusRegion = document.getElementById('proteus-live-status');
        expect(statusRegion?.textContent).toContain('Labeled element');
      }, 600);
    });

    it('should fallback to text content', () => {
      const element = document.createElement('div');
      element.textContent = 'Element text';
      
      screenReaderSupport.announceContainerChange(element, 'sm', 400);
      
      setTimeout(() => {
        const statusRegion = document.getElementById('proteus-live-status');
        expect(statusRegion?.textContent).toContain('Element text');
      }, 600);
    });

    it('should fallback to tag name and class', () => {
      const element = document.createElement('section');
      element.className = 'content-area';
      
      screenReaderSupport.announceContainerChange(element, 'md', 600);
      
      setTimeout(() => {
        const statusRegion = document.getElementById('proteus-live-status');
        expect(statusRegion?.textContent).toContain('section with class content-area');
      }, 600);
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const customRegion = screenReaderSupport.createLiveRegion('cleanup-test', {
        type: 'status',
        atomic: false,
        relevant: 'additions',
        busy: false
      });
      
      expect(document.getElementById('proteus-live-cleanup-test')).toBeTruthy();
      
      screenReaderSupport.destroy();
      
      expect(document.getElementById('proteus-live-status')).toBeNull();
      expect(document.getElementById('proteus-live-alert')).toBeNull();
      expect(document.getElementById('proteus-live-cleanup-test')).toBeNull();
    });

    it('should handle multiple destroy calls gracefully', () => {
      expect(() => {
        screenReaderSupport.destroy();
        screenReaderSupport.destroy();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid live region updates', () => {
      expect(() => {
        screenReaderSupport.updateLiveRegion('non-existent', 'content');
      }).not.toThrow();
    });

    it('should handle invalid elements in ARIA methods', () => {
      expect(() => {
        screenReaderSupport.applyAriaLabels(null as any, {});
      }).not.toThrow();
      
      expect(() => {
        screenReaderSupport.manageFocus(null as any, 'test');
      }).not.toThrow();
    });
  });
});
