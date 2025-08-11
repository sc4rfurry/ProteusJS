/**
 * ProteusJS - Main library class
 * Shape-shifting responsive design that adapts like the sea god himself
 */

import { ProteusConfig, TypographyConfig, LayoutConfig, AccessibilityConfig } from '../types';
import { ContainerOptions } from '../containers/SmartContainer';
import { SmartContainer } from '../containers/SmartContainer';
import { ScalingConfig } from '../typography/ClampScaling';
import { ScaleConfig, TypeScale } from '../typography/TypographicScale';
import { GridConfig } from '../layout/AdaptiveGrid';
import { logger } from '../utils/Logger';
import { EventSystem } from './EventSystem';
import { PluginSystem } from './PluginSystem';

import { MemoryManager } from './MemoryManager';
import { ObserverManager } from '../observers/ObserverManager';
import { ContainerManager } from '../containers/ContainerManager';
import { ClampScaling } from '../typography/ClampScaling';
import { TypographicScale } from '../typography/TypographicScale';
import { TextFitting } from '../typography/TextFitting';
import { LineHeightOptimizer } from '../typography/LineHeightOptimizer';
import { VerticalRhythm } from '../typography/VerticalRhythm';
import { AdaptiveGrid } from '../layout/AdaptiveGrid';
import { FlexboxEnhancer } from '../layout/FlexboxEnhancer';
import { FlowLayout } from '../layout/FlowLayout';
import { SpacingSystem } from '../layout/SpacingSystem';
import { ContentReordering } from '../layout/ContentReordering';
import { ResponsiveImages } from '../content/ResponsiveImages';
import { AccessibilityEngine } from '../accessibility/AccessibilityEngine';
import { EfficientEventHandler } from '../performance/EfficientEventHandler';
import { FluidTypography } from '../typography/FluidTypography';
import { ContainerBreakpoints } from '../containers/ContainerBreakpoints';
import { BrowserCompatibility } from '../compatibility/BrowserCompatibility';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';
import { BatchDOMOperations } from '../performance/BatchDOMOperations';
import { LazyEvaluationSystem } from '../performance/LazyEvaluationSystem';
import { CSSOptimizationEngine } from '../performance/CSSOptimizationEngine';
import { MemoryManagementSystem } from '../performance/MemoryManagementSystem';
import { CacheOptimizationSystem } from '../performance/CacheOptimizationSystem';
import { SmartThemeSystem } from '../theming/SmartThemeSystem';
import { FLIPAnimationSystem, MicroInteractions, ScrollAnimations } from '../animations/FLIPAnimationSystem';
import { ZeroConfigSystem } from '../developer/ZeroConfigSystem';
import { BrowserPolyfills } from '../polyfills/BrowserPolyfills';
import { getSupportInfo, isSupported } from '../utils/support';
import { version } from '../utils/version';

export class ProteusJS {
  private static instance: ProteusJS | null = null;
  private config!: Required<ProteusConfig>;
  private eventSystem!: EventSystem;
  private pluginSystem!: PluginSystem;
  private performanceMonitor!: PerformanceMonitor;
  private memoryManager!: MemoryManager;
  private observerManager!: ObserverManager;
  private containerManager!: ContainerManager;
  private clampScaling!: ClampScaling;
  private typographicScale!: TypographicScale;
  private textFitting!: TextFitting;
  private lineHeightOptimizer!: LineHeightOptimizer;
  private verticalRhythm!: VerticalRhythm;
  private eventHandler!: EfficientEventHandler;
  private batchDOM!: BatchDOMOperations;
  private lazyEvaluation!: LazyEvaluationSystem;
  private cssOptimizer!: CSSOptimizationEngine;
  private themeSystem!: SmartThemeSystem;
  private flipAnimations!: FLIPAnimationSystem;
  private scrollAnimations!: ScrollAnimations;
  private memoryManagement!: MemoryManagementSystem;
  private cacheOptimization!: CacheOptimizationSystem;
  private zeroConfig!: ZeroConfigSystem;
  private browserPolyfills!: BrowserPolyfills;
  private fluidTypography!: FluidTypography;
  private containerBreakpoints!: ContainerBreakpoints;
  private accessibilityEngine!: AccessibilityEngine;
  private browserCompatibility!: BrowserCompatibility;
  private initialized: boolean = false;

