/**
 * @sc4rfurryx/proteusjs/a11y-primitives
 * Headless accessibility patterns (no styles)
 * 
 * @version 1.1.0
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
}

export interface ComboboxOptions {
  multiselect?: boolean;
  filtering?: (query: string) => Promise<unknown[]> | unknown[];
}

export interface ListboxOptions {
  multiselect?: boolean;
}

export interface FocusTrapController {
  activate(): void;
  deactivate(): void;
}

/**
 * Dialog primitive with proper ARIA and focus management
 */
export function dialog(root: Element | string, opts: DialogOptions = {}): Controller {
  const rootEl = typeof root === 'string' ? document.querySelector(root) : root;
  if (!rootEl) throw new Error('Dialog root element not found');

  const { modal = true, restoreFocus = true } = opts;
  let previousFocus: Element | null = null;
  let isOpen = false;

  const setup = () => {
    rootEl.setAttribute('role', 'dialog');
    if (modal) {
      rootEl.setAttribute('aria-modal', 'true');
    }
    
    // Ensure dialog is initially hidden
    if (!rootEl.hasAttribute('hidden')) {
      rootEl.setAttribute('hidden', '');
    }
  };

  const open = () => {
    if (restoreFocus) {
      previousFocus = document.activeElement;
    }
    
    rootEl.removeAttribute('hidden');
    isOpen = true;
    
    // Focus first focusable element
    const focusable = rootEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) {
      (focusable as HTMLElement).focus();
    }
  };

  const close = () => {
    rootEl.setAttribute('hidden', '');
    isOpen = false;
    
    if (restoreFocus && previousFocus) {
      (previousFocus as HTMLElement).focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  };

  setup();
  document.addEventListener('keydown', handleKeyDown);

  return {
    destroy: () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (isOpen) close();
    }
  };
}

/**
 * Tooltip primitive with delay and proper ARIA
 */
export function tooltip(trigger: Element | string, panel: Element | string, opts: TooltipOptions = {}): Controller {
  const triggerEl = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
  const panelEl = typeof panel === 'string' ? document.querySelector(panel) : panel;
  
  if (!triggerEl || !panelEl) {
    throw new Error('Both trigger and panel elements must exist');
  }

  const { delay = 500 } = opts;
  let timeoutId: number | null = null;
  let isVisible = false;

  const setup = () => {
    const tooltipId = panelEl.id || `tooltip-${Math.random().toString(36).substring(2, 11)}`;
    panelEl.id = tooltipId;
    panelEl.setAttribute('role', 'tooltip');
    triggerEl.setAttribute('aria-describedby', tooltipId);
    
    // Initially hidden
    (panelEl as HTMLElement).style.display = 'none';
  };

  const show = () => {
    if (isVisible) return;
    (panelEl as HTMLElement).style.display = 'block';
    isVisible = true;
  };

  const hide = () => {
    if (!isVisible) return;
    (panelEl as HTMLElement).style.display = 'none';
    isVisible = false;
  };

  const handleMouseEnter = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(show, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    hide();
  };

  const handleFocus = () => {
    show();
  };

  const handleBlur = () => {
    hide();
  };

  setup();
  triggerEl.addEventListener('mouseenter', handleMouseEnter);
  triggerEl.addEventListener('mouseleave', handleMouseLeave);
  triggerEl.addEventListener('focus', handleFocus);
  triggerEl.addEventListener('blur', handleBlur);

  return {
    destroy: () => {
      if (timeoutId) clearTimeout(timeoutId);
      triggerEl.removeEventListener('mouseenter', handleMouseEnter);
      triggerEl.removeEventListener('mouseleave', handleMouseLeave);
      triggerEl.removeEventListener('focus', handleFocus);
      triggerEl.removeEventListener('blur', handleBlur);
      hide();
    }
  };
}

/**
 * Listbox primitive with keyboard navigation
 */
