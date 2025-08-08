/**
 * Visual Debugging Tools for ProteusJS
 * Comprehensive debugging overlays with container visualization and performance metrics
 */

export interface DebugConfig {
  showContainerBoundaries: boolean;
  showBreakpointIndicators: boolean;
  showTypographyScale: boolean;
  showPerformanceMetrics: boolean;
  showAccessibilityInfo: boolean;
  showLayoutGrid: boolean;
  overlayOpacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface DebugInfo {
  containers: ContainerDebugInfo[];
  performance: PerformanceDebugInfo;
  accessibility: AccessibilityDebugInfo;
  typography: TypographyDebugInfo;
}

export interface ContainerDebugInfo {
  element: Element;
  type: string;
  dimensions: { width: number; height: number };
  breakpoint: string;
  queries: string[];
}

export interface PerformanceDebugInfo {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  activeObservers: number;
  queueSize: number;
}

export interface AccessibilityDebugInfo {
  wcagLevel: string;
  issues: string[];
  score: number;
  screenReaderCompatible: boolean;
}

export interface TypographyDebugInfo {
  scale: string;
  baseSize: number;
  lineHeight: number;
  rhythm: number;
}

export class VisualDebuggingTools {
  private config: Required<DebugConfig>;
  private overlay: HTMLElement | null = null;
  private isActive: boolean = false;
  private updateInterval: number | null = null;
  private debugInfo: DebugInfo;

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = {
      showContainerBoundaries: true,
      showBreakpointIndicators: true,
      showTypographyScale: true,
      showPerformanceMetrics: true,
      showAccessibilityInfo: true,
      showLayoutGrid: false,
      overlayOpacity: 0.8,
      position: 'top-right',
      ...config
    };

    this.debugInfo = this.createInitialDebugInfo();
    this.setupKeyboardShortcuts();
  }

  /**
   * Activate debugging tools
   */
  public activate(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.createOverlay();
    this.startUpdating();
    this.highlightContainers();
    this.showLayoutGrid();

    console.log('🔍 ProteusJS Visual Debugging Tools Activated');
  }

  /**
   * Deactivate debugging tools
   */
  public deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.removeOverlay();
    this.stopUpdating();
    this.removeHighlights();
    this.hideLayoutGrid();

