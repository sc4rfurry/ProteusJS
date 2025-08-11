/**
 * @sc4rfurryx/proteusjs/adapters/vue
 * Vue composables and directives for ProteusJS
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

import { ref, onMounted, onUnmounted, Ref } from 'vue';
import { transition, TransitionOptions } from '../modules/transitions';
import { scrollAnimate, ScrollAnimateOptions } from '../modules/scroll';
import { attach as attachPopover, PopoverOptions, PopoverController } from '../modules/popover';
import { tether, TetherOptions, TetherController } from '../modules/anchor';
import { defineContainer, ContainerOptions } from '../modules/container';

/**
 * Composable for view transitions
 */
export function useTransition() {
  return {
    transition: async (run: () => Promise<any> | any, opts?: TransitionOptions) => {
      return transition(run, opts);
    }
  };
}

/**
 * Composable for scroll animations
 */
export function useScrollAnimate(
  elementRef: Ref<HTMLElement | undefined>,
  opts: ScrollAnimateOptions
) {
  onMounted(() => {
    if (elementRef.value) {
      scrollAnimate(elementRef.value, opts);
    }
  });

  return {
    elementRef
  };
}

/**
 * Composable for popover functionality
 */
export function usePopover(
  triggerRef: Ref<HTMLElement | undefined>,
  panelRef: Ref<HTMLElement | undefined>,
  opts?: PopoverOptions
) {
  const controller = ref<PopoverController | null>(null);
  const isOpen = ref(false);

  onMounted(() => {
    if (triggerRef.value && panelRef.value) {
      controller.value = attachPopover(triggerRef.value, panelRef.value, {
        ...opts,
        onOpen: () => {
          isOpen.value = true;
          opts?.onOpen?.();
        },
        onClose: () => {
          isOpen.value = false;
          opts?.onClose?.();
        }
      });
    }
  });

  onUnmounted(() => {
    if (controller.value) {
      controller.value.destroy();
    }
  });

  const open = () => controller.value?.open();
  const close = () => controller.value?.close();
  const toggle = () => controller.value?.toggle();

  return {
    isOpen,
    open,
    close,
    toggle
  };
}

/**
 * Composable for anchor positioning
 */
export function useAnchor(
  floatingRef: Ref<HTMLElement | undefined>,
  anchorRef: Ref<HTMLElement | undefined>,
  opts?: Omit<TetherOptions, 'anchor'>
) {
  const controller = ref<TetherController | null>(null);

  onMounted(() => {
    if (floatingRef.value && anchorRef.value) {
      controller.value = tether(floatingRef.value, {
        anchor: anchorRef.value,
        ...opts
      });
    }
  });

  onUnmounted(() => {
    if (controller.value) {
      controller.value.destroy();
    }
  });

  return {
    controller
  };
}

/**
 * Composable for container queries
 */
export function useContainer(
  elementRef: Ref<HTMLElement | undefined>,
  name?: string,
  opts?: ContainerOptions
) {
  onMounted(() => {
    if (elementRef.value) {
      defineContainer(elementRef.value, name, opts);
    }
  });

  return {
    elementRef
  };
}

/**
 * Vue directive for scroll animations
 */
export const vProteusScroll = {
  mounted(el: HTMLElement, binding: { value: ScrollAnimateOptions }) {
    scrollAnimate(el, binding.value);
  }
};

/**
 * Vue directive for container queries
 */
export const vProteusContainer = {
  mounted(el: HTMLElement, binding: { value?: { name?: string; options?: ContainerOptions } }) {
    const { name, options } = binding.value || {};
    defineContainer(el, name, options);
  }
};

/**
 * Vue directive for performance optimizations
 */
export const vProteusPerf = {
  mounted(el: HTMLElement) {
    // Apply content visibility optimization
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.style.contentVisibility = 'visible';
          } else {
            el.style.contentVisibility = 'auto';
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(el);

    // Store cleanup function
    (el as any)._proteusCleanup = () => {
      observer.disconnect();
    };
  },
  unmounted(el: HTMLElement) {
    if ((el as any)._proteusCleanup) {
      (el as any)._proteusCleanup();
    }
  }
};

/**
 * Vue directive for accessibility enhancements
 */
export const vProteusA11y = {
  mounted(el: HTMLElement, binding: { value?: { announceChanges?: boolean } }) {
    const { announceChanges = false } = binding.value || {};

    // Enhance focus indicators
    const focusableElements = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      const htmlEl = element as HTMLElement;
      htmlEl.addEventListener('focus', () => {
        htmlEl.style.outline = '2px solid #0066cc';
        htmlEl.style.outlineOffset = '2px';
      });
      
      htmlEl.addEventListener('blur', () => {
        htmlEl.style.outline = 'none';
      });
    });

    if (announceChanges) {
      const observer = new MutationObserver(() => {
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

      observer.observe(el, { childList: true, subtree: true });
      
      (el as any)._proteusA11yCleanup = () => {
        observer.disconnect();
      };
    }
  },
  unmounted(el: HTMLElement) {
    if ((el as any)._proteusA11yCleanup) {
      (el as any)._proteusA11yCleanup();
    }
  }
};

/**
 * Plugin for Vue 3
 */
export const ProteusPlugin = {
  install(app: any) {
    app.directive('proteus-scroll', vProteusScroll);
    app.directive('proteus-container', vProteusContainer);
    app.directive('proteus-perf', vProteusPerf);
    app.directive('proteus-a11y', vProteusA11y);
  }
};

// Export all composables and directives
export default {
  useTransition,
  useScrollAnimate,
  usePopover,
  useAnchor,
  useContainer,
  vProteusScroll,
  vProteusContainer,
  vProteusPerf,
  vProteusA11y,
  ProteusPlugin
};
