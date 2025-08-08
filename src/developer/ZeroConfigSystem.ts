/**
 * Zero-Config Setup System for ProteusJS
 * Automatic container detection, intelligent defaults, and optimization
 */

export interface ZeroConfigOptions {
  autoDetectContainers: boolean;
  intelligentBreakpoints: boolean;
  autoTypographyScaling: boolean;
  performanceOptimization: boolean;
  accessibilityOptimization: boolean;
  autoThemeDetection: boolean;
  responsiveImages: boolean;
  lazyLoading: boolean;
}

export interface DetectedContainer {
  element: Element;
  type: 'grid' | 'flex' | 'block' | 'inline';
  suggestedBreakpoints: Record<string, string>;
  priority: 'high' | 'normal' | 'low';
  confidence: number;
}

export interface AutoOptimization {
  performance: string[];
  accessibility: string[];
  typography: string[];
  layout: string[];
}

export class ZeroConfigSystem {
  private config: Required<ZeroConfigOptions>;
  private detectedContainers: Map<Element, DetectedContainer> = new Map();
  private appliedOptimizations: AutoOptimization;
  private observer: MutationObserver | null = null;

  constructor(config: Partial<ZeroConfigOptions> = {}) {
    this.config = {
      autoDetectContainers: true,
      intelligentBreakpoints: true,
      autoTypographyScaling: true,
      performanceOptimization: true,
      accessibilityOptimization: true,
      autoThemeDetection: true,
      responsiveImages: true,
      lazyLoading: true,
      ...config
    };

    this.appliedOptimizations = {
      performance: [],
      accessibility: [],
      typography: [],
      layout: []
    };
  }

  /**
   * Initialize zero-config setup
   */
  public async initialize(): Promise<void> {
    console.log('🚀 ProteusJS Zero-Config Setup Starting...');

    if (this.config.autoDetectContainers) {
      await this.detectContainers();
    }

    if (this.config.intelligentBreakpoints) {
      await this.setupIntelligentBreakpoints();
    }

    if (this.config.autoTypographyScaling) {
      await this.setupTypographyScaling();
    }

    if (this.config.performanceOptimization) {
      await this.applyPerformanceOptimizations();
    }

    if (this.config.accessibilityOptimization) {
      await this.applyAccessibilityOptimizations();
    }

    if (this.config.autoThemeDetection) {
      await this.setupAutoTheme();
    }

    if (this.config.responsiveImages) {
      await this.optimizeImages();
    }

    this.setupContinuousOptimization();
    
    console.log('✅ ProteusJS Zero-Config Setup Complete!');
    this.logOptimizations();
  }

