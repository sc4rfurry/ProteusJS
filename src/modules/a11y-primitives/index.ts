/**
 * @sc4rfurryx/proteusjs/a11y-primitives
 * Lightweight accessibility patterns
 * 
 * @version 1.1.1
 * @author sc4rfurry
 * @license MIT
 */

export interface Controller {
  destroy(): void;
}

export interface DialogOptions {
  modal?: boolean;
  restoreFocus?: boolean;
}

export interface TooltipOptions {
  delay?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface FocusTrapController {
  activate(): void;
  deactivate(): void;
}

export function dialog(root: Element | string, opts: DialogOptions = {}): Controller {
  const el = typeof root === 'string' ? document.querySelector(root) : root;
  if (!el) throw new Error('Dialog element not found');

  const { modal = true, restoreFocus = true } = opts;
  let prevFocus: Element | null = null;

  const open = () => {
    if (restoreFocus) prevFocus = document.activeElement;
    el.setAttribute('role', 'dialog');
    if (modal) el.setAttribute('aria-modal', 'true');
    (el as HTMLElement).focus();
  };

  const close = () => {
    if (restoreFocus && prevFocus) (prevFocus as HTMLElement).focus();
  };

  return { destroy: () => close() };
}

export function tooltip(trigger: Element, content: HTMLElement, opts: TooltipOptions = {}): Controller {
  const { delay = 300 } = opts;
  let timeout: number;

  const show = () => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      content.setAttribute('role', 'tooltip');
      trigger.setAttribute('aria-describedby', content.id || 'tooltip');
      content.style.display = 'block';
    }, delay);
  };

  const hide = () => {
    clearTimeout(timeout);
    content.style.display = 'none';
    trigger.removeAttribute('aria-describedby');
  };

  trigger.addEventListener('mouseenter', show);
  trigger.addEventListener('mouseleave', hide);
  trigger.addEventListener('focus', show);
  trigger.addEventListener('blur', hide);

  return {
    destroy: () => {
      clearTimeout(timeout);
      trigger.removeEventListener('mouseenter', show);
      trigger.removeEventListener('mouseleave', hide);
      trigger.removeEventListener('focus', show);
      trigger.removeEventListener('blur', hide);
    }
  };
}

export function focusTrap(container: Element): FocusTrapController {
  const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  const activate = () => {
    const elements = container.querySelectorAll(focusable);
    if (elements.length === 0) return;
    
    const first = elements[0] as HTMLElement;
    const last = elements[elements.length - 1] as HTMLElement;
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    
    container.addEventListener('keydown', handleTab as EventListener);
    first.focus();

    return () => container.removeEventListener('keydown', handleTab as EventListener);
  };

  let deactivate = () => {};

  return {
    activate: () => { deactivate = activate() || (() => {}); },
    deactivate: () => deactivate()
  };
}

export function menu(container: Element): Controller {
  const items = container.querySelectorAll('[role="menuitem"]');
  let currentIndex = 0;

  const navigate = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        (items[currentIndex] as HTMLElement).focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        (items[currentIndex] as HTMLElement).focus();
        break;
      case 'Escape':
        e.preventDefault();
        container.dispatchEvent(new CustomEvent('menu:close'));
        break;
    }
  };

  container.setAttribute('role', 'menu');
  container.addEventListener('keydown', navigate as EventListener);

  return {
    destroy: () => container.removeEventListener('keydown', navigate as EventListener)
  };
}

export default { dialog, tooltip, focusTrap, menu };
