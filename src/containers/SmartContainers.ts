/**
 * SmartContainers - Automatic container detection and management system
 * Core component of ProteusJS container query system
 */

import { logger } from '../utils/Logger';

export interface ContainerInfo {
  element: Element;
  type: 'block' | 'inline' | 'grid' | 'flex';
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  children: number;
  hasResponsiveContent: boolean;
}

export interface ContainerDetectionOptions {
  includeInline?: boolean;
  minConfidence?: number;
  excludeSelectors?: string[];
  includeSelectors?: string[];
}

export class SmartContainers {
  private containers: Map<Element, ContainerInfo> = new Map();
  private observer: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private isActive: boolean = false;

  constructor() {
    this.setupObservers();
  }

  /**
   * Automatically detect containers in the document
   */
  public async detectContainers(options: ContainerDetectionOptions = {}): Promise<ContainerInfo[]> {
    const {
      includeInline = false,
      minConfidence = 0.5,
      excludeSelectors = ['script', 'style', 'meta', 'link'],
      includeSelectors = []
    } = options;

    const containers: ContainerInfo[] = [];
    const elements = this.getAllElements(includeSelectors, excludeSelectors);

    for (const element of elements) {
      const containerInfo = this.analyzeElement(element, includeInline);
      
      if (containerInfo && containerInfo.confidence >= minConfidence) {
        containers.push(containerInfo);
        this.containers.set(element, containerInfo);
        
        // Start observing this container
        if (this.observer) {
          this.observer.observe(element);
        }
      }
    }

    // Sort by priority and confidence
    containers.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.confidence - a.confidence;
    });

    return containers;
  }

  /**
   * Calculate container units (cw, ch, cmin, cmax)
   */
  public calculateContainerUnit(element: Element, unit: string): number {
    const rect = element.getBoundingClientRect();
    const { width, height } = rect;

    switch (unit) {
      case 'cw': // Container width unit (1cw = 1% of container width)
        return width / 100;
      
      case 'ch': // Container height unit (1ch = 1% of container height)
        return height / 100;
      
      case 'cmin': // Container minimum unit (1cmin = 1% of smaller dimension)
        return Math.min(width, height) / 100;
      
      case 'cmax': // Container maximum unit (1cmax = 1% of larger dimension)
        return Math.max(width, height) / 100;
      
      case 'cqi': // Container inline size (same as cw for horizontal writing)
        return width / 100;
      
      case 'cqb': // Container block size (same as ch for horizontal writing)
        return height / 100;
      
      default:
        logger.warn(`Unknown container unit "${unit}"`);
        return 0;
    }
  }

  /**
   * Get container information for a specific element
   */
  public getContainerInfo(element: Element): ContainerInfo | null {
    return this.containers.get(element) || null;
  }

  /**
   * Update container information when dimensions change
   */
  public updateContainer(element: Element): ContainerInfo | null {
    const existingInfo = this.containers.get(element);
    if (!existingInfo) return null;

    const updatedInfo = this.analyzeElement(element, true);
    if (updatedInfo) {
      this.containers.set(element, updatedInfo);
      return updatedInfo;
    }

    return existingInfo;
  }

  /**
   * Start monitoring containers for changes
   */
  public startMonitoring(): void {
    this.isActive = true;
    
    if (this.observer) {
      // Re-observe all registered containers
      this.containers.forEach((_, element) => {
        this.observer!.observe(element);
      });
    }
  }

  /**
   * Stop monitoring containers
   */
  public stopMonitoring(): void {
    this.isActive = false;
    
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopMonitoring();
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    this.containers.clear();
  }

  /**
   * Setup ResizeObserver and MutationObserver
   */
  private setupObservers(): void {
    // Setup ResizeObserver for container dimension changes
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver((entries) => {
        if (!this.isActive) return;
        
        for (const entry of entries) {
          this.updateContainer(entry.target);
        }
      });
    }

    // Setup MutationObserver for DOM changes
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver((mutations) => {
        if (!this.isActive) return;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            // Re-analyze containers when children change
            mutation.target.parentElement && this.updateContainer(mutation.target.parentElement);
          }
        }
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Get all elements to analyze
   */
  private getAllElements(includeSelectors: string[], excludeSelectors: string[]): Element[] {
    let elements: Element[];

    if (includeSelectors.length > 0) {
      elements = Array.from(document.querySelectorAll(includeSelectors.join(', ')));
    } else {
      elements = Array.from(document.querySelectorAll('*'));
    }

    // Filter out excluded elements
    if (excludeSelectors.length > 0) {
      const excludeSelector = excludeSelectors.join(', ');
      elements = elements.filter(el => !el.matches(excludeSelector));
    }

    return elements;
  }

  /**
   * Analyze an element to determine if it's a good container candidate
   */
  private analyzeElement(element: Element, includeInline: boolean): ContainerInfo | null {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    const children = element.children.length;

    // Skip elements that are too small or invisible
    if (rect.width < 50 || rect.height < 50 || computedStyle.display === 'none') {
      return null;
    }

    // Determine container type
    const display = computedStyle.display;
    let type: ContainerInfo['type'];
    let confidence = 0;

    if (display.includes('grid')) {
      type = 'grid';
      confidence += 0.4;
    } else if (display.includes('flex')) {
      type = 'flex';
      confidence += 0.3;
    } else if (display === 'block' || display === 'flow-root') {
      type = 'block';
      confidence += 0.2;
    } else if (includeInline && (display === 'inline-block' || display === 'inline')) {
      type = 'inline';
      confidence += 0.1;
    } else {
      return null;
    }

    // Increase confidence based on various factors
    if (children > 0) confidence += 0.2;
    if (children > 3) confidence += 0.1;
    if (rect.width > 200) confidence += 0.1;
    if (rect.height > 200) confidence += 0.1;
    if (element.classList.length > 0) confidence += 0.1;
    if (element.id) confidence += 0.1;

    // Check for responsive content indicators
    const hasResponsiveContent = this.hasResponsiveContent(element);
    if (hasResponsiveContent) confidence += 0.2;

    // Determine priority
    let priority: ContainerInfo['priority'] = 'low';
    if (element.matches('main, article, section, aside, nav') ||
        element.getAttribute('role') === 'main' ||
        element.getAttribute('role') === 'banner' ||
        element.getAttribute('role') === 'navigation' ||
        element.getAttribute('role') === 'contentinfo') {
      priority = 'high';
    } else if (element.matches('div, header, footer, form') ||
               element.getAttribute('role') === 'complementary') {
      priority = 'medium';
    }

    return {
      element,
      type,
      confidence: Math.min(confidence, 1),
      priority,
      dimensions: {
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.width / rect.height
      },
      children,
      hasResponsiveContent
    };
  }

  /**
   * Check if element contains responsive content
   */
  private hasResponsiveContent(element: Element): boolean {
    // Check for responsive images
    const images = element.querySelectorAll('img[srcset], picture, img[sizes]');
    if (images.length > 0) return true;

    // Check for responsive videos
    const videos = element.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
    if (videos.length > 0) return true;

    // Check for CSS Grid or Flexbox children
    const gridFlexChildren = Array.from(element.children).some(child => {
      const style = window.getComputedStyle(child);
      return style.display.includes('grid') || style.display.includes('flex');
    });

    return gridFlexChildren;
  }

  /**
   * Get container performance metrics
   */
  public getMetrics(): {
    totalContainers: number;
    activeContainers: number;
    averageConfidence: number;
    typeDistribution: Record<string, number>;
  } {
    const containers = Array.from(this.containers.values());
    const typeDistribution: Record<string, number> = {};

    containers.forEach(container => {
      typeDistribution[container.type] = (typeDistribution[container.type] || 0) + 1;
    });

    const averageConfidence = containers.length > 0
      ? containers.reduce((sum, c) => sum + c.confidence, 0) / containers.length
      : 0;

    return {
      totalContainers: containers.length,
      activeContainers: this.isActive ? containers.length : 0,
      averageConfidence,
      typeDistribution
    };
  }

  /**
   * Force re-analysis of all containers
   */
  public refreshContainers(): Promise<ContainerInfo[]> {
    this.containers.clear();
    return this.detectContainers();
  }

  /**
   * Get containers by type
   */
  public getContainersByType(type: ContainerInfo['type']): ContainerInfo[] {
    return Array.from(this.containers.values()).filter(c => c.type === type);
  }

  /**
   * Get high-confidence containers
   */
  public getHighConfidenceContainers(minConfidence: number = 0.7): ContainerInfo[] {
    return Array.from(this.containers.values()).filter(c => c.confidence >= minConfidence);
  }
}
