/**
 * @sc4rfurryx/proteusjs-transitions
 * View Transitions API helpers and utilities
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

// Types
export interface ViewTransitionOptions {
  name?: string;
  duration?: number;
  easing?: string;
  skipTransition?: boolean;
  updateCallback?: () => void | Promise<void>;
}

export interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

export interface SharedElementOptions {
  name: string;
  element: Element;
  group?: string;
}

export interface CrossDocumentTransitionOptions {
  navigation?: boolean;
  types?: string[];
}

// Feature detection
const hasViewTransitions = typeof document !== 'undefined' && 'startViewTransition' in document;

/**
 * Start a view transition with the View Transitions API
 */
export async function viewTransition(
  updateCallback: () => void | Promise<void>,
  options: ViewTransitionOptions = {}
): Promise<ViewTransition | void> {
  if (!hasViewTransitions) {
    // Fallback: just run the callback
    await updateCallback();
    return;
  }

  if (options.skipTransition) {
    await updateCallback();
    return;
  }

  const transition = (document as any).startViewTransition(async () => {
    if (options.name) {
      document.documentElement.style.setProperty('view-transition-name', options.name);
    }
    
    await updateCallback();
  });

  // Apply custom duration and easing if specified
  if (options.duration || options.easing) {
    applyTransitionStyles(options);
  }

  return transition;
}

/**
 * Apply custom CSS for transition duration and easing
 */
function applyTransitionStyles(options: ViewTransitionOptions): void {
  const style = document.createElement('style');
  style.textContent = `
    ::view-transition-old(root),
    ::view-transition-new(root) {
      ${options.duration ? `animation-duration: ${options.duration}ms;` : ''}
      ${options.easing ? `animation-timing-function: ${options.easing};` : ''}
    }
  `;
  document.head.appendChild(style);
  
  // Clean up after transition
  setTimeout(() => {
    document.head.removeChild(style);
  }, (options.duration || 300) + 100);
}

/**
 * Set up shared element transitions
 */
export function setupSharedElement(options: SharedElementOptions): () => void {
  const { name, element, group } = options;
  
  // Set view-transition-name on the element
  (element as HTMLElement).style.viewTransitionName = name;
  
  if (group) {
    (element as HTMLElement).style.setProperty('--view-transition-group', group);
  }
  
  // Return cleanup function
  return () => {
    (element as HTMLElement).style.viewTransitionName = '';
    if (group) {
      (element as HTMLElement).style.removeProperty('--view-transition-group');
    }
  };
}

/**
 * Create a named transition for specific elements
 */
export function namedTransition(
  name: string,
  elements: Element[],
  updateCallback: () => void | Promise<void>,
  options: Omit<ViewTransitionOptions, 'name'> = {}
): Promise<ViewTransition | void> {
  // Set up shared elements
  const cleanupFunctions = elements.map(element => 
    setupSharedElement({ name, element })
  );
  
  return viewTransition(async () => {
    await updateCallback();
    // Cleanup after transition
    cleanupFunctions.forEach(cleanup => cleanup());
  }, { ...options, name });
}

/**
 * Enable cross-document view transitions
 */
export function enableCrossDocumentTransitions(options: CrossDocumentTransitionOptions = {}): void {
  if (!hasViewTransitions) {
    console.warn('View Transitions API not supported');
    return;
  }

  // Add CSS for cross-document transitions
  const style = document.createElement('style');
  style.textContent = `
    @view-transition {
      navigation: ${options.navigation ? 'auto' : 'none'};
      ${options.types ? `types: ${options.types.join(', ')};` : ''}
    }
  `;
  document.head.appendChild(style);
}

/**
 * Create a slide transition between pages
 */
export function slideTransition(
  direction: 'left' | 'right' | 'up' | 'down' = 'right',
  updateCallback: () => void | Promise<void>,
  options: Omit<ViewTransitionOptions, 'name'> = {}
): Promise<ViewTransition | void> {
  const style = document.createElement('style');
  style.textContent = `
    ::view-transition-old(root) {
      animation: slide-out-${direction} ${options.duration || 300}ms ${options.easing || 'ease-in-out'};
    }
    ::view-transition-new(root) {
      animation: slide-in-${direction} ${options.duration || 300}ms ${options.easing || 'ease-in-out'};
    }
    
    @keyframes slide-out-${direction} {
      to { transform: translateX(${direction === 'left' ? '-100%' : direction === 'right' ? '100%' : '0'}); }
    }
    @keyframes slide-in-${direction} {
      from { transform: translateX(${direction === 'left' ? '100%' : direction === 'right' ? '-100%' : '0'}); }
    }
  `;
  document.head.appendChild(style);
  
  return viewTransition(updateCallback, { ...options, name: `slide-${direction}` }).then(result => {
    // Cleanup styles
    setTimeout(() => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, (options.duration || 300) + 100);
    return result;
  });
}

/**
 * Create a fade transition
 */
export function fadeTransition(
  updateCallback: () => void | Promise<void>,
  options: Omit<ViewTransitionOptions, 'name'> = {}
): Promise<ViewTransition | void> {
  const style = document.createElement('style');
  style.textContent = `
    ::view-transition-old(root) {
      animation: fade-out ${options.duration || 300}ms ${options.easing || 'ease-in-out'};
    }
    ::view-transition-new(root) {
      animation: fade-in ${options.duration || 300}ms ${options.easing || 'ease-in-out'};
    }
    
    @keyframes fade-out {
      to { opacity: 0; }
    }
    @keyframes fade-in {
      from { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  return viewTransition(updateCallback, { ...options, name: 'fade' }).then(result => {
    // Cleanup styles
    setTimeout(() => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, (options.duration || 300) + 100);
    return result;
  });
}

/**
 * Check if View Transitions API is supported
 */
export function isViewTransitionsSupported(): boolean {
  return hasViewTransitions;
}

/**
 * Get active view transition
 */
export function getActiveViewTransition(): ViewTransition | null {
  if (!hasViewTransitions) return null;
  return (document as any).activeViewTransition || null;
}

/**
 * Skip the current view transition
 */
export function skipActiveTransition(): void {
  const activeTransition = getActiveViewTransition();
  if (activeTransition) {
    activeTransition.skipTransition();
  }
}
