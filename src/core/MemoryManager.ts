/**
 * Memory Manager for ProteusJS
 * Prevents memory leaks and manages resource cleanup
 */

export interface ManagedResource {
  id: string;
  type: 'observer' | 'listener' | 'timer' | 'animation' | 'cache';
  cleanup: () => void;
  element?: Element;
  timestamp: number;
}

export class MemoryManager {
  private resources: Map<string, ManagedResource> = new Map();
  private elementResources: Map<Element, Set<string>> = new Map();
  private mutationObserver: MutationObserver | null = null;
  private cleanupInterval: number | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    this.setupDOMObserver();
    this.startPeriodicCleanup();
  }

  /**
   * Register a resource for automatic cleanup
   */
  public register(resource: Omit<ManagedResource, 'timestamp'>): string {
    const fullResource: ManagedResource = {
      ...resource,
      timestamp: Date.now()
    };

    this.resources.set(resource.id, fullResource);

    // Track element-specific resources
    if (resource.element) {
      if (!this.elementResources.has(resource.element)) {
        this.elementResources.set(resource.element, new Set());
      }
      this.elementResources.get(resource.element)!.add(resource.id);
    }

    return resource.id;
  }

  /**
   * Unregister and cleanup a resource
   */
  public unregister(resourceId: string): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) return false;

    try {
      resource.cleanup();
    } catch (error) {
      console.error(`ProteusJS: Error cleaning up resource ${resourceId}:`, error);
    }

    this.resources.delete(resourceId);

    // Remove from element tracking
    if (resource.element) {
      const elementResources = this.elementResources.get(resource.element);
      if (elementResources) {
        elementResources.delete(resourceId);
        if (elementResources.size === 0) {
          this.elementResources.delete(resource.element);
        }
      }
    }

    return true;
  }

  /**
   * Cleanup all resources associated with an element
   */
  public cleanupElement(element: Element): number {
    const resourceIds = this.elementResources.get(element);
    if (!resourceIds) return 0;

    let cleanedCount = 0;
    resourceIds.forEach(resourceId => {
      if (this.unregister(resourceId)) {
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  /**
   * Cleanup resources by type
   */
  public cleanupByType(type: ManagedResource['type']): number {
    let cleanedCount = 0;
    const toCleanup: string[] = [];

    this.resources.forEach((resource, id) => {
      if (resource.type === type) {
        toCleanup.push(id);
      }
    });

    toCleanup.forEach(id => {
      if (this.unregister(id)) {
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  /**
   * Cleanup old resources based on age
   */
  public cleanupOldResources(maxAge: number = 300000): number { // 5 minutes default
    let cleanedCount = 0;
    const now = Date.now();
    const toCleanup: string[] = [];

    this.resources.forEach((resource, id) => {
      if (now - resource.timestamp > maxAge) {
        toCleanup.push(id);
      }
    });

    toCleanup.forEach(id => {
      if (this.unregister(id)) {
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  /**
   * Force garbage collection if available
   */
  public forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (error) {
        // Ignore errors - gc might not be available
      }
    }
  }

  /**
   * Get memory usage information
   */
  public getMemoryInfo(): object {
    const info: any = {
      managedResources: this.resources.size,
      trackedElements: this.elementResources.size,
      resourcesByType: {} as Record<string, number>
    };

    // Count resources by type
    this.resources.forEach(resource => {
      info.resourcesByType[resource.type] = (info.resourcesByType[resource.type] || 0) + 1;
    });

    // Add browser memory info if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      info.browserMemory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }

    return info;
  }

  /**
   * Check for potential memory leaks
   */
  public detectLeaks(): string[] {
    const warnings: string[] = [];
    const now = Date.now();

    // Check for too many resources
    if (this.resources.size > 1000) {
      warnings.push(`High number of managed resources: ${this.resources.size}`);
    }

    // Check for old resources
    let oldResourceCount = 0;
    this.resources.forEach(resource => {
      if (now - resource.timestamp > 600000) { // 10 minutes
        oldResourceCount++;
      }
    });

    if (oldResourceCount > 50) {
      warnings.push(`Many old resources detected: ${oldResourceCount}`);
    }

    // Check for orphaned element resources
    let orphanedCount = 0;
    this.elementResources.forEach((resourceIds, element) => {
      if (!document.contains(element)) {
        orphanedCount += resourceIds.size;
      }
    });

    if (orphanedCount > 0) {
      warnings.push(`Orphaned element resources detected: ${orphanedCount}`);
    }

    return warnings;
  }

  /**
   * Cleanup all resources and stop monitoring
   */
  public destroy(): void {
    // Cleanup all resources
    const resourceIds = Array.from(this.resources.keys());
    resourceIds.forEach(id => this.unregister(id));

    // Stop monitoring
    this.stopMonitoring();

    // Clear maps
    this.resources.clear();
    this.elementResources.clear();
  }

  /**
   * Start monitoring for memory leaks
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Setup DOM mutation observer to detect removed elements
   */
  private setupDOMObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.handleElementRemoval(node as Element);
            }
          });
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Handle element removal from DOM
   */
  private handleElementRemoval(element: Element): void {
    // Cleanup resources for this element
    this.cleanupElement(element);

    // Also check descendants
    const descendants = element.querySelectorAll('*');
    descendants.forEach(descendant => {
      this.cleanupElement(descendant);
    });
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      // Cleanup orphaned resources
      let orphanedCount = 0;
      this.elementResources.forEach((resourceIds, element) => {
        if (!document.contains(element)) {
          orphanedCount += this.cleanupElement(element);
        }
      });

      // Cleanup very old resources
      const oldCount = this.cleanupOldResources(600000); // 10 minutes

      if (orphanedCount > 0 || oldCount > 0) {
        console.log(`ProteusJS: Cleaned up ${orphanedCount} orphaned and ${oldCount} old resources`);
      }
    }, 60000); // Run every minute
  }
}