  constructor(config: ProteusConfig = {}) {
    // Singleton pattern to ensure only one instance
    if (ProteusJS.instance) {
      return ProteusJS.instance;
    }

    this.config = this.mergeConfig(config);
    this.eventSystem = new EventSystem();
    this.pluginSystem = new PluginSystem(this);

    this.memoryManager = new MemoryManager();
    this.observerManager = new ObserverManager();
    this.containerManager = new ContainerManager(
      this.config.containers,
      this.observerManager,
      this.memoryManager,
      this.eventSystem
    );
    this.clampScaling = new ClampScaling();
    this.typographicScale = new TypographicScale();
    this.textFitting = new TextFitting();
    this.lineHeightOptimizer = new LineHeightOptimizer();
    this.verticalRhythm = new VerticalRhythm({
      baseFontSize: 16,
      baseLineHeight: 1.5,
      baselineUnit: 24,
      scale: 'minor-third',
      precision: 0.001,
      responsive: true,
      containerAware: true
    });
    this.eventHandler = new EfficientEventHandler({
      debounceDelay: 16,
      useRAF: true,
      batchOperations: true,
      performanceTarget: 16.67
    });
    this.batchDOM = new BatchDOMOperations({
      maxBatchSize: 50,
      separateReadWrite: true,
      autoFlush: true
    });
    this.lazyEvaluation = new LazyEvaluationSystem({
      useIdleCallback: true,
      progressiveEnhancement: true,
      cacheResults: true
    });
    this.cssOptimizer = new CSSOptimizationEngine({
      deduplication: true,
      criticalCSS: true,
      unusedStyleRemoval: true
    });
    this.themeSystem = new SmartThemeSystem({
      autoDetect: true,
      respectSystemPreference: true,
      adaptiveContrast: true
    });
    this.flipAnimations = new FLIPAnimationSystem({
      respectMotionPreference: true,
      batchAnimations: true
    });
    this.scrollAnimations = new ScrollAnimations();
    this.memoryManagement = new MemoryManagementSystem({
      autoCleanup: true,
      leakDetection: true
    });
    this.cacheOptimization = new CacheOptimizationSystem({
      maxSize: 100,
      evictionStrategy: 'adaptive'
    });
    this.zeroConfig = new ZeroConfigSystem({
      autoDetectContainers: true,
      intelligentBreakpoints: true,
      performanceOptimization: true
    });
    this.browserPolyfills = BrowserPolyfills.getInstance();
    this.performanceMonitor = new PerformanceMonitor();
    this.fluidTypography = new FluidTypography();
    this.containerBreakpoints = new ContainerBreakpoints();
    this.accessibilityEngine = new AccessibilityEngine(document.body);
    this.browserCompatibility = new BrowserCompatibility();

    // Connect performance monitoring
    this.fluidTypography.setPerformanceMonitor(this.performanceMonitor);
    this.containerBreakpoints.setPerformanceMonitor(this.performanceMonitor);

    ProteusJS.instance = this;

    // Auto-initialize if configured
    if (this.config.autoInit) {
      this.init();
    }
  }

  /**
   * Public getters for subsystems
   */
  public get typography(): FluidTypography {
    return this.fluidTypography;
  }

  public get containers(): ContainerBreakpoints {
    return this.containerBreakpoints;
  }

