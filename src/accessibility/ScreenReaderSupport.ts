/**
 * ScreenReaderSupport - Enhanced screen reader compatibility
 * Provides intelligent announcements, live regions, and ARIA management
 */

export interface AnnouncementConfig {
  priority: 'polite' | 'assertive' | 'off';
  delay?: number;
  clear?: boolean;
  interrupt?: boolean;
}

export interface LiveRegionConfig {
  type: 'status' | 'alert' | 'log' | 'marquee' | 'timer';
  atomic: boolean;
  relevant: 'additions' | 'removals' | 'text' | 'all';
  busy: boolean;
}

export interface AriaLabelConfig {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  role?: string;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  live?: 'polite' | 'assertive' | 'off';
}

export class ScreenReaderSupport {
  private liveRegions: Map<string, HTMLElement> = new Map();
  private announcementQueue: Array<{ message: string; config: AnnouncementConfig }> = [];
  private isProcessingQueue: boolean = false;
  private screenReaderDetected: boolean = false;
  private lastAnnouncement: string = '';
  private lastAnnouncementTime: number = 0;

  constructor() {
    this.detectScreenReader();
    this.setupDefaultLiveRegions();
    this.setupKeyboardDetection();
  }

  /**
   * Announce message to screen readers
   */
  public announce(message: string, config: AnnouncementConfig = { priority: 'polite' }): void {
    if (!message.trim()) return;

    // Avoid duplicate announcements within 1 second
    const now = Date.now();
    if (this.lastAnnouncement === message && now - this.lastAnnouncementTime < 1000) {
      return;
    }

    this.lastAnnouncement = message;
    this.lastAnnouncementTime = now;

    if (config.interrupt) {
      this.clearQueue();
    }

    this.announcementQueue.push({ message, config });
    this.processQueue();
  }

  /**
   * Create or update live region
   */
  public createLiveRegion(id: string, config: LiveRegionConfig): HTMLElement {
    let region = this.liveRegions.get(id);
    
    if (!region) {
      region = document.createElement('div');
      region.id = `proteus-live-${id}`;
      region.className = 'proteus-sr-only';
      this.applyScreenReaderOnlyStyles(region);
      document.body.appendChild(region);
      this.liveRegions.set(id, region);
    }

    // Update ARIA attributes
    region.setAttribute('aria-live', this.mapLiveRegionType(config.type));
    region.setAttribute('aria-atomic', config.atomic.toString());
    region.setAttribute('aria-relevant', config.relevant);
    region.setAttribute('aria-busy', config.busy.toString());
    region.setAttribute('role', config.type === 'alert' ? 'alert' : 'status');

    return region;
  }

  /**
   * Update live region content
   */
  public updateLiveRegion(id: string, content: string): void {
    const region = this.liveRegions.get(id);
    if (region) {
      region.textContent = content;
    }
  }

  /**
   * Apply comprehensive ARIA labels to element
   */
  public applyAriaLabels(element: Element, config: AriaLabelConfig): void {
    const htmlElement = element as HTMLElement;

    // Label attributes
    if (config.label) {
      htmlElement.setAttribute('aria-label', config.label);
    }
    if (config.labelledBy) {
      htmlElement.setAttribute('aria-labelledby', config.labelledBy);
    }
    if (config.describedBy) {
      htmlElement.setAttribute('aria-describedby', config.describedBy);
    }

    // Role
    if (config.role) {
      htmlElement.setAttribute('role', config.role);
    }

    // State attributes
    if (config.expanded !== undefined) {
      htmlElement.setAttribute('aria-expanded', config.expanded.toString());
    }
    if (config.selected !== undefined) {
      htmlElement.setAttribute('aria-selected', config.selected.toString());
    }
    if (config.checked !== undefined) {
      htmlElement.setAttribute('aria-checked', config.checked.toString());
    }
    if (config.disabled !== undefined) {
      htmlElement.setAttribute('aria-disabled', config.disabled.toString());
    }
    if (config.hidden !== undefined) {
      htmlElement.setAttribute('aria-hidden', config.hidden.toString());
    }
    if (config.live) {
      htmlElement.setAttribute('aria-live', config.live);
    }
  }

  /**
   * Announce container changes for responsive layouts
   */
  public announceContainerChange(element: Element, breakpoint: string, width: number): void {
    const elementName = this.getElementDescription(element);
    const message = `${elementName} layout changed to ${breakpoint} breakpoint at ${width} pixels wide`;
    
    this.announce(message, { priority: 'polite', delay: 500 });
  }

  /**
   * Announce typography changes
   */
  public announceTypographyChange(element: Element, fontSize: string): void {
    const elementName = this.getElementDescription(element);
    const message = `${elementName} text size adjusted to ${fontSize}`;
    
    this.announce(message, { priority: 'polite', delay: 300 });
  }

