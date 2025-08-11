# Container Queries Guide

Container queries enable responsive design based on a container's size rather than the viewport size.

## Basic Setup

```javascript
import { container } from '@sc4rfurryx/proteusjs/container';

// Enable container queries on an element
container('.sidebar', {
  type: 'inline-size',
  name: 'sidebar-container'
});
```

## CSS Container Query Units

ProteusJS supports all standard container query units:

### Size Units

| Unit | Description | Example |
|------|-------------|---------|
| `cqw` | 1% of container's width | `width: 50cqw;` |
| `cqh` | 1% of container's height | `height: 75cqh;` |
| `cqi` | 1% of container's inline size | `padding: 2cqi;` |
| `cqb` | 1% of container's block size | `margin: 1cqb;` |
| `cqmin` | Smaller of `cqi` or `cqb` | `font-size: 4cqmin;` |
| `cqmax` | Larger of `cqi` or `cqb` | `border-radius: 2cqmax;` |

### ⚠️ Important: Correct Syntax

**✅ Correct:**
```css
.card {
  width: 50cqw;    /* 50% of container width */
  height: 25cqh;   /* 25% of container height */
  padding: 2cqi;   /* 2% of container inline size */
  margin: 1cqb;    /* 1% of container block size */
}
```

**❌ Incorrect:**
```css
.card {
  width: 50 cw;    /* Invalid - space not allowed */
  height: 25 ch;   /* Invalid - 'ch' is character unit, not container */
  padding: 2 ci;   /* Invalid - space not allowed */
}
```

## Complete Example

### HTML
```html
<div class="card-container">
  <div class="card">
    <h2 class="card-title">Responsive Card</h2>
    <p class="card-content">This card adapts to its container size.</p>
  </div>
</div>
```

### JavaScript
```javascript
import { container } from '@sc4rfurryx/proteusjs/container';

// Enable container queries
container('.card-container', {
  type: 'inline-size',
  name: 'card'
});
```

### CSS
```css
.card-container {
  container-type: inline-size;
  container-name: card;
  width: 100%;
  max-width: 600px;
}

.card {
  padding: 2cqi;
  border-radius: 1cqmin;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Small container */
@container card (max-width: 300px) {
  .card-title {
    font-size: 5cqw;
    margin-bottom: 1cqb;
  }
  
  .card-content {
    font-size: 3.5cqw;
    line-height: 1.4;
  }
}

/* Medium container */
@container card (min-width: 301px) and (max-width: 500px) {
  .card-title {
    font-size: 4cqw;
    margin-bottom: 1.5cqb;
  }
  
  .card-content {
    font-size: 3cqw;
    line-height: 1.5;
  }
}

/* Large container */
@container card (min-width: 501px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 3cqi;
  }
  
  .card-title {
    font-size: 3cqw;
    margin-bottom: 2cqb;
  }
  
  .card-content {
    font-size: 2.5cqw;
    line-height: 1.6;
  }
}
```

## Container Types

### `inline-size`
Queries based on the container's inline dimension (width in horizontal writing modes).

```javascript
container('.element', { type: 'inline-size' });
```

### `block-size`
Queries based on the container's block dimension (height in horizontal writing modes).

```javascript
container('.element', { type: 'block-size' });
```

### `size`
Queries based on both inline and block dimensions.

```javascript
container('.element', { type: 'size' });
```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 105+ | ✅ Full |
| Firefox | 110+ | ✅ Full |
| Safari | 16+ | ✅ Full |
| Edge | 105+ | ✅ Full |

## Performance Tips

1. **Use `inline-size`** for most responsive layouts (more performant than `size`)
2. **Avoid deep nesting** of container queries
3. **Use container names** to avoid conflicts
4. **Prefer `cqi` and `cqb`** over `cqw` and `cqh` for writing-mode independence

## Common Patterns

### Responsive Grid
```css
.grid-container {
  container-type: inline-size;
}

@container (min-width: 600px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(25cqw, 1fr));
    gap: 2cqi;
  }
}
```

### Adaptive Typography
```css
.text-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .heading {
    font-size: clamp(1.5rem, 4cqw, 3rem);
  }
}
```

### Component Variants
```css
.component-container {
  container-type: inline-size;
  container-name: component;
}

@container component (max-width: 300px) {
  .component {
    --variant: compact;
  }
}

@container component (min-width: 301px) {
  .component {
    --variant: expanded;
  }
}
```
