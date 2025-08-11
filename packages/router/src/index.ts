/**
 * @sc4rfurryx/proteusjs-router
 * Navigation API router with History fallback
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

// Types
export interface NavigateOptions {
  replace?: boolean;
  state?: any;
  transition?: TransitionOptions;
  info?: any;
}

export interface TransitionOptions {
  name?: string;
  duration?: number;
  easing?: string;
}

export interface NavigationHandler {
  (event: NavigationEvent): boolean | Promise<boolean>;
}

export interface NavigationEntry {
  url: string;
  key: string;
  id: string;
  index: number;
  sameDocument: boolean;
  state?: any;
}

export interface NavigationEvent {
  destination: {
    url: string;
    state?: any;
  };
  canIntercept: boolean;
  userInitiated: boolean;
  hashChange: boolean;
  formData?: FormData;
  intercept: (options: { handler: () => Promise<void> | void }) => void;
  preventDefault: () => void;
}

// Feature detection
const hasNavigationAPI = typeof window !== 'undefined' && 'navigation' in window;
const hasViewTransitions = typeof document !== 'undefined' && 'startViewTransition' in document;

/**
 * Navigate to a new URL using Navigation API or History API fallback
 */
export async function navigate(url: string, options: NavigateOptions = {}): Promise<void> {
  if (hasNavigationAPI) {
    return navigateWithNavigationAPI(url, options);
  } else {
    return navigateWithHistoryAPI(url, options);
  }
}

/**
 * Navigate using the modern Navigation API
 */
async function navigateWithNavigationAPI(url: string, options: NavigateOptions): Promise<void> {
  const navigation = (window as any).navigation;
  
  if (options.transition && hasViewTransitions) {
    return (document as any).startViewTransition(() => {
      return navigation.navigate(url, {
        replace: options.replace,
        state: options.state,
        info: options.info
      });
    });
  }
  
  return navigation.navigate(url, {
    replace: options.replace,
    state: options.state,
    info: options.info
  });
}

/**
 * Navigate using History API fallback
 */
async function navigateWithHistoryAPI(url: string, options: NavigateOptions): Promise<void> {
  if (options.transition && hasViewTransitions) {
    return (document as any).startViewTransition(() => {
      performHistoryNavigation(url, options);
    });
  }
  
  performHistoryNavigation(url, options);
}

function performHistoryNavigation(url: string, options: NavigateOptions): void {
  if (options.replace) {
    window.history.replaceState(options.state, '', url);
  } else {
    window.history.pushState(options.state, '', url);
  }
  
  // Dispatch custom navigation event for consistency
  window.dispatchEvent(new PopStateEvent('popstate', { state: options.state }));
}

/**
 * Go back in navigation history
 */
export function back(): void {
  if (hasNavigationAPI) {
    (window as any).navigation.back();
  } else {
    window.history.back();
  }
}

/**
 * Go forward in navigation history
 */
export function forward(): void {
  if (hasNavigationAPI) {
    (window as any).navigation.forward();
  } else {
    window.history.forward();
  }
}

/**
 * Reload the current page
 */
export function reload(): void {
  if (hasNavigationAPI) {
    (window as any).navigation.reload();
  } else {
    window.location.reload();
  }
}

/**
 * Intercept navigation events
 */
export function intercept(handler: NavigationHandler): () => void {
  if (hasNavigationAPI) {
    return interceptWithNavigationAPI(handler);
  } else {
    return interceptWithHistoryAPI(handler);
  }
}

function interceptWithNavigationAPI(handler: NavigationHandler): () => void {
  const navigation = (window as any).navigation;
  const abortController = new AbortController();
  
  navigation.addEventListener('navigate', (event: any) => {
    const shouldIntercept = handler(event);
    if (shouldIntercept && event.canIntercept) {
      event.intercept({
        handler: () => handleNavigation(event.destination.url)
      });
    }
  }, { signal: abortController.signal });
  
  return () => abortController.abort();
}

function interceptWithHistoryAPI(handler: NavigationHandler): () => void {
  const popstateHandler = (event: PopStateEvent) => {
    const navigationEvent = createNavigationEventFromPopState(event);
    handler(navigationEvent);
  };
  
  window.addEventListener('popstate', popstateHandler);
  return () => window.removeEventListener('popstate', popstateHandler);
}

function createNavigationEventFromPopState(event: PopStateEvent): NavigationEvent {
  return {
    destination: {
      url: window.location.href,
      state: event.state
    },
    canIntercept: true,
    userInitiated: true,
    hashChange: false,
    intercept: () => {},
    preventDefault: () => event.preventDefault()
  };
}

async function handleNavigation(url: string): Promise<void> {
  // Custom navigation handling logic
  console.log('Handling navigation to:', url);
}

/**
 * Get current navigation entry
 */
export function getCurrentNavigation(): NavigationEntry | null {
  if (hasNavigationAPI) {
    const current = (window as any).navigation.currentEntry;
    return current ? {
      url: current.url,
      key: current.key,
      id: current.id,
      index: current.index,
      sameDocument: current.sameDocument,
      state: current.getState?.()
    } : null;
  } else {
    return {
      url: window.location.href,
      key: window.history.state?.key || 'default',
      id: window.history.state?.id || 'default',
      index: window.history.length - 1,
      sameDocument: true,
      state: window.history.state
    };
  }
}

/**
 * Get navigation history entries
 */
export function getNavigationHistory(): NavigationEntry[] {
  if (hasNavigationAPI) {
    const navigation = (window as any).navigation;
    return navigation.entries().map((entry: any) => ({
      url: entry.url,
      key: entry.key,
      id: entry.id,
      index: entry.index,
      sameDocument: entry.sameDocument,
      state: entry.getState?.()
    }));
  } else {
    // History API doesn't provide access to all entries
    const current = getCurrentNavigation();
    return current ? [current] : [];
  }
}

/**
 * Check if Navigation API is supported
 */
export function isNavigationAPISupported(): boolean {
  return hasNavigationAPI;
}

/**
 * Check if View Transitions are supported
 */
export function isViewTransitionsSupported(): boolean {
  return hasViewTransitions;
}
