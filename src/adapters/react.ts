/**
 * @sc4rfurryx/proteusjs/adapters/react
 * React hooks and components for ProteusJS
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

import React, { useEffect, useRef, useCallback, RefObject, createElement, useState } from 'react';

// Legacy v1.x imports (still supported)
import { transition, TransitionOptions } from '../modules/transitions';
import { scrollAnimate, ScrollAnimateOptions } from '../modules/scroll';
import { attach as attachPopover, PopoverOptions, PopoverController } from '../modules/popover';
import { tether, TetherOptions, TetherController } from '../modules/anchor';
import { defineContainer, ContainerOptions } from '../modules/container';

// v2.0.0 package imports (when available)
// Note: These imports will be resolved at runtime to avoid build issues
// In production, users should install the individual packages

/**
 * Hook for view transitions (v1.x compatibility)
 */
export function useTransition() {
  return useCallback(async (
    run: () => Promise<any> | any,
    opts?: TransitionOptions
  ) => {
    return transition(run, opts);
  }, []);
}

/**
 * Hook for Navigation API (v2.0.0)
 */
export function useNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(() =>
    typeof window !== 'undefined' ? window.location.href : ''
  );

  const navigate = useCallback(async (url: string, options: any = {}) => {
    setIsNavigating(true);
    try {
      // Dynamic import to avoid build issues
      const { navigate: navigateImpl } = await import('../../packages/router/src/index.js').catch(() => ({
        navigate: (url: string) => {
          window.history.pushState(null, '', url);
          setCurrentUrl(url);
        }
      }));

      await navigateImpl(url, options);
      setCurrentUrl(url);
    } finally {
      setIsNavigating(false);
    }
  }, []);

  const back = useCallback(async () => {
    setIsNavigating(true);
    try {
      const { back: backImpl } = await import('../../packages/router/src/index.js').catch(() => ({
        back: () => window.history.back()
      }));
      backImpl();
    } finally {
      setIsNavigating(false);
    }
  }, []);

  const forward = useCallback(async () => {
    setIsNavigating(true);
    try {
      const { forward: forwardImpl } = await import('../../packages/router/src/index.js').catch(() => ({
        forward: () => window.history.forward()
      }));
      forwardImpl();
    } finally {
      setIsNavigating(false);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentUrl(window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    navigate,
    back,
    forward,
    isNavigating,
    currentUrl
  };
}

/**
 * Hook for View Transitions API (v2.0.0)
 */
export function useViewTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(async (
    updateCallback: () => void | Promise<void>,
    options: any = {}
  ) => {
    setIsTransitioning(true);
    try {
      const { viewTransition } = await import('../../packages/transitions/src/index.js').catch(() => ({
        viewTransition: async (callback: () => void | Promise<void>) => {
          await callback();
        }
      }));

      await viewTransition(updateCallback, options);
    } finally {
      setIsTransitioning(false);
    }
  }, []);

  const slideTransition = useCallback(async (
    direction: 'left' | 'right' | 'up' | 'down',
    updateCallback: () => void | Promise<void>,
    options: any = {}
  ) => {
    setIsTransitioning(true);
    try {
      const { slideTransition: slideImpl } = await import('../../packages/transitions/src/index.js').catch(() => ({
        slideTransition: async (dir: string, callback: () => void | Promise<void>) => {
          await callback();
        }
      }));

      await slideImpl(direction, updateCallback, options);
    } finally {
      setIsTransitioning(false);
    }
  }, []);

  return {
    startTransition,
    slideTransition,
    isTransitioning,
    isSupported: typeof document !== 'undefined' && 'startViewTransition' in document
  };
}

/**
 * Hook for Popover API (v2.0.0)
 */
export function usePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const controllerRef = useRef<any>(null);

  const show = useCallback(async () => {
    if (!triggerRef.current || !contentRef.current) return;

    try {
      const { popover } = await import('../../packages/layer/src/index.js').catch(() => ({
        popover: () => ({ show: () => {}, hide: () => {} })
      }));

      if (!controllerRef.current) {
        controllerRef.current = popover(triggerRef.current, contentRef.current, {
          trigger: 'manual'
        });
      }

      controllerRef.current.show();
      setIsOpen(true);
    } catch (error) {
      console.warn('Popover API not available:', error);
    }
  }, []);

  const hide = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.hide();
      setIsOpen(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      hide();
    } else {
      show();
    }
  }, [isOpen, show, hide]);

  return {
    triggerRef,
    contentRef,
    show,
    hide,
    toggle,
    isOpen,
    isSupported: typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype
  };
}

