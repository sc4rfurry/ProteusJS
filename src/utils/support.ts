/**
 * Browser support detection utilities
 */

export interface SupportInfo {
  resizeObserver: boolean;
  intersectionObserver: boolean;
  containerQueries: boolean;
  cssClamp: boolean;
  cssCustomProperties: boolean;
  webWorkers: boolean;
  requestAnimationFrame: boolean;
  passiveEventListeners: boolean;
}

/**
 * Check if the current environment supports ProteusJS features
 */
export function isSupported(): boolean {
  const support = getSupportInfo();
  return support.resizeObserver && support.intersectionObserver;
}

/**
 * Get detailed support information for all features
 */
export function getSupportInfo(): SupportInfo {
  return {
    resizeObserver: typeof ResizeObserver !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    containerQueries: checkContainerQuerySupport(),
    cssClamp: checkCSSClampSupport(),
    cssCustomProperties: checkCSSCustomPropertiesSupport(),
    webWorkers: typeof Worker !== 'undefined',
    requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
    passiveEventListeners: checkPassiveEventListenerSupport()
  };
}

/**
 * Check if CSS Container Queries are supported
 */
function checkContainerQuerySupport(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('container-type', 'inline-size');
}

/**
 * Check if CSS clamp() function is supported
 */
function checkCSSClampSupport(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('font-size', 'clamp(1rem, 2vw, 2rem)');
}

/**
 * Check if CSS Custom Properties are supported
 */
function checkCSSCustomPropertiesSupport(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('--test', 'value');
}

/**
 * Check if passive event listeners are supported
 */
function checkPassiveEventListenerSupport(): boolean {
  let passiveSupported = false;
  
  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      }
    };
    
    window.addEventListener('test' as any, null as any, options as any);
    window.removeEventListener('test' as any, null as any, options as any);
  } catch (err) {
    passiveSupported = false;
  }
  
  return passiveSupported;
}

/**
 * Get a user-friendly support message
 */
export function getSupportMessage(): string {
  const support = getSupportInfo();
  
  if (!support.resizeObserver) {
    return 'ResizeObserver is not supported. Please use a polyfill.';
  }
  
  if (!support.intersectionObserver) {
    return 'IntersectionObserver is not supported. Please use a polyfill.';
  }
  
  if (!support.containerQueries) {
    return 'CSS Container Queries are not supported. ProteusJS will provide a polyfill.';
  }
  
  return 'All features are supported!';
}
