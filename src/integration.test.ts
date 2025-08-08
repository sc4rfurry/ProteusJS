/**
 * Integration tests for ProteusJS
 * Tests the complete system working together
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProteusJS } from './core/ProteusJS';

describe('ProteusJS Integration', () => {
  let proteus: ProteusJS;
  let testContainer: HTMLElement;

  beforeEach(() => {
    // Reset singleton
    (ProteusJS as any).instance = null;
    
    // Create test container
    testContainer = document.createElement('div');
    testContainer.className = 'test-container';
    testContainer.style.width = '500px';
    testContainer.style.height = '300px';
    document.body.appendChild(testContainer);

    // Initialize ProteusJS
    proteus = new ProteusJS({
      debug: true,
      autoInit: false,
      containers: {
        autoDetect: false,
        breakpoints: {
          sm: '300px',
          md: '500px',
          lg: '800px'
        }
      }
    });
  });

  afterEach(() => {
    if (proteus) {
      proteus.destroy();
    }
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  describe('System Integration', () => {
    it('should initialize all systems', () => {
      proteus.init();
      
      expect(proteus.isInitialized()).toBe(true);
      expect(proteus.getEventSystem()).toBeDefined();
      expect(proteus.getPluginSystem()).toBeDefined();
      expect(proteus.getPerformanceMonitor()).toBeDefined();
      expect(proteus.getMemoryManager()).toBeDefined();
      expect(proteus.getObserverManager()).toBeDefined();
      expect(proteus.getContainerManager()).toBeDefined();
    });

    it('should create containers', () => {
      proteus.init();
      
      const container = proteus.container(testContainer);
      expect(container).toBeDefined();
      
      const containerManager = proteus.getContainerManager();
      expect(containerManager.getContainer(testContainer)).toBeDefined();
    });

    it('should apply fluid typography', () => {
      proteus.init();
      
      const textElement = document.createElement('p');
      textElement.textContent = 'Test text';
      testContainer.appendChild(textElement);

      proteus.fluidType(textElement, {
        minSize: 16,
        maxSize: 24,
        minContainer: 300,
        maxContainer: 800,
        unit: 'px',
        containerUnit: 'cw',
        curve: 'linear'
      });

      expect(textElement.style.fontSize).toBeTruthy();
    });

    it('should generate typographic scales', () => {
      proteus.init();
      
      const scale = proteus.createTypeScale({
        ratio: 1.2,
        baseSize: 16,
        baseUnit: 'px',
        levels: 5,
        direction: 'both'
      });

      expect(scale).toBeDefined();
      expect(scale.levels).toHaveLength(11); // 5 up + 5 down + 1 base
      expect(scale.cssCustomProperties).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      proteus.init();
      
      const performanceMonitor = proteus.getPerformanceMonitor();
      performanceMonitor.start();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.frameRate).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
    });
  });

  describe('Memory Management', () => {
    it('should track and cleanup resources', () => {
      proteus.init();
      
      const memoryManager = proteus.getMemoryManager();
      
      // Register a test resource
      const resourceId = memoryManager.register({
        id: 'test-resource',
        type: 'observer',
        cleanup: vi.fn(),
        element: testContainer
      });

      expect(resourceId).toBe('test-resource');
      
      const info = memoryManager.getMemoryInfo();
      expect(info).toHaveProperty('managedResources', 1);
      
      // Cleanup
      const cleaned = memoryManager.unregister(resourceId);
      expect(cleaned).toBe(true);
    });
  });

  describe('Container Queries', () => {
    it('should respond to container size changes', async () => {
      proteus.init();
      
      const container = proteus.container(testContainer, {
        breakpoints: {
          small: '200px',
          medium: '400px',
          large: '600px'
        }
      });

      // Simulate size change
      testContainer.style.width = '450px';
      
      // Wait for observer to trigger
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const state = (container as any).getState();
      expect(state.width).toBe(450);
      expect(state.activeBreakpoints).toContain('small');
      expect(state.activeBreakpoints).toContain('medium');
    });
  });

  describe('Event System', () => {
    it('should emit and handle events', () => {
      proteus.init();
      
      const eventSystem = proteus.getEventSystem();
      const mockCallback = vi.fn();
      
      eventSystem.on('test-event', mockCallback);
      eventSystem.emit('test-event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          detail: { data: 'test' }
        })
      );
    });
  });

  describe('Plugin System', () => {
    it('should register and install plugins', () => {
      proteus.init();
      
      const pluginSystem = proteus.getPluginSystem();
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn()
      };
      
      pluginSystem.register(mockPlugin);
      pluginSystem.install('test-plugin');
      
      expect(mockPlugin.install).toHaveBeenCalledWith(proteus);
      expect(pluginSystem.isInstalled('test-plugin')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock unsupported browser
      vi.spyOn(ProteusJS, 'isSupported').mockReturnValue(false);
      
      proteus.init();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'ProteusJS: Browser not supported. Missing required APIs.'
      );
      
      consoleSpy.mockRestore();
    });
  });
});
