/**
 * Comprehensive Browser Compatibility System for ProteusJS
 * Feature detection, polyfills, and graceful degradation
 */

import { logger } from '../utils/Logger';

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
  supported: boolean;
}

export interface FeatureSupport {
  containerQueries: boolean;
  clampFunction: boolean;
  customProperties: boolean;
  flexbox: boolean;
  grid: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  mutationObserver: boolean;
  requestAnimationFrame: boolean;
  webAnimations: boolean;
  prefersReducedMotion: boolean;
  prefersColorScheme: boolean;
  viewportUnits: boolean;
  calc: boolean;
  transforms: boolean;
  transitions: boolean;
  animations: boolean;
  webFonts: boolean;
  fontDisplay: boolean;
  fontVariationSettings: boolean;
}

export interface CompatibilityConfig {
  enablePolyfills: boolean;
  gracefulDegradation: boolean;
  fallbackStrategies: boolean;
  performanceOptimizations: boolean;
  legacySupport: boolean;
  modernFeatures: boolean;
  autoDetection: boolean;
}

export interface PolyfillInfo {
  name: string;
  required: boolean;
  loaded: boolean;
  size: number;
  url?: string;
  fallback?: () => void;
}

export class BrowserCompatibility {
  private browserInfo: BrowserInfo;
  private featureSupport: FeatureSupport;
  private config: Required<CompatibilityConfig>;
  private polyfills: Map<string, PolyfillInfo> = new Map();
  private fallbacks: Map<string, () => void> = new Map();
  private modernFeatures: Set<string> = new Set();
  private legacyFeatures: Set<string> = new Set();

  constructor(config: Partial<CompatibilityConfig> = {}) {
    this.config = {
      enablePolyfills: true,
      gracefulDegradation: true,
      fallbackStrategies: true,
      performanceOptimizations: true,
      legacySupport: true,
      modernFeatures: true,
      autoDetection: true,
      ...config
    };

    this.browserInfo = this.detectBrowser();
    this.featureSupport = this.detectFeatures();
    
    if (this.config.autoDetection) {
      this.initializeCompatibility();
    }
  }

  /**
   * Initialize compatibility system
   */
  public async initializeCompatibility(): Promise<void> {
    logger.info('Initializing browser compatibility system');
    
    // Apply browser-specific fixes
    this.applyBrowserFixes();
    
    // Load required polyfills
    if (this.config.enablePolyfills) {
      await this.loadPolyfills();
    }
    
    // Setup fallback strategies
    if (this.config.fallbackStrategies) {
      this.setupFallbacks();
    }
    
    // Apply performance optimizations
    if (this.config.performanceOptimizations) {
      this.applyPerformanceOptimizations();
    }
    
    // Setup modern feature detection
    if (this.config.modernFeatures) {
      this.setupModernFeatures();
    }
    
    logger.info('Browser compatibility system initialized', {
      browser: this.browserInfo,
      features: this.featureSupport
    });
  }