  /**
   * Create skip links for navigation
   */
  public createSkipLinks(targets: Array<{ id: string; label: string }>): HTMLElement {
    const skipContainer = document.createElement('div');
    skipContainer.className = 'proteus-skip-links';
    skipContainer.setAttribute('role', 'navigation');
    skipContainer.setAttribute('aria-label', 'Skip links');

    targets.forEach(target => {
      const link = document.createElement('a');
      link.href = `#${target.id}`;
      link.textContent = target.label;
      link.className = 'proteus-skip-link';
      
      // Style skip link
      this.applySkipLinkStyles(link);
      
      skipContainer.appendChild(link);
    });

    // Insert at beginning of body
    document.body.insertBefore(skipContainer, document.body.firstChild);
    
    return skipContainer;
  }

  /**
   * Manage focus for dynamic content
   */
  public manageFocus(element: Element, reason: string): void {
    const htmlElement = element as HTMLElement;
    
    // Ensure element is focusable
    if (!htmlElement.hasAttribute('tabindex')) {
      htmlElement.setAttribute('tabindex', '-1');
    }

    // Focus the element
    htmlElement.focus();

    // Announce focus change
    const elementName = this.getElementDescription(element);
    this.announce(`Focus moved to ${elementName}. ${reason}`, { priority: 'assertive' });
  }

  /**
   * Check if screen reader is active
   */
  public isScreenReaderActive(): boolean {
    return this.screenReaderDetected;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Remove live regions
    this.liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    this.liveRegions.clear();

    // Clear queue
    this.clearQueue();
  }

  /**
   * Detect screen reader presence
   */
  private detectScreenReader(): void {
    // Check for common screen reader indicators
    const indicators = [
      () => navigator.userAgent.includes('NVDA'),
      () => navigator.userAgent.includes('JAWS'),
      () => navigator.userAgent.includes('VoiceOver'),
      () => navigator.userAgent.includes('Orca'),
      () => window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
      () => 'speechSynthesis' in window,
      () => document.querySelector('[aria-live]') !== null
    ];

    this.screenReaderDetected = indicators.some(check => {
      try {
        return check();
      } catch {
        return false;
      }
    });

    // Also check for keyboard-only navigation
    this.setupKeyboardDetection();
  }

  /**
   * Setup keyboard navigation detection
   */
  private setupKeyboardDetection(): void {
    let keyboardUser = false;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        keyboardUser = true;
        document.body.classList.add('proteus-keyboard-user');
      }
    });

    document.addEventListener('mousedown', () => {
      if (keyboardUser) {
        keyboardUser = false;
        document.body.classList.remove('proteus-keyboard-user');
      }
    });
  }

  /**
   * Setup default live regions
   */
  private setupDefaultLiveRegions(): void {
    // Status region for general announcements
    this.createLiveRegion('status', {
      type: 'status',
      atomic: false,
      relevant: 'additions',
      busy: false
    });

    // Alert region for important announcements
    this.createLiveRegion('alert', {
      type: 'alert',
      atomic: true,
      relevant: 'all',
      busy: false
    });
  }

  /**
   * Process announcement queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.announcementQueue.length > 0) {
      const { message, config } = this.announcementQueue.shift()!;

      if (config.clear) {
        this.clearLiveRegions();
      }

      const regionId = config.priority === 'assertive' ? 'alert' : 'status';
      this.updateLiveRegion(regionId, message);

      if (config.delay) {
        await this.delay(config.delay);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Clear announcement queue
   */
  private clearQueue(): void {
    this.announcementQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Clear all live regions
   */
  private clearLiveRegions(): void {
    this.liveRegions.forEach(region => {
      region.textContent = '';
    });
  }

  /**
   * Map live region type to aria-live value
   */
  private mapLiveRegionType(type: LiveRegionConfig['type']): 'polite' | 'assertive' | 'off' {
    switch (type) {
      case 'alert':
        return 'assertive';
      case 'status':
      case 'log':
      case 'marquee':
      case 'timer':
        return 'polite';
      default:
        return 'polite';
    }
  }

  /**
   * Get descriptive name for element
   */
  private getElementDescription(element: Element): string {
    // Try aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Try aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || 'element';
    }

    // Try text content
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length < 50) return textContent;

    // Try tag name and class
    const tagName = element.tagName.toLowerCase();
    const className = element.className ? ` with class ${element.className}` : '';
    
    return `${tagName}${className}`;
  }

  /**
   * Apply screen reader only styles
   */
  private applyScreenReaderOnlyStyles(element: HTMLElement): void {
    element.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
  }

  /**
   * Apply skip link styles
   */
  private applySkipLinkStyles(element: HTMLElement): void {
    element.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `;

    // Show on focus
    element.addEventListener('focus', () => {
      element.style.top = '6px';
    });

    element.addEventListener('blur', () => {
      element.style.top = '-40px';
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
