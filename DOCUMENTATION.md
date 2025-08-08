# ProteusJS Documentation & Showcase

This repository contains comprehensive documentation and an interactive showcase website for ProteusJS - a modern, shape-shifting responsive design library.

## 📚 Documentation Structure

### ReadTheDocs Documentation

The `docs/` directory contains complete documentation built with Sphinx and hosted on ReadTheDocs:

```
docs/
├── index.rst                    # Main documentation index
├── conf.py                      # Sphinx configuration
├── requirements.txt             # Python dependencies
├── getting-started/
│   ├── installation.rst         # Installation guide
│   ├── quick-start.rst          # Quick start tutorial
│   ├── configuration.rst        # Configuration options
│   └── basic-concepts.rst       # Core concepts
├── features/
│   ├── container-queries.rst    # Container queries guide
│   ├── fluid-typography.rst     # Typography features
│   ├── accessibility.rst        # Accessibility features
│   ├── performance.rst          # Performance optimization
│   ├── responsive-images.rst    # Image handling
│   └── theming.rst              # Theme system
├── api/
│   ├── core-api.rst             # Core API reference
│   ├── container-api.rst        # Container API
│   ├── typography-api.rst       # Typography API
│   ├── accessibility-api.rst    # Accessibility API
│   ├── performance-api.rst      # Performance API
│   └── configuration.rst        # Configuration reference
├── frameworks/
│   ├── react.rst               # React integration
│   ├── vue.rst                 # Vue.js integration
│   ├── angular.rst             # Angular integration
│   └── vanilla-js.rst          # Vanilla JavaScript
├── examples/
│   ├── e-commerce-grid.rst     # E-commerce examples
│   ├── blog-layout.rst         # Blog layouts
│   ├── dashboard.rst           # Dashboard interfaces
│   ├── landing-page.rst        # Landing pages
│   └── before-after.rst        # Migration examples
├── guides/
│   ├── migration.rst           # Migration guide
│   ├── troubleshooting.rst     # Common issues
│   ├── best-practices.rst      # Best practices
│   └── performance-tips.rst    # Performance tips
└── reference/
    ├── browser-support.rst     # Browser compatibility
    ├── changelog.rst           # Version history
    ├── contributing.rst        # Contribution guide
    └── faq.rst                 # Frequently asked questions
```

### Key Documentation Features

- **Comprehensive API Reference**: Complete documentation of all classes, methods, and interfaces
- **Real-world Examples**: Practical examples for common use cases
- **Accessibility Guide**: WCAG 2.1 compliance and screen reader support
- **Framework Integration**: Dedicated guides for React, Vue, and Angular
- **Performance Optimization**: Advanced techniques for optimal performance
- **Interactive Code Examples**: Copy-paste ready code snippets
- **Search Functionality**: Full-text search across all documentation
- **Cross-references**: Linked navigation between related topics

## 🌐 Interactive Showcase Website

The `showcase/` directory contains a modern, responsive website that demonstrates ProteusJS functionality:

```
showcase/
├── index.html                   # Main showcase page
├── styles/
│   ├── main.css                # Core styles and CSS variables
│   ├── components.css          # Component styles
│   └── playground.css          # Interactive playground styles
├── scripts/
│   ├── main.js                 # Core functionality
│   ├── theme.js                # Dark/light theme management
│   ├── navigation.js           # Navigation and scroll spy
│   └── playground.js           # Interactive playground
└── assets/
    ├── images/                 # Images and icons
    └── fonts/                  # Custom fonts
```

### Showcase Features

#### 🎯 Hero Section
- **Interactive Demo**: Resizable container showing real-time responsiveness
- **Live Metrics**: Performance monitoring display
- **Installation Commands**: Copy-paste installation instructions
- **Feature Highlights**: Key ProteusJS capabilities

#### 🔧 Interactive Playground
- **Live Code Editor**: Real-time code editing and preview
- **Container Width Control**: Drag to resize containers
- **Typography Settings**: Adjust font sizes and accessibility levels
- **Code Generation**: Automatic JavaScript, CSS, and HTML code generation
- **Copy Functionality**: One-click code copying

#### 📱 Responsive Design
- **Mobile-First**: Optimized for all device sizes
- **Container Queries**: Uses ProteusJS for its own responsive behavior
- **Fluid Typography**: Demonstrates intelligent text scaling
- **Accessibility**: WCAG 2.1 AA compliant throughout

#### 🎨 Theme System
- **Dark/Light Modes**: Automatic system preference detection
- **Smooth Transitions**: Animated theme switching
- **Persistent Preferences**: Remembers user choice
- **Keyboard Shortcuts**: Ctrl/Cmd + Shift + T to toggle