  /**
   * Automatically detect containers in the DOM
   */
  private async detectContainers(): Promise<void> {
    const candidates = document.querySelectorAll('*');
    const containers: DetectedContainer[] = [];

    candidates.forEach(element => {
      const container = this.analyzeElement(element);
      if (container) {
        containers.push(container);
        this.detectedContainers.set(element, container);
      }
    });

    // Sort by priority and confidence
    containers.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.confidence - a.confidence;
    });

    console.log(`🔍 Detected ${containers.length} potential containers`);
  }

  /**
   * Analyze element to determine if it's a container
   */
  private analyzeElement(element: Element): DetectedContainer | null {
    const styles = window.getComputedStyle(element);
    const children = element.children.length;
    const rect = element.getBoundingClientRect();

    // Skip if too small or no children
    if (rect.width < 100 || rect.height < 50 || children === 0) {
      return null;
    }

    let type: DetectedContainer['type'] = 'block';
    let confidence = 0;
    let priority: DetectedContainer['priority'] = 'normal';

    // Detect container type
    if (styles.display === 'grid') {
      type = 'grid';
      confidence += 0.4;
    } else if (styles.display === 'flex') {
      type = 'flex';
      confidence += 0.3;
    } else if (styles.display === 'inline-block' || styles.display === 'inline-flex') {
      type = 'inline';
      confidence += 0.2;
    }

    // Increase confidence based on characteristics
    if (children >= 3) confidence += 0.2;
    if (rect.width > 300) confidence += 0.1;
    if (element.classList.length > 0) confidence += 0.1;
    if (element.id) confidence += 0.1;

    // Determine priority
    if (element.matches('main, .main, #main, .container, .wrapper')) {
      priority = 'high';
      confidence += 0.2;
    } else if (element.matches('section, article, aside, nav, header, footer')) {
      priority = 'normal';
      confidence += 0.1;
    }

    // Skip if confidence too low
    if (confidence < 0.3) return null;

    return {
      element,
      type,
      suggestedBreakpoints: this.generateBreakpoints(rect.width),
      priority,
      confidence
    };
  }

  /**
   * Generate intelligent breakpoints based on content
   */
  private generateBreakpoints(width: number): Record<string, string> {
    const breakpoints: Record<string, string> = {};

    // Base breakpoints on golden ratio and common device sizes
    const ratios = [0.618, 0.8, 1.0, 1.2, 1.618];
    const names = ['xs', 'sm', 'md', 'lg', 'xl'];

    ratios.forEach((ratio, index) => {
      const size = Math.round(width * ratio);
      if (size >= 200 && size <= 1920) {
        const name = names[index];
        if (name) {
          breakpoints[name] = `${size}px`;
        }
      }
    });

    return breakpoints;
  }

  /**
   * Setup intelligent breakpoints for detected containers
   */
  private async setupIntelligentBreakpoints(): Promise<void> {
    this.detectedContainers.forEach((container, element) => {
      // Apply container queries
      const className = this.generateClassName(element);
      element.classList.add(className);

      // Generate CSS for breakpoints
      this.generateBreakpointCSS(className, container.suggestedBreakpoints);
    });

    this.appliedOptimizations.layout.push('Intelligent breakpoints applied');
  }

  /**
   * Setup automatic typography scaling
   */
  private async setupTypographyScaling(): Promise<void> {
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
    
    textElements.forEach(element => {
      const container = this.findParentContainer(element);
      if (container) {
        this.applyFluidTypography(element, container);
      }
    });

    this.appliedOptimizations.typography.push('Fluid typography scaling applied');
  }

  /**
   * Apply performance optimizations
   */
  private async applyPerformanceOptimizations(): Promise<void> {
    // Enable passive event listeners
    this.enablePassiveListeners();
    
    // Optimize images
    if (this.config.responsiveImages) {
      this.optimizeImages();
    }
    
    // Enable lazy loading
    if (this.config.lazyLoading) {
      this.enableLazyLoading();
    }

    this.appliedOptimizations.performance.push(
      'Passive event listeners',
      'Image optimization',
      'Lazy loading'
    );
  }

  /**
   * Apply accessibility optimizations
   */
  private async applyAccessibilityOptimizations(): Promise<void> {
    // Add missing ARIA labels
    this.addMissingAriaLabels();
    
    // Improve focus indicators
    this.improveFocusIndicators();
    
    // Ensure proper heading hierarchy
    this.validateHeadingHierarchy();
    
    // Add skip links
    this.addSkipLinks();

    this.appliedOptimizations.accessibility.push(
      'ARIA labels added',
      'Focus indicators improved',
      'Heading hierarchy validated',
      'Skip links added'
    );
  }

  /**
   * Setup automatic theme detection
   */
  private async setupAutoTheme(): Promise<void> {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersDark) {
      document.body.classList.add('proteus-dark');
    }
    
    if (prefersHighContrast) {
      document.body.classList.add('proteus-high-contrast');
    }

    // Listen for changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      document.body.classList.toggle('proteus-dark', e.matches);
    });
  }

  /**
   * Optimize images automatically
   */
  private async optimizeImages(): Promise<void> {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading="lazy" if not present
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      
      // Suggest responsive image attributes
      if (!img.hasAttribute('sizes') && !img.hasAttribute('srcset')) {
        const container = this.findParentContainer(img);
        if (container) {
          this.addResponsiveImageAttributes(img, container);
        }
      }
    });
  }

  /**
   * Enable lazy loading for various elements
   */
  private enableLazyLoading(): Promise<void> {
    return new Promise((resolve) => {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target;
              element.classList.add('proteus-loaded');
              observer.unobserve(element);
            }
          });
        });

        // Observe images, videos, and iframes
        document.querySelectorAll('img, video, iframe').forEach(element => {
          observer.observe(element);
        });
      }
      resolve();
    });
  }

  /**
   * Setup continuous optimization
   */
  private setupContinuousOptimization(): void {
    // Watch for DOM changes
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.optimizeNewElement(node as Element);
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Optimize newly added elements
   */
  private optimizeNewElement(element: Element): void {
    // Check if it's a potential container
    const container = this.analyzeElement(element);
    if (container) {
      this.detectedContainers.set(element, container);
      
      if (this.config.intelligentBreakpoints) {
        const className = this.generateClassName(element);
        element.classList.add(className);
        this.generateBreakpointCSS(className, container.suggestedBreakpoints);
      }
    }

    // Optimize images
    if (this.config.responsiveImages) {
      const images = element.querySelectorAll('img');
      images.forEach(_img => this.optimizeImages());
    }

    // Apply accessibility improvements
    if (this.config.accessibilityOptimization) {
      this.addMissingAriaLabels(element);
    }
  }

  /**
   * Helper methods
   */
  private generateClassName(element: Element): string {
    const id = element.id || '';
    const classes = Array.from(element.classList).join('-');
    const tag = element.tagName.toLowerCase();
    return `proteus-${tag}-${id || classes || Math.random().toString(36).substring(2, 11)}`;
  }

  private generateBreakpointCSS(className: string, breakpoints: Record<string, string>): void {
    let css = '';
    Object.entries(breakpoints).forEach(([name, size]) => {
      css += `
        .${className} {
          container-type: inline-size;
        }
        @container (min-width: ${size}) {
          .${className} {
            --proteus-breakpoint: ${name};
          }
        }
      `;
    });

    // Add CSS to document
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  private findParentContainer(element: Element): DetectedContainer | null {
    let parent = element.parentElement;
    while (parent) {
      const container = this.detectedContainers.get(parent);
      if (container) return container;
      parent = parent.parentElement;
    }
    return null;
  }

  private applyFluidTypography(element: Element, _container: DetectedContainer): void {
    const htmlElement = element as HTMLElement;
    const currentSize = parseFloat(window.getComputedStyle(element).fontSize);
    
    // Calculate fluid typography based on container
    const minSize = Math.max(currentSize * 0.8, 12);
    const maxSize = currentSize * 1.5;
    
    htmlElement.style.fontSize = `clamp(${minSize}px, 4cw, ${maxSize}px)`;
  }

  private enablePassiveListeners(): void {
    // Override addEventListener to use passive listeners where appropriate
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      const passiveEvents = ['scroll', 'wheel', 'touchstart', 'touchmove'];
      if (passiveEvents.includes(type) && typeof options !== 'object') {
        options = { passive: true };
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  private addMissingAriaLabels(root: Element = document.body): void {
    // Add labels to buttons without text
    const buttons = root.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.textContent?.trim()) {
        button.setAttribute('aria-label', 'Button');
      }
    });

    // Add labels to form inputs
    const inputs = root.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const type = input.getAttribute('type') || 'text';
      input.setAttribute('aria-label', `${type} input`);
    });
  }

  private improveFocusIndicators(): void {
    const style = document.createElement('style');
    style.textContent = `
      *:focus {
        outline: 2px solid #4A90E2 !important;
        outline-offset: 2px !important;
      }
      .proteus-focus-visible:focus-visible {
        outline: 3px solid #4A90E2 !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  private validateHeadingHierarchy(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        console.warn(`Heading hierarchy issue: ${heading.tagName} follows h${lastLevel}`);
      }
      lastLevel = level;
    });
  }

  private addSkipLinks(): void {
    const main = document.querySelector('main, [role="main"], #main');
    if (main && !document.querySelector('.proteus-skip-link')) {
      const skipLink = document.createElement('a');
      skipLink.href = '#main';
      skipLink.textContent = 'Skip to main content';
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
      `;
      
      skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
      });
      
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }

  private addResponsiveImageAttributes(img: HTMLImageElement, container: DetectedContainer): void {
    const breakpoints = Object.values(container.suggestedBreakpoints);
    const sizes = breakpoints.map((bp, index) => {
      const width = parseInt(bp);
      return index === breakpoints.length - 1 ? `${width}px` : `(max-width: ${width}px) ${width}px`;
    }).join(', ');
    
    img.setAttribute('sizes', sizes);
  }

  private logOptimizations(): void {
    console.group('🎯 ProteusJS Auto-Optimizations Applied');
    
    Object.entries(this.appliedOptimizations).forEach(([category, optimizations]) => {
      if (optimizations.length > 0) {
        console.group(`${category.charAt(0).toUpperCase() + category.slice(1)}:`);
        optimizations.forEach((opt: string) => console.log(`✅ ${opt}`));
        console.groupEnd();
      }
    });
    
    console.log(`📊 Detected ${this.detectedContainers.size} containers`);
    console.groupEnd();
  }

  /**
   * Get optimization report
   */
  public getOptimizationReport(): {
    containers: number;
    optimizations: AutoOptimization;
    detectedContainers: DetectedContainer[];
  } {
    return {
      containers: this.detectedContainers.size,
      optimizations: this.appliedOptimizations,
      detectedContainers: Array.from(this.detectedContainers.values())
    };
  }

  /**
   * Destroy zero-config system
   */
  public destroy(): void {
    this.observer?.disconnect();
    this.detectedContainers.clear();
  }
}
