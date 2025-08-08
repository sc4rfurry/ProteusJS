/**
 * FLIP Animation System for ProteusJS
 * First, Last, Invert, Play animations for smooth layout transitions
 */

export interface FLIPConfig {
  duration: number;
  easing: string;
  respectMotionPreference: boolean;
  batchAnimations: boolean;
  performanceMode: 'smooth' | 'performance' | 'auto';
  maxConcurrentAnimations: number;
}

export interface FLIPState {
  element: Element;
  first: DOMRect;
  last: DOMRect;
  invert: { x: number; y: number; scaleX: number; scaleY: number };
  player: Animation | null;
}

export class FLIPAnimationSystem {
  private config: Required<FLIPConfig>;
  private activeAnimations: Map<Element, FLIPState> = new Map();
  private animationQueue: (() => Promise<void>)[] = [];
  private isProcessing: boolean = false;

  constructor(config: Partial<FLIPConfig> = {}) {
    this.config = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      respectMotionPreference: true,
      batchAnimations: true,
      performanceMode: 'auto',
      maxConcurrentAnimations: 10,
      ...config
    };
  }

  /**
   * Animate element from current position to new position
   */
  public async animate(
    element: Element,
    newPosition: () => void,
    options: Partial<FLIPConfig> = {}
  ): Promise<void> {
    const config = { ...this.config, ...options };
    
    if (this.shouldSkipAnimation()) {
      newPosition();
      return;
    }

    // FLIP: First - record initial position
    const first = element.getBoundingClientRect();

    // FLIP: Last - apply changes and record final position
    newPosition();
    const last = element.getBoundingClientRect();

    // FLIP: Invert - calculate the difference
    const invert = this.calculateInvert(first, last);

    // Skip if no change
    if (invert.x === 0 && invert.y === 0 && invert.scaleX === 1 && invert.scaleY === 1) {
      return;
    }

    // FLIP: Play - animate to final position
    return this.playAnimation(element, invert, config);
  }

  /**
   * Animate multiple elements in batch
   */
  public async animateBatch(
    animations: Array<{
      element: Element;
      newPosition: () => void;
      options?: Partial<FLIPConfig>;
    }>
  ): Promise<void> {
    if (!this.config.batchAnimations) {
      // Run animations sequentially
      for (const anim of animations) {
        await this.animate(anim.element, anim.newPosition, anim.options);
      }
      return;
    }

    // Batch FLIP: First - record all initial positions
    const flipStates = animations.map(anim => ({
      element: anim.element,
      first: anim.element.getBoundingClientRect(),
      newPosition: anim.newPosition,
      options: anim.options || {}
    }));

    // Batch FLIP: Last - apply all changes
    flipStates.forEach(state => state.newPosition());

    // Batch FLIP: Invert and Play
    const playPromises = flipStates.map(state => {
      const last = state.element.getBoundingClientRect();
      const invert = this.calculateInvert(state.first, last);
      
      if (invert.x === 0 && invert.y === 0 && invert.scaleX === 1 && invert.scaleY === 1) {
        return Promise.resolve();
      }

      const config = { ...this.config, ...state.options };
      return this.playAnimation(state.element, invert, config);
    });

    await Promise.all(playPromises);
  }

  /**
   * Cancel animation for element
   */
  public cancel(element: Element): void {
    const flipState = this.activeAnimations.get(element);
    if (flipState?.player) {
      flipState.player.cancel();
      this.activeAnimations.delete(element);
    }
  }

  /**
   * Cancel all active animations
   */
  public cancelAll(): void {
    this.activeAnimations.forEach((flipState, element) => {
      this.cancel(element);
    });
  }

  /**
   * Get active animation count
   */
  public getActiveCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Check if element is animating
   */
  public isAnimating(element: Element): boolean {
    return this.activeAnimations.has(element);
  }

  /**
   * Destroy animation system
   */
  public destroy(): void {
    this.cancelAll();
    this.animationQueue = [];
  }

  /**
   * Calculate invert values
   */
  private calculateInvert(first: DOMRect, last: DOMRect): {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
  } {
    return {
      x: first.left - last.left,
      y: first.top - last.top,
      scaleX: first.width / last.width,
      scaleY: first.height / last.height
    };
  }

  /**
   * Play FLIP animation
   */
  private async playAnimation(
    element: Element,
    invert: { x: number; y: number; scaleX: number; scaleY: number },
    config: Required<FLIPConfig>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const htmlElement = element as HTMLElement;

      // Apply initial transform (inverted position)
      const initialTransform = `translate(${invert.x}px, ${invert.y}px) scale(${invert.scaleX}, ${invert.scaleY})`;
      htmlElement.style.transform = initialTransform;

      // Create animation
      const animation = htmlElement.animate([
        { transform: initialTransform },
        { transform: 'translate(0, 0) scale(1, 1)' }
      ], {
        duration: config.duration,
        easing: config.easing,
        fill: 'forwards'
      });

      // Store animation state
      const flipState: FLIPState = {
        element,
        first: { x: 0, y: 0, width: 0, height: 0 } as DOMRect,
        last: { x: 0, y: 0, width: 0, height: 0 } as DOMRect,
        invert,
        player: animation
      };

      this.activeAnimations.set(element, flipState);

      // Handle animation completion
      animation.addEventListener('finish', () => {
        htmlElement.style.transform = '';
        this.activeAnimations.delete(element);
        resolve();
      });

      animation.addEventListener('cancel', () => {
        htmlElement.style.transform = '';
        this.activeAnimations.delete(element);
        reject(new Error('Animation cancelled'));
      });
    });
  }

  /**
   * Check if animations should be skipped
   */
  private shouldSkipAnimation(): boolean {
    if (this.config.respectMotionPreference) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        return true;
      }
    }

    if (this.config.performanceMode === 'performance') {
      return this.activeAnimations.size >= this.config.maxConcurrentAnimations;
    }

    return false;
  }
}

