/**
 * ProteusJS Codemods - Transform Index
 * Exports all available transforms for v1→v2 migration
 */

export { default as importUpdates } from './import-updates.js';
export { default as apiChanges } from './api-changes.js';

// Transform names for CLI usage
export type TransformName = 
  | 'import-updates'
  | 'api-changes'
  | 'navigation-api'
  | 'view-transitions'
  | 'popover-api'
  | 'scheduler-api'
  | 'pwa-apis'
  | 'speculation-rules';

// Available transforms registry
export const AVAILABLE_TRANSFORMS = [
  'import-updates',
  'api-changes',
  'navigation-api',
  'view-transitions',
  'popover-api',
  'scheduler-api',
  'pwa-apis',
  'speculation-rules'
] as const;
