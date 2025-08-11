/**
 * @sc4rfurryx/proteusjs/scroll
 * Scroll-driven animations with CSS Scroll-Linked Animations
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

export interface ScrollAnimateOptions {
  keyframes: Keyframe[];
  range?: [string, string];
  timeline?: {
    axis?: 'block' | 'inline';
    start?: string;
    end?: string;
  };
  fallback?: 'io' | false;
}

/**
 * Zero-boilerplate setup for CSS Scroll-Linked Animations with fallbacks
 */
export function scrollAnimate(
  target: Element | string,
  opts: ScrollAnimateOptions
): void {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetEl) {
    throw new Error('Target element not found');
  }

  const {
    keyframes,
    range = ['0%', '100%'],
    timeline = {},
    fallback = 'io'
  } = opts;

  const {
    axis = 'block',
    start = '0%',
    end = '100%'
  } = timeline;

  // Check for CSS Scroll-Linked Animations support
  const hasScrollTimeline = 'CSS' in window && CSS.supports('animation-timeline', 'scroll()');

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Respect user preference - either disable or reduce animation
    if (fallback === false) return;
    
    // Apply only the end state for reduced motion
    const endKeyframe = keyframes[keyframes.length - 1];
    Object.assign((targetEl as HTMLElement).style, endKeyframe);
    return;
  }

  if (hasScrollTimeline) {
    // Use native CSS Scroll-Linked Animations
    const timelineName = `scroll-timeline-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create scroll timeline
    const style = document.createElement('style');
    style.textContent = `
      @scroll-timeline ${timelineName} {
        source: nearest;
        orientation: ${axis};
        scroll-offsets: ${start}, ${end};
      }
      
      .scroll-animate-${timelineName} {
        animation-timeline: ${timelineName};
        animation-duration: 1ms; /* Required but ignored */
        animation-fill-mode: both;
      }
    `;
    document.head.appendChild(style);

    // Apply animation class
    targetEl.classList.add(`scroll-animate-${timelineName}`);

    // Create Web Animations API animation
    const animation = targetEl.animate(keyframes, {
      duration: 1, // Required but ignored with scroll timeline
      fill: 'both'
    });

    // Set scroll timeline (when supported)
    if ('timeline' in animation) {
      (animation as any).timeline = new (window as any).ScrollTimeline({
        source: document.scrollingElement,
        orientation: axis,
        scrollOffsets: [
          { target: targetEl, edge: 'start', threshold: parseFloat(start) / 100 },
          { target: targetEl, edge: 'end', threshold: parseFloat(end) / 100 }
        ]
      });
    }

  } else if (fallback === 'io') {
    // Fallback using Intersection Observer
    let animation: Animation | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const progress = Math.max(0, Math.min(1, entry.intersectionRatio));
          
          if (!animation) {
            animation = targetEl.animate(keyframes, {
              duration: 1000,
              fill: 'both'
            });
            animation.pause();
          }

          // Update animation progress based on intersection
          animation.currentTime = progress * 1000;
        });
      },
      {
        threshold: Array.from({ length: 101 }, (_, i) => i / 100) // 0 to 1 in 0.01 steps
      }
    );

    observer.observe(targetEl);

    // Store cleanup function
    (targetEl as any)._scrollAnimateCleanup = () => {
      observer.disconnect();
      if (animation) {
        animation.cancel();
      }
    };
  }
}

/**
 * Create a scroll-triggered animation that plays once when element enters viewport
 */
export function scrollTrigger(
  target: Element | string,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions = {}
): void {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetEl) {
    throw new Error('Target element not found');
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Apply end state immediately
    const endKeyframe = keyframes[keyframes.length - 1];
    Object.assign((targetEl as HTMLElement).style, endKeyframe);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Play animation
          targetEl.animate(keyframes, {
            duration: 600,
            easing: 'ease-out',
            fill: 'forwards',
            ...options
          });

          // Disconnect observer after first trigger
          observer.disconnect();
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    }
  );

  observer.observe(targetEl);
}

/**
 * Parallax effect using scroll-driven animations
 */
export function parallax(
  target: Element | string,
  speed: number = 0.5
): void {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetEl) {
    throw new Error('Target element not found');
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const keyframes = [
    { transform: `translateY(${-100 * speed}px)` },
    { transform: `translateY(${100 * speed}px)` }
  ];

  scrollAnimate(targetEl, {
    keyframes,
    range: ['0%', '100%'],
    timeline: { axis: 'block' },
    fallback: 'io'
  });
}

/**
 * Cleanup function to remove scroll animations
 */
export function cleanup(target: Element | string): void {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetEl) return;

  // Call stored cleanup function if it exists
  if ((targetEl as any)._scrollAnimateCleanup) {
    (targetEl as any)._scrollAnimateCleanup();
    delete (targetEl as any)._scrollAnimateCleanup;
  }

  // Remove animation classes
  targetEl.classList.forEach(className => {
    if (className.startsWith('scroll-animate-')) {
      targetEl.classList.remove(className);
    }
  });

  // Cancel any running animations
  const animations = targetEl.getAnimations();
  animations.forEach(animation => animation.cancel());
}

// Export default object for convenience
export default {
  scrollAnimate,
  scrollTrigger,
  parallax,
  cleanup
};
