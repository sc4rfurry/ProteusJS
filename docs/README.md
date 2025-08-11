# ProteusJS Documentation

Welcome to the ProteusJS documentation! This documentation covers all aspects of using ProteusJS v1.1.1 for native-first web development.

## 📚 Documentation Structure

### Getting Started
- [**Main Documentation**](index.md) - Quick start guide and overview
- [**Installation**](index.md#installation) - NPM and CDN setup
- [**Browser Support**](index.md#browser-support) - Compatibility information

### Core Features
- [**Container Queries**](container-queries.md) - Responsive design with correct CSS units
- [**Anchor Positioning**](anchor-positioning.md) - Element positioning with browser compatibility notes
- [**Accessibility**](accessibility.md) - Accessibility tools and best practices

### API Reference
- [**View Transitions**](index.md#-view-transitions) - Smooth page transitions
- [**Performance**](index.md#-performance) - Web performance optimization
- [**Typography**](index.md#-typography) - Responsive typography
- [**Framework Adapters**](index.md#framework-adapters) - React, Vue, Svelte integration

## 🚀 Quick Links

- **NPM Package**: [@sc4rfurryx/proteusjs](https://www.npmjs.com/package/@sc4rfurryx/proteusjs)
- **GitHub Repository**: [sc4rfurry/ProteusJS](https://github.com/sc4rfurry/ProteusJS)
- **Version**: 1.1.1
- **License**: MIT

## 📖 Key Documentation Pages

### [Container Queries Guide](container-queries.md)
Learn how to use container queries with **correct CSS units** (`cqw`, `cqh`, `cqi`, `cqb`) and avoid common syntax errors.

### [Anchor Positioning Guide](anchor-positioning.md)
Understand browser compatibility limitations and how ProteusJS provides fallbacks for unsupported browsers.

### [Accessibility Guide](accessibility.md)
Important information about what ProteusJS does and does NOT provide for accessibility compliance.

## ⚠️ Important Notes

### Container Query Units
Always use the correct syntax for container query units:
- ✅ `width: 50cqw;` (correct)
- ❌ `width: 50 cw;` (incorrect - space not allowed)

### Browser Compatibility
- **Anchor Positioning**: Native support only in Chrome/Edge 125+, JavaScript fallback for others
- **View Transitions**: Native support in Chrome 111+, fallback for others
- **Container Queries**: Supported in all modern browsers

### Accessibility
ProteusJS provides accessibility tools but **does not automatically ensure WCAG compliance**. Manual testing and inclusive design practices are still required.

## 🔧 Development

This documentation is maintained alongside the ProteusJS codebase. For issues or improvements, please visit the [GitHub repository](https://github.com/sc4rfurry/ProteusJS).

---

**ProteusJS v1.1.1** - Native-first web development primitives
© 2025 sc4rfurry - MIT License
