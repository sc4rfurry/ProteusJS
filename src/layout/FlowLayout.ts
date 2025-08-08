/**
 * Flow Layout Engine for ProteusJS
 * Natural content flow with reading pattern optimization
 */

export interface FlowConfig {
  pattern: 'z-pattern' | 'f-pattern' | 'gutenberg' | 'natural' | 'custom' | 'auto';
  direction: 'ltr' | 'rtl' | 'auto';
  language: string;
  accessibility: boolean;
  focusManagement: boolean;
  skipLinks: boolean;
  landmarks: boolean;
  readingOrder: 'visual' | 'logical' | 'auto';
  customFlow?: FlowStep[];
}

export interface FlowStep {
  selector: string;
  priority: number;
  region: 'header' | 'main' | 'content' | 'footer' | 'navigation' | 'sidebar';
  tabIndex?: number;
  ariaLabel?: string;
  landmark?: string;
}

export interface FlowState {
  currentPattern: string;
  direction: 'ltr' | 'rtl';
  focusableElements: Element[];
  tabOrder: Element[];
  landmarks: Map<string, Element>;
  skipTargets: Element[];
}

export class FlowLayout {
  private element: Element;
  private config: Required<FlowConfig>;
  private state: FlowState;
  private mutationObserver: MutationObserver | null = null;

  private static readonly READING_PATTERNS = {
    'z-pattern': [
      { selector: 'header, [role="banner"]', region: 'header' as const, priority: 1 },
      { selector: 'nav, [role="navigation"]', region: 'navigation' as const, priority: 2 },
      { selector: 'main, [role="main"]', region: 'main' as const, priority: 3 },
      { selector: 'aside, [role="complementary"]', region: 'sidebar' as const, priority: 4 },
      { selector: 'footer, [role="contentinfo"]', region: 'footer' as const, priority: 5 }
    ],
    'f-pattern': [
      { selector: 'header, [role="banner"]', region: 'header' as const, priority: 1 },
      { selector: 'main, [role="main"]', region: 'main' as const, priority: 2 },
      { selector: 'aside, [role="complementary"]', region: 'sidebar' as const, priority: 3 },
      { selector: 'nav, [role="navigation"]', region: 'navigation' as const, priority: 4 },
      { selector: 'footer, [role="contentinfo"]', region: 'footer' as const, priority: 5 }
    ],
    'gutenberg': [
      { selector: 'nav, [role="navigation"]', region: 'navigation' as const, priority: 1 },
      { selector: 'header, [role="banner"]', region: 'header' as const, priority: 2 },
      { selector: 'main, [role="main"]', region: 'main' as const, priority: 3 },
      { selector: 'aside, [role="complementary"]', region: 'sidebar' as const, priority: 4 },
      { selector: 'footer, [role="contentinfo"]', region: 'footer' as const, priority: 5 }
    ],
    'natural': [
      { selector: 'header, [role="banner"]', region: 'header' as const, priority: 1 },
      { selector: 'main, [role="main"]', region: 'main' as const, priority: 2 },
      { selector: 'nav, [role="navigation"]', region: 'navigation' as const, priority: 3 },
      { selector: 'aside, [role="complementary"]', region: 'sidebar' as const, priority: 4 },
      { selector: 'footer, [role="contentinfo"]', region: 'footer' as const, priority: 5 }
    ]
  };

  private static readonly RTL_LANGUAGES = [
    'ar', 'he', 'fa', 'ur', 'yi', 'ji', 'iw', 'ku', 'ps', 'sd'
  ];

  constructor(element: Element, config: Partial<FlowConfig> = {}) {
    this.element = element;
    this.config = {
      pattern: 'natural',
      direction: 'auto',
      language: 'en',
      accessibility: true,
      focusManagement: true,
      skipLinks: true,
      landmarks: true,
      readingOrder: 'auto',
      customFlow: [],
      ...config
    };

    this.state = this.createInitialState();
    this.activate();
  }

  /**
   * Activate the flow layout
   */
  public activate(): void {
    this.analyzeContent();
    this.applyFlowPattern();
    this.setupAccessibility();
    this.setupObservers();
  }

  /**
   * Deactivate and clean up
   */
  public deactivate(): void {
    this.cleanupObservers();
    this.removeFlowStyles();
    this.removeAccessibilityFeatures();
  }

  /**
   * Update flow configuration
   */
  public updateConfig(newConfig: Partial<FlowConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.activate();
  }

  /**
   * Get current flow state
   */
  public getState(): FlowState {
    return { ...this.state };
  }

