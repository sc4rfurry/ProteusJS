/**
 * Smart Theme System for ProteusJS
 * Intelligent dark mode, adaptive contrast, and dynamic theming
 */

import { logger } from '../utils/Logger';

export interface ThemeConfig {
  autoDetect: boolean;
  respectSystemPreference: boolean;
  adaptiveContrast: boolean;
  colorSchemes: Record<string, ColorScheme>;
  transitions: boolean;
  transitionDuration: number;
  storage: 'localStorage' | 'sessionStorage' | 'none';
  storageKey: string;
}

export interface ColorScheme {
  name: string;
  type: 'light' | 'dark' | 'auto';
  colors: Record<string, string>;
  contrast: 'normal' | 'high' | 'low';
  accessibility: {
    minContrast: number;
    largeTextContrast: number;
    focusIndicator: string;
  };
}

export interface ThemeState {
  currentScheme: string;
  systemPreference: 'light' | 'dark';
  userPreference: string | null;
  contrastLevel: 'normal' | 'high' | 'low';
  reducedMotion: boolean;
  highContrast: boolean;
}

export class SmartThemeSystem {
  private config!: Required<ThemeConfig>;
  private state!: ThemeState;
  private mediaQueries: Map<string, MediaQueryList> = new Map();
  private observers: Set<(state: ThemeState) => void> = new Set();

