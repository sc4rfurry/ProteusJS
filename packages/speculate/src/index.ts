/**
 * @sc4rfurryx/proteusjs-speculate
 * Speculation Rules utilities for prefetch and prerender
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

// Types
export interface SpeculationRule {
  source: 'list' | 'document';
  where?: { href_matches?: string; selector_matches?: string; not?: SpeculationRule['where'] };
  urls?: string[];
  eagerness?: 'immediate' | 'moderate' | 'conservative';
}

export interface SpeculationRulesConfig {
  prefetch?: SpeculationRule[];
  prerender?: SpeculationRule[];
}

export interface PrefetchOptions {
  urls?: string[];
  selector?: string;
  eagerness?: SpeculationRule['eagerness'];
  exclude?: string[];
}

export interface PrerenderOptions extends PrefetchOptions {
  maxConcurrent?: number;
}

// Feature detection
const hasSpeculationRules = 'supports' in HTMLScriptElement && HTMLScriptElement.supports('speculationrules');

/**
 * Create and inject speculation rules
 */
export function createSpeculationRules(config: SpeculationRulesConfig): HTMLScriptElement {
  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.textContent = JSON.stringify(config, null, 2);
  
  document.head.appendChild(script);
  return script;
}

/**
 * Set up prefetch rules for specific URLs
 */
export function prefetch(options: PrefetchOptions = {}): HTMLScriptElement {
  const rules: SpeculationRule[] = [];
  
  if (options.urls && options.urls.length > 0) {
    rules.push({
      source: 'list',
      urls: options.urls,
      eagerness: options.eagerness || 'moderate'
    });
  }
  
  if (options.selector) {
    rules.push({
      source: 'document',
      where: { selector_matches: options.selector },
      eagerness: options.eagerness || 'moderate'
    });
  }
  
  // Add exclusion rules if specified
  if (options.exclude && options.exclude.length > 0) {
    rules.forEach(rule => {
      if (rule.where) {
        rule.where.not = {
          href_matches: options.exclude!.join('|')
        };
      }
    });
  }
  
  return createSpeculationRules({ prefetch: rules });
}

/**
 * Set up prerender rules for specific URLs
 */
export function prerender(options: PrerenderOptions = {}): HTMLScriptElement {
  const rules: SpeculationRule[] = [];
  
  if (options.urls && options.urls.length > 0) {
    rules.push({
      source: 'list',
      urls: options.urls,
      eagerness: options.eagerness || 'conservative'
    });
  }
  
  if (options.selector) {
    rules.push({
      source: 'document',
      where: { selector_matches: options.selector },
      eagerness: options.eagerness || 'conservative'
    });
  }
  
  // Add exclusion rules if specified
  if (options.exclude && options.exclude.length > 0) {
    rules.forEach(rule => {
      if (rule.where) {
        rule.where.not = {
          href_matches: options.exclude!.join('|')
        };
      }
    });
  }
  
  return createSpeculationRules({ prerender: rules });
}

/**
 * Set up intelligent prefetching based on user behavior
 */
