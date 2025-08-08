/**
 * Container Manager for ProteusJS
 * Manages multiple SmartContainer instances and provides the main API
 */

import type { ContainerConfig, BreakpointConfig } from '../types';
import { SmartContainer, ContainerOptions, ContainerState } from './SmartContainer';
import { ObserverManager } from '../observers/ObserverManager';
import { MemoryManager } from '../core/MemoryManager';
import { EventSystem } from '../core/EventSystem';
import { performanceTracker } from '../utils/performance';

export class ContainerManager {
  private containers: Map<Element, SmartContainer> = new Map();
  private observerManager: ObserverManager;
  private memoryManager: MemoryManager;
  private eventSystem: EventSystem;
  private config: Required<ContainerConfig>;
  private autoDetectionEnabled: boolean = false;

  constructor(
    config: ContainerConfig,
    observerManager: ObserverManager,
    memoryManager: MemoryManager,
    eventSystem: EventSystem
  ) {
    this.observerManager = observerManager;
    this.memoryManager = memoryManager;
    this.eventSystem = eventSystem;
    
    this.config = {
      autoDetect: true,
      breakpoints: {
        sm: '300px',
        md: '500px',
        lg: '800px',
        xl: '1200px'
      },
      units: true,
      isolation: true,
      polyfill: true,
      ...config
    };

    if (this.config.autoDetect) {
      this.enableAutoDetection();
    }
  }

  /**
   * Create and manage a container
   */
  public container(
    selector: string | Element | Element[],
    options: ContainerOptions = {}
  ): SmartContainer | SmartContainer[] {
    performanceTracker.mark('container-create');

    const elements = this.normalizeSelector(selector);
    const containers: SmartContainer[] = [];

    elements.forEach(element => {
      let container = this.containers.get(element);
      
      if (container) {
        // Update existing container
        if (options.breakpoints) {
          container.updateBreakpoints(options.breakpoints);
        }
      } else {
        // Create new container
        const mergedOptions: ContainerOptions = {
          breakpoints: this.config.breakpoints,
          ...options
        };

        container = new SmartContainer(
          element,
          mergedOptions,
          this.observerManager,
          this.memoryManager
        );

        this.containers.set(element, container);
        container.activate();

        // Emit container created event
        this.eventSystem.emit('containerCreated', {
          element,
          container,
          options: mergedOptions
        });
      }

      containers.push(container);
    });

    performanceTracker.measure('container-create');

    return elements.length === 1 ? containers[0]! : containers;
  }

  /**
   * Remove container management from element(s)
   */
  public removeContainer(selector: string | Element | Element[]): boolean {
    const elements = this.normalizeSelector(selector);
    let removed = false;

    elements.forEach(element => {
      const container = this.containers.get(element);
      if (container) {
        container.deactivate();
        this.containers.delete(element);
        removed = true;

        // Emit container removed event
        this.eventSystem.emit('containerRemoved', {
          element,
          container
        });
      }
    });

    return removed;
  }

  /**
   * Get container instance for element
   */
  public getContainer(element: Element): SmartContainer | undefined {
    return this.containers.get(element);
  }

  /**
   * Get all managed containers
   */
  public getAllContainers(): SmartContainer[] {
    return Array.from(this.containers.values());
  }

  /**
   * Get containers by breakpoint
   */
  public getContainersByBreakpoint(breakpoint: string): SmartContainer[] {
    return this.getAllContainers().filter(container =>
      container.isBreakpointActive(breakpoint)
    );
  }

  /**
   * Update global breakpoints
   */
  public updateGlobalBreakpoints(breakpoints: BreakpointConfig): void {
    const stringBreakpoints = Object.fromEntries(
      Object.entries(breakpoints).map(([key, value]) => [key, String(value)])
    );
    this.config.breakpoints = { ...this.config.breakpoints, ...stringBreakpoints };
    
    // Update all existing containers
    this.containers.forEach(container => {
      container.updateBreakpoints(this.config.breakpoints);
    });

    // Emit breakpoints updated event
    this.eventSystem.emit('breakpointsUpdated', {
      breakpoints: this.config.breakpoints
    });
  }

  /**
   * Enable automatic container detection
   */
  public enableAutoDetection(): void {
    if (this.autoDetectionEnabled) return;

    this.autoDetectionEnabled = true;
    this.scanForContainers();

    // Set up mutation observer for new elements
    this.setupMutationObserver();
  }

