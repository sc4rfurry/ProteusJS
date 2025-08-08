/**
 * Tests for ProteusJS core functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProteusJS } from './ProteusJS';

describe('ProteusJS', () => {
  let proteus: ProteusJS;

  beforeEach(() => {
    // Reset singleton instance
    (ProteusJS as any).instance = null;
    proteus = new ProteusJS({ debug: true, autoInit: false });
  });

  afterEach(() => {
    if (proteus) {
      proteus.destroy();
    }
  });

  describe('Initialization', () => {
    it('should create a singleton instance', () => {
      const instance1 = new ProteusJS();
      const instance2 = new ProteusJS();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default config', () => {
      const config = proteus.getConfig();
      expect(config.debug).toBe(true);
      expect(config.accessibility).toBe(true);
      expect(config.performance).toBe('high');
    });

    it('should merge custom config with defaults', () => {
      const customProteus = new ProteusJS({
        debug: false,
        performance: 'low',
        containers: {
          autoDetect: false
        }
      });
      
      const config = customProteus.getConfig();
      expect(config.debug).toBe(false);
      expect(config.performance).toBe('low');
      expect(config.containers.autoDetect).toBe(false);
      expect(config.accessibility).toBe(true); // Should keep default
      
      customProteus.destroy();
    });

    it('should initialize successfully', () => {
      expect(proteus.isInitialized()).toBe(false);
      proteus.init();
      expect(proteus.isInitialized()).toBe(true);
    });

    it('should not initialize twice', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      proteus.init();
      proteus.init(); // Second call should warn
      
      expect(consoleSpy).toHaveBeenCalledWith('ProteusJS: Already initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      proteus.updateConfig({ debug: false });
      const config = proteus.getConfig();
      expect(config.debug).toBe(false);
    });

    it('should emit config update event', () => {
      const eventSystem = proteus.getEventSystem();
      const mockCallback = vi.fn();
      
      eventSystem.on('configUpdate', mockCallback);
      proteus.updateConfig({ debug: false });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'configUpdate',
          detail: expect.objectContaining({
            config: expect.any(Object)
          })
        })
      );
    });
  });

  describe('Systems', () => {
    it('should provide access to event system', () => {
      const eventSystem = proteus.getEventSystem();
      expect(eventSystem).toBeDefined();
      expect(typeof eventSystem.on).toBe('function');
    });

    it('should provide access to plugin system', () => {
      const pluginSystem = proteus.getPluginSystem();
      expect(pluginSystem).toBeDefined();
      expect(typeof pluginSystem.register).toBe('function');
    });

    it('should provide access to performance monitor', () => {
      const performanceMonitor = proteus.getPerformanceMonitor();
      expect(performanceMonitor).toBeDefined();
      expect(typeof performanceMonitor.getMetrics).toBe('function');
    });
  });

  describe('Static methods', () => {
    it('should return version', () => {
      const version = ProteusJS.getVersion();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should return support info', () => {
      const support = ProteusJS.getSupportInfo();
      expect(support).toBeDefined();
      expect(typeof support.resizeObserver).toBe('boolean');
      expect(typeof support.intersectionObserver).toBe('boolean');
    });

    it('should check browser support', () => {
      const isSupported = ProteusJS.isSupported();
      expect(typeof isSupported).toBe('boolean');
    });

    it('should get or create global instance', () => {
      const instance1 = ProteusJS.getInstance();
      const instance2 = ProteusJS.getInstance();
      expect(instance1).toBe(instance2);
      
      instance1.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should destroy properly', () => {
      proteus.init();
      expect(proteus.isInitialized()).toBe(true);
      
      proteus.destroy();
      expect(proteus.isInitialized()).toBe(false);
    });

    it('should reset singleton on destroy', () => {
      proteus.init();
      proteus.destroy();
      
      const newInstance = new ProteusJS();
      expect(newInstance).not.toBe(proteus);
      
      newInstance.destroy();
    });
  });
});