  /**
   * Detect browser information
   */
  private detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    let name = 'Unknown';
    let version = '0';
    let engine = 'Unknown';
    
    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match?.[1] || '0';
      engine = 'Blink';
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match?.[1] || '0';
      engine = 'Gecko';
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match?.[1] || '0';
      engine = 'WebKit';
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match?.[1] || '0';
      engine = 'Blink';
    }
    // Internet Explorer
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      name = 'Internet Explorer';
      const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
      version = match?.[1] || '0';
      engine = 'Trident';
    }

    const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const supported = this.isBrowserSupported(name, parseInt(version));

    return {
      name,
      version,
      engine,
      platform,
      mobile,
      supported
    };
  }

  /**
   * Check if browser is supported
   */
  private isBrowserSupported(name: string, version: number): boolean {
    const minimumVersions: Record<string, number> = {
      'Chrome': 60,
      'Firefox': 55,
      'Safari': 12,
      'Edge': 79,
      'Internet Explorer': 11
    };

    return version >= (minimumVersions[name] || 0);
  }

  /**
   * Detect feature support
   */
  private detectFeatures(): FeatureSupport {
    return {
      containerQueries: this.supportsContainerQueries(),
      clampFunction: this.supportsClamp(),
      customProperties: this.supportsCustomProperties(),
      flexbox: this.supportsFlexbox(),
      grid: this.supportsGrid(),
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      requestAnimationFrame: 'requestAnimationFrame' in window,
      webAnimations: 'animate' in document.createElement('div'),
      prefersReducedMotion: this.supportsMediaQuery('(prefers-reduced-motion: reduce)'),
      prefersColorScheme: this.supportsMediaQuery('(prefers-color-scheme: dark)'),
      viewportUnits: this.supportsViewportUnits(),
      calc: this.supportsCalc(),
      transforms: this.supportsTransforms(),
      transitions: this.supportsTransitions(),
      animations: this.supportsAnimations(),
      webFonts: this.supportsWebFonts(),
      fontDisplay: this.supportsFontDisplay(),
      fontVariationSettings: this.supportsFontVariationSettings()
    };
  }

  /**
   * Check container queries support
   */
  private supportsContainerQueries(): boolean {
    try {
      return CSS.supports('container-type', 'inline-size');
    } catch {
      return false;
    }
  }

  /**
   * Check clamp() function support
   */
  private supportsClamp(): boolean {
    try {
      return CSS.supports('width', 'clamp(1px, 2px, 3px)');
    } catch {
      return false;
    }
  }

  /**
   * Check CSS custom properties support
   */
  private supportsCustomProperties(): boolean {
    try {
      return CSS.supports('--test', '0');
    } catch {
      return false;
    }
  }

  /**
   * Check flexbox support
   */
  private supportsFlexbox(): boolean {
    try {
      return CSS.supports('display', 'flex');
    } catch {
      return false;
    }
  }

  /**
   * Check CSS Grid support
   */
  private supportsGrid(): boolean {
    try {
      return CSS.supports('display', 'grid');
    } catch {
      return false;
    }
  }

  /**
   * Check media query support
   */
  private supportsMediaQuery(query: string): boolean {
    try {
      return window.matchMedia(query).media === query;
    } catch {
      return false;
    }
  }

  /**
   * Check viewport units support
   */
  private supportsViewportUnits(): boolean {
    try {
      return CSS.supports('width', '1vw');
    } catch {
      return false;
    }
  }

  /**
   * Check calc() function support
   */
  private supportsCalc(): boolean {
    try {
      return CSS.supports('width', 'calc(1px + 1px)');
    } catch {
      return false;
    }
  }

  /**
   * Check CSS transforms support
   */
  private supportsTransforms(): boolean {
    try {
      return CSS.supports('transform', 'translateX(1px)');
    } catch {
      return false;
    }
  }

  /**
   * Check CSS transitions support
   */
  private supportsTransitions(): boolean {
    try {
      return CSS.supports('transition', 'all 1s');
    } catch {
      return false;
    }
  }

  /**
   * Check CSS animations support
   */
  private supportsAnimations(): boolean {
    try {
      return CSS.supports('animation', 'test 1s');
    } catch {
      return false;
    }
  }

  /**
   * Check web fonts support
   */
  private supportsWebFonts(): boolean {
    return 'fonts' in document;
  }

  /**
   * Check font-display support
   */
  private supportsFontDisplay(): boolean {
    try {
      return CSS.supports('font-display', 'swap');
    } catch {
      return false;
    }
  }

  /**
   * Check font-variation-settings support
   */
  private supportsFontVariationSettings(): boolean {
    try {
      return CSS.supports('font-variation-settings', '"wght" 400');
    } catch {
      return false;
    }
  }

  /**
   * Apply browser-specific fixes
   */
  private applyBrowserFixes(): void {
    // Internet Explorer fixes
    if (this.browserInfo.name === 'Internet Explorer') {
      this.applyIEFixes();
    }

    // Safari fixes
    if (this.browserInfo.name === 'Safari') {
      this.applySafariFixes();
    }

    // Firefox fixes
    if (this.browserInfo.name === 'Firefox') {
      this.applyFirefoxFixes();
    }

    // Mobile browser fixes
    if (this.browserInfo.mobile) {
      this.applyMobileFixes();
    }
  }

  /**
   * Apply Internet Explorer specific fixes
   */
  private applyIEFixes(): void {
    // Add IE-specific CSS class
    document.documentElement.classList.add('ie');

    // Fix viewport units in IE
    if (!this.featureSupport.viewportUnits) {
      this.addPolyfill('viewport-units', {
        name: 'Viewport Units Polyfill',
        required: true,
        loaded: false,
        size: 15000,
        fallback: this.viewportUnitsFallback.bind(this)
      });
    }

    // Fix flexbox in IE
    if (!this.featureSupport.flexbox) {
      this.addPolyfill('flexbox', {
        name: 'Flexbox Polyfill',
        required: true,
        loaded: false,
        size: 25000,
        fallback: this.flexboxFallback.bind(this)
      });
    }
  }

  /**
   * Apply Safari specific fixes
   */
  private applySafariFixes(): void {
    // Add Safari-specific CSS class
    document.documentElement.classList.add('safari');

    // Fix backdrop-filter in older Safari
    const safariVersion = parseInt(this.browserInfo.version);
    if (safariVersion < 14) {
      document.documentElement.classList.add('safari-old');
    }
  }

  /**
   * Apply Firefox specific fixes
   */
  private applyFirefoxFixes(): void {
    // Add Firefox-specific CSS class
    document.documentElement.classList.add('firefox');

    // Fix scrollbar styling in Firefox
    const style = document.createElement('style');
    style.textContent = `
      /* Firefox scrollbar styling */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(0,0,0,0.3) transparent;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Apply mobile browser fixes
   */
  private applyMobileFixes(): void {
    // Add mobile-specific CSS class
    document.documentElement.classList.add('mobile');

    // Fix viewport height on mobile
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Prevent zoom on input focus
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
  }

  /**
   * Load required polyfills
   */
  private async loadPolyfills(): Promise<void> {
    const requiredPolyfills = Array.from(this.polyfills.values())
      .filter(polyfill => polyfill.required && !polyfill.loaded);

    if (requiredPolyfills.length === 0) {
      return;
    }

    logger.info(`Loading ${requiredPolyfills.length} polyfills`);

    for (const polyfill of requiredPolyfills) {
      try {
        if (polyfill.url) {
          await this.loadPolyfillScript(polyfill);
        } else if (polyfill.fallback) {
          polyfill.fallback();
        }

        polyfill.loaded = true;
        logger.info(`Loaded polyfill: ${polyfill.name}`);
      } catch (error) {
        logger.error(`Failed to load polyfill ${polyfill.name}:`, error);

        // Try fallback if available
        if (polyfill.fallback) {
          polyfill.fallback();
          polyfill.loaded = true;
        }
      }
    }
  }

  /**
   * Load polyfill script
   */
  private loadPolyfillScript(polyfill: PolyfillInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = polyfill.url!;
      script.async = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${polyfill.url}`));

      document.head.appendChild(script);
    });
  }

  /**
   * Add polyfill to the system
   */
  private addPolyfill(name: string, info: PolyfillInfo): void {
    this.polyfills.set(name, info);
  }

  /**
   * Setup fallback strategies
   */
  private setupFallbacks(): void {
    // Container queries fallback
    if (!this.featureSupport.containerQueries) {
      this.fallbacks.set('container-queries', this.containerQueriesFallback.bind(this));
    }

    // Clamp function fallback
    if (!this.featureSupport.clampFunction) {
      this.fallbacks.set('clamp', this.clampFallback.bind(this));
    }

    // Custom properties fallback
    if (!this.featureSupport.customProperties) {
      this.fallbacks.set('custom-properties', this.customPropertiesFallback.bind(this));
    }

    // Intersection Observer fallback
    if (!this.featureSupport.intersectionObserver) {
      this.fallbacks.set('intersection-observer', this.intersectionObserverFallback.bind(this));
    }
  }

  /**
   * Container queries fallback
   */
  private containerQueriesFallback(): void {
    // Implement ResizeObserver-based container queries
    if (this.featureSupport.resizeObserver) {
      logger.info('Using ResizeObserver fallback for container queries');

      // Create a polyfill using ResizeObserver
      const style = document.createElement('style');
      style.id = 'container-queries-fallback';
      style.textContent = `
        /* Container queries fallback using ResizeObserver */
        [data-container-fallback] {
          position: relative;
        }

        [data-container="small"] {
          --container-size: small;
        }

        [data-container="medium"] {
          --container-size: medium;
        }

        [data-container="large"] {
          --container-size: large;
        }
      `;

      if (!document.getElementById('container-queries-fallback')) {
        document.head.appendChild(style);
      }

      // Setup ResizeObserver to simulate container queries
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const element = entry.target;
          const width = entry.contentRect.width;

          // Apply container size classes based on width
          element.removeAttribute('data-container');

          if (width <= 400) {
            element.setAttribute('data-container', 'small');
          } else if (width <= 800) {
            element.setAttribute('data-container', 'medium');
          } else {
            element.setAttribute('data-container', 'large');
          }
        });
      });

      // Observe all elements with container query attributes
      document.querySelectorAll('[data-container-fallback]').forEach((element) => {
        resizeObserver.observe(element);
      });

    } else {
      logger.warn('No fallback available for container queries');

      // Use media queries as last resort
      const style = document.createElement('style');
      style.textContent = `
        /* Media query fallback for container queries */
        @media (max-width: 400px) {
          [data-container-fallback] {
            --container-size: small;
          }
        }

        @media (min-width: 401px) and (max-width: 800px) {
          [data-container-fallback] {
            --container-size: medium;
          }
        }

        @media (min-width: 801px) {
          [data-container-fallback] {
            --container-size: large;
          }
        }
      `;

      document.head.appendChild(style);
    }
  }

  /**
   * Clamp function fallback
   */
  private clampFallback(): void {
    // Replace clamp() with calc() and media queries
    logger.info('Using calc() and media queries fallback for clamp()');

    const style = document.createElement('style');
    style.id = 'clamp-fallback';
    style.textContent = `
      /* Clamp fallback styles */
      .proteus-clamp {
        font-size: var(--min-size, 16px);
      }

      @media (min-width: 320px) {
        .proteus-clamp {
          font-size: calc(var(--min-size, 16px) + (var(--max-size, 24px) - var(--min-size, 16px)) * ((100vw - 320px) / (1200px - 320px)));
        }
      }

      @media (min-width: 1200px) {
        .proteus-clamp {
          font-size: var(--max-size, 24px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Custom properties fallback
   */
  private customPropertiesFallback(): void {
    logger.info('Using JavaScript fallback for CSS custom properties');

    // Create a simple CSS custom properties polyfill
    const customPropertiesMap = new Map<string, string>();

    // Parse existing custom properties
    const parseCustomProperties = (element: Element) => {
      const computedStyle = window.getComputedStyle(element);
      const cssText = (element as HTMLElement).style.cssText;

      // Extract custom properties from inline styles
      const customPropRegex = /--([\w-]+):\s*([^;]+)/g;
      let match;

      while ((match = customPropRegex.exec(cssText)) !== null) {
        if (match[1] && match[2]) {
          customPropertiesMap.set(`--${match[1]}`, match[2].trim());
        }
      }
    };

    // Apply custom properties polyfill
    const applyCustomProperties = (element: Element) => {
      const htmlElement = element as HTMLElement;
      const style = htmlElement.style;

      // Replace var() functions with actual values
      const cssText = style.cssText;
      const varRegex = /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g;

      let updatedCssText = cssText;
      let varMatch;

      while ((varMatch = varRegex.exec(cssText)) !== null) {
        const varName = varMatch[1];
        const fallbackValue = varMatch[2] || '';
        const value = customPropertiesMap.get(varName || '') || fallbackValue;

        if (value) {
          updatedCssText = updatedCssText.replace(varMatch[0], value);
        }
      }

      if (updatedCssText !== cssText) {
        htmlElement.style.cssText = updatedCssText;
      }
    };

    // Setup mutation observer to handle dynamic changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target as Element;
          parseCustomProperties(element);
          applyCustomProperties(element);
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style']
    });

    // Initial processing
    document.querySelectorAll('*').forEach((element) => {
      parseCustomProperties(element);
      applyCustomProperties(element);
    });
  }

  /**
   * Intersection Observer fallback
   */
  private intersectionObserverFallback(): void {
    logger.info('Using scroll event fallback for Intersection Observer');

    // Create a polyfill using scroll events
    class IntersectionObserverPolyfill {
      private callback: IntersectionObserverCallback;
      private elements: Set<Element> = new Set();
      private rootMargin: string;
      private threshold: number | number[];

      constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
        this.callback = callback;
        this.rootMargin = options.rootMargin || '0px';
        this.threshold = options.threshold || 0;

        this.setupScrollListener();
      }

      observe(element: Element): void {
        this.elements.add(element);
        this.checkIntersection();
      }

      unobserve(element: Element): void {
        this.elements.delete(element);
      }

      disconnect(): void {
        this.elements.clear();
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleScroll);
      }

      private setupScrollListener(): void {
        this.handleScroll = this.handleScroll.bind(this);
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        window.addEventListener('resize', this.handleScroll, { passive: true });
      }

      private handleScroll = (): void => {
        this.checkIntersection();
      };

      private checkIntersection(): void {
        const entries: IntersectionObserverEntry[] = [];

        this.elements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const windowWidth = window.innerWidth;

          // Calculate intersection
          const isIntersecting = rect.top < windowHeight &&
                                rect.bottom > 0 &&
                                rect.left < windowWidth &&
                                rect.right > 0;

          // Calculate intersection ratio (simplified)
          let intersectionRatio = 0;
          if (isIntersecting) {
            const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
            const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
            const visibleArea = visibleHeight * visibleWidth;
            const totalArea = rect.height * rect.width;
            intersectionRatio = totalArea > 0 ? visibleArea / totalArea : 0;
          }

          entries.push({
            target: element,
            isIntersecting,
            intersectionRatio,
            boundingClientRect: rect,
            intersectionRect: rect, // Simplified
            rootBounds: { top: 0, left: 0, bottom: windowHeight, right: windowWidth, width: windowWidth, height: windowHeight },
            time: Date.now()
          } as IntersectionObserverEntry);
        });

        if (entries.length > 0) {
          this.callback(entries, this as any);
        }
      }
    }

    // Replace global IntersectionObserver if not available
    if (!(window as any).IntersectionObserver) {
      (window as any).IntersectionObserver = IntersectionObserverPolyfill;
    }
  }

  /**
   * Viewport units fallback
   */
  private viewportUnitsFallback(): void {
    logger.info('Using JavaScript fallback for viewport units');

    const updateViewportUnits = () => {
      const vw = window.innerWidth / 100;
      const vh = window.innerHeight / 100;

      document.documentElement.style.setProperty('--vw', `${vw}px`);
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateViewportUnits();
    window.addEventListener('resize', updateViewportUnits);
  }

  /**
   * Flexbox fallback
   */
  private flexboxFallback(): void {
    logger.info('Using table/inline-block fallback for flexbox');

    const style = document.createElement('style');
    style.textContent = `
      /* Flexbox fallback */
      .proteus-flex {
        display: table;
        width: 100%;
      }

      .proteus-flex-item {
        display: table-cell;
        vertical-align: middle;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Apply performance optimizations
   */
  private applyPerformanceOptimizations(): void {
    // Optimize for older browsers
    if (!this.browserInfo.supported) {
      this.applyLegacyOptimizations();
    }

    // Optimize for mobile
    if (this.browserInfo.mobile) {
      this.applyMobileOptimizations();
    }

    // Optimize based on feature support
    this.applyFeatureBasedOptimizations();
  }

  /**
   * Apply legacy browser optimizations
   */
  private applyLegacyOptimizations(): void {
    // Reduce animation complexity
    document.documentElement.classList.add('legacy-browser');

    const style = document.createElement('style');
    style.textContent = `
      .legacy-browser * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Apply mobile optimizations
   */
  private applyMobileOptimizations(): void {
    // Optimize touch interactions
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile optimizations */
      * {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      button, a, [role="button"] {
        min-height: 44px;
        min-width: 44px;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Apply feature-based optimizations
   */
  private applyFeatureBasedOptimizations(): void {
    // Use hardware acceleration when available
    if (this.featureSupport.transforms) {
      document.documentElement.classList.add('transforms-supported');
    }

    // Optimize animations
    if (!this.featureSupport.webAnimations) {
      document.documentElement.classList.add('no-web-animations');
    }
  }

  /**
   * Setup modern features
   */
  private setupModernFeatures(): void {
    // Enable modern features based on support
    Object.entries(this.featureSupport).forEach(([feature, supported]) => {
      if (supported) {
        this.modernFeatures.add(feature);
        document.documentElement.classList.add(`supports-${feature.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      } else {
        this.legacyFeatures.add(feature);
        document.documentElement.classList.add(`no-${feature.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      }
    });
  }

  /**
   * Get browser information
   */
  public getBrowserInfo(): BrowserInfo {
    return { ...this.browserInfo };
  }

  /**
   * Get feature support information
   */
  public getFeatureSupport(): FeatureSupport {
    return { ...this.featureSupport };
  }

  /**
   * Check if specific feature is supported
   */
  public isFeatureSupported(feature: keyof FeatureSupport): boolean {
    return this.featureSupport[feature];
  }

  /**
   * Get compatibility report
   */
  public getCompatibilityReport(): {
    browser: BrowserInfo;
    features: FeatureSupport;
    polyfills: PolyfillInfo[];
    modernFeatures: string[];
    legacyFeatures: string[];
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (!this.browserInfo.supported) {
      recommendations.push('Consider upgrading to a modern browser for better performance');
    }

    if (this.legacyFeatures.size > 5) {
      recommendations.push('Many modern features are not supported - consider using polyfills');
    }

    if (this.browserInfo.name === 'Internet Explorer') {
      recommendations.push('Internet Explorer support is limited - consider migrating to Edge');
    }

    return {
      browser: this.getBrowserInfo(),
      features: this.getFeatureSupport(),
      polyfills: Array.from(this.polyfills.values()),
      modernFeatures: Array.from(this.modernFeatures),
      legacyFeatures: Array.from(this.legacyFeatures),
      recommendations
    };
  }

  /**
   * Enable graceful degradation for specific feature
   */
  public enableGracefulDegradation(feature: string, fallback: () => void): void {
    this.fallbacks.set(feature, fallback);

    // Apply fallback if feature is not supported
    if (!this.modernFeatures.has(feature)) {
      fallback();
    }
  }

  /**
   * Cleanup compatibility system
   */
  public destroy(): void {
    // Remove added styles
    const styles = document.querySelectorAll('style[id*="proteus"], style[id*="clamp-fallback"]');
    styles.forEach(style => style.remove());

    // Clear maps
    this.polyfills.clear();
    this.fallbacks.clear();
    this.modernFeatures.clear();
    this.legacyFeatures.clear();

    logger.info('Browser compatibility system destroyed');
  }
}