  public get performance(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  public get accessibility(): AccessibilityEngine {
    return this.accessibilityEngine;
  }

  public get compatibility(): BrowserCompatibility {
    return this.browserCompatibility;
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): Required<ProteusConfig> {
    return this.config;
  }

  /**
   * Initialize ProteusJS (async version)
   */
  public async initialize(): Promise<this> {
    return this.init();
  }

  /**
   * Initialize ProteusJS
   */
  public init(): this {
    if (this.initialized) {
      if (this.config.debug) {
        logger.warn('Already initialized');
      }
      return this;
    }

    // Check browser support
    if (!isSupported()) {
      logger.error('Browser not supported. Missing required APIs.');
      return this;
    }

    if (this.config.debug) {
      logger.info('Initializing...', {
        version,
        config: this.config,
        support: getSupportInfo()
      });
    }

    // Start performance monitoring
    this.performanceMonitor.start();

    // Initialize core systems
    this.eventSystem.init();
    this.pluginSystem.init();
    this.eventHandler.initialize();

    // Initialize zero-config system for automatic optimization
    this.zeroConfig.initialize().catch(error => {
      logger.warn('Zero-config initialization failed', error);
    });

    // Mark as initialized
    this.initialized = true;

    // Emit initialization event
    this.eventSystem.emit('init', { config: this.config });

    if (this.config.debug) {
      logger.info('Initialized successfully');
    }

    return this;
  }

  /**
   * Get browser capabilities
   */
  public getBrowserCapabilities(): any {
    const support = this.browserPolyfills?.checkBrowserSupport() || { supported: [], missing: [] };

    // Convert to expected format
    return {
      resizeObserver: support.supported.includes('ResizeObserver'),
      intersectionObserver: support.supported.includes('IntersectionObserver'),
      containerQueries: support.supported.includes('CSS Container Queries'),
      cssClamp: support.supported.includes('CSS clamp()'),
      customProperties: support.supported.includes('CSS Custom Properties'),
      matchMedia: support.supported.includes('matchMedia'),
      mutationObserver: support.supported.includes('MutationObserver')
    };
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): any {
    return this.performanceMonitor?.getMetrics() || {};
  }

  /**
   * Detect browser features
   */
  public detectFeatures(): any {
    const capabilities = this.getBrowserCapabilities();
    const support = this.browserPolyfills?.checkBrowserSupport() || { supported: [], missing: [] };

    return {
      // Include individual capability flags
      resizeObserver: capabilities.resizeObserver,
      intersectionObserver: capabilities.intersectionObserver,
      containerQueries: capabilities.containerQueries,
      cssClamp: capabilities.cssClamp,
      customProperties: capabilities.customProperties,
      flexbox: capabilities.flexbox,
      grid: capabilities.grid,
      // Include arrays for detailed info
      supported: support.supported,
      missing: support.missing,
      polyfillsActive: support.missing.length > 0
    };
  }

  /**
   * Update live region for screen readers
   */
  public updateLiveRegion(element: Element, message: string): void {
    if (element instanceof HTMLElement) {
      element.textContent = message;
      element.setAttribute('aria-live', 'polite');
    }
  }



  /**
   * Destroy ProteusJS instance and clean up resources
   */
  public destroy(): void {
    if (!this.initialized) return;

    if (this.config.debug) {
      console.log('ProteusJS: Destroying...');
    }

    // Clean up systems
    this.containerManager.destroy();
    this.observerManager.destroy();
    this.memoryManager.destroy();
    this.performanceMonitor.stop();
    this.eventHandler.destroy();
    this.batchDOM.destroy();
    this.lazyEvaluation.destroy();
    this.cssOptimizer.destroy();
    this.themeSystem.destroy();
    this.flipAnimations.destroy();
    this.scrollAnimations.destroy();
    this.memoryManagement.destroy();
    this.cacheOptimization.destroy();
    this.zeroConfig.destroy();
    this.pluginSystem.destroy();
    this.eventSystem.destroy();

    // Reset state
    this.initialized = false;
    ProteusJS.instance = null;

    if (this.config.debug) {
      console.log('ProteusJS: Destroyed');
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<ProteusConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ProteusConfig>): this {
    this.config = this.mergeConfig(newConfig, this.config);
    this.eventSystem.emit('configUpdate', { config: this.config });
    return this;
  }

  /**
   * Get event system instance
   */
  public getEventSystem(): EventSystem {
    return this.eventSystem;
  }

  /**
   * Get plugin system instance
   */
  public getPluginSystem(): PluginSystem {
    return this.pluginSystem;
  }

  /**
   * Get performance monitor instance
   */
  public getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Get memory manager instance
   */
  public getMemoryManager(): MemoryManager {
    return this.memoryManager;
  }

  /**
   * Get observer manager instance
   */
  public getObserverManager(): ObserverManager {
    return this.observerManager;
  }

  /**
   * Get container manager instance
   */
  public getContainerManager(): ContainerManager {
    return this.containerManager;
  }

  /**
   * Create a container with responsive behavior
   */
  public container(selector: string | Element | Element[], options?: ContainerOptions): SmartContainer | SmartContainer[] {
    return this.containerManager.container(selector, options);
  }

  /**
   * Create fluid typography scaling
   */
  public fluidType(selector: string | Element | Element[], config?: ScalingConfig): void {
    const elements = this.normalizeSelector(selector);
    elements.forEach(element => {
      // Apply fluid typography using clamp scaling
      const defaultConfig: ScalingConfig = {
        minSize: 16,
        maxSize: 24,
        minContainer: 320,
        maxContainer: 1200,
        unit: 'px',
        containerUnit: 'px',
        curve: 'linear'
      };
      const scaling = this.clampScaling.createScaling(config || defaultConfig);
      (element as HTMLElement).style.fontSize = scaling.clampValue;

      // Apply default line height for accessibility
      const computedStyle = getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      (element as HTMLElement).style.lineHeight = `${fontSize * 1.5}px`;
    });
  }

  /**
   * Generate typographic scale
   */
  public createTypeScale(config?: ScaleConfig): TypeScale | number[] {
    const defaultConfig: ScaleConfig = {
      ratio: 1.25,
      baseSize: 16,
      baseUnit: 'px',
      levels: 6,
      direction: 'both'
    };
    return this.typographicScale.generateScale(config || defaultConfig);
  }

  /**
   * Create adaptive grid layout
   */
  public createGrid(selector: string | Element, config?: Partial<GridConfig>): AdaptiveGrid | null {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Grid element not found');
      return null;
    }

    const grid = new AdaptiveGrid(element, config);
    grid.activate();
    return grid;
  }

  /**
   * Apply text fitting to elements
   */
  public fitText(selector: string | Element | Element[], config?: any) {
    const elements = this.normalizeSelector(selector);
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const text = element.textContent || '';
      const result = this.textFitting.fitText(element, text, rect.width, rect.height, config);
      this.textFitting.applyFitting(element, result, config);
    });
  }

  /**
   * Apply vertical rhythm to elements
   */
  public applyRhythm(selector: string | Element | Element[], _config?: unknown): void {
    const elements = this.normalizeSelector(selector);
    elements.forEach(element => {
      const rhythm = this.verticalRhythm.generateRhythm();
      this.verticalRhythm.applyRhythm(element, rhythm);
    });
  }

  /**
   * Create enhanced flexbox layout
   */
  public createFlexbox(selector: string | Element, config?: any) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Flexbox element not found');
      return null;
    }

    const flexbox = new FlexboxEnhancer(element, config);
    flexbox.activate();
    return flexbox;
  }

  /**
   * Apply flow layout
   */
  public applyFlow(selector: string | Element, config?: any) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Flow element not found');
      return null;
    }

    const flow = new FlowLayout(element, config);
    flow.activate();
    return flow;
  }

  /**
   * Apply spacing system
   */
  public applySpacing(selector: string | Element, config?: any) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Spacing element not found');
      return null;
    }

    const spacing = new SpacingSystem(element, config);
    spacing.activate();
    return spacing;
  }

  /**
   * Enable content reordering
   */
  public enableReordering(selector: string | Element, config?: any) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Reordering element not found');
      return null;
    }

    const reordering = new ContentReordering(element, config);
    reordering.activate();
    return reordering;
  }

  /**
   * Enable responsive images
   */
  public responsiveImages(selector: string | Element | Element[], config?: any) {
    const elements = this.normalizeSelector(selector);
    const instances: ResponsiveImages[] = [];

    elements.forEach(element => {
      const responsiveImage = new ResponsiveImages(element, config);
      responsiveImage.activate();
      instances.push(responsiveImage);
    });

    return instances.length === 1 ? instances[0] : instances;
  }

  /**
   * Enable accessibility features
   */
  public enableAccessibility(selector: string | Element, config?: any) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Accessibility element not found');
      return null;
    }

    const accessibility = new AccessibilityEngine(element, config);
    accessibility.activate();
    return accessibility;
  }

  /**
   * Comprehensive setup for complete ProteusJS experience
   */
  public setupComplete(config?: any) {
    // Apply to document body by default
    const container = config?.container || document.body;

    // Enable all core features
    this.container(container, config?.container);
    this.fluidType(container.querySelectorAll('h1, h2, h3, h4, h5, h6, p'), config?.typography);
    this.createGrid(container.querySelectorAll('.grid, .gallery'), config?.grid);
    this.applySpacing(container, config?.spacing);
    this.enableAccessibility(container, config?.accessibility);

    // Enable responsive images for all images
    this.responsiveImages(container.querySelectorAll('img'), config?.images);

    return this;
  }

  /**
   * Check if ProteusJS is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get library version
   */
  public static getVersion(): string {
    return version;
  }

  /**
   * Get browser support information
   */
  public static getSupportInfo() {
    return getSupportInfo();
  }

  /**
   * Check if browser is supported
   */
  public static isSupported(): boolean {
    return isSupported();
  }

  /**
   * Get or create global instance
   */
  public static getInstance(config?: ProteusConfig): ProteusJS {
    if (!ProteusJS.instance) {
      ProteusJS.instance = new ProteusJS(config);
    }
    return ProteusJS.instance;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfig(
    config: Partial<ProteusConfig>, 
    existing?: Required<ProteusConfig>
  ): Required<ProteusConfig> {
    const defaults: Required<ProteusConfig> = {
      debug: false,
      performance: 'high',
      accessibility: true,
      autoInit: true,
      containers: {
        autoDetect: true,
        breakpoints: {},
        units: true,
        isolation: true,
        polyfill: true
      },
      typography: {
        fluidScaling: true,
        autoOptimize: true,
        accessibility: true,
        scale: {
          ratio: 1.33,
          base: '1rem',
          levels: 6
        },
        lineHeight: {
          auto: true,
          density: 'comfortable'
        }
      },
      layout: {
        grid: {
          auto: true,
          masonry: false,
          gap: 'fluid'
        },
        flexbox: {
          enhanced: true,
          autoWrap: true
        },
        spacing: {
          scale: 'minor-third',
          density: 'comfortable'
        }
      },
      animations: {
        enabled: true,
        respectMotionPreferences: true,
        duration: 300,
        easing: 'ease-out',
        flip: true,
        microInteractions: true
      },
      theming: {
        darkMode: {
          auto: true,
          schedule: '18:00-06:00',
          transition: 'smooth'
        },
        contrast: {
          adaptive: true,
          level: 'AA'
        }
      }
    };

    return {
      ...defaults,
      ...existing,
      ...config,
      containers: { ...defaults.containers, ...existing?.containers, ...config.containers },
      typography: { 
        ...defaults.typography, 
        ...existing?.typography, 
        ...config.typography,
        scale: { ...defaults.typography.scale, ...existing?.typography?.scale, ...config.typography?.scale },
        lineHeight: { ...defaults.typography.lineHeight, ...existing?.typography?.lineHeight, ...config.typography?.lineHeight }
      },
      layout: {
        ...defaults.layout,
        ...existing?.layout,
        ...config.layout,
        grid: { ...defaults.layout.grid, ...existing?.layout?.grid, ...config.layout?.grid },
        flexbox: { ...defaults.layout.flexbox, ...existing?.layout?.flexbox, ...config.layout?.flexbox },
        spacing: { ...defaults.layout.spacing, ...existing?.layout?.spacing, ...config.layout?.spacing }
      },
      animations: { ...defaults.animations, ...existing?.animations, ...config.animations },
      theming: {
        ...defaults.theming,
        ...existing?.theming,
        ...config.theming,
        darkMode: { ...defaults.theming.darkMode, ...existing?.theming?.darkMode, ...config.theming?.darkMode },
        contrast: { ...defaults.theming.contrast, ...existing?.theming?.contrast, ...config.theming?.contrast }
      }
    };
  }

  /**
   * Normalize selector to array of elements
   */
  private normalizeSelector(selector: string | Element | Element[]): Element[] {
    if (typeof selector === 'string') {
      return Array.from(document.querySelectorAll(selector));
    } else if (selector instanceof Element) {
      return [selector];
    } else if (Array.isArray(selector)) {
      return selector;
    }
    return [];
  }

  /**
   * Get performance metrics from event handler
   */
  public getPerformanceMetrics() {
    return {
      eventHandler: this.eventHandler.getMetrics(),
      batchDOM: this.batchDOM.getMetrics(),
      performanceMonitor: this.performanceMonitor.getMetrics()
    };
  }

  /**
   * Efficiently observe element resize with batching
   */
  public observeResize(
    selector: string | Element,
    callback: (entry: ResizeObserverEntry) => void,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Element not found for resize observation');
      return null;
    }

    return this.eventHandler.observeResize(element, callback, priority);
  }

  /**
   * Batch DOM style changes for performance
   */
  public batchStyles(
    selector: string | Element,
    styles: Record<string, string>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Element not found for style batching');
      return Promise.reject(new Error('Element not found'));
    }

    return this.batchDOM.batchStyles(element, styles, priority);
  }

  /**
   * Batch DOM measurements for performance
   */
  public measureElement(
    selector: string | Element,
    measurements: ('width' | 'height' | 'top' | 'left' | 'right' | 'bottom')[] = ['width', 'height'],
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Element not found for measurement');
      return Promise.reject(new Error('Element not found'));
    }

    return this.batchDOM.measureElement(element, measurements, priority);
  }

  /**
   * Set theme scheme
   */
  public setTheme(scheme: string) {
    this.themeSystem.setScheme(scheme);
    return this;
  }

  /**
   * Toggle theme between light and dark
   */
  public toggleTheme() {
    this.themeSystem.toggle();
    return this;
  }

  /**
   * Animate element with FLIP technique
   */
  public async animateElement(
    selector: string | Element,
    newPosition: () => void,
    options?: any
  ) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Element not found for animation');
      return;
    }

    return this.flipAnimations.animate(element, newPosition, options);
  }

  /**
   * Add micro-interactions to elements
   */
  public addMicroInteractions(selector: string | Element, type: 'hover' | 'press' | 'focus' | 'ripple' = 'hover') {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Element not found for micro-interactions');
      return this;
    }

    switch (type) {
      case 'hover':
        MicroInteractions.addHover(element);
        break;
      case 'press':
        MicroInteractions.addPress(element);
        break;
      case 'focus':
        MicroInteractions.addFocus(element);
        break;
      case 'ripple':
        MicroInteractions.addRipple(element);
        break;
    }

    return this;
  }

  /**
   * Register lazy-loaded component
   */
  public lazyLoad(
    selector: string | Element,
    activator: () => Promise<void>,
    options?: any
  ) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!element) {
      console.warn('ProteusJS: Element not found for lazy loading');
      return null;
    }

    return this.lazyEvaluation.register(element, activator, options);
  }

  /**
   * Optimize CSS performance
   */
  public async optimizeCSS() {
    return this.cssOptimizer.optimizeAll();
  }

  /**
   * Get comprehensive performance metrics
   */
  public getAdvancedMetrics() {
    return {
      eventHandler: this.eventHandler.getMetrics(),
      batchDOM: this.batchDOM.getMetrics(),
      lazyEvaluation: this.lazyEvaluation.getMetrics(),
      cssOptimizer: this.cssOptimizer.getMetrics(),
      themeSystem: this.themeSystem.getState(),
      flipAnimations: this.flipAnimations.getActiveCount(),
      performanceMonitor: this.performanceMonitor.getMetrics()
    };
  }
}
