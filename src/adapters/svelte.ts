/**
 * @sc4rfurryx/proteusjs/adapters/svelte
 * Svelte actions and stores for ProteusJS
 * 
 * @version 1.1.0
 * @author sc4rfurry
 * @license MIT
 */

import { writable } from 'svelte/store';
import { transition, TransitionOptions } from '../modules/transitions';
import { scrollAnimate, ScrollAnimateOptions } from '../modules/scroll';
import { attach as attachPopover, PopoverOptions, PopoverController } from '../modules/popover';
import { tether, TetherOptions, TetherController } from '../modules/anchor';
import { defineContainer, ContainerOptions } from '../modules/container';

/**
 * Svelte action for scroll animations
 */
export function proteusScroll(node: HTMLElement, options: ScrollAnimateOptions) {
  scrollAnimate(node, options);

  return {
    update(newOptions: ScrollAnimateOptions) {
      // Re-apply with new options
      scrollAnimate(node, newOptions);
    },
    destroy() {
      // Cleanup handled by scroll module
    }
  };
}

/**
 * Svelte action for container queries
 */
export function proteusContainer(
  node: HTMLElement, 
  options: { name?: string; containerOptions?: ContainerOptions } = {}
) {
  const { name, containerOptions } = options;
  defineContainer(node, name, containerOptions);

  return {
    update(newOptions: { name?: string; containerOptions?: ContainerOptions }) {
      const { name: newName, containerOptions: newContainerOptions } = newOptions;
      defineContainer(node, newName, newContainerOptions);
    }
  };
}

/**
 * Svelte action for popover functionality
 */
export function proteusPopover(
  node: HTMLElement,
  options: { panel: HTMLElement | string; popoverOptions?: PopoverOptions }
) {
  let controller: PopoverController | null = null;
  const { panel, popoverOptions } = options;

  controller = attachPopover(node, panel, popoverOptions);

  return {
    update(newOptions: { panel: HTMLElement | string; popoverOptions?: PopoverOptions }) {
      if (controller) {
        controller.destroy();
      }
      controller = attachPopover(node, newOptions.panel, newOptions.popoverOptions);
    },
    destroy() {
      if (controller) {
        controller.destroy();
      }
    }
  };
}

/**
 * Svelte action for anchor positioning
 */
export function proteusAnchor(
  node: HTMLElement,
  options: TetherOptions
) {
  let controller: TetherController | null = null;

  controller = tether(node, options);

  return {
    update(newOptions: TetherOptions) {
      if (controller) {
        controller.destroy();
      }
      controller = tether(node, newOptions);
    },
    destroy() {
      if (controller) {
        controller.destroy();
      }
    }
  };
}

/**
 * Svelte action for performance optimizations
 */
export function proteusPerf(node: HTMLElement) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          node.style.contentVisibility = 'visible';
        } else {
          node.style.contentVisibility = 'auto';
        }
      });
    },
    { rootMargin: '50px' }
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}

/**
 * Svelte action for accessibility enhancements
 */
export function proteusA11y(
  node: HTMLElement,
  options: { announceChanges?: boolean } = {}
) {
  const { announceChanges = false } = options;

  // Enhance focus indicators
  const focusableElements = node.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const focusHandlers = new Map();

  focusableElements.forEach(element => {
    const htmlEl = element as HTMLElement;
    
    const focusHandler = () => {
      htmlEl.style.outline = '2px solid #0066cc';
      htmlEl.style.outlineOffset = '2px';
    };
    
    const blurHandler = () => {
      htmlEl.style.outline = 'none';
    };

    htmlEl.addEventListener('focus', focusHandler);
    htmlEl.addEventListener('blur', blurHandler);
    
    focusHandlers.set(htmlEl, { focusHandler, blurHandler });
  });

  let mutationObserver: MutationObserver | null = null;

  if (announceChanges) {
    mutationObserver = new MutationObserver(() => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.textContent = 'Content updated';
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    });

    mutationObserver.observe(node, { childList: true, subtree: true });
  }

  return {
    destroy() {
      // Clean up focus handlers
      focusHandlers.forEach(({ focusHandler, blurHandler }, element) => {
        element.removeEventListener('focus', focusHandler);
        element.removeEventListener('blur', blurHandler);
      });
      
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    }
  };
}

/**
 * Store for managing popover state
 */
export function createPopover(
  triggerSelector: string,
  panelSelector: string,
  options?: PopoverOptions
) {
  const isOpen = writable(false);
  let controller: PopoverController | null = null;

  const initialize = () => {
    const trigger = document.querySelector(triggerSelector);
    const panel = document.querySelector(panelSelector);

    if (trigger && panel) {
      controller = attachPopover(trigger, panel, {
        ...options,
        onOpen: () => {
          isOpen.set(true);
          options?.onOpen?.();
        },
        onClose: () => {
          isOpen.set(false);
          options?.onClose?.();
        }
      });
    }
  };

  const open = () => controller?.open();
  const close = () => controller?.close();
  const toggle = () => controller?.toggle();
  const destroy = () => {
    if (controller) {
      controller.destroy();
      controller = null;
    }
  };

  return {
    isOpen,
    initialize,
    open,
    close,
    toggle,
    destroy
  };
}

/**
 * Store for managing transition state
 */
export function createTransition() {
  const isTransitioning = writable(false);

  const runTransition = async (
    run: () => Promise<any> | any,
    opts?: TransitionOptions
  ) => {
    isTransitioning.set(true);
    try {
      await transition(run, opts);
    } finally {
      isTransitioning.set(false);
    }
  };

  return {
    isTransitioning,
    runTransition
  };
}

/**
 * Utility function to create reactive container size store
 */
export function createContainerSize(element: HTMLElement) {
  const size = writable({ width: 0, height: 0 });

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        size.set({ width, height });
      }
    });

    resizeObserver.observe(element);

    return {
      size,
      destroy: () => resizeObserver.disconnect()
    };
  }

  // Fallback for browsers without ResizeObserver
  const updateSize = () => {
    const rect = element.getBoundingClientRect();
    size.set({ width: rect.width, height: rect.height });
  };

  updateSize();
  (window as any).addEventListener('resize', updateSize);

  return {
    size,
    destroy: () => (window as any).removeEventListener('resize', updateSize)
  };
}

// Export all actions and utilities
export default {
  proteusScroll,
  proteusContainer,
  proteusPopover,
  proteusAnchor,
  proteusPerf,
  proteusA11y,
  createPopover,
  createTransition,
  createContainerSize
};