#### ♿ Accessibility Features
- **Screen Reader Support**: Comprehensive ARIA labeling
- **Keyboard Navigation**: Full keyboard accessibility
- **Skip Links**: Quick navigation for assistive technologies
- **Focus Management**: Proper focus handling for modals and menus
- **Motion Preferences**: Respects prefers-reduced-motion

## 🚀 Getting Started

### Building Documentation Locally

1. **Install Python Dependencies**:
   ```bash
   pip install -r docs/requirements.txt
   ```

2. **Build Documentation**:
   ```bash
   cd docs
   make html
   ```

3. **Serve Documentation**:
   ```bash
   python -m http.server 8000 -d _build/html
   ```

### Running Showcase Locally

1. **Serve the Showcase**:
   ```bash
   cd showcase
   python -m http.server 8080
   ```

2. **Open in Browser**:
   Navigate to `http://localhost:8080`

### Development Setup

For development with live reload:

```bash
# Install development dependencies
npm install -g live-server

# Serve showcase with live reload
cd showcase
live-server --port=8080

# Serve documentation with auto-rebuild
cd docs
sphinx-autobuild . _build/html --port=8081
```

## 📖 Documentation Standards

### Writing Guidelines

- **Clear and Concise**: Use simple, direct language
- **Code Examples**: Include working code snippets for all features
- **Accessibility**: Document accessibility implications
- **Cross-references**: Link to related sections
- **Real-world Context**: Provide practical use cases

### Code Example Format

```typescript
// Brief description of what this code does
import { ProteusJS } from '@sc4rfurryx/proteusjs';

const proteus = new ProteusJS();

// Container queries example
proteus.container('.my-container', {
  breakpoints: {
    sm: '400px',
    md: '600px',
    lg: '800px'
  }
});
```

**CDN Usage:**
```html
<script src="https://cdn.jsdelivr.net/npm/@sc4rfurryx/proteusjs@1.0.0/dist/proteus.js"></script>
<script>
  const proteus = new ProteusJS();
  // Your code here
</script>
```

### API Documentation Format

Each API method should include:
- **Purpose**: What the method does
- **Parameters**: Type, description, and default values
- **Returns**: Return type and description
- **Examples**: Working code examples
- **See Also**: Links to related methods

## 🎯 Showcase Development

### Component Architecture

The showcase uses a modular architecture:

- **NavigationManager**: Handles mobile navigation and scroll spy
- **ThemeManager**: Manages dark/light theme switching
- **PlaygroundManager**: Powers the interactive playground
- **ProteusShowcase**: Main application controller

### Performance Considerations

- **Lazy Loading**: Components load only when needed
- **Debounced Events**: Resize and scroll events are debounced
- **Efficient DOM Updates**: Minimal DOM manipulation
- **Memory Management**: Proper cleanup of event listeners

### Accessibility Implementation

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Comprehensive labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling
- **Announcements**: Screen reader announcements for dynamic content

## 🔧 Configuration

### ReadTheDocs Configuration

The `.readthedocs.yaml` file configures:
- Python and Node.js versions
- Build requirements
- Output formats (HTML, PDF, ePub)
- Search ranking

### Sphinx Configuration

The `docs/conf.py` file includes:
- Theme customization
- Extension configuration
- SEO metadata
- Custom CSS and JavaScript

## 📊 Analytics and Monitoring

### Documentation Analytics

- **ReadTheDocs Analytics**: Built-in page view tracking
- **Search Analytics**: Popular search terms and results
- **User Feedback**: Documentation rating system

### Showcase Analytics

- **Performance Monitoring**: Real-time performance metrics
- **User Interactions**: Playground usage tracking
- **Error Monitoring**: JavaScript error tracking

## 🤝 Contributing

### Documentation Contributions

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b docs/new-feature`
3. **Write Documentation**: Follow the style guide
4. **Test Locally**: Build and review documentation
5. **Submit Pull Request**: Include description of changes

### Showcase Contributions

1. **Follow Code Standards**: Use ESLint and Prettier
2. **Test Accessibility**: Verify WCAG compliance
3. **Test Responsiveness**: Check all device sizes
4. **Performance Testing**: Ensure optimal performance

## 📝 License

This documentation and showcase are part of ProteusJS and are released under the MIT License. See the [LICENSE](../LICENSE) file for details.

## 🔗 Links

- **Documentation**: https://proteusjs.readthedocs.io/
- **Showcase**: https://proteusjs.dev/
- **GitHub**: https://github.com/sc4rfurry/ProteusJS
- **npm**: https://www.npmjs.com/package/@sc4rfurryx/proteusjs

## 📞 Support

- **Issues**: https://github.com/sc4rfurry/ProteusJS/issues
- **Discussions**: https://github.com/sc4rfurry/ProteusJS/discussions
- **Email**: support@proteusjs.dev