export function intelligentPrefetch(options: {
  hoverDelay?: number;
  intersectionThreshold?: number;
  exclude?: string[];
  maxConcurrent?: number;
} = {}): () => void {
  const {
    hoverDelay = 100,
    intersectionThreshold = 0.1,
    exclude = [],
    maxConcurrent = 3
  } = options;
  
  const prefetchedUrls = new Set<string>();
  const pendingPrefetches = new Map<string, number>();
  let activePrefetches = 0;
  
  // Hover-based prefetching
  const handleMouseEnter = (event: MouseEvent) => {
    const link = (event.target as Element).closest('a[href]') as HTMLAnchorElement;
    if (!link || !shouldPrefetch(link.href)) return;
    
    const timeoutId = window.setTimeout(() => {
      prefetchUrl(link.href);
    }, hoverDelay);
    
    pendingPrefetches.set(link.href, timeoutId);
  };
  
  const handleMouseLeave = (event: MouseEvent) => {
    const link = (event.target as Element).closest('a[href]') as HTMLAnchorElement;
    if (!link) return;
    
    const timeoutId = pendingPrefetches.get(link.href);
    if (timeoutId) {
      clearTimeout(timeoutId);
      pendingPrefetches.delete(link.href);
    }
  };
  
  // Intersection-based prefetching
  const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLAnchorElement;
        if (shouldPrefetch(link.href)) {
          // Delay prefetch to avoid prefetching links user quickly scrolls past
          setTimeout(() => {
            if (entry.intersectionRatio >= intersectionThreshold) {
              prefetchUrl(link.href);
            }
          }, 500);
        }
      }
    });
  }, { threshold: intersectionThreshold });
  
  function shouldPrefetch(url: string): boolean {
    if (prefetchedUrls.has(url)) return false;
    if (activePrefetches >= maxConcurrent) return false;
    if (exclude.some(pattern => url.includes(pattern))) return false;
    
    // Don't prefetch external links
    try {
      const urlObj = new URL(url, window.location.href);
      return urlObj.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  
  function prefetchUrl(url: string): void {
    if (prefetchedUrls.has(url) || activePrefetches >= maxConcurrent) return;
    
    prefetchedUrls.add(url);
    activePrefetches++;
    
    // Use speculation rules if supported, otherwise fall back to link prefetch
    if (hasSpeculationRules) {
      const script = prefetch({ urls: [url], eagerness: 'immediate' });
      
      // Clean up after some time
      setTimeout(() => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        activePrefetches--;
      }, 30000);
    } else {
      // Fallback to link prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.onload = link.onerror = () => {
        activePrefetches--;
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
      document.head.appendChild(link);
    }
  }
  
  // Set up event listeners
  document.addEventListener('mouseenter', handleMouseEnter, true);
  document.addEventListener('mouseleave', handleMouseLeave, true);
  
  // Observe all links
  document.querySelectorAll('a[href]').forEach(link => {
    intersectionObserver.observe(link);
  });
  
  // Observe new links added to the DOM
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const links = element.matches('a[href]') 
            ? [element] 
            : Array.from(element.querySelectorAll('a[href]'));
          
          links.forEach(link => intersectionObserver.observe(link));
        }
      });
    });
  });
  
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Return cleanup function
  return () => {
    document.removeEventListener('mouseenter', handleMouseEnter, true);
    document.removeEventListener('mouseleave', handleMouseLeave, true);
    intersectionObserver.disconnect();
    mutationObserver.disconnect();
    
    // Clear pending prefetches
    pendingPrefetches.forEach(timeoutId => clearTimeout(timeoutId));
    pendingPrefetches.clear();
  };
}

/**
 * Set up common exclusion patterns for auth/admin pages
 */
export function createSafeSpeculationRules(options: {
  prefetchUrls?: string[];
  prerenderUrls?: string[];
  excludePatterns?: string[];
} = {}): HTMLScriptElement {
  const defaultExcludes = [
    '/admin',
    '/auth',
    '/login',
    '/logout',
    '/api',
    '/download',
    '.pdf',
    '.zip',
    '.exe',
    'mailto:',
    'tel:',
    '#'
  ];
  
  const excludePatterns = [...defaultExcludes, ...(options.excludePatterns || [])];
  
  const config: SpeculationRulesConfig = {};
  
  if (options.prefetchUrls) {
    config.prefetch = [{
      source: 'list',
      urls: options.prefetchUrls.filter(url => 
        !excludePatterns.some(pattern => url.includes(pattern))
      ),
      eagerness: 'moderate'
    }];
  }
  
  if (options.prerenderUrls) {
    config.prerender = [{
      source: 'list',
      urls: options.prerenderUrls.filter(url => 
        !excludePatterns.some(pattern => url.includes(pattern))
      ),
      eagerness: 'conservative'
    }];
  }
  
  return createSpeculationRules(config);
}

/**
 * Remove speculation rules
 */
export function removeSpeculationRules(script: HTMLScriptElement): void {
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
}

/**
 * Check if Speculation Rules API is supported
 */
export function isSpeculationRulesSupported(): boolean {
  return hasSpeculationRules;
}

/**
 * Get all active speculation rules scripts
 */
export function getActiveSpeculationRules(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script[type="speculationrules"]'));
}

/**
 * Clear all speculation rules
 */
export function clearAllSpeculationRules(): void {
  getActiveSpeculationRules().forEach(removeSpeculationRules);
}
