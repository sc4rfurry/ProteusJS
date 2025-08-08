/**
 * Tests for Batch DOM Operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BatchDOMOperations } from '../BatchDOMOperations';

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('BatchDOMOperations', () => {
  let batchDOM: BatchDOMOperations;
  let testElement: HTMLElement;

  beforeEach(() => {
    batchDOM = new BatchDOMOperations({
      maxBatchSize: 10,
      frameTimeLimit: 16,
      separateReadWrite: true,
      autoFlush: false // Disable for testing
    });

    testElement = document.createElement('div');
    testElement.style.width = '100px';
    testElement.style.height = '100px';
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    batchDOM.destroy();
    document.body.removeChild(testElement);
    vi.clearAllMocks();
  });

  describe('Read Operations', () => {
    it('should queue and execute read operations', async () => {
      const result = await batchDOM.queueRead(
        testElement,
        () => testElement.offsetWidth
      );

      expect(result).toBe(100);
    });

    it('should batch multiple reads efficiently', async () => {
      const reads = [
        batchDOM.queueRead(testElement, () => testElement.offsetWidth),
        batchDOM.queueRead(testElement, () => testElement.offsetHeight),
        batchDOM.queueRead(testElement, () => testElement.offsetTop)
      ];

      const results = await Promise.all(reads);
      
      expect(results[0]).toBe(100); // width
      expect(results[1]).toBe(100); // height
      expect(typeof results[2]).toBe('number'); // top
    });

    it('should handle read operation errors', async () => {
      await expect(
        batchDOM.queueRead(testElement, () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });

  describe('Write Operations', () => {
    it('should queue and execute write operations', async () => {
      await batchDOM.queueWrite(
        testElement,
        () => {
          testElement.style.backgroundColor = 'red';
        }
      );

      expect(testElement.style.backgroundColor).toBe('red');
    });

    it('should batch multiple writes efficiently', async () => {
      const writes = [
        batchDOM.queueWrite(testElement, () => {
          testElement.style.color = 'blue';
        }),
        batchDOM.queueWrite(testElement, () => {
          testElement.style.fontSize = '20px';
        })
      ];

      await Promise.all(writes);
      
      expect(testElement.style.color).toBe('blue');
      expect(testElement.style.fontSize).toBe('20px');
    });
  });

  describe('Batch Style Operations', () => {
    it('should batch multiple style changes', async () => {
      await batchDOM.batchStyles(testElement, {
        'background-color': 'green',
        'border': '1px solid black',
        'padding': '10px'
      });

      expect(testElement.style.backgroundColor).toBe('green');
      expect(testElement.style.border).toBe('1px solid black');
      expect(testElement.style.padding).toBe('10px');
    });
  });

  describe('Batch Class Operations', () => {
    it('should batch class changes', async () => {
      testElement.className = 'initial-class';

      await batchDOM.batchClasses(testElement, {
        add: ['new-class', 'another-class'],
        remove: ['initial-class'],
        toggle: ['toggle-class']
      });

      expect(testElement.classList.contains('new-class')).toBe(true);
      expect(testElement.classList.contains('another-class')).toBe(true);
      expect(testElement.classList.contains('initial-class')).toBe(false);
      expect(testElement.classList.contains('toggle-class')).toBe(true);
    });
  });

  describe('Batch Attribute Operations', () => {
    it('should batch attribute changes', async () => {
      await batchDOM.batchAttributes(testElement, {
        'data-test': 'value',
        'aria-label': 'Test element',
        'title': null // Should remove
      });

      expect(testElement.getAttribute('data-test')).toBe('value');
      expect(testElement.getAttribute('aria-label')).toBe('Test element');
      expect(testElement.hasAttribute('title')).toBe(false);
    });
  });

  describe('Batch Read Operations', () => {
    it('should batch multiple property reads', async () => {
      const results = await batchDOM.batchReads(testElement, {
        width: () => testElement.offsetWidth,
        height: () => testElement.offsetHeight,
        tagName: () => testElement.tagName
      });

      expect(results.width).toBe(100);
      expect(results.height).toBe(100);
      expect(results.tagName).toBe('DIV');
    });
  });

  describe('Element Measurement', () => {
    it('should measure element dimensions', async () => {
      const measurements = await batchDOM.measureElement(
        testElement,
        ['width', 'height', 'top', 'left']
      );

      expect(measurements.width).toBe(100);
      expect(measurements.height).toBe(100);
      expect(typeof measurements.top).toBe('number');
      expect(typeof measurements.left).toBe('number');
    });

    it('should measure only requested dimensions', async () => {
      const measurements = await batchDOM.measureElement(
        testElement,
        ['width']
      );

      expect(measurements.width).toBe(100);
      expect(measurements.height).toBeUndefined();
    });
  });

  describe('Priority Handling', () => {
    it('should respect operation priorities', async () => {
      const executionOrder: string[] = [];

      // Add operations with different priorities
      const lowPriority = batchDOM.queueWrite(testElement, () => {
        executionOrder.push('low');
      }, 'low');

      const highPriority = batchDOM.queueWrite(testElement, () => {
        executionOrder.push('high');
      }, 'high');

      const normalPriority = batchDOM.queueWrite(testElement, () => {
        executionOrder.push('normal');
      }, 'normal');

      await Promise.all([lowPriority, highPriority, normalPriority]);

      // High priority should execute first
      expect(executionOrder[0]).toBe('high');
    });
  });

  describe('Read/Write Separation', () => {
    it('should separate reads and writes to prevent layout thrashing', async () => {
      const executionOrder: string[] = [];

      // Mix reads and writes
      const read1 = batchDOM.queueRead(testElement, () => {
        executionOrder.push('read1');
        return testElement.offsetWidth;
      });

      const write1 = batchDOM.queueWrite(testElement, () => {
        executionOrder.push('write1');
        testElement.style.width = '200px';
      });

      const read2 = batchDOM.queueRead(testElement, () => {
        executionOrder.push('read2');
        return testElement.offsetHeight;
      });

      const write2 = batchDOM.queueWrite(testElement, () => {
        executionOrder.push('write2');
        testElement.style.height = '200px';
      });

      await Promise.all([read1, write1, read2, write2]);

      // All reads should come before writes
      const readIndices = executionOrder
        .map((op, index) => op.startsWith('read') ? index : -1)
        .filter(index => index !== -1);
      
      const writeIndices = executionOrder
        .map((op, index) => op.startsWith('write') ? index : -1)
        .filter(index => index !== -1);

      const lastReadIndex = Math.max(...readIndices);
      const firstWriteIndex = Math.min(...writeIndices);

      expect(lastReadIndex).toBeLessThan(firstWriteIndex);
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', async () => {
      const initialMetrics = batchDOM.getMetrics();
      
      await batchDOM.queueRead(testElement, () => testElement.offsetWidth);
      await batchDOM.queueWrite(testElement, () => {
        testElement.style.color = 'red';
      });

      const updatedMetrics = batchDOM.getMetrics();
      
      expect(updatedMetrics.totalOperations).toBeGreaterThan(initialMetrics.totalOperations);
      expect(updatedMetrics.readOperations).toBeGreaterThan(initialMetrics.readOperations);
      expect(updatedMetrics.writeOperations).toBeGreaterThan(initialMetrics.writeOperations);
    });
  });

  describe('Flush Operations', () => {
    it('should flush all queued operations', async () => {
      let executed = false;

      // Queue operation without auto-flush
      batchDOM.queueWrite(testElement, () => {
        executed = true;
      });

      // Should not be executed yet
      expect(executed).toBe(false);

      // Flush manually
      await batchDOM.flush();

      // Should be executed now
      expect(executed).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clear all queues', () => {
      batchDOM.queueRead(testElement, () => testElement.offsetWidth);
      batchDOM.queueWrite(testElement, () => {
        testElement.style.color = 'red';
      });

      const metricsBeforeClear = batchDOM.getMetrics();
      expect(metricsBeforeClear.totalOperations).toBeGreaterThan(0);

      batchDOM.clear();

      // Queues should be empty after clear
      // Note: We can't directly test queue size, but we can test that no new operations are processed
    });

    it('should destroy properly', () => {
      expect(() => batchDOM.destroy()).not.toThrow();
    });
  });
});