/**
 * Hook for Scheduler API (v2.0.0)
 */
export function useScheduler() {
  const [isProcessing, setIsProcessing] = useState(false);

  const postTask = useCallback(async (
    callback: () => any,
    options: any = {}
  ) => {
    setIsProcessing(true);
    try {
      const { postTask: postTaskImpl } = await import('../../packages/schedule/src/index.js').catch(() => ({
        postTask: async (cb: () => any) => cb()
      }));

      return await postTaskImpl(callback, options);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processInChunks = useCallback(async (
    items: any[],
    processor: (item: any, index: number) => any,
    options: any = {}
  ) => {
    setIsProcessing(true);
    try {
      const { processInChunks: processImpl } = await import('../../packages/schedule/src/index.js').catch(() => ({
        processInChunks: async (items: any[], proc: any) => items.map(proc)
      }));

      return await processImpl(items, processor, options);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const yieldToMain = useCallback(async (options: any = {}) => {
    const { yieldToMain: yieldImpl } = await import('../../packages/schedule/src/index.js').catch(() => ({
      yieldToMain: async () => new Promise(resolve => setTimeout(resolve, 0))
    }));

    return await yieldImpl(options);
  }, []);

  return {
    postTask,
    processInChunks,
    yieldToMain,
    isProcessing,
    isSupported: typeof window !== 'undefined' && 'scheduler' in window
  };
}

/**
 * Hook for PWA APIs (v2.0.0)
 */
export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPromptRef.current) return false;

    try {
      deferredPromptRef.current.prompt();
      const result = await deferredPromptRef.current.userChoice;

      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setIsInstalled(true);
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Install prompt failed:', error);
      return false;
    }
  }, []);

  const share = useCallback(async (data: any) => {
    try {
      const { Share } = await import('../../packages/pwa/src/index.js').catch(() => ({
        Share: { share: async () => {} }
      }));

      await Share.share(data);
      return true;
    } catch (error) {
      console.warn('Web Share failed:', error);
      return false;
    }
  }, []);

  const setBadge = useCallback(async (count?: number) => {
    try {
      const { Badging } = await import('../../packages/pwa/src/index.js').catch(() => ({
        Badging: { set: async () => {} }
      }));

      await Badging.set({ count });
    } catch (error) {
      console.warn('Badging failed:', error);
    }
  }, []);

  const clearBadge = useCallback(async () => {
    try {
      const { Badging } = await import('../../packages/pwa/src/index.js').catch(() => ({
        Badging: { clear: async () => {} }
      }));

      await Badging.clear();
    } catch (error) {
      console.warn('Badging clear failed:', error);
    }
  }, []);

  return {
    install,
    share,
    setBadge,
    clearBadge,
    isInstallable,
    isInstalled,
    capabilities: {
      share: 'share' in navigator,
      badging: 'setAppBadge' in navigator,
      fileSystem: 'showOpenFilePicker' in window
    }
  };
}

/**
 * Hook for scroll-driven animations (legacy v1.x)
 */
export function useScrollAnimate(
  ref: RefObject<HTMLElement>,
  opts: ScrollAnimateOptions
) {
  useEffect(() => {
    if (!ref.current) return;

    scrollAnimate(ref.current, opts);

    return () => {
      // Cleanup would be handled by the scroll module
    };
  }, [ref, opts]);
}

/**
 * Hook for popover functionality (legacy v1.x)
 */
export function useLegacyPopover(
  triggerRef: RefObject<HTMLElement>,
  panelRef: RefObject<HTMLElement>,
  opts?: PopoverOptions
): PopoverController | null {
  const controllerRef = useRef<PopoverController | null>(null);

  useEffect(() => {
    if (!triggerRef.current || !panelRef.current) return;

    controllerRef.current = attachPopover(triggerRef.current, panelRef.current, opts);

    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, [triggerRef, panelRef, opts]);

  return controllerRef.current;
}

/**
 * Hook for anchor positioning
 */
export function useAnchor(
  floatingRef: RefObject<HTMLElement>,
  anchorRef: RefObject<HTMLElement>,
  opts?: Omit<TetherOptions, 'anchor'>
): TetherController | null {
  const controllerRef = useRef<TetherController | null>(null);

  useEffect(() => {
    if (!floatingRef.current || !anchorRef.current) return;

    controllerRef.current = tether(floatingRef.current, {
      anchor: anchorRef.current,
      ...opts
    });

    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, [floatingRef, anchorRef, opts]);

  return controllerRef.current;
}

/**
 * Hook for container queries
 */
export function useContainer(
  ref: RefObject<HTMLElement>,
  name?: string,
  opts?: ContainerOptions
) {
  useEffect(() => {
    if (!ref.current) return;

    defineContainer(ref.current, name, opts);
  }, [ref, name, opts]);
}

/**
 * Hook for performance optimizations
 */
export function usePerformance(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return;

    // Apply basic performance optimizations
    const element = ref.current;
    
    // Content visibility for off-screen content
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            element.style.contentVisibility = 'visible';
          } else {
            element.style.contentVisibility = 'auto';
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);
}

/**
 * Hook for accessibility features
 */
export function useA11y(ref: RefObject<HTMLElement>, options: {
  announceChanges?: boolean;
  focusManagement?: boolean;
} = {}): void {
  const { announceChanges = false, focusManagement = true } = options;

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    // Basic accessibility enhancements
    if (focusManagement) {
      // Ensure focusable elements have visible focus indicators
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      focusableElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl.style.outline && !getComputedStyle(htmlEl).outline) {
          htmlEl.style.outline = '2px solid transparent';
          htmlEl.style.outlineOffset = '2px';
          
          htmlEl.addEventListener('focus', () => {
            htmlEl.style.outline = '2px solid #0066cc';
          });
          
          htmlEl.addEventListener('blur', () => {
            htmlEl.style.outline = '2px solid transparent';
          });
        }
      });
    }

    if (announceChanges) {
      // Set up mutation observer for announcing changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Announce significant changes to screen readers
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.style.position = 'absolute';
            announcement.style.left = '-10000px';
            announcement.textContent = 'Content updated';
            document.body.appendChild(announcement);
            
            setTimeout(() => {
              document.body.removeChild(announcement);
            }, 1000);
          }
        });
      });

      observer.observe(element, {
        childList: true,
        subtree: true
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [ref, announceChanges, focusManagement]);
}

/**
 * Higher-order component for adding ProteusJS features
 */
export function withProteus<P extends object>(
  Component: React.ComponentType<P>,
  features: {
    container?: { name?: string; options?: ContainerOptions };
    performance?: boolean;
    accessibility?: boolean;
  } = {}
) {
  return function ProteusEnhanced(props: P) {
    const ref = useRef<HTMLDivElement>(null);

    if (features.container) {
      useContainer(ref, features.container.name, features.container.options);
    }

    if (features.performance) {
      usePerformance(ref);
    }

    if (features.accessibility) {
      useA11y(ref);
    }

    return createElement(
      'div',
      { ref },
      createElement(Component, props)
    );
  };
}

// Export all hooks and utilities
export default {
  useTransition,
  useScrollAnimate,
  usePopover,
  useAnchor,
  useContainer,
  usePerformance,
  useA11y,
  withProteus
};
