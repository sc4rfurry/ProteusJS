# Anchor Positioning Guide

CSS Anchor Positioning allows you to position elements relative to other elements (anchors) anywhere in the DOM.

## Quick Start

```javascript
import { tether } from '@sc4rfurryx/proteusjs/anchor';

const tooltip = document.getElementById('tooltip');
const button = document.getElementById('button');

const controller = tether(tooltip, {
  anchor: button,
  placement: 'top',
  offset: 8
});
```

## Browser Compatibility

### Native CSS Anchor Positioning

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 125+ | ✅ **Native Support** |
| Edge | 125+ | ✅ **Native Support** |
| Firefox | - | ❌ **Not Supported** |
| Safari | - | ❌ **Not Supported** |

### ProteusJS Fallback Support

ProteusJS automatically provides JavaScript fallback for unsupported browsers:

| Browser | Version | ProteusJS Support |
|---------|---------|-------------------|
| Chrome | 125+ | ✅ Native CSS |
| Chrome | 60-124 | ✅ JS Fallback |
| Firefox | 60+ | ✅ JS Fallback |
| Safari | 12+ | ✅ JS Fallback |
| Edge | 125+ | ✅ Native CSS |
| Edge | 79-124 | ✅ JS Fallback |

## ⚠️ Limitations & Considerations

### CSS Anchor Positioning Limitations

1. **Limited Browser Support**: Only Chrome/Edge 125+
2. **Performance**: Native CSS is faster but less flexible
3. **Dynamic Updates**: Requires manual position updates
4. **Overflow Handling**: Limited automatic overflow detection

### JavaScript Fallback Limitations

1. **Performance**: Slightly slower than native CSS
2. **Scroll Performance**: May need throttling on scroll
3. **Layout Shifts**: Can cause brief layout shifts during updates
4. **Memory Usage**: Keeps references to DOM elements

### General Limitations

1. **Cross-Frame Positioning**: Cannot position across iframe boundaries
2. **Print Styles**: May not work correctly in print media
3. **High DPI Displays**: Sub-pixel positioning may vary
4. **Transform Conflicts**: May conflict with CSS transforms on anchors

## API Reference

### Basic Usage

```javascript
const controller = tether(floatingElement, options);
```

### Options

```typescript
interface TetherOptions {
  anchor: Element;           // Element to anchor to
  placement?: Placement;     // Where to position relative to anchor
  offset?: number;          // Distance from anchor (default: 0)
  fallback?: Placement[];   // Fallback placements if primary doesn't fit
  boundary?: Element;       // Boundary element for overflow detection
  strategy?: 'absolute' | 'fixed'; // Positioning strategy
}

type Placement = 
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';
```

### Controller Methods

```javascript
// Update position (call after anchor moves)
controller.update();

// Destroy and cleanup
controller.destroy();

// Check if using native CSS
controller.isNative; // boolean
```

## Examples

### Basic Tooltip

```html
<button id="trigger">Hover me</button>
<div id="tooltip" style="display: none;">Tooltip content</div>
```

```javascript
import { tether } from '@sc4rfurryx/proteusjs/anchor';

const trigger = document.getElementById('trigger');
const tooltip = document.getElementById('tooltip');

const controller = tether(tooltip, {
  anchor: trigger,
  placement: 'top',
  offset: 8
});

trigger.addEventListener('mouseenter', () => {
  tooltip.style.display = 'block';
  controller.update();
});

trigger.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
});
```

### Dropdown Menu

```javascript
const dropdown = tether(menuElement, {
  anchor: buttonElement,
  placement: 'bottom-start',
  fallback: ['bottom-end', 'top-start', 'top-end'],
  boundary: document.body
});

// Update on scroll/resize
window.addEventListener('scroll', () => dropdown.update());
window.addEventListener('resize', () => dropdown.update());
```

### Modal Dialog

```javascript
const modal = tether(dialogElement, {
  anchor: triggerElement,
  placement: 'bottom',
  strategy: 'fixed',
  boundary: viewport
});
```

## Performance Optimization

### Throttle Updates

```javascript
import { throttle } from 'lodash-es';

const throttledUpdate = throttle(() => controller.update(), 16);

window.addEventListener('scroll', throttledUpdate);
window.addEventListener('resize', throttledUpdate);
```

### Intersection Observer

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      controller.update();
    }
  });
});

observer.observe(anchorElement);
```

### Cleanup

```javascript
// Always cleanup when done
controller.destroy();

// Remove event listeners
window.removeEventListener('scroll', throttledUpdate);
window.removeEventListener('resize', throttledUpdate);
observer.disconnect();
```

## CSS Integration

### Native CSS Anchor (Chrome 125+)

```css
.tooltip {
  position: absolute;
  anchor-name: --button-anchor;
  position-anchor: --button-anchor;
  top: calc(anchor(bottom) + 8px);
  left: anchor(center);
  translate: -50% 0;
}

.button {
  anchor-name: --button-anchor;
}
```

### Fallback Styles

```css
.tooltip {
  position: absolute;
  /* ProteusJS will set top/left via JavaScript */
  z-index: 1000;
}

/* Hide until positioned */
.tooltip:not([data-positioned]) {
  visibility: hidden;
}
```

## Accessibility

### ARIA Relationships

```javascript
// Set up proper ARIA relationships
trigger.setAttribute('aria-describedby', tooltip.id);
tooltip.setAttribute('role', 'tooltip');

// For dropdowns
trigger.setAttribute('aria-expanded', 'false');
trigger.setAttribute('aria-haspopup', 'true');
dropdown.setAttribute('role', 'menu');
```

### Focus Management

```javascript
// Return focus to trigger when closing
dropdown.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    dropdown.style.display = 'none';
    trigger.focus();
  }
});
```

## Migration from Other Libraries

### From Popper.js

```javascript
// Popper.js
createPopper(reference, popper, {
  placement: 'top',
  modifiers: [{ name: 'offset', options: { offset: [0, 8] } }]
});

// ProteusJS
tether(popper, {
  anchor: reference,
  placement: 'top',
  offset: 8
});
```

### From Floating UI

```javascript
// Floating UI
computePosition(reference, floating, {
  placement: 'top',
  middleware: [offset(8), flip(), shift()]
});

// ProteusJS
tether(floating, {
  anchor: reference,
  placement: 'top',
  offset: 8,
  fallback: ['bottom', 'left', 'right']
});
```

## Troubleshooting

### Common Issues

1. **Element not positioning**: Ensure anchor element is visible and has layout
2. **Position not updating**: Call `controller.update()` after DOM changes
3. **Flickering**: Use `visibility: hidden` until positioned
4. **Performance issues**: Throttle scroll/resize updates
5. **Z-index conflicts**: Ensure floating element has appropriate z-index

### Debug Mode

```javascript
const controller = tether(element, {
  anchor: anchor,
  placement: 'top',
  debug: true // Logs positioning information
});
```