  /**
   * Manually set tab order
   */
  public setTabOrder(elements: Element[]): void {
    elements.forEach((element, index) => {
      (element as HTMLElement).tabIndex = index + 1;
    });
    this.state.tabOrder = elements;
  }

  /**
   * Add skip link
   */
  public addSkipLink(target: Element, label: string): void {
    if (!this.config.skipLinks) return;

    const skipLink = document.createElement('a');
    skipLink.href = `#${this.ensureId(target)}`;
    skipLink.textContent = label;
    skipLink.className = 'proteus-skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      transition: top 0.3s;
    `;

    // Show on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
    this.state.skipTargets.push(target);
  }

  /**
   * Analyze content structure
   */
  private analyzeContent(): void {
    // Detect reading direction
    this.state.direction = this.detectReadingDirection();
    
    // Find focusable elements
    this.state.focusableElements = this.findFocusableElements();
    
    // Identify landmarks
    this.state.landmarks = this.identifyLandmarks();
    
    // Determine optimal pattern
    this.state.currentPattern = this.determineOptimalPattern();
  }

  /**
   * Apply flow pattern
   */
  private applyFlowPattern(): void {
    let pattern;
    if (this.config.pattern === 'custom') {
      pattern = this.config.customFlow;
    } else if (this.config.pattern === 'auto') {
      const optimalPattern = this.determineOptimalPattern();
      pattern = FlowLayout.READING_PATTERNS[optimalPattern as keyof typeof FlowLayout.READING_PATTERNS];
    } else {
      pattern = FlowLayout.READING_PATTERNS[this.config.pattern];
    }

    if (!pattern) return;

    // Sort elements by pattern priority
    const sortedElements = this.sortElementsByPattern(pattern);
    
    // Apply visual flow
    this.applyVisualFlow(sortedElements);
    
    // Set logical tab order
    if (this.config.focusManagement) {
      this.setLogicalTabOrder(sortedElements);
    }
  }

  /**
   * Setup accessibility features
   */
  private setupAccessibility(): void {
    if (!this.config.accessibility) return;

    // Add landmarks
    if (this.config.landmarks) {
      this.addLandmarks();
    }

    // Add skip links
    if (this.config.skipLinks) {
      this.addDefaultSkipLinks();
    }

    // Set reading order
    this.setReadingOrder();
  }

  /**
   * Detect reading direction
   */
  private detectReadingDirection(): 'ltr' | 'rtl' {
    if (this.config.direction !== 'auto') {
      return this.config.direction;
    }

    const langCode = this.config.language?.split('-')[0]?.toLowerCase();
    return langCode && FlowLayout.RTL_LANGUAGES.includes(langCode) ? 'rtl' : 'ltr';
  }

  /**
   * Find all focusable elements
   */
  private findFocusableElements(): Element[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(this.element.querySelectorAll(focusableSelectors));
  }

  /**
   * Identify semantic landmarks
   */
  private identifyLandmarks(): Map<string, Element> {
    const landmarks = new Map<string, Element>();
    
    const landmarkSelectors = {
      'banner': 'header, [role="banner"]',
      'main': 'main, [role="main"]',
      'navigation': 'nav, [role="navigation"]',
      'complementary': 'aside, [role="complementary"]',
      'contentinfo': 'footer, [role="contentinfo"]',
      'search': '[role="search"]',
      'form': 'form, [role="form"]'
    };

    Object.entries(landmarkSelectors).forEach(([role, selector]) => {
      const element = this.element.querySelector(selector);
      if (element) {
        landmarks.set(role, element);
      }
    });

    return landmarks;
  }

  /**
   * Determine optimal reading pattern
   */
  private determineOptimalPattern(): string {
    if (this.config.pattern !== 'auto') {
      return this.config.pattern;
    }

    // Analyze layout structure to suggest pattern
    const hasHeader = this.state.landmarks.has('banner');
    const hasSidebar = this.state.landmarks.has('complementary');
    const hasNav = this.state.landmarks.has('navigation');

    if (hasHeader && hasSidebar && hasNav) {
      return 'z-pattern';
    } else if (hasHeader && hasSidebar) {
      return 'f-pattern';
    } else {
      return 'natural';
    }
  }

  /**
   * Sort elements by pattern priority
   */
  private sortElementsByPattern(pattern: FlowStep[]): Element[] {
    const elements: Array<{ element: Element; priority: number }> = [];

    pattern.forEach(step => {
      const stepElements = Array.from(this.element.querySelectorAll(step.selector));
      stepElements.forEach(element => {
        elements.push({ element, priority: step.priority });
      });
    });

    // Sort by priority, then by DOM order
    return elements
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Use DOM order as tiebreaker
        return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      })
      .map(item => item.element);
  }

  /**
   * Apply visual flow styles
   */
  private applyVisualFlow(elements: Element[]): void {
    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.setProperty('--flow-order', index.toString());
      htmlElement.classList.add('proteus-flow-item');
    });

    // Add CSS for visual flow
    this.addFlowCSS();
  }

  /**
   * Set logical tab order
   */
  private setLogicalTabOrder(elements: Element[]): void {
    const focusableInOrder = elements.filter(el => 
      this.state.focusableElements.includes(el)
    );

    focusableInOrder.forEach((element, index) => {
      (element as HTMLElement).tabIndex = index + 1;
    });

    this.state.tabOrder = focusableInOrder;
  }

  /**
   * Add landmark roles and labels
   */
  private addLandmarks(): void {
    this.state.landmarks.forEach((element, role) => {
      const htmlElement = element as HTMLElement;
      
      if (!htmlElement.getAttribute('role')) {
        htmlElement.setAttribute('role', role);
      }
      
      if (!htmlElement.getAttribute('aria-label') && !htmlElement.getAttribute('aria-labelledby')) {
        const label = this.generateLandmarkLabel(role);
        htmlElement.setAttribute('aria-label', label);
      }
    });
  }

  /**
   * Add default skip links
   */
  private addDefaultSkipLinks(): void {
    const mainContent = this.state.landmarks.get('main');
    if (mainContent) {
      this.addSkipLink(mainContent, 'Skip to main content');
    }

    const navigation = this.state.landmarks.get('navigation');
    if (navigation) {
      this.addSkipLink(navigation, 'Skip to navigation');
    }
  }

  /**
   * Set reading order for screen readers
   */
  private setReadingOrder(): void {
    if (this.config.readingOrder === 'visual') {
      // Use CSS order for screen readers
      (this.element as HTMLElement).style.setProperty('--reading-order', 'visual');
    } else {
      // Maintain logical DOM order
      (this.element as HTMLElement).style.setProperty('--reading-order', 'logical');
    }
  }

  /**
   * Generate landmark label
   */
  private generateLandmarkLabel(role: string): string {
    const labels = {
      'banner': 'Site header',
      'main': 'Main content',
      'navigation': 'Site navigation',
      'complementary': 'Sidebar',
      'contentinfo': 'Site footer',
      'search': 'Search',
      'form': 'Form'
    };
    
    return labels[role as keyof typeof labels] || role;
  }

  /**
   * Add CSS for flow layout
   */
  private addFlowCSS(): void {
    const styleId = 'proteus-flow-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .proteus-flow-item {
        order: var(--flow-order, 0);
      }
      
      .proteus-skip-link:focus {
        clip: auto !important;
        height: auto !important;
        margin: 0 !important;
        overflow: visible !important;
        position: absolute !important;
        width: auto !important;
      }
      
      [dir="rtl"] .proteus-flow-item {
        direction: rtl;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Ensure element has an ID
   */
  private ensureId(element: Element): string {
    if (!element.id) {
      element.id = `proteus-flow-${Math.random().toString(36).substring(2, 11)}`;
    }
    return element.id;
  }

  /**
   * Setup observers
   */
  private setupObservers(): void {
    this.mutationObserver = new MutationObserver(() => {
      this.analyzeContent();
      this.applyFlowPattern();
    });

    this.mutationObserver.observe(this.element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'tabindex']
    });
  }

  /**
   * Clean up observers
   */
  private cleanupObservers(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  /**
   * Remove flow styles
   */
  private removeFlowStyles(): void {
    const flowItems = this.element.querySelectorAll('.proteus-flow-item');
    flowItems.forEach(item => {
      const htmlItem = item as HTMLElement;
      htmlItem.classList.remove('proteus-flow-item');
      htmlItem.style.removeProperty('--flow-order');
    });

    const styleElement = document.getElementById('proteus-flow-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * Remove accessibility features
   */
  private removeAccessibilityFeatures(): void {
    // Remove skip links
    const skipLinks = document.querySelectorAll('.proteus-skip-link');
    skipLinks.forEach(link => link.remove());

    // Reset tab indices
    this.state.tabOrder.forEach(element => {
      (element as HTMLElement).removeAttribute('tabindex');
    });
  }

  /**
   * Create initial state
   */
  private createInitialState(): FlowState {
    return {
      currentPattern: 'natural',
      direction: 'ltr',
      focusableElements: [],
      tabOrder: [],
      landmarks: new Map(),
      skipTargets: []
    };
  }
}