  /**
   * Disable automatic container detection
   */
  public disableAutoDetection(): void {
    this.autoDetectionEnabled = false;
    // Note: We don't remove existing containers, just stop auto-detection
  }

  /**
   * Manually scan for containers
   */
  public scanForContainers(): void {
    if (!this.autoDetectionEnabled) return;

    performanceTracker.mark('container-scan');

    // Look for elements with container-related attributes or classes
    const candidates = this.findContainerCandidates();
    
    candidates.forEach(element => {
      if (!this.containers.has(element)) {
        const options = this.extractOptionsFromElement(element);
        this.container(element, options);
      }
    });

    performanceTracker.measure('container-scan');
  }

  /**
   * Get container statistics
   */
  public getStats(): object {
    const containers = this.getAllContainers();
    const stats = {
      totalContainers: containers.length,
      activeContainers: containers.filter(c => c.getState().lastUpdate > 0).length,
      autoDetectionEnabled: this.autoDetectionEnabled,
      breakpoints: Object.keys(this.config.breakpoints),
      containersByBreakpoint: {} as Record<string, number>
    };

    // Count containers by active breakpoints
    Object.keys(this.config.breakpoints).forEach(bp => {
      stats.containersByBreakpoint[bp] = this.getContainersByBreakpoint(bp).length;
    });

    return stats;
  }

  /**
   * Destroy all containers and clean up
   */
  public destroy(): void {
    // Deactivate all containers
    this.containers.forEach(container => {
      container.deactivate();
    });

    this.containers.clear();
    this.autoDetectionEnabled = false;
  }

  /**
   * Normalize selector to array of elements
   */
  private normalizeSelector(selector: string | Element | Element[]): Element[] {
    if (typeof selector === 'string') {
      return Array.from(document.querySelectorAll(selector));
    } else if (selector instanceof Element) {
      return [selector];
    } else if (Array.isArray(selector)) {
      return selector;
    }
    return [];
  }

  /**
   * Find potential container elements
   */
  private findContainerCandidates(): Element[] {
    const candidates: Element[] = [];

    // Elements with data-container attribute
    candidates.push(...Array.from(document.querySelectorAll('[data-container]')));

    // Elements with container-related classes
    candidates.push(...Array.from(document.querySelectorAll('.container, .card, .widget, .component')));

    // Elements with CSS container-type
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('container-type', 'inline-size')) {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        const style = getComputedStyle(element);
        if (style.containerType && style.containerType !== 'normal') {
          candidates.push(element);
        }
      });
    }

    // Remove duplicates
    return Array.from(new Set(candidates));
  }

  /**
   * Extract container options from element attributes
   */
  private extractOptionsFromElement(element: Element): ContainerOptions {
    const options: ContainerOptions = {};

    // Extract from data attributes
    const containerData = element.getAttribute('data-container');
    if (containerData) {
      try {
        const parsed = JSON.parse(containerData);
        Object.assign(options, parsed);
      } catch (error) {
        // Ignore invalid JSON
      }
    }

    // Extract breakpoints from data-breakpoints
    const breakpointsData = element.getAttribute('data-breakpoints');
    if (breakpointsData) {
      try {
        options.breakpoints = JSON.parse(breakpointsData);
      } catch (error) {
        // Ignore invalid JSON
      }
    }

    // Extract container type from CSS or data attribute
    const containerType = element.getAttribute('data-container-type');
    if (containerType) {
      options.containerType = containerType as any;
    }

    return options;
  }

  /**
   * Set up mutation observer for auto-detection
   */
  private setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldScan = true;
            }
          });
        } else if (mutation.type === 'attributes') {
          if (
            mutation.attributeName?.startsWith('data-container') ||
            mutation.attributeName === 'class'
          ) {
            shouldScan = true;
          }
        }
      });

      if (shouldScan) {
        // Debounce scanning to avoid excessive calls
        setTimeout(() => this.scanForContainers(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-container', 'data-breakpoints', 'data-container-type', 'class']
    });

    // Register cleanup
    this.memoryManager.register({
      id: 'container-mutation-observer',
      type: 'observer',
      cleanup: () => observer.disconnect()
    });
  }
}
