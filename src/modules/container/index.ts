/**
 * @sc4rfurryx/proteusjs/container
 * Container/Style Query helpers with visualization devtools
 * 
 * @version 1.1.1
 * @author sc4rfurry
 * @license MIT
 */

export interface ContainerOptions {
  type?: 'size' | 'style';
  inlineSize?: boolean;
}

/**
 * Sugar on native container queries with dev visualization
 */
export function defineContainer(
  target: Element | string,
  name?: string,
  opts: ContainerOptions = {}
): void {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetEl) {
    throw new Error('Target element not found');
  }

  const {
    type = 'size',
    inlineSize: _inlineSize = true
  } = opts;

  const containerName = name || `container-${Math.random().toString(36).substring(2, 11)}`;

  // Apply container properties
  const element = targetEl as HTMLElement;
  element.style.containerName = containerName;
  element.style.containerType = type;

  // Warn if containment settings are missing
  const computedStyle = getComputedStyle(element);
  if (!computedStyle.contain || computedStyle.contain === 'none') {
    console.warn(`Container "${containerName}" may need explicit containment settings for optimal performance`);
  }

  // Dev overlay (only in development)
  if (process.env['NODE_ENV'] === 'development' || (window as unknown as { __PROTEUS_DEV__?: boolean }).__PROTEUS_DEV__) {
    createDevOverlay(element, containerName);
  }
}

/**
 * Create development overlay showing container bounds and breakpoints
 */
function createDevOverlay(element: HTMLElement, name: string): void {
  const overlay = document.createElement('div');
  overlay.className = 'proteus-container-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    border: 2px dashed rgba(255, 0, 255, 0.5);
    background: rgba(255, 0, 255, 0.05);
    z-index: 9999;
    font-family: monospace;
    font-size: 12px;
    color: #ff00ff;
  `;

  const label = document.createElement('div');
  label.style.cssText = `
    position: absolute;
    top: -20px;
    left: 0;
    background: rgba(255, 0, 255, 0.9);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    white-space: nowrap;
  `;
  label.textContent = `Container: ${name}`;

  const sizeInfo = document.createElement('div');
  sizeInfo.style.cssText = `
    position: absolute;
    bottom: 2px;
    right: 2px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 10px;
  `;

  overlay.appendChild(label);
  overlay.appendChild(sizeInfo);

  // Position overlay relative to container
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }
  element.appendChild(overlay);

  // Update size info
  const updateSizeInfo = () => {
    const rect = element.getBoundingClientRect();
    sizeInfo.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
  };

  updateSizeInfo();

  // Update on resize
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(updateSizeInfo);
    resizeObserver.observe(element);
  }

  // Store cleanup function
  (element as HTMLElement & { _proteusContainerCleanup?: () => void })._proteusContainerCleanup = () => {
    overlay.remove();
  };
}

/**
 * Helper to create container query CSS rules
 */
export function createContainerQuery(
  containerName: string,
  condition: string,
  styles: Record<string, string>
): string {
  const cssRules = Object.entries(styles)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `@container ${containerName} (${condition}) {\n${cssRules}\n}`;
}

/**
 * Apply container query styles dynamically
 */
export function applyContainerQuery(
  containerName: string,
  condition: string,
  styles: Record<string, string>
): void {
  const css = createContainerQuery(containerName, condition, styles);
  
  const styleElement = document.createElement('style');
  styleElement.textContent = css;
  styleElement.setAttribute('data-proteus-container', containerName);
  document.head.appendChild(styleElement);
}

/**
 * Remove container query styles
 */
export function removeContainerQuery(containerName: string): void {
  const styleElements = document.querySelectorAll(`style[data-proteus-container="${containerName}"]`);
  styleElements.forEach(element => element.remove());
}

/**
 * Get container size information
 */
export function getContainerSize(target: Element | string): { width: number; height: number } {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetEl) {
    throw new Error('Target element not found');
  }

  const rect = targetEl.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}

/**
 * Check if container queries are supported
 */
export function isSupported(): boolean {
  return CSS.supports('container-type', 'size');
}

/**
 * Cleanup container overlays and observers
 */
export function cleanup(target: Element | string): void {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetEl) return;

  // Call stored cleanup function if it exists
  const elementWithCleanup = targetEl as HTMLElement & { _proteusContainerCleanup?: () => void };
  if (elementWithCleanup._proteusContainerCleanup) {
    elementWithCleanup._proteusContainerCleanup();
    delete elementWithCleanup._proteusContainerCleanup;
  }
}

/**
 * Toggle dev overlay visibility
 */
export function toggleDevOverlay(visible?: boolean): void {
  const overlays = document.querySelectorAll('.proteus-container-overlay');
  overlays.forEach(overlay => {
    const element = overlay as HTMLElement;
    if (visible !== undefined) {
      element.style.display = visible ? 'block' : 'none';
    } else {
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
  });
}

// Export default object for convenience
export default {
  defineContainer,
  createContainerQuery,
  applyContainerQuery,
  removeContainerQuery,
  getContainerSize,
  isSupported,
  cleanup,
  toggleDevOverlay
};
