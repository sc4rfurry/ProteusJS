/**
 * @sc4rfurryx/proteusjs-layer
 * Popover API and positioning primitives
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';

// Types
export interface PopoverOptions {
  trigger?: 'click' | 'hover' | 'focus' | 'manual';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  flip?: boolean;
  shift?: boolean;
  arrow?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  role?: 'tooltip' | 'menu' | 'dialog' | 'listbox';
  ariaLabel?: string;
}

export interface TooltipOptions extends Omit<PopoverOptions, 'trigger' | 'role'> {
  delay?: number;
  hideDelay?: number;
}

export interface MenuOptions extends Omit<PopoverOptions, 'role'> {
  items?: MenuItem[];
  keyboard?: boolean;
}

export interface MenuItem {
  label: string;
  value: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
}

export interface LayerController {
  show(): void;
  hide(): void;
  toggle(): void;
  destroy(): void;
  isVisible(): boolean;
  update(): void;
}

// Feature detection
const hasPopoverAPI = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
const hasAnchorPositioning = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('anchor-name', 'none');

/**
 * Create a popover with Popover API or fallback positioning
 */
export function popover(
  trigger: HTMLElement,
  content: HTMLElement,
  options: PopoverOptions = {}
): LayerController {
  if (hasPopoverAPI) {
    return createNativePopover(trigger, content, options);
  } else {
    return createFallbackPopover(trigger, content, options);
  }
}

/**
 * Create popover using native Popover API
 */
function createNativePopover(
  trigger: HTMLElement,
  content: HTMLElement,
  options: PopoverOptions
): LayerController {
  // Set up popover attributes
  content.setAttribute('popover', 'auto');
  content.setAttribute('role', options.role || 'tooltip');
  
  if (options.ariaLabel) {
    content.setAttribute('aria-label', options.ariaLabel);
  }
  
  // Set up trigger
  trigger.setAttribute('popovertarget', content.id || generateId());
  
  if (!content.id) {
    content.id = trigger.getAttribute('popovertarget')!;
  }
  
  // Position using CSS Anchor Positioning if available
  if (hasAnchorPositioning && options.placement) {
    setupAnchorPositioning(trigger, content, options);
  } else {
    // Fallback to Floating UI
    setupFloatingUIPositioning(trigger, content, options);
  }
  
  // Event listeners
  const showHandler = () => content.showPopover?.();
  const hideHandler = () => content.hidePopover?.();
  
  if (options.trigger === 'hover') {
    trigger.addEventListener('mouseenter', showHandler);
    trigger.addEventListener('mouseleave', hideHandler);
    content.addEventListener('mouseenter', showHandler);
    content.addEventListener('mouseleave', hideHandler);
  } else if (options.trigger === 'focus') {
    trigger.addEventListener('focus', showHandler);
    trigger.addEventListener('blur', hideHandler);
  } else {
    trigger.addEventListener('click', () => content.togglePopover?.());
  }
  
  return {
    show: () => content.showPopover?.(),
    hide: () => content.hidePopover?.(),
    toggle: () => content.togglePopover?.(),
    destroy: () => {
      trigger.removeAttribute('popovertarget');
      content.removeAttribute('popover');
      // Remove event listeners
    },
    isVisible: () => content.matches(':popover-open'),
    update: () => updatePosition(trigger, content, options)
  };
}

/**
 * Create popover using fallback positioning
 */
function createFallbackPopover(
  trigger: HTMLElement,
  content: HTMLElement,
  options: PopoverOptions
): LayerController {
  let isVisible = false;
  
  // Set up initial styles
  content.style.position = 'absolute';
  content.style.zIndex = '1000';
  content.style.display = 'none';
  content.setAttribute('role', options.role || 'tooltip');
  
  if (options.ariaLabel) {
    content.setAttribute('aria-label', options.ariaLabel);
  }
  
  const show = () => {
    if (isVisible) return;
    isVisible = true;
    content.style.display = 'block';
    updatePosition(trigger, content, options);
    content.setAttribute('aria-hidden', 'false');
  };
  
  const hide = () => {
    if (!isVisible) return;
    isVisible = false;
    content.style.display = 'none';
    content.setAttribute('aria-hidden', 'true');
  };
  
  const toggle = () => isVisible ? hide() : show();
  
  // Event listeners
  if (options.trigger === 'hover') {
    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('mouseleave', hide);
    content.addEventListener('mouseenter', show);
    content.addEventListener('mouseleave', hide);
  } else if (options.trigger === 'focus') {
    trigger.addEventListener('focus', show);
    trigger.addEventListener('blur', hide);
  } else {
    trigger.addEventListener('click', toggle);
  }
  
  // Close on outside click
  if (options.closeOnOutsideClick !== false) {
    document.addEventListener('click', (event) => {
      if (!trigger.contains(event.target as Node) && !content.contains(event.target as Node)) {
        hide();
      }
    });
  }
  
  // Close on escape
  if (options.closeOnEscape !== false) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isVisible) {
        hide();
      }
    });
  }
  
  return {
    show,
    hide,
    toggle,
    destroy: () => {
      hide();
      // Remove event listeners
    },
    isVisible: () => isVisible,
    update: () => updatePosition(trigger, content, options)
  };
}

