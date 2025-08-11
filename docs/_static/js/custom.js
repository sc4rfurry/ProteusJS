/* ProteusJS v2.0.0 Documentation - Enhanced Custom JavaScript */

/**
 * ProteusJS Documentation Enhancement Suite
 * Provides advanced functionality for improved user experience
 */

class ProteusDocsEnhancer {
    constructor() {
        this.init();
        this.setupPerformanceMonitoring();
        this.setupAccessibilityEnhancements();
        this.setupInteractiveFeatures();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.enhance());
        } else {
            this.enhance();
        }
    }

    enhance() {
        this.addVersionBadge();
        this.enhanceNavigation();
        this.enhanceCodeBlocks();
        this.enhanceSearch();
        this.addExternalLinkIndicators();
        this.setupThemeSystem();
        this.addSkipLink();
        this.enhanceTableResponsiveness();
        this.addProgressIndicator();
    }

    addVersionBadge() {
        const versionBadge = document.createElement('span');
        versionBadge.className = 'version-badge';
        versionBadge.textContent = 'v2.0.0';
        versionBadge.setAttribute('aria-label', 'ProteusJS version 2.0.0');

        const navTop = document.querySelector('.wy-nav-top');
        if (navTop && !navTop.querySelector('.version-badge')) {
            navTop.appendChild(versionBadge);
        }
    }

    enhanceNavigation() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without jumping
                    history.pushState(null, null, anchor.getAttribute('href'));

                    // Focus target for accessibility
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            });
        });

        // Add active section highlighting
        this.setupSectionHighlighting();
    }

    setupSectionHighlighting() {
        const sections = document.querySelectorAll('h1, h2, h3');
        const navLinks = document.querySelectorAll('.wy-menu-vertical a');

        if (sections.length === 0 || navLinks.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    if (id) {
                        navLinks.forEach(link => {
                            link.classList.remove('current-section');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('current-section');
                            }
                        });
                    }
                }
            });
        }, {
            rootMargin: '-20% 0px -80% 0px'
        });

        sections.forEach(section => {
            if (section.id) {
                observer.observe(section);
            }
        });
    }

    enhanceCodeBlocks() {
        const codeBlocks = document.querySelectorAll('.highlight');

        codeBlocks.forEach((block, index) => {
            // Add language detection and labeling
            const pre = block.querySelector('pre');
            if (pre) {
                const code = pre.querySelector('code');
                if (code && code.className) {
                    const language = code.className.match(/language-(\w+)/);
                    if (language) {
                        block.setAttribute('data-language', language[1]);
                    }
                }
            }

            // Enhanced hover effects
            block.addEventListener('mouseenter', () => {
                block.style.transform = 'translateY(-2px)';
                block.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)';
            });

            block.addEventListener('mouseleave', () => {
                block.style.transform = 'translateY(0)';
                block.style.boxShadow = '';
            });

            // Add copy functionality if not present
            if (!block.querySelector('.btn-clipboard')) {
                this.addCopyButton(block, index);
            }
        });
    }

    addCopyButton(codeBlock, index) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-clipboard';
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.setAttribute('aria-label', `Copy code block ${index + 1}`);
        copyBtn.style.position = 'absolute';
        copyBtn.style.top = '8px';
        copyBtn.style.right = '8px';
        copyBtn.style.zIndex = '10';

        codeBlock.style.position = 'relative';
        codeBlock.appendChild(copyBtn);

        copyBtn.addEventListener('click', async () => {
            const code = codeBlock.querySelector('pre').textContent;
            try {
                await navigator.clipboard.writeText(code);
                copyBtn.innerHTML = '✅ Copied!';
                copyBtn.style.background = 'var(--proteus-success)';

                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Copy';
                    copyBtn.style.background = '';
                }, 2000);
            } catch (err) {
                console.warn('Copy failed:', err);
                copyBtn.innerHTML = '❌ Failed';
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Copy';
                }, 2000);
            }
        });
    }

    enhanceSearch() {
        const searchInput = document.querySelector('input[type="text"][name="q"]');
        if (searchInput) {
            searchInput.placeholder = '🔍 Search ProteusJS docs...';
            searchInput.setAttribute('aria-label', 'Search ProteusJS documentation');

            // Add search suggestions (basic implementation)
            this.addSearchSuggestions(searchInput);
        }
    }

    addSearchSuggestions(searchInput) {
        const suggestions = [
            'navigation api', 'view transitions', 'popover api', 'scheduler api',
            'pwa features', 'speculation rules', 'migration guide', 'browser support',
            'performance', 'accessibility', 'installation', 'getting started'
        ];

        let suggestionBox = null;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();

            if (query.length < 2) {
                if (suggestionBox) {
                    suggestionBox.remove();
                    suggestionBox = null;
                }
                return;
            }

            const matches = suggestions.filter(s => s.includes(query)).slice(0, 5);

            if (matches.length > 0) {
                if (!suggestionBox) {
                    suggestionBox = document.createElement('div');
                    suggestionBox.className = 'search-suggestions';
                    suggestionBox.style.cssText = `
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: white;
                        border: 1px solid var(--proteus-gray-200);
                        border-radius: var(--proteus-radius);
                        box-shadow: var(--proteus-shadow-lg);
                        z-index: 1000;
                        max-height: 200px;
                        overflow-y: auto;
                    `;
                    searchInput.parentElement.style.position = 'relative';
                    searchInput.parentElement.appendChild(suggestionBox);
                }

                suggestionBox.innerHTML = matches.map(match =>
                    `<div class="suggestion-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--proteus-gray-100);">${match}</div>`
                ).join('');

                suggestionBox.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        searchInput.value = item.textContent;
                        suggestionBox.remove();
                        suggestionBox = null;
                        searchInput.form.submit();
                    });
                });
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (suggestionBox && !searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
                suggestionBox.remove();
                suggestionBox = null;
            }
        });
    }

    addExternalLinkIndicators() {
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            if (!link.hostname.includes('proteusjs') &&
                !link.hostname.includes('readthedocs') &&
                !link.querySelector('.external-icon')) {

                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');

                const icon = document.createElement('span');
                icon.className = 'external-icon';
                icon.innerHTML = ' ↗';
                icon.style.fontSize = '0.8em';
                icon.style.opacity = '0.6';
                icon.setAttribute('aria-label', 'External link');
                link.appendChild(icon);
            }
        });
    }

    setupThemeSystem() {
        // Detect system theme preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        const savedTheme = localStorage.getItem('proteus-docs-theme');

        // Apply saved theme or system preference
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
        } else if (prefersDark.matches) {
            document.body.setAttribute('data-theme', 'dark');
        }

        // Listen for system theme changes
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('proteus-docs-theme')) {
                document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.setAttribute('aria-label', 'Skip to main content');

        document.body.insertBefore(skipLink, document.body.firstChild);

        // Ensure main content has an ID
        const mainContent = document.querySelector('.wy-nav-content') ||
                           document.querySelector('main') ||
                           document.querySelector('[role="main"]');

        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    enhanceTableResponsiveness() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (!table.closest('.wy-table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'wy-table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    addProgressIndicator() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: var(--proteus-gradient);
            z-index: 1001;
            transition: width 0.1s ease;
        `;

        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }

    setupPerformanceMonitoring() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData && perfData.loadEventEnd > 0) {
                        const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                        console.log(`📊 ProteusJS Docs loaded in ${Math.round(loadTime)}ms`);
                    }
                }, 0);
            });
        }
    }

    setupAccessibilityEnhancements() {
        // Add ARIA labels to navigation elements
        const navElements = document.querySelectorAll('.wy-menu-vertical a');
        navElements.forEach((link, index) => {
            if (!link.getAttribute('aria-label')) {
                link.setAttribute('aria-label', `Navigate to ${link.textContent.trim()}`);
            }
        });

        // Enhance keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Alt + M for main content
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.focus();
                    mainContent.scrollIntoView({ behavior: 'smooth' });
                }
            }

            // Alt + S for search
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const searchInput = document.querySelector('input[name="q"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    setupInteractiveFeatures() {
        // Add smooth reveal animations for content
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });

            // Observe elements for animation
            document.querySelectorAll('.admonition, .highlight, .wy-table-responsive').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        }
    }
}

// Initialize the documentation enhancer
new ProteusDocsEnhancer();
