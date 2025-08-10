/**
 * @sc4rfurryx/proteusjs/anchor
 * CSS Anchor Positioning utilities with robust JS fallback
 * 
 * @version 1.1.0
 * @author sc4rfurry
 * @license MIT
 */

export interface TetherOptions {
  anchor: Element | string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  align?: 'start' | 'center' | 'end';
  offset?: number;
  strategy?: 'absolute' | 'fixed';
}

export interface TetherController {
  destroy(): void;
}

/**
 * Declarative tethers (tooltips, callouts) via CSS Anchor Positioning when available;
 * robust JS fallback with flip/collision detection
 */
export function tether(
  floating: Element | string,
  opts: TetherOptions
): TetherController {
  const floatingEl = typeof floating === 'string' ? document.querySelector(floating) : floating;
  const anchorEl = typeof opts.anchor === 'string' ? document.querySelector(opts.anchor) : opts.anchor;

  if (!floatingEl || !anchorEl) {
    throw new Error('Both floating and anchor elements must exist');
  }

  const {
    placement = 'bottom',
    align = 'center',
    offset = 8,
    strategy = 'absolute'
  } = opts;

  // Check for CSS Anchor Positioning support
  const hasAnchorPositioning = CSS.supports('anchor-name', 'test');

  let isDestroyed = false;
  let resizeObserver: ResizeObserver | null = null;

  const setupCSSAnchorPositioning = () => {
    if (!hasAnchorPositioning) return false;

    // Generate unique anchor name
    const anchorName = `anchor-${Math.random().toString(36).substring(2, 11)}`;
    
    // Set anchor name on anchor element
    (anchorEl as HTMLElement).style.setProperty('anchor-name', anchorName);

    // Position floating element using CSS anchor positioning
    const floatingStyle = floatingEl as HTMLElement;
    floatingStyle.style.position = strategy;
    floatingStyle.style.setProperty('position-anchor', anchorName);

    // Set position based on placement
    switch (placement) {
      case 'top':
        floatingStyle.style.bottom = `anchor(bottom, ${offset}px)`;
        break;
      case 'bottom':
        floatingStyle.style.top = `anchor(bottom, ${offset}px)`;
        break;
      case 'left':
        floatingStyle.style.right = `anchor(left, ${offset}px)`;
        break;
      case 'right':
        floatingStyle.style.left = `anchor(right, ${offset}px)`;
        break;
    }

    // Set alignment
    if (placement === 'top' || placement === 'bottom') {
      switch (align) {
        case 'start':
          floatingStyle.style.left = 'anchor(left)';
          break;
        case 'center':
          floatingStyle.style.left = 'anchor(center)';
          floatingStyle.style.transform = 'translateX(-50%)';
          break;
        case 'end':
          floatingStyle.style.right = 'anchor(right)';
          break;
      }
    } else {
      switch (align) {
        case 'start':
          floatingStyle.style.top = 'anchor(top)';
          break;
        case 'center':
          floatingStyle.style.top = 'anchor(center)';
          floatingStyle.style.transform = 'translateY(-50%)';
          break;
        case 'end':
          floatingStyle.style.bottom = 'anchor(bottom)';
          break;
      }
    }

    return true;
  };

  const calculatePosition = () => {
    const anchorRect = anchorEl.getBoundingClientRect();
    const floatingRect = floatingEl.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let finalPlacement = placement;
    let x = 0;
    let y = 0;

    // Calculate base position
    switch (finalPlacement) {
      case 'top':
        x = anchorRect.left;
        y = anchorRect.top - floatingRect.height - offset;
        break;
      case 'bottom':
        x = anchorRect.left;
        y = anchorRect.bottom + offset;
        break;
      case 'left':
        x = anchorRect.left - floatingRect.width - offset;
        y = anchorRect.top;
        break;
      case 'right':
        x = anchorRect.right + offset;
        y = anchorRect.top;
        break;
      case 'auto': {
        // Choose best placement based on available space
        const spaces = {
          top: anchorRect.top,
          bottom: viewport.height - anchorRect.bottom,
          left: anchorRect.left,
          right: viewport.width - anchorRect.right
        };

        const bestPlacement = Object.entries(spaces).reduce((a, b) =>
          spaces[a[0] as keyof typeof spaces] > spaces[b[0] as keyof typeof spaces] ? a : b
        )[0] as typeof finalPlacement;
        
        finalPlacement = bestPlacement;
        return calculatePosition(); // Recursive call with determined placement
      }
    }

    // Apply alignment
    if (finalPlacement === 'top' || finalPlacement === 'bottom') {
      switch (align) {
        case 'start':
          // x already set correctly
          break;
        case 'center':
          x = anchorRect.left + (anchorRect.width - floatingRect.width) / 2;
          break;
        case 'end':
          x = anchorRect.right - floatingRect.width;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          // y already set correctly
          break;
        case 'center':
          y = anchorRect.top + (anchorRect.height - floatingRect.height) / 2;
          break;
        case 'end':
          y = anchorRect.bottom - floatingRect.height;
          break;
      }
    }

    // Collision detection and adjustment
    if (x < 0) x = 8;
    if (y < 0) y = 8;
    if (x + floatingRect.width > viewport.width) {
      x = viewport.width - floatingRect.width - 8;
    }
    if (y + floatingRect.height > viewport.height) {
      y = viewport.height - floatingRect.height - 8;
    }

    return { x, y };
  };

  const updatePosition = () => {
    if (isDestroyed) return;

    if (!hasAnchorPositioning) {
      const { x, y } = calculatePosition();
      const floatingStyle = floatingEl as HTMLElement;
      floatingStyle.style.position = strategy;
      floatingStyle.style.left = `${x}px`;
      floatingStyle.style.top = `${y}px`;
    }
  };

  const setupJSFallback = () => {
    updatePosition();

    // Set up observers for position updates
    resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(anchorEl);
    resizeObserver.observe(floatingEl);

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
  };

  const destroy = () => {
    isDestroyed = true;

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    window.removeEventListener('scroll', updatePosition);
    window.removeEventListener('resize', updatePosition);

    // Clean up CSS anchor positioning
    if (hasAnchorPositioning) {
      (anchorEl as HTMLElement).style.removeProperty('anchor-name');
      const floatingStyle = floatingEl as HTMLElement;
      floatingStyle.style.removeProperty('position-anchor');
      floatingStyle.style.position = '';
    }
  };

  // Initialize
  if (!setupCSSAnchorPositioning()) {
    setupJSFallback();
  }

  return {
    destroy
  };
}

// Export default object for convenience
export default {
  tether
};