/**
 * Set up CSS Anchor Positioning
 */
function setupAnchorPositioning(
  trigger: HTMLElement,
  content: HTMLElement,
  options: PopoverOptions
): void {
  const anchorName = `--anchor-${generateId()}`;
  trigger.style.setProperty('anchor-name', anchorName);
  
  const placement = options.placement || 'bottom';
  content.style.setProperty('position-anchor', anchorName);
  
  switch (placement) {
    case 'top':
      content.style.setProperty('bottom', 'anchor(top)');
      content.style.setProperty('left', 'anchor(center)');
      content.style.setProperty('translate', '-50% 0');
      break;
    case 'bottom':
      content.style.setProperty('top', 'anchor(bottom)');
      content.style.setProperty('left', 'anchor(center)');
      content.style.setProperty('translate', '-50% 0');
      break;
    case 'left':
      content.style.setProperty('right', 'anchor(left)');
      content.style.setProperty('top', 'anchor(center)');
      content.style.setProperty('translate', '0 -50%');
      break;
    case 'right':
      content.style.setProperty('left', 'anchor(right)');
      content.style.setProperty('top', 'anchor(center)');
      content.style.setProperty('translate', '0 -50%');
      break;
  }
}

/**
 * Set up Floating UI positioning
 */
function setupFloatingUIPositioning(
  trigger: HTMLElement,
  content: HTMLElement,
  options: PopoverOptions
): void {
  updatePosition(trigger, content, options);
}

/**
 * Update position using Floating UI
 */
async function updatePosition(
  trigger: HTMLElement,
  content: HTMLElement,
  options: PopoverOptions
): Promise<void> {
  if (hasAnchorPositioning) return; // CSS Anchor Positioning handles this
  
  const middleware = [];
  
  if (options.offset) {
    middleware.push(offset(options.offset));
  }
  
  if (options.flip !== false) {
    middleware.push(flip());
  }
  
  if (options.shift !== false) {
    middleware.push(shift({ padding: 8 }));
  }
  
  if (options.arrow) {
    const arrowElement = content.querySelector('[data-arrow]') as HTMLElement;
    if (arrowElement) {
      middleware.push(arrow({ element: arrowElement }));
    }
  }
  
  const { x, y, placement, middlewareData } = await computePosition(trigger, content, {
    placement: options.placement || 'bottom',
    middleware
  });
  
  Object.assign(content.style, {
    left: `${x}px`,
    top: `${y}px`,
  });
  
  // Update arrow position
  if (options.arrow && middlewareData.arrow) {
    const arrowElement = content.querySelector('[data-arrow]') as HTMLElement;
    if (arrowElement) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow;
      Object.assign(arrowElement.style, {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
      });
    }
  }
}

/**
 * Create a tooltip
 */
export function tooltip(
  trigger: HTMLElement,
  content: string | HTMLElement,
  options: TooltipOptions = {}
): LayerController {
  const tooltipElement = typeof content === 'string' 
    ? createTooltipElement(content)
    : content;
  
  return popover(trigger, tooltipElement, {
    ...options,
    trigger: 'hover',
    role: 'tooltip',
    placement: options.placement || 'top'
  });
}

function createTooltipElement(content: string): HTMLElement {
  const element = document.createElement('div');
  element.className = 'proteus-tooltip';
  element.textContent = content;
  element.style.cssText = `
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    max-width: 200px;
    word-wrap: break-word;
  `;
  document.body.appendChild(element);
  return element;
}

/**
 * Create a menu
 */
export function menu(
  trigger: HTMLElement,
  options: MenuOptions = {}
): LayerController {
  const menuElement = createMenuElement(options.items || []);
  
  return popover(trigger, menuElement, {
    ...options,
    trigger: 'click',
    role: 'menu',
    placement: options.placement || 'bottom'
  });
}

function createMenuElement(items: MenuItem[]): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'proteus-menu';
  menu.setAttribute('role', 'menu');
  
  items.forEach(item => {
    if (item.separator) {
      const separator = document.createElement('hr');
      separator.className = 'proteus-menu-separator';
      menu.appendChild(separator);
    } else {
      const menuItem = document.createElement('button');
      menuItem.className = 'proteus-menu-item';
      menuItem.setAttribute('role', 'menuitem');
      menuItem.textContent = item.label;
      menuItem.disabled = item.disabled || false;
      
      if (!item.disabled) {
        menuItem.addEventListener('click', () => {
          // Emit custom event
          menu.dispatchEvent(new CustomEvent('menuselect', {
            detail: { value: item.value, label: item.label }
          }));
        });
      }
      
      menu.appendChild(menuItem);
    }
  });
  
  document.body.appendChild(menu);
  return menu;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `proteus-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if Popover API is supported
 */
export function isPopoverAPISupported(): boolean {
  return hasPopoverAPI;
}

/**
 * Check if CSS Anchor Positioning is supported
 */
export function isAnchorPositioningSupported(): boolean {
  return hasAnchorPositioning;
}
