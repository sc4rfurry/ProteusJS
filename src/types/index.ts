/**
 * Core type definitions for ProteusJS
 */

// Main configuration interface
export interface ProteusConfig {
  debug?: boolean;
  performance?: 'low' | 'medium' | 'high';
  accessibility?: boolean;
  autoInit?: boolean;
  containers?: ContainerConfig;
  typography?: TypographyConfig;
  layout?: LayoutConfig;
  animations?: AnimationConfig;
  theming?: ThemingConfig;
}

// Container query configuration
export interface ContainerConfig {
  autoDetect?: boolean;
  breakpoints?: Record<string, string>;
  units?: boolean;
  isolation?: boolean;
  polyfill?: boolean;
}

// Breakpoint configuration
export interface BreakpointConfig {
  [key: string]: string | number;
}

// Typography configuration
export interface TypographyConfig {
  fluidScaling?: boolean;
  autoOptimize?: boolean;
  accessibility?: boolean;
  scale?: {
    ratio?: number;
    base?: string;
    levels?: number;
  };
  lineHeight?: {
    auto?: boolean;
    density?: 'compact' | 'comfortable' | 'spacious';
  };
}

// Layout configuration
export interface LayoutConfig {
  grid?: {
    auto?: boolean;
    masonry?: boolean;
    gap?: 'fluid' | string;
  };
  flexbox?: {
    enhanced?: boolean;
    autoWrap?: boolean;
  };
  spacing?: {
    scale?: 'minor-third' | 'major-third' | 'perfect-fourth' | 'golden-ratio';
    density?: 'compact' | 'comfortable' | 'spacious';
  };
}

// Animation configuration
export interface AnimationConfig {
  enabled?: boolean;
  respectMotionPreferences?: boolean;
  duration?: number;
  easing?: string;
  flip?: boolean;
  microInteractions?: boolean;
}

// Theming configuration
export interface ThemingConfig {
  darkMode?: {
    auto?: boolean;
    schedule?: string;
    transition?: 'instant' | 'smooth';
  };
  contrast?: {
    adaptive?: boolean;
    level?: 'AA' | 'AAA';
  };
}

// Accessibility configuration
export interface AccessibilityConfig {
  screenReader?: boolean;
  keyboardNavigation?: boolean;
  colorCompliance?: 'AA' | 'AAA';
  motionPreferences?: boolean;
  announcements?: boolean;
}

// Performance configuration
export interface PerformanceConfig {
  targetFrameRate?: number;
  memoryManagement?: boolean;
  lazyEvaluation?: boolean;
  caching?: boolean;
  monitoring?: boolean;
}

// Element query types
export type ElementQuery = {
  property: 'width' | 'height' | 'aspect-ratio' | 'content-size';
  operator: 'min' | 'max' | 'exact';
  value: string | number;
};

// Container units
export type ContainerUnit = 'cw' | 'ch' | 'cmin' | 'cmax' | 'cqi' | 'cqb';

// Event types
export interface ProteusEvent {
  type: string;
  target: Element;
  detail?: any;
  timestamp: number;
}

// Observer callback types
export type ResizeCallback = (entry: ResizeObserverEntry) => void;
export type IntersectionCallback = (entry: IntersectionObserverEntry) => void;

// Plugin system types
export interface ProteusPlugin {
  name: string;
  version: string;
  install: (proteus: any) => void;
  uninstall?: (proteus: any) => void;
}
