/**
 * ProteusJS - Native-first Web Development Primitives
 * Shape-shifting responsive design that adapts like the sea god himself
 *
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

// Core exports (legacy compatibility)
export { ProteusJS as default } from './core/ProteusJS';
export { ProteusJS } from './core/ProteusJS';

// New modular exports
export * as transitions from './modules/transitions';
export * as scroll from './modules/scroll';
export * as anchor from './modules/anchor';
export * as popover from './modules/popover';
export * as container from './modules/container';
export * as typography from './modules/typography';
export * as a11yAudit from './modules/a11y-audit';
export * as a11yPrimitives from './modules/a11y-primitives';
export * as perf from './modules/perf';

// Framework adapters are available as separate subpath exports:
// import { ... } from '@sc4rfurryx/proteusjs/adapters/react'
// import { ... } from '@sc4rfurryx/proteusjs/adapters/vue'
// import { ... } from '@sc4rfurryx/proteusjs/adapters/svelte'

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

// Module-specific type exports
export type { TransitionOptions, NavigateOptions } from './modules/transitions';
export type { ScrollAnimateOptions } from './modules/scroll';
export type { TetherOptions, TetherController } from './modules/anchor';
export type { PopoverOptions, PopoverController } from './modules/popover';
export type { ContainerOptions } from './modules/container';
export type { FluidTypeOptions, FluidTypeResult } from './modules/typography';
export type { AuditOptions, AuditReport, AuditViolation } from './modules/a11y-audit';
export type { Controller, DialogOptions, TooltipOptions, FocusTrapController } from './modules/a11y-primitives';
export type { SpeculationOptions, ContentVisibilityOptions } from './modules/perf';

// Utility exports
export { version } from './utils/version';
export { isSupported } from './utils/support';

// Plugin exports (for extensibility)
export type { ProteusPlugin } from './core/PluginSystem';

// Constants
export const VERSION = '2.0.0';
export const LIBRARY_NAME = 'ProteusJS';
