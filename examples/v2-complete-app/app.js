/**
 * ProteusJS v2.0.0 Complete Application Example
 * 
 * This example demonstrates all the features of ProteusJS v2.0.0:
 * - Navigation API with View Transitions
 * - Popover API with CSS Anchor Positioning
 * - Scheduler API for performance optimization
 * - PWA features (File System, Badging, Web Share)
 * - Intelligent prefetching with Speculation Rules
 * - Accessibility compliance and testing
 */

// Application state
const AppState = {
  currentPage: 'home',
  theme: 'auto',
  animations: true,
  prefetching: true,
  notifications: true,
  metrics: {
    navigationTimes: [],
    transitionTimes: [],
    apiSupport: 0
  }
};

// Mock ProteusJS v2.0.0 APIs for demo purposes
// In production, these would be imported from the actual packages
const ProteusJS = {
  // Router package
  Router: {
    navigate: async (url, options = {}) => {
      console.log('🧭 Navigation API:', url, options);
      const startTime = performance.now();
      
      // Simulate navigation work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      AppState.metrics.navigationTimes.push(duration);
      
      return { url, duration };
    },
    
    back: () => {
      console.log('🧭 Navigation API: back()');
      window.history.back();
    },
    
    isSupported: () => 'navigation' in window
  },
  
  // Transitions package
  Transitions: {
    viewTransition: async (callback, options = {}) => {
      console.log('✨ View Transitions API:', options);
      const startTime = performance.now();
      
      if (document.startViewTransition && AppState.animations) {
        return document.startViewTransition(callback);
      } else {
        await callback();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      AppState.metrics.transitionTimes.push(duration);
      
      return { duration };
    },
    
    slideTransition: async (direction, callback, options = {}) => {
      console.log('✨ Slide Transition:', direction, options);
      return ProteusJS.Transitions.viewTransition(callback, { ...options, type: 'slide', direction });
    },
    
    isSupported: () => 'startViewTransition' in document
  },
  
  // Layer package
  Layer: {
    popover: (trigger, content, options = {}) => {
      console.log('📱 Popover API:', options);
      
      const controller = {
        show: () => {
          content.style.display = 'block';
          content.setAttribute('popover', 'manual');
          if (content.showPopover) {
            content.showPopover();
          }
        },
        hide: () => {
          content.style.display = 'none';
          if (content.hidePopover) {
            content.hidePopover();
          }
        },
        toggle: () => {
          if (content.style.display === 'none') {
            controller.show();
          } else {
            controller.hide();
          }
        }
      };
      
      if (options.trigger === 'click') {
        trigger.addEventListener('click', controller.toggle);
      }
      
      return controller;
    },
    
    isSupported: () => 'popover' in HTMLElement.prototype
  },
  
  // Schedule package
  Schedule: {
    postTask: async (callback, options = {}) => {
      console.log('⚡ Scheduler API:', options);
      
      if (window.scheduler && window.scheduler.postTask) {
        return window.scheduler.postTask(callback, options);
      } else {
        // Fallback to setTimeout with priority simulation
        const delay = options.priority === 'user-blocking' ? 0 : 
                     options.priority === 'user-visible' ? 5 : 16;
        return new Promise(resolve => {
          setTimeout(() => resolve(callback()), delay);
        });
      }
    },
    
    yieldToMain: async (options = {}) => {
      console.log('⚡ Yield to main thread:', options);
      return new Promise(resolve => setTimeout(resolve, 0));
    },
    
    isSupported: () => 'scheduler' in window
  },
  
  // PWA package
  PWA: {
    FileSystem: {
      openFile: async (options = {}) => {
        console.log('🔧 File System Access API:', options);
        
        if (window.showOpenFilePicker) {
          return window.showOpenFilePicker(options);
        } else {
          // Fallback to input[type=file]
          return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = options.types?.[0]?.accept ? 
              Object.values(options.types[0].accept).flat().join(',') : '*/*';
            
            input.onchange = () => resolve([...input.files]);
            input.oncancel = () => reject(new Error('User cancelled'));
            input.click();
          });
        }
      }
    },
    
    Badging: {
      set: async (options = {}) => {
        console.log('🔧 Badging API:', options);
        
        if (navigator.setAppBadge) {
          return navigator.setAppBadge(options.count);
        } else {
          // Fallback to title badge
          const originalTitle = document.title;
          document.title = options.count ? `(${options.count}) ${originalTitle}` : originalTitle;
        }
      },
      
      clear: async () => {
        console.log('🔧 Badging API: clear');
        
        if (navigator.clearAppBadge) {
          return navigator.clearAppBadge();
        } else {
          document.title = document.title.replace(/^\(\d+\)\s*/, '');
        }
      }
    },
    
    Share: {
      share: async (data) => {
        console.log('🔧 Web Share API:', data);
        
        if (navigator.share) {
          return navigator.share(data);
        } else {
          // Fallback to clipboard
          const text = `${data.title}\n${data.text}\n${data.url}`;
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!');
          } else {
            console.log('Share data:', text);
            showToast('Share data logged to console');
          }
        }
      }
    }
  },
  
  // Speculate package
  Speculate: {
    prefetch: (options = {}) => {
      console.log('🚀 Speculation Rules API:', options);
      
      if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
        const script = document.createElement('script');
        script.type = 'speculationrules';
        script.textContent = JSON.stringify({
          prefetch: [{
            where: { href_matches: options.pattern || "/*" },
            eagerness: options.eagerness || "moderate"
          }]
        });
        document.head.appendChild(script);
        return script;
      } else {
        // Fallback to link prefetch
        options.urls?.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
        });
      }
    },
    
    isSupported: () => HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')
  }
};