export function listbox(root: Element | string, opts: ListboxOptions = {}): Controller {
  const rootEl = typeof root === 'string' ? document.querySelector(root) : root;
  if (!rootEl) throw new Error('Listbox root element not found');

  const { multiselect = false } = opts;
  let currentIndex = -1;

  const setup = () => {
    rootEl.setAttribute('role', 'listbox');
    if (multiselect) {
      rootEl.setAttribute('aria-multiselectable', 'true');
    }
    
    // Set up options
    const options = rootEl.querySelectorAll('[role="option"]');
    options.forEach((option, _index) => {
      option.setAttribute('aria-selected', 'false');
      option.setAttribute('tabindex', '-1');
    });
    
    if (options.length > 0) {
      options[0]?.setAttribute('tabindex', '0');
      currentIndex = 0;
    }
  };

  const getOptions = () => rootEl.querySelectorAll('[role="option"]');

  const setCurrentIndex = (index: number) => {
    const options = getOptions();
    if (index < 0 || index >= options.length) return;
    
    // Remove tabindex from all options
    options.forEach(option => option.setAttribute('tabindex', '-1'));
    
    // Set current option
    currentIndex = index;
    options[currentIndex]?.setAttribute('tabindex', '0');
    (options[currentIndex] as HTMLElement)?.focus();
  };

  const selectOption = (index: number) => {
    const options = getOptions();
    if (index < 0 || index >= options.length) return;
    
    if (multiselect) {
      const isSelected = options[index]?.getAttribute('aria-selected') === 'true';
      options[index]?.setAttribute('aria-selected', (!isSelected).toString());
    } else {
      // Single select - clear all others
      options.forEach(option => option.setAttribute('aria-selected', 'false'));
      options[index]?.setAttribute('aria-selected', 'true');
    }
  };

  const handleKeyDown = (e: Event) => {
    const keyEvent = e as KeyboardEvent;
    const options = getOptions();
    
    switch (keyEvent.key) {
      case 'ArrowDown':
        keyEvent.preventDefault();
        setCurrentIndex(Math.min(currentIndex + 1, options.length - 1));
        break;
      case 'ArrowUp':
        keyEvent.preventDefault();
        setCurrentIndex(Math.max(currentIndex - 1, 0));
        break;
      case 'Home':
        keyEvent.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        keyEvent.preventDefault();
        setCurrentIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        keyEvent.preventDefault();
        selectOption(currentIndex);
        break;
    }
  };

  const handleClick = (e: Event) => {
    const target = e.target as Element;
    const option = target.closest('[role="option"]');
    if (!option) return;
    
    const options = Array.from(getOptions());
    const index = options.indexOf(option);
    if (index >= 0) {
      setCurrentIndex(index);
      selectOption(index);
    }
  };

  setup();
  rootEl.addEventListener('keydown', handleKeyDown);
  rootEl.addEventListener('click', handleClick);

  return {
    destroy: () => {
      rootEl.removeEventListener('keydown', handleKeyDown);
      rootEl.removeEventListener('click', handleClick);
    }
  };
}

/**
 * Combobox primitive with filtering and multiselect
 */
export function combobox(
  root: Element | string,
  opts: ComboboxOptions = {}
): Controller {
  const rootEl = typeof root === 'string' ? document.querySelector(root) : root;
  if (!rootEl) throw new Error('Combobox root element not found');

  const { multiselect = false, filtering: _filtering } = opts;
  let isOpen = false;

  const setup = () => {
    rootEl.setAttribute('role', 'combobox');
    rootEl.setAttribute('aria-expanded', 'false');
    if (multiselect) {
      rootEl.setAttribute('aria-multiselectable', 'true');
    }
  };

  const handleKeyDown = (e: Event) => {
    const keyEvent = e as KeyboardEvent;

    switch (keyEvent.key) {
      case 'ArrowDown':
        keyEvent.preventDefault();
        if (!isOpen) {
          isOpen = true;
          rootEl.setAttribute('aria-expanded', 'true');
        }
        // Navigate options logic would go here
        break;
      case 'Escape':
        keyEvent.preventDefault();
        isOpen = false;
        rootEl.setAttribute('aria-expanded', 'false');
        break;
    }
  };

  setup();
  rootEl.addEventListener('keydown', handleKeyDown);

  return {
    destroy: () => {
      rootEl.removeEventListener('keydown', handleKeyDown);
    }
  };
}

/**
 * Tabs primitive with keyboard navigation
 */