  private static readonly DEFAULT_SCHEMES: Record<string, ColorScheme> = {
    light: {
      name: 'Light',
      type: 'light',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        textSecondary: '#6c757d',
        border: '#dee2e6'
      },
      contrast: 'normal',
      accessibility: {
        minContrast: 4.5,
        largeTextContrast: 3,
        focusIndicator: '#005cbf'
      }
    },
    dark: {
      name: 'Dark',
      type: 'dark',
      colors: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        success: '#198754',
        danger: '#dc3545',
        warning: '#fd7e14',
        info: '#0dcaf0',
        background: '#121212',
        surface: '#1e1e1e',
        text: '#ffffff',
        textSecondary: '#adb5bd',
        border: '#495057'
      },
      contrast: 'normal',
      accessibility: {
        minContrast: 4.5,
        largeTextContrast: 3,
        focusIndicator: '#4dabf7'
      }
    },
    highContrast: {
      name: 'High Contrast',
      type: 'light',
      colors: {
        primary: '#0000ff',
        secondary: '#000000',
        success: '#008000',
        danger: '#ff0000',
        warning: '#ff8c00',
        info: '#0000ff',
        background: '#ffffff',
        surface: '#ffffff',
        text: '#000000',
        textSecondary: '#000000',
        border: '#000000'
      },
      contrast: 'high',
      accessibility: {
        minContrast: 7,
        largeTextContrast: 4.5,
        focusIndicator: '#ff0000'
      }
    }
  };

  constructor(config: Partial<ThemeConfig> = {}) {
    this.config = {
      autoDetect: true,
      respectSystemPreference: true,
      adaptiveContrast: true,
      colorSchemes: SmartThemeSystem.DEFAULT_SCHEMES,
      transitions: true,
      transitionDuration: 300,
      storage: 'localStorage',
      storageKey: 'proteus-theme',
      ...config
    };

    this.state = this.createInitialState();
    this.setupMediaQueries();
    this.loadStoredPreference();
    this.applyInitialTheme();
  }

  /**
   * Set theme scheme
   */
  public setScheme(schemeName: string): void {
    if (!this.config.colorSchemes[schemeName]) {
      console.warn(`Theme scheme '${schemeName}' not found`);
      return;
    }

    this.state.currentScheme = schemeName;
    this.state.userPreference = schemeName;
    
    this.applyTheme();
    this.savePreference();
    this.notifyObservers();
  }

  /**
   * Toggle between light and dark themes
   */
  public toggle(): void {
    const currentScheme = this.config.colorSchemes[this.state.currentScheme];

    if (currentScheme && currentScheme.type === 'light') {
      this.setScheme('dark');
    } else {
      this.setScheme('light');
    }
  }

  /**
   * Set contrast level
   */
  public setContrast(level: 'normal' | 'high' | 'low'): void {
    this.state.contrastLevel = level;
    
    if (level === 'high' && this.config.colorSchemes['highContrast']) {
      this.setScheme('highContrast');
    } else {
      this.applyContrastAdjustments();
    }
    
    this.notifyObservers();
  }

  /**
   * Get current theme state
   */
  public getState(): ThemeState {
    return { ...this.state };
  }

  /**
   * Get current color scheme
   */
  public getCurrentScheme(): ColorScheme {
    const scheme = this.config.colorSchemes[this.state.currentScheme];
    if (!scheme) {
      throw new Error(`Color scheme '${this.state.currentScheme}' not found`);
    }
    return scheme;
  }

  /**
   * Add theme observer
   */
  public observe(callback: (state: ThemeState) => void): () => void {
    this.observers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Add custom color scheme
   */
  public addScheme(scheme: ColorScheme): void {
    this.config.colorSchemes[scheme.name.toLowerCase()] = scheme;
  }

  /**
   * Remove color scheme
   */
  public removeScheme(schemeName: string): void {
    if (schemeName === this.state.currentScheme) {
      console.warn('Cannot remove currently active scheme');
      return;
    }
    
    delete this.config.colorSchemes[schemeName];
  }

  /**
   * Get available schemes
   */
  public getAvailableSchemes(): ColorScheme[] {
    return Object.values(this.config.colorSchemes);
  }

  /**
   * Apply theme to document
   */
  public applyTheme(): void {
    const scheme = this.getCurrentScheme();
    
    // Apply CSS custom properties
    this.applyCSSProperties(scheme);
    
    // Apply theme class
    this.applyThemeClass(scheme);
    
    // Apply transitions if enabled
    if (this.config.transitions) {
      this.applyTransitions();
    }
    
    // Apply accessibility enhancements
    this.applyAccessibilityEnhancements(scheme);
  }

  /**
   * Reset to system preference
   */
  public resetToSystem(): void {
    this.state.userPreference = null;
    this.state.currentScheme = this.state.systemPreference;
    
    this.applyTheme();
    this.savePreference();
    this.notifyObservers();
  }

  /**
   * Destroy theme system
   */
  public destroy(): void {
    this.mediaQueries.forEach(mq => {
      mq.removeEventListener('change', this.handleMediaQueryChange);
    });
    this.mediaQueries.clear();
    this.observers.clear();
  }

  /**
   * Setup media query listeners
   */
  private setupMediaQueries(): void {
    // Check if matchMedia is available (polyfill may not be loaded yet)
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      console.warn('matchMedia not available, skipping media query setup');
      return;
    }

    // Dark mode preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueries.set('dark-mode', darkModeQuery);
    darkModeQuery.addEventListener('change', this.handleMediaQueryChange.bind(this));

    // High contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    this.mediaQueries.set('high-contrast', highContrastQuery);
    highContrastQuery.addEventListener('change', this.handleMediaQueryChange.bind(this));
    
    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.mediaQueries.set('reduced-motion', reducedMotionQuery);
    reducedMotionQuery.addEventListener('change', this.handleMediaQueryChange.bind(this));
    
    // Update initial state
    this.updateStateFromMediaQueries();
  }

  /**
   * Handle media query changes
   */
  private handleMediaQueryChange = (): void => {
    this.updateStateFromMediaQueries();
    
    if (this.config.respectSystemPreference && !this.state.userPreference) {
      this.state.currentScheme = this.state.systemPreference;
      this.applyTheme();
    }
    
    this.notifyObservers();
  };

  /**
   * Update state from media queries
   */
  private updateStateFromMediaQueries(): void {
    const darkModeQuery = this.mediaQueries.get('dark-mode');
    const highContrastQuery = this.mediaQueries.get('high-contrast');
    const reducedMotionQuery = this.mediaQueries.get('reduced-motion');
    
    this.state.systemPreference = darkModeQuery?.matches ? 'dark' : 'light';
    this.state.highContrast = highContrastQuery?.matches || false;
    this.state.reducedMotion = reducedMotionQuery?.matches || false;
    
    if (this.state.highContrast && this.config.adaptiveContrast) {
      this.state.contrastLevel = 'high';
    }
  }

  /**
   * Apply CSS custom properties
   */
  private applyCSSProperties(scheme: ColorScheme): void {
    try {
      const root = document.documentElement;

      // Check if root element and style property exist
      if (!root || !root.style || typeof root.style.setProperty !== 'function') {
        logger.warn('CSS custom properties not supported in this environment');
        return;
      }

      Object.entries(scheme.colors).forEach(([name, value]) => {
        root.style.setProperty(`--proteus-${name}`, value);
      });

      // Apply accessibility properties
      root.style.setProperty('--proteus-min-contrast', scheme.accessibility.minContrast.toString());
      root.style.setProperty('--proteus-focus-indicator', scheme.accessibility.focusIndicator);
    } catch (error) {
      logger.warn('Failed to apply CSS custom properties:', error);
    }
  }

  /**
   * Apply theme class to document
   */
  private applyThemeClass(scheme: ColorScheme): void {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('proteus-light', 'proteus-dark', 'proteus-high-contrast');
    
    // Add current theme class
    body.classList.add(`proteus-${scheme.type}`);
    
    if (scheme.contrast === 'high') {
      body.classList.add('proteus-high-contrast');
    }
    
    // Add reduced motion class if needed
    if (this.state.reducedMotion) {
      body.classList.add('proteus-reduced-motion');
    } else {
      body.classList.remove('proteus-reduced-motion');
    }
  }

  /**
   * Apply theme transitions
   */
  private applyTransitions(): void {
    if (this.state.reducedMotion) return;
    
    const style = document.createElement('style');
    style.id = 'proteus-theme-transitions';
    
    // Remove existing transition styles
    const existing = document.getElementById('proteus-theme-transitions');
    if (existing) {
      existing.remove();
    }
    
    style.textContent = `
      * {
        transition: 
          background-color ${this.config.transitionDuration}ms ease,
          color ${this.config.transitionDuration}ms ease,
          border-color ${this.config.transitionDuration}ms ease,
          box-shadow ${this.config.transitionDuration}ms ease !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Remove transitions after animation completes
    setTimeout(() => {
      style.remove();
    }, this.config.transitionDuration + 100);
  }

  /**
   * Apply accessibility enhancements
   */
  private applyAccessibilityEnhancements(scheme: ColorScheme): void {
    const style = document.createElement('style');
    style.id = 'proteus-accessibility-enhancements';
    
    // Remove existing accessibility styles
    const existing = document.getElementById('proteus-accessibility-enhancements');
    if (existing) {
      existing.remove();
    }
    
    style.textContent = `
      :focus {
        outline: 2px solid var(--proteus-focus-indicator) !important;
        outline-offset: 2px !important;
      }
      
      .proteus-high-contrast {
        filter: contrast(${scheme.contrast === 'high' ? '150%' : '100%'});
      }
      
      .proteus-reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Apply contrast adjustments
   */
  private applyContrastAdjustments(): void {
    const scheme = this.getCurrentScheme();
    const adjustedScheme = { ...scheme };
    
    if (this.state.contrastLevel === 'high') {
      // Increase contrast for better accessibility
      adjustedScheme.colors = this.adjustColorsForHighContrast(scheme.colors);
    } else if (this.state.contrastLevel === 'low') {
      // Reduce contrast for comfort
      adjustedScheme.colors = this.adjustColorsForLowContrast(scheme.colors);
    }
    
    this.applyCSSProperties(adjustedScheme);
  }

  /**
   * Adjust colors for high contrast
   */
  private adjustColorsForHighContrast(colors: Record<string, string>): Record<string, string> {
    const adjusted = { ...colors };
    
    // Make text more contrasted
    if (colors['background'] === '#ffffff') {
      adjusted['text'] = '#000000';
      adjusted['textSecondary'] = '#333333';
    } else {
      adjusted['text'] = '#ffffff';
      adjusted['textSecondary'] = '#cccccc';
    }
    
    return adjusted;
  }

  /**
   * Adjust colors for low contrast
   */
  private adjustColorsForLowContrast(colors: Record<string, string>): Record<string, string> {
    const adjusted = { ...colors };
    
    // Make text less contrasted
    if (colors['background'] === '#ffffff') {
      adjusted['text'] = '#444444';
      adjusted['textSecondary'] = '#666666';
    } else {
      adjusted['text'] = '#dddddd';
      adjusted['textSecondary'] = '#aaaaaa';
    }
    
    return adjusted;
  }

  /**
   * Load stored preference
   */
  private loadStoredPreference(): void {
    if (this.config.storage === 'none') return;
    
    try {
      const storage = this.config.storage === 'localStorage' ? localStorage : sessionStorage;
      const stored = storage.getItem(this.config.storageKey);
      
      if (stored) {
        const preference = JSON.parse(stored);
        this.state.userPreference = preference.scheme;
        this.state.contrastLevel = preference.contrast || 'normal';
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
  }

  /**
   * Save current preference
   */
  private savePreference(): void {
    if (this.config.storage === 'none') return;
    
    try {
      const storage = this.config.storage === 'localStorage' ? localStorage : sessionStorage;
      const preference = {
        scheme: this.state.userPreference,
        contrast: this.state.contrastLevel
      };
      
      storage.setItem(this.config.storageKey, JSON.stringify(preference));
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  /**
   * Apply initial theme
   */
  private applyInitialTheme(): void {
    if (this.state.userPreference && this.config.colorSchemes[this.state.userPreference]) {
      this.state.currentScheme = this.state.userPreference;
    } else if (this.config.autoDetect) {
      this.state.currentScheme = this.state.systemPreference;
    } else {
      this.state.currentScheme = 'light';
    }
    
    this.applyTheme();
  }

  /**
   * Notify observers of state changes
   */
  private notifyObservers(): void {
    this.observers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Theme observer error:', error);
      }
    });
  }

  /**
   * Create initial state
   */
  private createInitialState(): ThemeState {
    return {
      currentScheme: 'light',
      systemPreference: 'light',
      userPreference: null,
      contrastLevel: 'normal',
      reducedMotion: false,
      highContrast: false
    };
  }
}
