/**
 * ProteusJS - Dynamic Responsive Design Library
 * Shape-shifting responsive design that adapts like the sea god himself
 * 
 * @version 1.0.0
 * @author ProteusJS Team
 * @license MIT
 */

// Core exports
export { ProteusJS as default } from './core/ProteusJS';
export { ProteusJS } from './core/ProteusJS';

// Type exports
export type {
  ProteusConfig,
  ContainerConfig,
  BreakpointConfig,
  TypographyConfig,
  LayoutConfig,
  AnimationConfig,
  AccessibilityConfig,
  PerformanceConfig
} from './types';

// Utility exports
export { version } from './utils/version';
export { isSupported } from './utils/support';

// Plugin exports (for extensibility)
export type { ProteusPlugin } from './core/PluginSystem';

// Constants
export const VERSION = '1.0.0';
export const LIBRARY_NAME = 'ProteusJS';