// Application initialization
class ProteusApp {
  constructor() {
    this.init();
  }
  
  async init() {
    console.log('🌊 Initializing ProteusJS v2.0.0 Complete App');
    
    // Initialize performance monitoring
    this.initPerformanceMonitoring();
    
    // Initialize navigation
    this.initNavigation();
    
    // Initialize UI components
    this.initUIComponents();
    
    // Initialize PWA features
    this.initPWAFeatures();
    
    // Initialize prefetching
    this.initPrefetching();
    
    // Initialize accessibility
    this.initAccessibility();
    
    // Calculate API support
    this.calculateAPISupport();
    
    console.log('✅ ProteusJS v2.0.0 Complete App initialized');
  }
  
  initPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      // This would use the web-vitals library in production
      console.log('📊 Performance monitoring initialized');
    }
    
    // Update metrics display
    setInterval(() => {
      this.updateMetricsDisplay();
    }, 1000);
  }
  
  initNavigation() {
    // Set up navigation event listeners
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        await this.navigateToPage(page);
      });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || 'home';
      this.showPage(page, false);
    });
  }
  
  async navigateToPage(page) {
    if (page === AppState.currentPage) return;
    
    // Show loading indicator
    this.showLoading(true);
    
    try {
      // Use View Transitions for smooth navigation
      await ProteusJS.Transitions.viewTransition(async () => {
        // Update navigation state
        await ProteusJS.Router.navigate(`#${page}`, {
          state: { page }
        });
        
        // Update UI
        this.showPage(page);
        
        // Simulate content loading
        await ProteusJS.Schedule.postTask(async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        }, { priority: 'user-visible' });
      });
      
    } catch (error) {
      console.error('Navigation error:', error);
      showToast('Navigation failed', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  showPage(page, updateHistory = true) {
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
    
    // Update page visibility
    document.querySelectorAll('.page').forEach(pageEl => {
      pageEl.classList.toggle('active', pageEl.dataset.page === page);
    });
    
    // Update app state
    AppState.currentPage = page;
    
    // Update browser history
    if (updateHistory) {
      history.pushState({ page }, '', `#${page}`);
    }
    
    // Load page-specific content
    this.loadPageContent(page);
  }
  
  async loadPageContent(page) {
    switch (page) {
      case 'dashboard':
        await this.loadDashboard();
        break;
      case 'features':
        await this.loadFeatures();
        break;
      case 'settings':
        await this.loadSettings();
        break;
    }
  }
  
  async loadDashboard() {
    // Simulate loading dashboard data
    await ProteusJS.Schedule.postTask(async () => {
      // Update performance metrics
      this.updateMetricsDisplay();
      
      // Initialize performance chart
      this.initPerformanceChart();
    }, { priority: 'background' });
  }
  
  async loadFeatures() {
    // Load feature demonstrations
    const demoContainer = document.querySelector('#features-page .demo-container');
    if (demoContainer) {
      demoContainer.innerHTML = `
        <div class="feature-demo">
          <h3>Interactive Feature Demos</h3>
          <p>Try out the ProteusJS v2.0.0 features below:</p>
          
          <div class="demo-grid">
            <button class="demo-btn" data-demo="navigation">Navigation Demo</button>
            <button class="demo-btn" data-demo="transitions">Transitions Demo</button>
            <button class="demo-btn" data-demo="popover">Popover Demo</button>
            <button class="demo-btn" data-demo="performance">Performance Demo</button>
          </div>
        </div>
      `;
      
      // Add demo event listeners
      demoContainer.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.runDemo(btn.dataset.demo);
        });
      });
    }
  }
  
  async loadSettings() {
    // Load current settings
    document.getElementById('theme-setting').value = AppState.theme;
    document.getElementById('animations-setting').checked = AppState.animations;
    document.getElementById('prefetch-setting').checked = AppState.prefetching;
    document.getElementById('notifications-setting').checked = AppState.notifications;
    
    // Add settings event listeners
    document.getElementById('save-settings-btn').addEventListener('click', () => {
      this.saveSettings();
    });
  }
  
  initUIComponents() {
    // Initialize popovers
    this.initPopovers();
    
    // Initialize theme toggle
    this.initThemeToggle();
    
    // Initialize feature demos
    this.initFeatureDemos();
  }
  
  initPopovers() {
    // User menu popover
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userMenuPopover = document.getElementById('user-menu-popover');
    
    if (userMenuTrigger && userMenuPopover) {
      const userMenuController = ProteusJS.Layer.popover(userMenuTrigger, userMenuPopover, {
        placement: 'bottom-end',
        trigger: 'click'
      });
    }
    
    // Notifications popover
    const notificationsTrigger = document.getElementById('notifications-btn');
    const notificationsPopover = document.getElementById('notifications-popover');
    
    if (notificationsTrigger && notificationsPopover) {
      const notificationsController = ProteusJS.Layer.popover(notificationsTrigger, notificationsPopover, {
        placement: 'bottom-end',
        trigger: 'click'
      });
    }
  }
  
  initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }
  
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    ProteusJS.Transitions.viewTransition(() => {
      document.documentElement.setAttribute('data-theme', newTheme);
      AppState.theme = newTheme;
      
      // Update theme toggle icon
      const icon = document.querySelector('#theme-toggle .icon');
      if (icon) {
        icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      }
    });
  }
  
  initFeatureDemos() {
    document.querySelectorAll('.feature-demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.runDemo(btn.dataset.demo);
      });
    });
  }
  
  async runDemo(demoType) {
    console.log(`🎮 Running ${demoType} demo`);
    
    switch (demoType) {
      case 'navigation':
        await this.demoNavigation();
        break;
      case 'transitions':
        await this.demoTransitions();
        break;
      case 'layer':
        await this.demoPopover();
        break;
      case 'schedule':
        await this.demoPerformance();
        break;
      case 'pwa':
        await this.demoPWA();
        break;
      case 'speculate':
        await this.demoPrefetching();
        break;
    }
  }
  
  async demoNavigation() {
    showToast('Navigation API Demo: Smooth page transition');
    await this.navigateToPage('dashboard');
    
    setTimeout(async () => {
      await this.navigateToPage('home');
      showToast('Navigation demo completed!');
    }, 2000);
  }
  
  async demoTransitions() {
    const card = document.querySelector('.feature-card[data-feature="transitions"]');
    if (card) {
      await ProteusJS.Transitions.slideTransition('right', () => {
        card.style.transform = 'scale(1.1)';
        card.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        card.style.color = 'white';
      });
      
      setTimeout(async () => {
        await ProteusJS.Transitions.slideTransition('left', () => {
          card.style.transform = '';
          card.style.background = '';
          card.style.color = '';
        });
        showToast('View Transitions demo completed!');
      }, 1500);
    }
  }
  
  async demoPopover() {
    showToast('Popover API Demo: Native popover functionality');
    
    // Create a temporary popover
    const tempPopover = document.createElement('div');
    tempPopover.className = 'popover-content';
    tempPopover.innerHTML = `
      <div style="padding: 1rem;">
        <h4>🎉 Popover Demo</h4>
        <p>This popover uses the native Popover API with CSS Anchor Positioning!</p>
        <button onclick="this.closest('.popover-content').style.display='none'">Close</button>
      </div>
    `;
    document.body.appendChild(tempPopover);
    
    const trigger = document.querySelector('.feature-card[data-feature="layer"] .feature-demo-btn');
    const controller = ProteusJS.Layer.popover(trigger, tempPopover, {
      placement: 'top',
      trigger: 'manual'
    });
    
    controller.show();
    
    setTimeout(() => {
      controller.hide();
      document.body.removeChild(tempPopover);
      showToast('Popover demo completed!');
    }, 3000);
  }
  
  async demoPerformance() {
    showToast('Scheduler API Demo: Intelligent task scheduling');
    
    const startTime = performance.now();
    
    // Schedule a series of tasks with different priorities
    await ProteusJS.Schedule.postTask(() => {
      console.log('High priority task executed');
    }, { priority: 'user-blocking' });
    
    await ProteusJS.Schedule.postTask(() => {
      console.log('Normal priority task executed');
    }, { priority: 'user-visible' });
    
    await ProteusJS.Schedule.postTask(() => {
      console.log('Background task executed');
    }, { priority: 'background' });
    
    const endTime = performance.now();
    showToast(`Performance demo completed in ${Math.round(endTime - startTime)}ms!`);
  }
  
  async demoPWA() {
    showToast('PWA Features Demo: File System, Badging, Web Share');
    
    try {
      // Demo badging
      await ProteusJS.PWA.Badging.set({ count: 5 });
      showToast('Badge set to 5');
      
      setTimeout(async () => {
        await ProteusJS.PWA.Badging.clear();
        showToast('Badge cleared');
      }, 2000);
      
      // Demo sharing
      setTimeout(async () => {
        await ProteusJS.PWA.Share.share({
          title: 'ProteusJS v2.0.0',
          text: 'Check out this amazing web development framework!',
          url: window.location.href
        });
      }, 3000);
      
    } catch (error) {
      console.log('PWA demo error:', error);
      showToast('PWA features demo completed!');
    }
  }
  
  async demoPrefetching() {
    showToast('Speculation Rules Demo: Intelligent prefetching');
    
    // Enable prefetching for dashboard
    ProteusJS.Speculate.prefetch({
      pattern: '/dashboard*',
      eagerness: 'moderate'
    });
    
    showToast('Prefetching enabled for dashboard page');
    
    setTimeout(() => {
      showToast('Prefetching demo completed!');
    }, 2000);
  }
  
  initPWAFeatures() {
    // Install prompt
    this.initInstallPrompt();
    
    // Share functionality
    this.initShareFeature();
    
    // Badge management
    this.initBadgeManagement();
  }
  
  initInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      const installBtn = document.getElementById('install-app-btn');
      if (installBtn) {
        installBtn.style.display = 'inline-block';
        installBtn.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
              showToast('App installed successfully!');
            }
            deferredPrompt = null;
            installBtn.style.display = 'none';
          }
        });
      }
    });
  }
  
  initShareFeature() {
    const shareBtn = document.getElementById('share-app-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        await ProteusJS.PWA.Share.share({
          title: 'ProteusJS v2.0.0 Complete App',
          text: 'Check out this complete example of ProteusJS v2.0.0 features!',
          url: window.location.href
        });
      });
    }
  }
  
  initBadgeManagement() {
    // Update badge based on notifications
    const updateBadge = () => {
      const notificationCount = document.querySelectorAll('.notification-item').length;
      const badge = document.getElementById('notification-badge');
      
      if (badge) {
        badge.textContent = notificationCount;
        badge.style.display = notificationCount > 0 ? 'block' : 'none';
      }
      
      if (AppState.notifications) {
        ProteusJS.PWA.Badging.set({ count: notificationCount });
      }
    };
    
    updateBadge();
    
    // Clear notifications
    const clearBtn = document.getElementById('clear-notifications');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.querySelectorAll('.notification-item').forEach(item => item.remove());
        updateBadge();
        showToast('Notifications cleared');
      });
    }
  }
  
  initPrefetching() {
    if (AppState.prefetching) {
      // Enable intelligent prefetching
      ProteusJS.Speculate.prefetch({
        pattern: '/*',
        eagerness: 'conservative'
      });
      
      console.log('🚀 Intelligent prefetching enabled');
    }
  }
  
  initAccessibility() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any open popovers
        document.querySelectorAll('.popover-content').forEach(popover => {
          popover.style.display = 'none';
        });
      }
    });
    
    // Focus management
    this.initFocusManagement();
    
    // Screen reader announcements
    this.initScreenReaderSupport();
  }
  
  initFocusManagement() {
    // Trap focus in popovers
    document.querySelectorAll('.popover-content').forEach(popover => {
      const focusableElements = popover.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        popover.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        });
      }
    });
  }
  
  initScreenReaderSupport() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    
    // Announce page changes
    const originalShowPage = this.showPage.bind(this);
    this.showPage = function(page, updateHistory = true) {
      originalShowPage(page, updateHistory);
      liveRegion.textContent = `Navigated to ${page} page`;
    };
  }
  
  calculateAPISupport() {
    const apis = [
      ProteusJS.Router.isSupported(),
      ProteusJS.Transitions.isSupported(),
      ProteusJS.Layer.isSupported(),
      ProteusJS.Schedule.isSupported(),
      'showOpenFilePicker' in window,
      'setAppBadge' in navigator,
      'share' in navigator,
      ProteusJS.Speculate.isSupported()
    ];
    
    const supportedCount = apis.filter(Boolean).length;
    AppState.metrics.apiSupport = Math.round((supportedCount / apis.length) * 100);
  }
  
  updateMetricsDisplay() {
    // Update navigation performance
    const navPerf = document.getElementById('nav-performance');
    if (navPerf && AppState.metrics.navigationTimes.length > 0) {
      const avg = AppState.metrics.navigationTimes.reduce((a, b) => a + b, 0) / 
                  AppState.metrics.navigationTimes.length;
      navPerf.textContent = Math.round(avg);
    }
    
    // Update transition performance
    const transPerf = document.getElementById('transition-performance');
    if (transPerf && AppState.metrics.transitionTimes.length > 0) {
      const avg = AppState.metrics.transitionTimes.reduce((a, b) => a + b, 0) / 
                  AppState.metrics.transitionTimes.length;
      transPerf.textContent = Math.round(avg);
    }
    
    // Update API support
    const apiSupport = document.getElementById('api-support');
    if (apiSupport) {
      apiSupport.textContent = AppState.metrics.apiSupport;
    }
  }
  
  initPerformanceChart() {
    const canvas = document.getElementById('performance-chart');
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      
      // Simple performance chart implementation
      // In production, you'd use a charting library like Chart.js
      ctx.fillStyle = '#667eea';
      ctx.fillRect(50, 50, 100, 200);
      
      ctx.fillStyle = '#764ba2';
      ctx.fillRect(200, 100, 100, 150);
      
      ctx.fillStyle = '#f093fb';
      ctx.fillRect(350, 75, 100, 175);
      
      // Labels
      ctx.fillStyle = '#333';
      ctx.font = '14px sans-serif';
      ctx.fillText('Navigation', 50, 270);
      ctx.fillText('Transitions', 200, 270);
      ctx.fillText('API Calls', 350, 270);
    }
  }
  
  saveSettings() {
    AppState.theme = document.getElementById('theme-setting').value;
    AppState.animations = document.getElementById('animations-setting').checked;
    AppState.prefetching = document.getElementById('prefetch-setting').checked;
    AppState.notifications = document.getElementById('notifications-setting').checked;
    
    // Apply settings
    if (AppState.theme !== 'auto') {
      document.documentElement.setAttribute('data-theme', AppState.theme);
    }
    
    // Save to localStorage
    localStorage.setItem('proteusjs-settings', JSON.stringify(AppState));
    
    showToast('Settings saved successfully!');
  }
  
  showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }
}

// Utility functions
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 300);
  }, 3000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new ProteusApp();
});

// Export for module usage
export { ProteusApp, AppState, ProteusJS };
