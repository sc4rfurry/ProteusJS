# RFC-001: Navigation API Integration

**Status**: Accepted  
**Author**: ProteusJS Team  
**Date**: 2024-12-11  

## Summary

Integrate the modern Navigation API as the foundation for ProteusJS v2.0.0 routing, replacing custom routing implementations with native browser capabilities while maintaining backward compatibility through History API fallbacks.

## Motivation

### Current State
- ProteusJS v1.x uses custom routing implementations
- Limited integration with browser navigation features
- Manual handling of navigation events and state

### Goals
- Leverage native Navigation API for better performance
- Provide seamless SPA/MPA navigation experiences
- Enable advanced features like navigation interception
- Maintain compatibility with browsers lacking Navigation API support

## Detailed Design

### New Package: `@sc4rfurryx/proteusjs-router`

```typescript
// Core navigation functions
export function navigate(url: string, options?: NavigateOptions): Promise<void>;
export function back(): void;
export function forward(): void;
export function reload(): void;

// Navigation interception
export function intercept(handler: NavigationHandler): () => void;

// Navigation state
export function getCurrentNavigation(): NavigationEntry;
export function getNavigationHistory(): NavigationEntry[];

// Types
interface NavigateOptions {
  replace?: boolean;
  state?: any;
  transition?: TransitionOptions;
}

interface NavigationHandler {
  (event: NavigationEvent): boolean | Promise<boolean>;
}
```

### Implementation Strategy

1. **Feature Detection**
   ```typescript
   const hasNavigationAPI = 'navigation' in window;
   
   if (hasNavigationAPI) {
     // Use Navigation API
     window.navigation.addEventListener('navigate', handler);
   } else {
     // Fallback to History API
     window.addEventListener('popstate', handler);
   }
   ```

2. **Navigation Interception**
   ```typescript
   export function intercept(handler: NavigationHandler) {
     if (hasNavigationAPI) {
       const abortController = new AbortController();
       window.navigation.addEventListener('navigate', (event) => {
         if (handler(event)) {
           event.intercept({
             handler: () => handleNavigation(event.destination.url)
           });
         }
       }, { signal: abortController.signal });
       
       return () => abortController.abort();
     } else {
       // History API fallback implementation
     }
   }
   ```

3. **Integration with View Transitions**
   ```typescript
   export function navigate(url: string, options: NavigateOptions = {}) {
     if (options.transition && 'startViewTransition' in document) {
       return document.startViewTransition(() => {
         return performNavigation(url, options);
       });
     }
     return performNavigation(url, options);
   }
   ```

### Browser Support

- **Navigation API**: Chrome 102+, Edge 102+
- **Fallback**: History API (all modern browsers)
- **Progressive Enhancement**: Feature detection ensures compatibility

## Drawbacks

1. **Complexity**: Dual implementation paths increase maintenance burden
2. **Bundle Size**: Additional code for fallback implementations
3. **Testing**: Need to test both Navigation API and History API paths

## Alternatives

1. **History API Only**: Simpler but misses modern capabilities
2. **Polyfill**: Add Navigation API polyfill (increases bundle size)
3. **Framework-Specific**: Different implementations per framework

## Adoption Strategy

### Migration Path
```typescript
// v1.x (deprecated)
proteus.navigate('/page');

// v2.0.0 (new)
import { navigate } from '@sc4rfurryx/proteusjs-router';
navigate('/page', { transition: 'slide' });
```

### Compatibility Mode
```typescript
// Enable v1 compatibility
import '@sc4rfurryx/proteusjs/compat';
// Old API continues to work
```

### Codemods
```bash
npx proteusjs-migrate navigation ./src
```

## Implementation Plan

1. **Phase 1**: Core Navigation API wrapper
2. **Phase 2**: History API fallback implementation
3. **Phase 3**: View Transitions integration
4. **Phase 4**: Framework adapter updates
5. **Phase 5**: Migration tools and documentation

## Unresolved Questions

1. Should we provide a Navigation API polyfill option?
2. How should we handle navigation timing and performance metrics?
3. What level of History API compatibility should we maintain?

## References

- [Navigation API Specification](https://wicg.github.io/navigation-api/)
- [MDN Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)
- [Chrome DevTools Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api/)
