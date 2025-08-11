/**
 * @sc4rfurryx/proteusjs/perf
 * Performance guardrails and CWV-friendly patterns
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

export interface SpeculationOptions {
  prerender?: string[];
  prefetch?: string[];
  sameOriginOnly?: boolean;
}

export interface ContentVisibilityOptions {
  containIntrinsicSize?: string;
}

/**
 * Apply content-visibility for performance optimization
 */
export function contentVisibility(
  selector: string | Element,
  mode: 'auto' | 'hidden' = 'auto',
  opts: ContentVisibilityOptions = {}
): void {
  const elements = typeof selector === 'string' 
    ? document.querySelectorAll(selector)
    : [selector];

  const { containIntrinsicSize = '1000px 400px' } = opts;

  elements.forEach(element => {
    const el = element as HTMLElement;
    el.style.contentVisibility = mode;
    
    if (mode === 'auto') {
      el.style.containIntrinsicSize = containIntrinsicSize;
    }
  });
}

/**
 * Set fetch priority for resources
 */
export function fetchPriority(
  selector: string | Element,
  priority: 'high' | 'low' | 'auto'
): void {
  const elements = typeof selector === 'string'
    ? document.querySelectorAll(selector)
    : [selector];

  elements.forEach(element => {
    if (element instanceof HTMLImageElement || 
        element instanceof HTMLLinkElement ||
        element instanceof HTMLScriptElement) {
      (element as HTMLImageElement | HTMLLinkElement | HTMLScriptElement & { fetchPriority?: string }).fetchPriority = priority;
    }
  });
}

/**
 * Set up speculation rules for prerendering and prefetching
 */
export function speculate(opts: SpeculationOptions): void {
  const { prerender = [], prefetch = [], sameOriginOnly = true } = opts;

  // Check for Speculation Rules API support
  if (!('supports' in HTMLScriptElement && HTMLScriptElement.supports('speculationrules'))) {
    console.warn('Speculation Rules API not supported');
    return;
  }

  const rules: any = {};

  if (prerender.length > 0) {
    rules.prerender = prerender.map(url => {
      const rule: any = { where: { href_matches: url } };
      if (sameOriginOnly) {
        rule.where.href_matches = new URL(url, window.location.origin).href;
      }
      return rule;
    });
  }

  if (prefetch.length > 0) {
    rules.prefetch = prefetch.map(url => {
      const rule: any = { where: { href_matches: url } };
      if (sameOriginOnly) {
        rule.where.href_matches = new URL(url, window.location.origin).href;
      }
      return rule;
    });
  }

  if (Object.keys(rules).length === 0) return;

  // Create and inject speculation rules script
  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.textContent = JSON.stringify(rules);
  document.head.appendChild(script);
}

/**
 * Yield to browser using scheduler.yield or postTask when available
 */
export async function yieldToBrowser(): Promise<void> {
  // Use scheduler.yield if available (Chrome 115+)
  if ('scheduler' in window && 'yield' in (window as any).scheduler) {
    return (window as any).scheduler.yield();
  }

  // Use scheduler.postTask if available
  if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
    return new Promise(resolve => {
      (window as any).scheduler.postTask(resolve, { priority: 'user-blocking' });
    });
  }

  // Fallback to setTimeout
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

/**
 * Optimize images with loading and decoding hints
 */
export function optimizeImages(selector: string | Element = 'img'): void {
  const images = typeof selector === 'string'
    ? document.querySelectorAll(selector)
    : [selector];

  images.forEach(img => {
    if (!(img instanceof HTMLImageElement)) return;

    // Set loading attribute if not already set
    if (!img.hasAttribute('loading')) {
      const rect = img.getBoundingClientRect();
      const isAboveFold = rect.top < window.innerHeight;
      img.loading = isAboveFold ? 'eager' : 'lazy';
    }

    // Set decoding hint
    if (!img.hasAttribute('decoding')) {
      img.decoding = 'async';
    }

    // Set fetch priority for above-fold images
    if (!img.hasAttribute('fetchpriority')) {
      const rect = img.getBoundingClientRect();
      const isAboveFold = rect.top < window.innerHeight;
      if (isAboveFold) {
        (img as any).fetchPriority = 'high';
      }
    }
  });
}

/**
 * Preload critical resources
 */
export function preloadCritical(resources: Array<{ href: string; as: string; type?: string }>): void {
  resources.forEach(({ href, as, type }) => {
    // Check if already preloaded
    const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) {
      link.type = type;
    }
    document.head.appendChild(link);
  });
}

/**
 * Measure and report Core Web Vitals
 */
export function measureCWV(): Promise<{ lcp?: number; fid?: number; cls?: number }> {
  return new Promise(resolve => {
    const metrics: { lcp?: number; fid?: number; cls?: number } = {};
    let metricsCount = 0;
    const totalMetrics = 3;

    const checkComplete = () => {
      metricsCount++;
      if (metricsCount >= totalMetrics) {
        resolve(metrics);
      }
    };

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Stop observing after 10 seconds
        setTimeout(() => {
          lcpObserver.disconnect();
          checkComplete();
        }, 10000);
      } catch {
        checkComplete();
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metrics.fid = entry.processingStart - entry.startTime;
          });
          fidObserver.disconnect();
          checkComplete();
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // If no input after 10 seconds, consider FID as 0
        setTimeout(() => {
          if (metrics.fid === undefined) {
            metrics.fid = 0;
            fidObserver.disconnect();
            checkComplete();
          }
        }, 10000);
      } catch {
        checkComplete();
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(list => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // Stop observing after 10 seconds
        setTimeout(() => {
          clsObserver.disconnect();
          checkComplete();
        }, 10000);
      } catch {
        checkComplete();
      }
    } else {
      // Fallback if PerformanceObserver is not supported
      setTimeout(() => resolve(metrics), 100);
    }
  });
}

// Export boost object to match usage examples in upgrade spec
export const boost = {
  contentVisibility,
  fetchPriority,
  speculate,
  yieldToBrowser,
  optimizeImages,
  preloadCritical,
  measureCWV
};

// Export all functions as named exports and default object
export default {
  contentVisibility,
  fetchPriority,
  speculate,
  yieldToBrowser,
  optimizeImages,
  preloadCritical,
  measureCWV,
  boost
};
