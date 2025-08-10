/**
 * @sc4rfurryx/proteusjs/transitions
 * View Transitions API wrapper with safe fallbacks
 * 
 * @version 1.1.0
 * @author sc4rfurry
 * @license MIT
 */

export interface TransitionOptions {
  name?: string;
  duration?: number;
  onBefore?: () => void;
  onAfter?: () => void;
  allowInterrupt?: boolean;
}

export interface NavigateOptions {
  name?: string;
  prerender?: boolean;
}

/**
 * One API for animating DOM state changes and cross-document navigations 
 * using the View Transitions API with safe fallbacks.
 */
export async function transition(
  run: () => Promise<any> | any,
  opts: TransitionOptions = {}
): Promise<void> {
  const {
    name,
    duration = 300,
    onBefore,
    onAfter,
    allowInterrupt = true
  } = opts;

  // Check for View Transitions API support
  const hasViewTransitions = 'startViewTransition' in document;

  if (onBefore) {
    onBefore();
  }

  if (!hasViewTransitions) {
    // Fallback: run immediately without transitions
    try {
      await run();
    } finally {
      if (onAfter) {
        onAfter();
      }
    }
    return;
  }

  // Use native View Transitions API
  try {
    const viewTransition = (document as any).startViewTransition(async () => {
      await run();
    });

    // Add CSS view-transition-name if name provided
    if (name) {
      const style = document.createElement('style');
      style.textContent = `
        ::view-transition-old(${name}),
        ::view-transition-new(${name}) {
          animation-duration: ${duration}ms;
        }
      `;
      document.head.appendChild(style);
      
      // Clean up style after transition
      viewTransition.finished.finally(() => {
        style.remove();
      });
    }

    await viewTransition.finished;
  } catch (error) {
    console.warn('View transition failed, falling back to immediate execution:', error);
    await run();
  } finally {
    if (onAfter) {
      onAfter();
    }
  }
}

/**
 * MPA-friendly navigation with view transitions when supported
 */
export async function navigate(url: string, opts: NavigateOptions = {}): Promise<void> {
  const { name, prerender = false } = opts;

  // Optional prerender hint (basic implementation)
  if (prerender && 'speculation' in HTMLScriptElement.prototype) {
    const script = document.createElement('script');
    script.type = 'speculationrules';
    script.textContent = JSON.stringify({
      prerender: [{ where: { href_matches: url } }]
    });
    document.head.appendChild(script);
  }

  // Check for View Transitions API support
  const hasViewTransitions = 'startViewTransition' in document;

  if (!hasViewTransitions) {
    // Fallback: normal navigation
    window.location.href = url;
    return;
  }

  try {
    // Use view transitions for navigation
    const viewTransition = (document as any).startViewTransition(() => {
      window.location.href = url;
    });

    if (name) {
      const style = document.createElement('style');
      style.textContent = `
        ::view-transition-old(${name}),
        ::view-transition-new(${name}) {
          animation-duration: 300ms;
        }
      `;
      document.head.appendChild(style);
    }

    await viewTransition.finished;
  } catch (error) {
    console.warn('View transition navigation failed, falling back to normal navigation:', error);
    window.location.href = url;
  }
}

// Export default object for convenience
export default {
  transition,
  navigate
};
