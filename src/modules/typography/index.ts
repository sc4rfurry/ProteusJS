/**
 * @sc4rfurryx/proteusjs/typography
 * Fluid typography with CSS-first approach
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

export interface FluidTypeOptions {
  minViewportPx?: number;
  maxViewportPx?: number;
  lineHeight?: number;
  containerUnits?: boolean;
}

export interface FluidTypeResult {
  css: string;
}

/**
 * Generate pure-CSS clamp() rules for fluid typography
 */
export function fluidType(
  minRem: number,
  maxRem: number,
  options: FluidTypeOptions = {}
): FluidTypeResult {
  const {
    minViewportPx = 320,
    maxViewportPx = 1200,
    lineHeight,
    containerUnits = false
  } = options;

  // Convert rem to px for calculations (assuming 16px base)
  const minPx = minRem * 16;
  const maxPx = maxRem * 16;

  // Calculate slope and y-intercept for linear interpolation
  const slope = (maxPx - minPx) / (maxViewportPx - minViewportPx);
  const yIntercept = minPx - slope * minViewportPx;

  // Generate clamp() function
  const viewportUnit = containerUnits ? 'cqw' : 'vw';
  const clampValue = `clamp(${minRem}rem, ${yIntercept / 16}rem + ${slope * 100}${viewportUnit}, ${maxRem}rem)`;

  let css = `font-size: ${clampValue};`;

  // Add line-height if specified
  if (lineHeight) {
    css += `\nline-height: ${lineHeight};`;
  }

  return { css };
}

/**
 * Apply fluid typography to elements
 */
export function applyFluidType(
  selector: string,
  minRem: number,
  maxRem: number,
  options: FluidTypeOptions = {}
): void {
  const { css } = fluidType(minRem, maxRem, options);
  
  const styleElement = document.createElement('style');
  styleElement.textContent = `${selector} {\n  ${css.replace(/\n/g, '\n  ')}\n}`;
  styleElement.setAttribute('data-proteus-typography', selector);
  document.head.appendChild(styleElement);
}

/**
 * Create a complete typographic scale
 */
export function createTypographicScale(
  baseSize: number = 1,
  ratio: number = 1.25,
  steps: number = 6,
  options: FluidTypeOptions = {}
): Record<string, FluidTypeResult> {
  const scale: Record<string, FluidTypeResult> = {};

  for (let i = -2; i <= steps - 3; i++) {
    const size = baseSize * Math.pow(ratio, i);
    const minSize = size * 0.8; // 20% smaller at min viewport
    const maxSize = size * 1.2; // 20% larger at max viewport
    
    const stepName = i <= 0 ? `small${Math.abs(i)}` : `large${i}`;
    scale[stepName] = fluidType(minSize, maxSize, options);
  }

  return scale;
}

/**
 * Generate CSS custom properties for a typographic scale
 */
export function generateScaleCSS(
  scale: Record<string, FluidTypeResult>,
  prefix: string = '--font-size'
): string {
  const cssVars = Object.entries(scale)
    .map(([name, result]) => `  ${prefix}-${name}: ${result.css.replace('font-size: ', '').replace(';', '')};`)
    .join('\n');

  return `:root {\n${cssVars}\n}`;
}

/**
 * Optimize line height for readability
 */
export function optimizeLineHeight(fontSize: number, measure: number = 65): number {
  // Optimal line height based on font size and measure (characters per line)
  // Smaller fonts need more line height, larger fonts need less
  const baseLineHeight = 1.4;
  const sizeAdjustment = Math.max(0.1, Math.min(0.3, (1 - fontSize) * 0.5));
  const measureAdjustment = Math.max(-0.1, Math.min(0.1, (65 - measure) * 0.002));
  
  return baseLineHeight + sizeAdjustment + measureAdjustment;
}

/**
 * Calculate optimal font size for container width
 */
export function calculateOptimalSize(
  containerWidth: number,
  targetCharacters: number = 65,
  baseCharWidth: number = 0.5
): number {
  // Calculate font size to achieve target characters per line
  const optimalFontSize = containerWidth / (targetCharacters * baseCharWidth);
  
  // Clamp to reasonable bounds (12px to 24px)
  return Math.max(0.75, Math.min(1.5, optimalFontSize));
}

/**
 * Apply responsive typography to an element
 */
export function makeResponsive(
  target: Element | string,
  options: {
    minSize?: number;
    maxSize?: number;
    targetCharacters?: number;
    autoLineHeight?: boolean;
  } = {}
): void {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetEl) {
    throw new Error('Target element not found');
  }

  const {
    minSize = 0.875,
    maxSize = 1.25,
    targetCharacters = 65,
    autoLineHeight = true
  } = options;

  // Apply fluid typography
  const { css } = fluidType(minSize, maxSize);
  const element = targetEl as HTMLElement;
  
  // Parse and apply CSS
  const styles = css.split(';').filter(Boolean);
  styles.forEach(style => {
    const [property, value] = style.split(':').map(s => s.trim());
    if (property && value) {
      element.style.setProperty(property, value);
    }
  });

  // Auto line height if enabled
  if (autoLineHeight) {
    const updateLineHeight = () => {
      const computedStyle = getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const containerWidth = element.getBoundingClientRect().width;
      const charactersPerLine = containerWidth / (fontSize * 0.5);
      
      const optimalLineHeight = optimizeLineHeight(fontSize / 16, charactersPerLine);
      element.style.lineHeight = optimalLineHeight.toString();
    };

    updateLineHeight();

    // Update on resize
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(updateLineHeight);
      resizeObserver.observe(element);
      
      // Store cleanup function
      (element as any)._proteusTypographyCleanup = () => {
        resizeObserver.disconnect();
      };
    }
  }
}

/**
 * Remove applied typography styles
 */
export function cleanup(target?: Element | string): void {
  if (target) {
    const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
    if (targetEl && (targetEl as any)._proteusTypographyCleanup) {
      (targetEl as any)._proteusTypographyCleanup();
      delete (targetEl as any)._proteusTypographyCleanup;
    }
  } else {
    // Remove all typography style elements
    const styleElements = document.querySelectorAll('style[data-proteus-typography]');
    styleElements.forEach(element => element.remove());
  }
}

/**
 * Check if container query units are supported
 */
export function supportsContainerUnits(): boolean {
  return CSS.supports('width', '1cqw');
}

// Export default object for convenience
export default {
  fluidType,
  applyFluidType,
  createTypographicScale,
  generateScaleCSS,
  optimizeLineHeight,
  calculateOptimalSize,
  makeResponsive,
  cleanup,
  supportsContainerUnits
};
