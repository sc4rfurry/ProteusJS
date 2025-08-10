/**
 * @sc4rfurryx/proteusjs/popover
 * HTML Popover API wrapper with robust focus/inert handling
 * 
 * @version 1.1.0
 * @author sc4rfurry
 * @license MIT
 */

export interface PopoverOptions {
  type?: 'menu' | 'dialog' | 'tooltip';
  trapFocus?: boolean;
  restoreFocus?: boolean;
  closeOnEscape?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface PopoverController {
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

/**
 * Unified API for menus, tooltips, and dialogs using the native Popover API
 * with robust focus/inert handling
 */
export function attach(
  trigger: Element | string,
  panel: Element | string,
  opts: PopoverOptions = {}
): PopoverController {
  const triggerEl = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
  const panelEl = typeof panel === 'string' ? document.querySelector(panel) : panel;

  if (!triggerEl || !panelEl) {
    throw new Error('Both trigger and panel elements must exist');
  }

  const {
    type = 'menu',
    trapFocus = type === 'dialog',
    restoreFocus = true,
    closeOnEscape = true,
    onOpen,
    onClose
  } = opts;

  let isOpen = false;
  let previousFocus: Element | null = null;
  let focusTrap: FocusTrap | null = null;

  // Check for native Popover API support
  const hasPopoverAPI = 'popover' in HTMLElement.prototype;

  // Set up ARIA attributes
  const setupAria = () => {
    const panelId = panelEl.id || `popover-${Math.random().toString(36).substr(2, 9)}`;
    panelEl.id = panelId;

    triggerEl.setAttribute('aria-expanded', 'false');
    triggerEl.setAttribute('aria-controls', panelId);

    if (type === 'menu') {
      triggerEl.setAttribute('aria-haspopup', 'menu');
      panelEl.setAttribute('role', 'menu');
    } else if (type === 'dialog') {
      triggerEl.setAttribute('aria-haspopup', 'dialog');
      panelEl.setAttribute('role', 'dialog');
      panelEl.setAttribute('aria-modal', 'true');
    } else if (type === 'tooltip') {
      triggerEl.setAttribute('aria-describedby', panelId);
      panelEl.setAttribute('role', 'tooltip');
    }
  };

  // Set up native popover if supported
  const setupNativePopover = () => {
    if (hasPopoverAPI) {
      (panelEl as any).popover = type === 'dialog' ? 'manual' : 'auto';
      triggerEl.setAttribute('popovertarget', panelEl.id);
    }
  };

  // Focus trap implementation
  class FocusTrap {
    private focusableElements: Element[] = [];

    constructor(private container: Element) {
      this.updateFocusableElements();
    }

    private updateFocusableElements() {
      const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      this.focusableElements = Array.from(this.container.querySelectorAll(selector));
    }

    activate() {
      this.updateFocusableElements();
      if (this.focusableElements.length > 0) {
        (this.focusableElements[0] as HTMLElement).focus();
      }
      document.addEventListener('keydown', this.handleKeyDown);
    }

    deactivate() {
      document.removeEventListener('keydown', this.handleKeyDown);
    }

    private handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = this.focusableElements[0] as HTMLElement;
      const lastElement = this.focusableElements[this.focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
  }

  const open = () => {
    if (isOpen) return;

    if (restoreFocus) {
      previousFocus = document.activeElement;
    }

    if (hasPopoverAPI) {
      (panelEl as any).showPopover();
    } else {
      (panelEl as HTMLElement).style.display = 'block';
      panelEl.setAttribute('data-popover-open', 'true');
    }

    triggerEl.setAttribute('aria-expanded', 'true');
    isOpen = true;

    if (trapFocus) {
      focusTrap = new FocusTrap(panelEl);
      focusTrap.activate();
    }

    if (onOpen) {
      onOpen();
    }
  };

  const close = () => {
    if (!isOpen) return;

    if (hasPopoverAPI) {
      (panelEl as any).hidePopover();
    } else {
      (panelEl as HTMLElement).style.display = 'none';
      panelEl.removeAttribute('data-popover-open');
    }

    triggerEl.setAttribute('aria-expanded', 'false');
    isOpen = false;

    if (focusTrap) {
      focusTrap.deactivate();
      focusTrap = null;
    }

    if (restoreFocus && previousFocus) {
      (previousFocus as HTMLElement).focus();
      previousFocus = null;
    }

    if (onClose) {
      onClose();
    }
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (closeOnEscape && e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  };

  const handleClick = (e: Event) => {
    e.preventDefault();
    toggle();
  };

  const destroy = () => {
    triggerEl.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleKeyDown);
    
    if (focusTrap) {
      focusTrap.deactivate();
    }
    
    if (isOpen) {
      close();
    }
  };

  // Initialize
  setupAria();
  setupNativePopover();
  
  triggerEl.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);

  return {
    open,
    close,
    toggle,
    destroy
  };
}

// Export default object for convenience
export default {
  attach
};
