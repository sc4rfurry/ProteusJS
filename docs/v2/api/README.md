# ProteusJS v2.0.0 API Reference

Complete API documentation for all ProteusJS v2.0.0 packages.

## 📦 Package APIs

### Core Packages

- **[Router API](./router.md)** - Navigation API integration
- **[Transitions API](./transitions.md)** - View Transitions helpers
- **[Layer API](./layer.md)** - Popover and positioning
- **[Schedule API](./schedule.md)** - Performance scheduling
- **[PWA API](./pwa.md)** - Progressive Web App features
- **[Speculate API](./speculate.md)** - Intelligent prefetching

### Utility Packages

- **[CLI API](./cli.md)** - Command line tools
- **[Codemods API](./codemods.md)** - Migration utilities
- **[ESLint Plugin](./eslint-plugin.md)** - Code quality rules
- **[Vite Plugin](./vite.md)** - Build tool integration

## 🔗 Quick Links

- [Getting Started](../README.md)
- [Migration Guide](../migration-guide.md)
- [Browser Support](../browser-support.md)
- [Performance Guide](../performance.md)

## 📝 API Conventions

All ProteusJS v2.0.0 APIs follow these conventions:

### Error Handling
- All async functions include proper error handling
- Fallbacks are provided for unsupported browsers
- Errors include descriptive messages

### TypeScript Support
- Full TypeScript definitions included
- Strict type checking enabled
- Generic types where appropriate

### Browser Compatibility
- Modern APIs with intelligent fallbacks
- Feature detection before usage
- Graceful degradation strategies

### Performance
- Lazy loading where possible
- Tree-shakeable exports
- Minimal bundle impact