export function tabs(root: Element | string): Controller {
  const rootEl = typeof root === 'string' ? document.querySelector(root) : root;
  if (!rootEl) throw new Error('Tabs root element not found');

  let currentIndex = 0;

  const setup = () => {
    const tabList = rootEl.querySelector('[role="tablist"]');
    const tabs = rootEl.querySelectorAll('[role="tab"]');
    const panels = rootEl.querySelectorAll('[role="tabpanel"]');

    if (!tabList) {
      rootEl.setAttribute('role', 'tablist');
    }

    tabs.forEach((tab, index) => {
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    });

    panels.forEach((panel, index) => {
      panel.setAttribute('hidden', index === 0 ? '' : 'true');
    });
  };

  const handleKeyDown = (e: Event) => {
    const keyEvent = e as KeyboardEvent;
    const tabs = Array.from(rootEl.querySelectorAll('[role="tab"]'));

    switch (keyEvent.key) {
      case 'ArrowRight':
        keyEvent.preventDefault();
        currentIndex = (currentIndex + 1) % tabs.length;
        activateTab(currentIndex);
        break;
      case 'ArrowLeft':
        keyEvent.preventDefault();
        currentIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        activateTab(currentIndex);
        break;
    }
  };

  const activateTab = (index: number) => {
    const tabs = rootEl.querySelectorAll('[role="tab"]');
    const panels = rootEl.querySelectorAll('[role="tabpanel"]');

    tabs.forEach((tab, i) => {
      tab.setAttribute('tabindex', i === index ? '0' : '-1');
      tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
      if (i === index) {
        (tab as HTMLElement).focus();
      }
    });

    panels.forEach((panel, i) => {
      if (i === index) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', 'true');
      }
    });
  };

  setup();
  rootEl.addEventListener('keydown', handleKeyDown);

  return {
    destroy: () => {
      rootEl.removeEventListener('keydown', handleKeyDown);
    }
  };
}

/**
 * Menu primitive with keyboard navigation
 */
export function menu(root: Element | string): Controller {
  const rootEl = typeof root === 'string' ? document.querySelector(root) : root;
  if (!rootEl) throw new Error('Menu root element not found');

  let currentIndex = -1;

  const setup = () => {
    rootEl.setAttribute('role', 'menu');

    const items = rootEl.querySelectorAll('[role="menuitem"]');
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    if (items.length > 0) {
      currentIndex = 0;
    }
  };

  const handleKeyDown = (e: Event) => {
    const keyEvent = e as KeyboardEvent;
    const items = Array.from(rootEl.querySelectorAll('[role="menuitem"]'));

    switch (keyEvent.key) {
      case 'ArrowDown':
        keyEvent.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        setCurrentItem(currentIndex);
        break;
      case 'ArrowUp':
        keyEvent.preventDefault();
        currentIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        setCurrentItem(currentIndex);
        break;
      case 'Enter':
      case ' ':
        keyEvent.preventDefault();
        if (items[currentIndex]) {
          (items[currentIndex] as HTMLElement).click();
        }
        break;
    }
  };

  const setCurrentItem = (index: number) => {
    const items = rootEl.querySelectorAll('[role="menuitem"]');
    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === index ? '0' : '-1');
      if (i === index) {
        (item as HTMLElement).focus();
      }
    });
  };

  setup();
  rootEl.addEventListener('keydown', handleKeyDown);

  return {
    destroy: () => {
      rootEl.removeEventListener('keydown', handleKeyDown);
    }
  };
}

/**
 * Focus trap utility
 */
export function focusTrap(root: Element | string): FocusTrapController {
  const rootEl = typeof root === 'string' ? document.querySelector(root) : root;
  if (!rootEl) throw new Error('Focus trap root element not found');

  let isActive = false;
  let focusableElements: Element[] = [];

  const updateFocusableElements = () => {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    focusableElements = Array.from(rootEl.querySelectorAll(selector));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isActive || e.key !== 'Tab') return;

    updateFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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

  const activate = () => {
    if (isActive) return;
    isActive = true;
    updateFocusableElements();
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
    
    document.addEventListener('keydown', handleKeyDown);
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    document.removeEventListener('keydown', handleKeyDown);
  };

  return {
    activate,
    deactivate
  };
}

// Export all functions
export default {
  dialog,
  tooltip,
  combobox,
  listbox,
  tabs,
  menu,
  focusTrap
};
