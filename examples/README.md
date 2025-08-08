# ProteusJS Examples & Showcases

Welcome to the ProteusJS examples collection! These comprehensive demonstrations showcase the power of container queries, fluid typography, and accessibility-first design.

## 🎯 **Quick Navigation**

### 🏆 **Featured Showcases**

| Example | Description | Key Features |
|---------|-------------|--------------|
| [🛒 E-commerce Grid](real-world/e-commerce-showcase.html) | Responsive product grid | Container queries, accessibility, performance metrics |
| [📝 Blog Article](real-world/blog-article-showcase.html) | Accessible article layout | Fluid typography, reading time, cognitive accessibility |
| [📊 Dashboard](real-world/dashboard-showcase.html) | Adaptive admin interface | Responsive widgets, accessibility controls |
| [🚀 Landing Page](real-world/landing-page-showcase.html) | Modern landing page | Hero sections, interactive demos |
| [📊 Before/After](comparisons/before-after-showcase.html) | Traditional vs ProteusJS | Side-by-side comparison, metrics |

## 🎨 **Real-World Examples**

### 🛒 **E-commerce Product Grid**
**File**: `real-world/e-commerce-showcase.html`

**What it demonstrates**:
- Container-based responsive product grid
- Accessibility-enhanced product cards with ARIA labels
- Real-time performance monitoring
- WCAG compliance validation
- Interactive demo controls

**Key ProteusJS features**:
```typescript
// Container queries for product grid
proteus.container('.product-grid', {
  breakpoints: { sm: '400px', md: '600px', lg: '800px', xl: '1000px' }
});

// Accessibility enhancements
proteus.enableAccessibility(document.body, {
  wcagLevel: 'AA',
  screenReader: true,
  autoLabeling: true
});
```

### 📝 **Blog Article Layout**
**File**: `real-world/blog-article-showcase.html`

**What it demonstrates**:
- Fluid typography with optimal reading experience
- Reading time estimation
- Content simplification for cognitive accessibility
- High contrast mode toggle
- Enhanced keyboard navigation

**Key ProteusJS features**:
```typescript
// Fluid typography with WCAG AAA compliance
proteus.fluidType('article p', {
  minSize: 16,
  maxSize: 18,
  accessibility: 'AAA'
});

// Cognitive accessibility features
proteus.enableAccessibility('article', {
  showReadingTime: true,
  simplifyContent: true,
  readingLevel: 'middle'
});
```

### 📊 **Dashboard Interface**
**File**: `real-world/dashboard-showcase.html`

**What it demonstrates**:
- Adaptive dashboard layout with collapsible sidebar
- Container-based responsive widgets
- Accessibility control panel
- Real-time performance metrics
- Screen reader announcements

**Key ProteusJS features**:
```typescript
// Dashboard container queries
proteus.container('.dashboard', {
  breakpoints: {
    compact: '768px',
    comfortable: '1024px',
    spacious: '1200px'
  },
  announceChanges: true
});

// Widget grid responsiveness
proteus.container('.widget-grid', {
  breakpoints: { sm: '400px', md: '600px', lg: '800px' }
});
```

### 🚀 **Landing Page**
**File**: `real-world/landing-page-showcase.html`

**What it demonstrates**:
- Hero section with fluid typography
- Interactive container query demonstrations
- Performance metrics visualization
- Responsive component showcases
- Accessibility indicators

**Key ProteusJS features**:
```typescript
// Hero section fluid typography
proteus.fluidType('.hero-title', {
  minSize: 28,
  maxSize: 48,
  accessibility: 'AAA'
});

// Features grid container queries
proteus.container('.features-grid', {
  breakpoints: { sm: '600px', lg: '900px' }
});
```

## 📊 **Comparison Examples**

### 📊 **Before/After Showcase**
**File**: `comparisons/before-after-showcase.html`

**What it demonstrates**:
- Side-by-side comparison of traditional vs ProteusJS approaches
- Interactive controls to see differences in real-time
- Feature comparison table
- Code examples showing implementation differences
- Performance and accessibility metrics comparison

**Key comparisons**:
- **Responsive Design**: Viewport-based vs Container-based
- **Typography**: Fixed sizes vs Fluid scaling
- **Accessibility**: Manual implementation vs Automatic compliance
- **Performance**: Basic optimization vs Real-time monitoring
- **Maintenance**: Complex CSS vs Automated solutions

## 🎯 **How to Use These Examples**

### 1. **Local Development**
```bash
# Clone the repository
git clone https://github.com/sc4rfurry/ProteusJS.git
cd ProteusJS

# Install dependencies
npm install

# Start development server
npm run dev

# Open examples in browser
# Navigate to examples/ directory
```

### 2. **Live Demos**
Each example is a standalone HTML file that can be opened directly in a browser. They include:
- Complete CSS styling
- JavaScript implementation simulating ProteusJS functionality
- Interactive controls for testing
- Real-time metrics and feedback

### 3. **Integration Examples**
See how to integrate ProteusJS with popular frameworks:

#### React
```tsx
import { useEffect, useRef } from 'react';
import { ProteusJS } from '@sc4rfurryx/proteusjs';

function ResponsiveGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (gridRef.current) {
      const proteus = new ProteusJS();
      proteus.container(gridRef.current, {
        breakpoints: { sm: '400px', lg: '800px' }
      });
      
      return () => proteus.destroy();
    }
  }, []);
  
  return <div ref={gridRef} className="product-grid">
    {/* Your content */}
  </div>;
}
```

#### Vue 3
```vue
<template>
  <div ref="gridRef" class="product-grid">
    <!-- Your content -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ProteusJS } from '@sc4rfurryx/proteusjs';

const gridRef = ref();
let proteus;

onMounted(() => {
  proteus = new ProteusJS();
  proteus.container(gridRef.value, {
    breakpoints: { sm: '400px', lg: '800px' }
  });
});

onUnmounted(() => {
  proteus?.destroy();
});
</script>
```

## 🔧 **Customization Guide**

### Modifying Examples
1. **Breakpoints**: Adjust container query breakpoints in the JavaScript
2. **Typography**: Modify fluid typography settings
3. **Accessibility**: Change WCAG compliance levels
4. **Styling**: Update CSS for your brand/design system

### Creating New Examples
1. Copy an existing example as a starting point
2. Modify the HTML structure for your use case
3. Update the ProteusJS configuration
4. Test across different screen sizes and accessibility tools

## 📚 **Learning Resources**

### Understanding Container Queries
- [MDN Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)
- [Can I Use Container Queries](https://caniuse.com/css-container-queries)

### Accessibility Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

### Performance Best Practices
- [Web Vitals](https://web.dev/vitals/)
- [Performance Monitoring](https://web.dev/performance-monitoring/)

## 🤝 **Contributing Examples**

We welcome community contributions! To add a new example:

1. Fork the repository
2. Create your example in the appropriate directory
3. Follow the existing naming convention
4. Include comprehensive comments and documentation
5. Test across multiple browsers and accessibility tools
6. Submit a pull request

### Example Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProteusJS [Your Example Name]</title>
    <meta name="description" content="[Description of what this example demonstrates]">
    <!-- Your styles -->
</head>
<body>
    <!-- Your HTML structure -->
    
    <script type="module">
        // ProteusJS implementation
        // Include comprehensive comments
    </script>
</body>
</html>
```

## 📞 **Support & Feedback**

- **Issues**: [GitHub Issues](https://github.com/sc4rfurry/ProteusJS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sc4rfurry/ProteusJS/discussions)
- **Documentation**: [API Documentation](../API.md)

---

**Happy coding with ProteusJS!** 🌊