    console.log('🔍 ProteusJS Visual Debugging Tools Deactivated');
  }

  /**
   * Toggle debugging tools
   */
  public toggle(): void {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Update debug information
   */
  public updateDebugInfo(info: Partial<DebugInfo>): void {
    this.debugInfo = { ...this.debugInfo, ...info };
    if (this.isActive) {
      this.updateOverlay();
    }
  }

  /**
   * Highlight specific container
   */
  public highlightContainer(element: Element, color: string = '#ff6b6b'): void {
    const highlight = document.createElement('div');
    highlight.className = 'proteus-debug-highlight';
    highlight.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid ${color};
      background: ${color}20;
      z-index: 10000;
      transition: all 0.3s ease;
    `;

    const rect = element.getBoundingClientRect();
    highlight.style.left = `${rect.left + window.scrollX}px`;
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;

    document.body.appendChild(highlight);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
    }, 3000);
  }

  /**
   * Show performance bottlenecks
   */
  public showBottlenecks(): void {
    const bottlenecks = this.detectBottlenecks();
    
    bottlenecks.forEach(bottleneck => {
      this.highlightContainer(bottleneck.element, '#e53e3e');
      
      // Show bottleneck info
      const info = document.createElement('div');
      info.className = 'proteus-debug-bottleneck-info';
      info.style.cssText = `
        position: absolute;
        background: #e53e3e;
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10001;
        pointer-events: none;
      `;
      info.textContent = bottleneck.issue;

      const rect = bottleneck.element.getBoundingClientRect();
      info.style.left = `${rect.left + window.scrollX}px`;
      info.style.top = `${rect.top + window.scrollY - 30}px`;

      document.body.appendChild(info);

      setTimeout(() => {
        if (info.parentNode) {
          info.parentNode.removeChild(info);
        }
      }, 5000);
    });
  }

  /**
   * Export debug report
   */
  public exportReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      debugInfo: this.debugInfo,
      performance: this.getDetailedPerformanceInfo(),
      accessibility: this.getDetailedAccessibilityInfo()
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Create debugging overlay
   */
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'proteus-debug-overlay';
    this.overlay.style.cssText = this.getOverlayStyles();

    this.updateOverlay();
    document.body.appendChild(this.overlay);
  }

  /**
   * Remove debugging overlay
   */
  private removeOverlay(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
      this.overlay = null;
    }
  }

  /**
   * Update overlay content
   */
  private updateOverlay(): void {
    if (!this.overlay) return;

    this.overlay.innerHTML = `
      <div class="proteus-debug-header">
        <h3>🔍 ProteusJS Debug</h3>
        <button onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
      
      ${this.config.showPerformanceMetrics ? this.renderPerformanceSection() : ''}
      ${this.config.showContainerBoundaries ? this.renderContainerSection() : ''}
      ${this.config.showTypographyScale ? this.renderTypographySection() : ''}
      ${this.config.showAccessibilityInfo ? this.renderAccessibilitySection() : ''}
      
      <div class="proteus-debug-actions">
        <button onclick="proteusDebugTools.showBottlenecks()">Find Bottlenecks</button>
        <button onclick="proteusDebugTools.exportReport()">Export Report</button>
      </div>
    `;
  }

  /**
   * Render performance section
   */
  private renderPerformanceSection(): string {
    const perf = this.debugInfo.performance;
    return `
      <div class="proteus-debug-section">
        <h4>⚡ Performance</h4>
        <div class="proteus-debug-metrics">
          <div class="metric">
            <span class="label">FPS:</span>
            <span class="value ${perf.fps < 50 ? 'warning' : ''}">${perf.fps}</span>
          </div>
          <div class="metric">
            <span class="label">Frame Time:</span>
            <span class="value ${perf.frameTime > 20 ? 'warning' : ''}">${perf.frameTime.toFixed(2)}ms</span>
          </div>
          <div class="metric">
            <span class="label">Memory:</span>
            <span class="value">${(perf.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
          </div>
          <div class="metric">
            <span class="label">Observers:</span>
            <span class="value">${perf.activeObservers}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render container section
   */
  private renderContainerSection(): string {
    const containers = this.debugInfo.containers;
    return `
      <div class="proteus-debug-section">
        <h4>📦 Containers (${containers.length})</h4>
        <div class="proteus-debug-containers">
          ${containers.map(container => `
            <div class="container-item">
              <span class="container-type">${container.type}</span>
              <span class="container-size">${container.dimensions.width}×${container.dimensions.height}</span>
              <span class="container-breakpoint">${container.breakpoint}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render typography section
   */
  private renderTypographySection(): string {
    const typo = this.debugInfo.typography;
    return `
      <div class="proteus-debug-section">
        <h4>📝 Typography</h4>
        <div class="proteus-debug-typography">
          <div class="typo-item">Scale: ${typo.scale}</div>
          <div class="typo-item">Base: ${typo.baseSize}px</div>
          <div class="typo-item">Line Height: ${typo.lineHeight}</div>
          <div class="typo-item">Rhythm: ${typo.rhythm}px</div>
        </div>
      </div>
    `;
  }

  /**
   * Render accessibility section
   */
  private renderAccessibilitySection(): string {
    const a11y = this.debugInfo.accessibility;
    return `
      <div class="proteus-debug-section">
        <h4>♿ Accessibility</h4>
        <div class="proteus-debug-accessibility">
          <div class="a11y-score ${a11y.score < 80 ? 'warning' : ''}">
            Score: ${a11y.score}/100
          </div>
          <div class="a11y-level">WCAG: ${a11y.wcagLevel}</div>
          <div class="a11y-issues">
            Issues: ${a11y.issues.length}
            ${a11y.issues.length > 0 ? `
              <ul>
                ${a11y.issues.slice(0, 3).map(issue => `<li>${issue}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Highlight all containers
   */
  private highlightContainers(): void {
    if (!this.config.showContainerBoundaries) return;

    this.debugInfo.containers.forEach(container => {
      const highlight = document.createElement('div');
      highlight.className = 'proteus-debug-container-highlight';
      highlight.style.cssText = `
        position: absolute;
        pointer-events: none;
        border: 1px dashed #667eea;
        background: rgba(102, 126, 234, 0.1);
        z-index: 9999;
      `;

      const rect = container.element.getBoundingClientRect();
      highlight.style.left = `${rect.left + window.scrollX}px`;
      highlight.style.top = `${rect.top + window.scrollY}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;

      // Add breakpoint indicator
      if (this.config.showBreakpointIndicators) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
          position: absolute;
          top: 2px;
          left: 2px;
          background: #667eea;
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 2px;
        `;
        indicator.textContent = container.breakpoint;
        highlight.appendChild(indicator);
      }

      document.body.appendChild(highlight);
    });
  }

  /**
   * Remove container highlights
   */
  private removeHighlights(): void {
    const highlights = document.querySelectorAll('.proteus-debug-container-highlight, .proteus-debug-highlight');
    highlights.forEach(highlight => {
      if (highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
    });
  }

  /**
   * Show layout grid
   */
  private showLayoutGrid(): void {
    if (!this.config.showLayoutGrid) return;

    const grid = document.createElement('div');
    grid.className = 'proteus-debug-grid';
    grid.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
      background-image: 
        linear-gradient(rgba(102, 126, 234, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(102, 126, 234, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
    `;

    document.body.appendChild(grid);
  }

  /**
   * Hide layout grid
   */
  private hideLayoutGrid(): void {
    const grid = document.querySelector('.proteus-debug-grid');
    if (grid && grid.parentNode) {
      grid.parentNode.removeChild(grid);
    }
  }

  /**
   * Start updating debug info
   */
  private startUpdating(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateDebugInfo({
        performance: this.getCurrentPerformanceInfo(),
        containers: this.getCurrentContainerInfo()
      });
    }, 1000);
  }

  /**
   * Stop updating debug info
   */
  private stopUpdating(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + D to toggle debug tools
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Get overlay styles
   */
  private getOverlayStyles(): string {
    const positions = {
      'top-left': 'top: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;'
    };

    return `
      position: fixed;
      ${positions[this.config.position]}
      width: 300px;
      max-height: 80vh;
      background: rgba(0, 0, 0, ${this.config.overlayOpacity});
      color: white;
      font-family: monospace;
      font-size: 12px;
      border-radius: 8px;
      padding: 15px;
      z-index: 10000;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
  }

  /**
   * Detect performance bottlenecks
   */
  private detectBottlenecks(): Array<{ element: Element; issue: string }> {
    const bottlenecks: Array<{ element: Element; issue: string }> = [];

    // Check for elements with excessive reflows
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      
      // Check for layout-triggering properties
      if (styles.position === 'fixed' && styles.transform !== 'none') {
        bottlenecks.push({
          element,
          issue: 'Fixed position with transform may cause performance issues'
        });
      }

      // Check for large elements without will-change
      const rect = element.getBoundingClientRect();
      if (rect.width > 1000 && rect.height > 1000 && styles.willChange === 'auto') {
        bottlenecks.push({
          element,
          issue: 'Large element without will-change optimization'
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Get current performance info
   */
  private getCurrentPerformanceInfo(): PerformanceDebugInfo {
    return {
      fps: 60, // Would be calculated from actual frame timing
      frameTime: 16.67,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      activeObservers: document.querySelectorAll('[data-proteus-observer]').length,
      queueSize: 0
    };
  }

  /**
   * Get current container info
   */
  private getCurrentContainerInfo(): ContainerDebugInfo[] {
    const containers: ContainerDebugInfo[] = [];
    
    document.querySelectorAll('[data-proteus-container]').forEach(element => {
      const rect = element.getBoundingClientRect();
      containers.push({
        element,
        type: element.getAttribute('data-proteus-type') || 'unknown',
        dimensions: { width: rect.width, height: rect.height },
        breakpoint: element.getAttribute('data-proteus-breakpoint') || 'none',
        queries: (element.getAttribute('data-proteus-queries') || '').split(',')
      });
    });

    return containers;
  }

  /**
   * Get detailed performance info
   */
  private getDetailedPerformanceInfo(): any {
    return {
      timing: performance.timing,
      navigation: performance.navigation,
      memory: (performance as any).memory,
      entries: performance.getEntries().slice(-10)
    };
  }

  /**
   * Get detailed accessibility info
   */
  private getDetailedAccessibilityInfo(): any {
    const issues: string[] = [];
    
    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    if (inputs.length > 0) {
      issues.push(`${inputs.length} form inputs missing labels`);
    }

    return {
      issues,
      totalElements: document.querySelectorAll('*').length,
      interactiveElements: document.querySelectorAll('button, a, input, select, textarea').length,
      headingStructure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.tagName)
    };
  }

  /**
   * Create initial debug info
   */
  private createInitialDebugInfo(): DebugInfo {
    return {
      containers: [],
      performance: {
        fps: 60,
        frameTime: 16.67,
        memoryUsage: 0,
        activeObservers: 0,
        queueSize: 0
      },
      accessibility: {
        wcagLevel: 'AA',
        issues: [],
        score: 100,
        screenReaderCompatible: true
      },
      typography: {
        scale: 'golden-ratio',
        baseSize: 16,
        lineHeight: 1.5,
        rhythm: 24
      }
    };
  }
}

// Global instance for easy access
declare global {
  interface Window {
    proteusDebugTools: VisualDebuggingTools;
  }
}

// Auto-initialize if in development mode
if (typeof window !== 'undefined') {
  window.proteusDebugTools = new VisualDebuggingTools();
}