/**
 * Micro-interactions system for subtle UI feedback
 */
export class MicroInteractions {
  private static readonly INTERACTIONS = {
    hover: {
      scale: 1.05,
      duration: 200,
      easing: 'ease-out'
    },
    press: {
      scale: 0.95,
      duration: 100,
      easing: 'ease-in'
    },
    focus: {
      scale: 1.02,
      duration: 150,
      easing: 'ease-out'
    }
  };

  /**
   * Add hover micro-interaction
   */
  public static addHover(element: Element, options: Partial<typeof MicroInteractions.INTERACTIONS.hover> = {}): void {
    const config = { ...MicroInteractions.INTERACTIONS.hover, ...options };
    const htmlElement = element as HTMLElement;

    htmlElement.addEventListener('mouseenter', () => {
      htmlElement.style.transition = `transform ${config.duration}ms ${config.easing}`;
      htmlElement.style.transform = `scale(${config.scale})`;
    });

    htmlElement.addEventListener('mouseleave', () => {
      htmlElement.style.transform = 'scale(1)';
    });
  }

  /**
   * Add press micro-interaction
   */
  public static addPress(element: Element, options: Partial<typeof MicroInteractions.INTERACTIONS.press> = {}): void {
    const config = { ...MicroInteractions.INTERACTIONS.press, ...options };
    const htmlElement = element as HTMLElement;

    htmlElement.addEventListener('mousedown', () => {
      htmlElement.style.transition = `transform ${config.duration}ms ${config.easing}`;
      htmlElement.style.transform = `scale(${config.scale})`;
    });

    htmlElement.addEventListener('mouseup', () => {
      htmlElement.style.transform = 'scale(1)';
    });

    htmlElement.addEventListener('mouseleave', () => {
      htmlElement.style.transform = 'scale(1)';
    });
  }

  /**
   * Add focus micro-interaction
   */
  public static addFocus(element: Element, options: Partial<typeof MicroInteractions.INTERACTIONS.focus> = {}): void {
    const config = { ...MicroInteractions.INTERACTIONS.focus, ...options };
    const htmlElement = element as HTMLElement;

    htmlElement.addEventListener('focus', () => {
      htmlElement.style.transition = `transform ${config.duration}ms ${config.easing}`;
      htmlElement.style.transform = `scale(${config.scale})`;
    });

    htmlElement.addEventListener('blur', () => {
      htmlElement.style.transform = 'scale(1)';
    });
  }

  /**
   * Add ripple effect
   */
  public static addRipple(element: Element, color: string = 'rgba(255, 255, 255, 0.3)'): void {
    const htmlElement = element as HTMLElement;
    htmlElement.style.position = 'relative';
    htmlElement.style.overflow = 'hidden';

    htmlElement.addEventListener('click', (event) => {
      const rect = htmlElement.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: ${color};
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 600ms ease-out;
        pointer-events: none;
      `;

      // Add ripple animation CSS if not exists
      if (!document.getElementById('ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
          @keyframes ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      htmlElement.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
}

/**
 * Scroll-based animations system
 */
export class ScrollAnimations {
  private observer: IntersectionObserver | null = null;
  private animations: Map<Element, () => void> = new Map();

  constructor() {
    this.setupIntersectionObserver();
  }

  /**
   * Add scroll-triggered animation
   */
  public addAnimation(
    element: Element,
    animation: () => void,
    options: IntersectionObserverInit = {}
  ): void {
    this.animations.set(element, animation);
    
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  /**
   * Remove scroll animation
   */
  public removeAnimation(element: Element): void {
    this.animations.delete(element);
    
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  /**
   * Destroy scroll animations
   */
  public destroy(): void {
    this.observer?.disconnect();
    this.animations.clear();
  }

  /**
   * Setup intersection observer
   */
  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animation = this.animations.get(entry.target);
          if (animation) {
            animation();
            // Remove one-time animations
            this.removeAnimation(entry.target);
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
  }

  /**
   * Fade in animation
   */
  public static fadeIn(element: Element, duration: number = 600): void {
    const htmlElement = element as HTMLElement;
    htmlElement.style.opacity = '0';
    htmlElement.style.transition = `opacity ${duration}ms ease-in-out`;
    
    requestAnimationFrame(() => {
      htmlElement.style.opacity = '1';
    });
  }

  /**
   * Slide up animation
   */
  public static slideUp(element: Element, duration: number = 600): void {
    const htmlElement = element as HTMLElement;
    htmlElement.style.transform = 'translateY(50px)';
    htmlElement.style.opacity = '0';
    htmlElement.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
      htmlElement.style.transform = 'translateY(0)';
      htmlElement.style.opacity = '1';
    });
  }

  /**
   * Scale in animation
   */
  public static scaleIn(element: Element, duration: number = 600): void {
    const htmlElement = element as HTMLElement;
    htmlElement.style.transform = 'scale(0.8)';
    htmlElement.style.opacity = '0';
    htmlElement.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
      htmlElement.style.transform = 'scale(1)';
      htmlElement.style.opacity = '1';
    });
  }
}
