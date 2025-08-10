/**
 * @sc4rfurryx/proteusjs/adapters/react
 * React hooks and components for ProteusJS
 * 
 * @version 1.1.0
 * @author sc4rfurry
 * @license MIT
 */

import React, { useEffect, useRef, useCallback, RefObject, createElement } from 'react';
import { transition, TransitionOptions } from '../modules/transitions';
import { scrollAnimate, ScrollAnimateOptions } from '../modules/scroll';
import { attach as attachPopover, PopoverOptions, PopoverController } from '../modules/popover';
import { tether, TetherOptions, TetherController } from '../modules/anchor';
import { defineContainer, ContainerOptions } from '../modules/container';

/**
 * Hook for view transitions
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
 * Hook for scroll-driven animations
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
 * Hook for popover functionality
 */
export function usePopover(
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
