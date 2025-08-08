# Contributing to ProteusJS

Thank you for your interest in contributing to ProteusJS! 🎉 We welcome contributions from the community and are excited to work with you.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm, yarn, or pnpm
- Git

### Development Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/ProteusJS.git
cd ProteusJS

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev

# 5. Run tests
npm test
```

## 📋 Development Guidelines

### Code Standards
- **TypeScript**: Use strict mode with proper typing
- **ESLint + Prettier**: Code must pass linting and formatting checks
- **WCAG 2.1**: All accessibility features must meet compliance standards
- **Test Coverage**: Maintain 90%+ test coverage for new features

### Commit Messages
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new container query feature
fix: resolve typography scaling issue
docs: update API documentation
test: add accessibility validation tests
refactor: improve performance monitoring
```

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes  
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🧪 Testing

### Running Tests
```bash
# All tests
npm test

# Specific test suites
npm run test:accessibility
npm run test:performance
npm run benchmark

# Coverage report
npm run test:coverage
```

### Writing Tests
- Unit tests for all new functions
- Integration tests for complex features
- Accessibility tests for WCAG compliance
- Performance tests for optimization features

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Browser/environment** information
5. **Code examples** if applicable

Use our [bug report template](https://github.com/sc4rfurry/ProteusJS/issues/new?template=bug_report.md).

## 💡 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and problem it solves
3. **Provide examples** of how it would work
4. **Consider accessibility** implications

Use our [feature request template](https://github.com/sc4rfurry/ProteusJS/issues/new?template=feature_request.md).

## 🔄 Pull Request Process

### Before Submitting
1. **Fork** the repository
2. **Create a branch** from `main`
3. **Make your changes** following our guidelines
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Run the full test suite**
7. **Ensure accessibility compliance**

### PR Requirements
- [ ] Tests pass (`npm test`)
- [ ] Code is properly formatted (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Documentation is updated
- [ ] Accessibility standards are met

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Accessibility enhancement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Accessibility tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## 🎯 Areas for Contribution

### High Priority
- 🐛 **Bug fixes** - Always welcome
- ♿ **Accessibility improvements** - WCAG compliance enhancements
- ⚡ **Performance optimizations** - Speed and memory improvements
- 📚 **Documentation** - Examples, guides, API docs

### Medium Priority  
- 🧪 **Test coverage** - Additional test cases
- 🌐 **Browser compatibility** - Cross-browser improvements
- 🔧 **Developer experience** - Better tooling and debugging

### Future Features
- 🎨 **Advanced animations** - FLIP-based transitions
- 🌙 **Theme system** - Intelligent theming
- 🤖 **AI optimization** - Smart performance tuning
- 🔌 **Plugin system** - Extensible architecture

## 📖 Documentation

### Types of Documentation
- **API Reference** - Technical documentation
- **Guides & Tutorials** - How-to content
- **Examples** - Real-world use cases
- **Blog Posts** - Feature announcements

### Writing Guidelines
- Use clear, concise language
- Include code examples
- Consider accessibility in examples
- Test all code snippets

## 🏆 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors graph
- Special mentions for major features

## 📞 Getting Help

- 💬 **Discussions**: [GitHub Discussions](https://github.com/sc4rfurry/ProteusJS/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/sc4rfurry/ProteusJS/issues)
- 📧 **Email**: For sensitive matters

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 🙏 Thank You

Every contribution, no matter how small, helps make ProteusJS better for everyone. Thank you for being part of our community! 

---

**Happy Contributing!** 🚀
