/**
 * SmartContainers Test Suite
 * Comprehensive tests for container detection and management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmartContainers, ContainerInfo } from '../SmartContainers';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

describe('SmartContainers', () => {
  let smartContainers: SmartContainers;
  let testContainer: HTMLElement;

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Create test container
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    testContainer.style.width = '400px';
    testContainer.style.height = '300px';
    testContainer.style.display = 'block';
    document.body.appendChild(testContainer);

    smartContainers = new SmartContainers();
  });

  afterEach(() => {
    smartContainers.destroy();
    document.body.innerHTML = '';
  });

  describe('Container Detection', () => {
    it('should detect basic block containers', async () => {
      const containers = await smartContainers.detectContainers();
      
      expect(containers.length).toBeGreaterThan(0);
      const testContainerInfo = containers.find(c => c.element === testContainer);
      expect(testContainerInfo).toBeDefined();
      expect(testContainerInfo?.type).toBe('block');
    });

    it('should detect grid containers', async () => {
      testContainer.style.display = 'grid';
      
      const containers = await smartContainers.detectContainers();
      const gridContainer = containers.find(c => c.element === testContainer);
      
      expect(gridContainer?.type).toBe('grid');
      expect(gridContainer?.confidence).toBeGreaterThan(0.4);
    });

    it('should detect flex containers', async () => {
      testContainer.style.display = 'flex';
      
      const containers = await smartContainers.detectContainers();
      const flexContainer = containers.find(c => c.element === testContainer);
      
      expect(flexContainer?.type).toBe('flex');
      expect(flexContainer?.confidence).toBeGreaterThan(0.3);
    });

    it('should exclude small elements', async () => {
      const smallElement = document.createElement('div');
      smallElement.style.width = '10px';
      smallElement.style.height = '10px';
      document.body.appendChild(smallElement);
      
      const containers = await smartContainers.detectContainers();
      const smallContainer = containers.find(c => c.element === smallElement);
      
      expect(smallContainer).toBeUndefined();
    });

    it('should respect confidence threshold', async () => {
      const containers = await smartContainers.detectContainers({ minConfidence: 0.8 });
      
      // Should have fewer containers with high confidence threshold
      expect(containers.length).toBeLessThanOrEqual(
        (await smartContainers.detectContainers({ minConfidence: 0.1 })).length
      );
    });
  });

  describe('Container Units', () => {
    beforeEach(() => {
      // Mock getBoundingClientRect
      vi.spyOn(testContainer, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect);
    });

    it('should calculate container width units (cw)', () => {
      const unit = smartContainers.calculateContainerUnit(testContainer, 'cw');
      expect(unit).toBe(4); // 400px / 100 = 4px per cw
    });

    it('should calculate container height units (ch)', () => {
      const unit = smartContainers.calculateContainerUnit(testContainer, 'ch');
      expect(unit).toBe(3); // 300px / 100 = 3px per ch
    });

    it('should calculate container minimum units (cmin)', () => {
      const unit = smartContainers.calculateContainerUnit(testContainer, 'cmin');
      expect(unit).toBe(3); // min(400, 300) / 100 = 3px per cmin
    });

    it('should calculate container maximum units (cmax)', () => {
      const unit = smartContainers.calculateContainerUnit(testContainer, 'cmax');
      expect(unit).toBe(4); // max(400, 300) / 100 = 4px per cmax
    });

    it('should handle unknown units gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const unit = smartContainers.calculateContainerUnit(testContainer, 'unknown');
      
      expect(unit).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown container unit "unknown"')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Container Management', () => {
    it('should track container information', async () => {
      await smartContainers.detectContainers();
      
      const containerInfo = smartContainers.getContainerInfo(testContainer);
      expect(containerInfo).toBeDefined();
      expect(containerInfo?.element).toBe(testContainer);
    });

    it('should update container information', async () => {
      await smartContainers.detectContainers();
      
      // Change container style
      testContainer.style.display = 'grid';
      
      const updatedInfo = smartContainers.updateContainer(testContainer);
      expect(updatedInfo?.type).toBe('grid');
    });

    it('should start and stop monitoring', () => {
      smartContainers.startMonitoring();
      expect(smartContainers['isActive']).toBe(true);
      
      smartContainers.stopMonitoring();
      expect(smartContainers['isActive']).toBe(false);
    });
  });

  describe('Responsive Content Detection', () => {
    it('should detect responsive images', async () => {
      const img = document.createElement('img');
      img.srcset = 'image-320w.jpg 320w, image-640w.jpg 640w';
      testContainer.appendChild(img);
      
      const containers = await smartContainers.detectContainers();
      const containerInfo = containers.find(c => c.element === testContainer);
      
      expect(containerInfo?.hasResponsiveContent).toBe(true);
    });

    it('should detect responsive videos', async () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/test';
      testContainer.appendChild(iframe);
      
      const containers = await smartContainers.detectContainers();
      const containerInfo = containers.find(c => c.element === testContainer);
      
      expect(containerInfo?.hasResponsiveContent).toBe(true);
    });

    it('should detect grid/flex children', async () => {
      const child = document.createElement('div');
      child.style.display = 'grid';
      testContainer.appendChild(child);
      
      const containers = await smartContainers.detectContainers();
      const containerInfo = containers.find(c => c.element === testContainer);
      
      expect(containerInfo?.hasResponsiveContent).toBe(true);
    });
  });

  describe('Metrics and Analysis', () => {
    it('should provide performance metrics', async () => {
      await smartContainers.detectContainers();
      
      const metrics = smartContainers.getMetrics();
      
      expect(metrics.totalContainers).toBeGreaterThan(0);
      expect(metrics.averageConfidence).toBeGreaterThan(0);
      expect(metrics.typeDistribution).toBeDefined();
    });

    it('should filter containers by type', async () => {
      // Create different container types
      const gridContainer = document.createElement('div');
      gridContainer.style.display = 'grid';
      gridContainer.style.width = '200px';
      gridContainer.style.height = '200px';
      document.body.appendChild(gridContainer);
      
      await smartContainers.detectContainers();
      
      const gridContainers = smartContainers.getContainersByType('grid');
      const blockContainers = smartContainers.getContainersByType('block');
      
      expect(gridContainers.length).toBeGreaterThan(0);
      expect(blockContainers.length).toBeGreaterThan(0);
      expect(gridContainers.every(c => c.type === 'grid')).toBe(true);
      expect(blockContainers.every(c => c.type === 'block')).toBe(true);
    });

    it('should filter high-confidence containers', async () => {
      await smartContainers.detectContainers();
      
      const highConfidenceContainers = smartContainers.getHighConfidenceContainers(0.5);
      
      expect(highConfidenceContainers.every(c => c.confidence >= 0.5)).toBe(true);
    });

    it('should refresh containers', async () => {
      const initialContainers = await smartContainers.detectContainers();
      
      // Add new container
      const newContainer = document.createElement('div');
      newContainer.style.width = '300px';
      newContainer.style.height = '200px';
      newContainer.style.display = 'flex';
      document.body.appendChild(newContainer);
      
      const refreshedContainers = await smartContainers.refreshContainers();
      
      expect(refreshedContainers.length).toBeGreaterThan(initialContainers.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing elements gracefully', () => {
      const nonExistentElement = document.createElement('div');
      
      const containerInfo = smartContainers.getContainerInfo(nonExistentElement);
      expect(containerInfo).toBeNull();
      
      const updatedInfo = smartContainers.updateContainer(nonExistentElement);
      expect(updatedInfo).toBeNull();
    });

    it('should handle cleanup properly', () => {
      expect(() => {
        smartContainers.destroy();
      }).not.toThrow();
    });
  });
});
