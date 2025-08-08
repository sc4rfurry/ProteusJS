/**
 * Performance Benchmark Suite
 * Comprehensive performance testing and validation for ProteusJS
 */

import { ProteusJS } from '../src/core/ProteusJS';
import { SmartContainers } from '../src/containers/SmartContainers';
import { ContainerBreakpoints } from '../src/containers/ContainerBreakpoints';
import { FluidTypography } from '../src/typography/FluidTypography';
import { PerformanceMonitor } from '../src/performance/PerformanceMonitor';

interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  memoryUsage: {
    before: number;
    after: number;
    delta: number;
  };
  passed: boolean;
  target: number;
  details?: any;
}

interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  overall: {
    passed: boolean;
    totalTime: number;
    averageOpsPerSecond: number;
    memoryLeaks: boolean;
  };
}

class PerformanceBenchmark {
  private proteus: ProteusJS | null = null;
  private monitor: PerformanceMonitor | null = null;
  private results: BenchmarkSuite[] = [];

  /**
   * Run complete performance benchmark suite
   */
  public async runBenchmarks(): Promise<BenchmarkSuite[]> {
    console.log('🚀 Starting ProteusJS Performance Benchmarks...\n');

    // Initialize ProteusJS
    await this.initializeProteusJS();

    // Run benchmark suites
    await this.runInitializationBenchmarks();
    await this.runContainerDetectionBenchmarks();
    await this.runBreakpointBenchmarks();
    await this.runTypographyBenchmarks();
    await this.runMemoryBenchmarks();
    await this.runStressBenchmarks();

    // Generate final report
    this.generateReport();

    return this.results;
  }

  /**
   * Initialize ProteusJS for benchmarking
   */
  private async initializeProteusJS(): Promise<void> {
    this.proteus = new ProteusJS({
      performance: { monitoring: true }
    });
    
    this.monitor = new PerformanceMonitor();
    this.monitor.start();
    
    await this.proteus.initialize();
  }

  /**
   * Benchmark initialization performance
   */
  private async runInitializationBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Initialization Performance',
      results: [],
      overall: { passed: true, totalTime: 0, averageOpsPerSecond: 0, memoryLeaks: false }
    };

    // Benchmark ProteusJS initialization
    const initResult = await this.benchmark(
      'ProteusJS Initialization',
      async () => {
        const proteus = new ProteusJS();
        await proteus.initialize();
        proteus.destroy();
      },
      1,
      100 // Target: <100ms
    );
    suite.results.push(initResult);

    // Benchmark SmartContainers initialization
    const containersResult = await this.benchmark(
      'SmartContainers Initialization',
      async () => {
        const containers = new SmartContainers();
        containers.destroy();
      },
      10,
      10 // Target: <10ms per operation
    );
    suite.results.push(containersResult);

    // Benchmark ContainerBreakpoints initialization
    const breakpointsResult = await this.benchmark(
      'ContainerBreakpoints Initialization',
      async () => {
        const breakpoints = new ContainerBreakpoints();
        breakpoints.destroy();
      },
      10,
      5 // Target: <5ms per operation
    );
    suite.results.push(breakpointsResult);

    this.finalizeSuite(suite);
    this.results.push(suite);
  }

  /**
   * Benchmark container detection performance
   */
  private async runContainerDetectionBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Container Detection Performance',
      results: [],
      overall: { passed: true, totalTime: 0, averageOpsPerSecond: 0, memoryLeaks: false }
    };

    // Create test DOM structure
    this.createTestDOM(100); // 100 elements

    const containers = new SmartContainers();

    // Benchmark container detection
    const detectionResult = await this.benchmark(
      'Container Detection (100 elements)',
      async () => {
        await containers.detectContainers();
      },
      5,
      50 // Target: <50ms per detection
    );
    suite.results.push(detectionResult);

    // Benchmark container updates
    const updateResult = await this.benchmark(
      'Container Updates',
      () => {
        const elements = document.querySelectorAll('.test-container');
        elements.forEach(el => {
          containers.updateContainer(el as Element);
        });
      },
      10,
      20 // Target: <20ms per update cycle
    );
    suite.results.push(updateResult);

    containers.destroy();
    this.cleanupTestDOM();
    this.finalizeSuite(suite);
    this.results.push(suite);
  }

  /**
   * Benchmark breakpoint performance
   */
  private async runBreakpointBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Breakpoint Performance',
      results: [],
      overall: { passed: true, totalTime: 0, averageOpsPerSecond: 0, memoryLeaks: false }
    };

    this.createTestDOM(50);
    const breakpoints = new ContainerBreakpoints();

    // Benchmark breakpoint registration
    const registrationResult = await this.benchmark(
      'Breakpoint Registration (50 elements)',
      () => {
        const elements = document.querySelectorAll('.test-container');
        elements.forEach(el => {
          breakpoints.register(el as Element, {
            sm: '300px',
            md: '600px',
            lg: '900px'
          });
        });
      },
      1,
      30 // Target: <30ms for 50 registrations
    );
    suite.results.push(registrationResult);

    // Benchmark breakpoint updates
    const updateResult = await this.benchmark(
      'Breakpoint Updates',
      () => {
        breakpoints.updateAll();
      },
      20,
      10 // Target: <10ms per update
    );
    suite.results.push(updateResult);

    breakpoints.destroy();
    this.cleanupTestDOM();
    this.finalizeSuite(suite);
    this.results.push(suite);
  }

  /**
   * Benchmark typography performance
   */
  private async runTypographyBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Typography Performance',
      results: [],
      overall: { passed: true, totalTime: 0, averageOpsPerSecond: 0, memoryLeaks: false }
    };

    this.createTestDOM(100, true); // Include text content
    const typography = new FluidTypography();

    // Benchmark fluid typography application
    const fluidResult = await this.benchmark(
      'Fluid Typography Application (100 elements)',
      () => {
        const elements = document.querySelectorAll('.test-text');
        elements.forEach(el => {
          typography.applyFluidScaling(el as Element, {
            minSize: 14,
            maxSize: 18,
            accessibility: 'AA'
          });
        });
      },
      1,
      50 // Target: <50ms for 100 elements
    );
    suite.results.push(fluidResult);

    // Benchmark typography updates
    const updateResult = await this.benchmark(
      'Typography Updates',
      () => {
        const elements = document.querySelectorAll('.test-text');
        elements.forEach(el => {
          // Simulate container size change
          (el as HTMLElement).style.width = Math.random() * 400 + 200 + 'px';
        });
      },
      10,
      15 // Target: <15ms per update cycle
    );
    suite.results.push(updateResult);

    typography.destroy();
    this.cleanupTestDOM();
    this.finalizeSuite(suite);
    this.results.push(suite);
  }

  /**
   * Benchmark memory usage and leak detection
   */
  private async runMemoryBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Memory Management',
      results: [],
      overall: { passed: true, totalTime: 0, averageOpsPerSecond: 0, memoryLeaks: false }
    };

    // Benchmark memory usage during initialization
    const memoryResult = await this.benchmarkMemory(
      'Memory Usage - Full Initialization',
      async () => {
        this.createTestDOM(200);
        
        const proteus = new ProteusJS();
        await proteus.initialize();
        
        const containers = new SmartContainers();
        await containers.detectContainers();
        containers.startMonitoring();
        
        const breakpoints = new ContainerBreakpoints();
        const elements = document.querySelectorAll('.test-container');
        elements.forEach(el => {
          breakpoints.register(el as Element, {
            sm: '300px',
            md: '600px',
            lg: '900px'
          });
        });
        
        // Cleanup
        proteus.destroy();
        containers.destroy();
        breakpoints.destroy();
        this.cleanupTestDOM();
      },
      10 * 1024 * 1024 // Target: <10MB memory increase
    );
    suite.results.push(memoryResult);

    // Test for memory leaks
    const leakResult = await this.testMemoryLeaks();
    suite.results.push(leakResult);

    this.finalizeSuite(suite);
    this.results.push(suite);
  }

  /**
   * Run stress tests
   */
  private async runStressBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Stress Testing',
      results: [],
      overall: { passed: true, totalTime: 0, averageOpsPerSecond: 0, memoryLeaks: false }
    };

    // Stress test with many containers
    const stressResult = await this.benchmark(
      'Stress Test - 1000 Containers',
      async () => {
        this.createTestDOM(1000);
        
        const containers = new SmartContainers();
        await containers.detectContainers();
        
        const breakpoints = new ContainerBreakpoints();
        const elements = document.querySelectorAll('.test-container');
        
        // Register breakpoints on first 100 elements
        for (let i = 0; i < Math.min(100, elements.length); i++) {
          breakpoints.register(elements[i] as Element, {
            sm: '300px',
            md: '600px',
            lg: '900px'
          });
        }
        
        // Update all breakpoints
        breakpoints.updateAll();
        
        containers.destroy();
        breakpoints.destroy();
        this.cleanupTestDOM();
      },
      1,
      500 // Target: <500ms for stress test
    );
    suite.results.push(stressResult);

    this.finalizeSuite(suite);
    this.results.push(suite);
  }

  /**
   * Generic benchmark function
   */
  private async benchmark(
    name: string,
    operation: () => void | Promise<void>,
    iterations: number,
    targetMs: number
  ): Promise<BenchmarkResult> {
    const memoryBefore = this.getMemoryUsage();
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      await operation();
    }

    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsage();
    
    const duration = endTime - startTime;
    const avgDuration = duration / iterations;
    const opsPerSecond = 1000 / avgDuration;
    const passed = avgDuration <= targetMs;

    return {
      name,
      duration: avgDuration,
      operations: iterations,
      opsPerSecond,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        delta: memoryAfter - memoryBefore
      },
      passed,
      target: targetMs
    };
  }

  /**
   * Benchmark memory usage
   */
  private async benchmarkMemory(
    name: string,
    operation: () => void | Promise<void>,
    targetBytes: number
  ): Promise<BenchmarkResult> {
    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }

    const memoryBefore = this.getMemoryUsage();
    const startTime = performance.now();

    await operation();

    // Force garbage collection again
    if ((global as any).gc) {
      (global as any).gc();
    }

    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsage();
    
    const duration = endTime - startTime;
    const memoryDelta = memoryAfter - memoryBefore;
    const passed = memoryDelta <= targetBytes;

    return {
      name,
      duration,
      operations: 1,
      opsPerSecond: 1000 / duration,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        delta: memoryDelta
      },
      passed,
      target: targetBytes,
      details: {
        memoryDeltaMB: (memoryDelta / 1024 / 1024).toFixed(2),
        targetMB: (targetBytes / 1024 / 1024).toFixed(2)
      }
    };
  }

  /**
   * Test for memory leaks
   */
  private async testMemoryLeaks(): Promise<BenchmarkResult> {
    const iterations = 10;
    const memoryReadings: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Create and destroy ProteusJS instances
      this.createTestDOM(50);
      
      const proteus = new ProteusJS();
      await proteus.initialize();
      
      const containers = new SmartContainers();
      await containers.detectContainers();
      
      proteus.destroy();
      containers.destroy();
      this.cleanupTestDOM();
      
      // Force garbage collection
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      memoryReadings.push(this.getMemoryUsage());
      
      // Wait a bit between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if memory is consistently increasing (indicating leaks)
    const firstReading = memoryReadings[0];
    const lastReading = memoryReadings[memoryReadings.length - 1];
    const memoryIncrease = lastReading - firstReading;
    const leakThreshold = 5 * 1024 * 1024; // 5MB threshold
    
    const hasLeaks = memoryIncrease > leakThreshold;

    return {
      name: 'Memory Leak Detection',
      duration: 0,
      operations: iterations,
      opsPerSecond: 0,
      memoryUsage: {
        before: firstReading,
        after: lastReading,
        delta: memoryIncrease
      },
      passed: !hasLeaks,
      target: leakThreshold,
      details: {
        readings: memoryReadings,
        increaseMB: (memoryIncrease / 1024 / 1024).toFixed(2),
        thresholdMB: (leakThreshold / 1024 / 1024).toFixed(2)
      }
    };
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Create test DOM structure
   */
  private createTestDOM(count: number, includeText: boolean = false): void {
    const container = document.createElement('div');
    container.id = 'benchmark-container';
    
    for (let i = 0; i < count; i++) {
      const element = document.createElement('div');
      element.className = 'test-container';
      element.style.width = Math.random() * 400 + 200 + 'px';
      element.style.height = Math.random() * 300 + 100 + 'px';
      element.style.display = 'block';
      
      if (includeText) {
        const text = document.createElement('p');
        text.className = 'test-text';
        text.textContent = `Test text content ${i}`;
        element.appendChild(text);
      }
      
      container.appendChild(element);
    }
    
    document.body.appendChild(container);
  }

  /**
   * Clean up test DOM
   */
  private cleanupTestDOM(): void {
    const container = document.getElementById('benchmark-container');
    if (container) {
      container.remove();
    }
  }

  /**
   * Finalize benchmark suite
   */
  private finalizeSuite(suite: BenchmarkSuite): void {
    suite.overall.totalTime = suite.results.reduce((sum, r) => sum + r.duration, 0);
    suite.overall.averageOpsPerSecond = suite.results.reduce((sum, r) => sum + r.opsPerSecond, 0) / suite.results.length;
    suite.overall.passed = suite.results.every(r => r.passed);
    suite.overall.memoryLeaks = suite.results.some(r => r.name.includes('Memory Leak') && !r.passed);
  }

  /**
   * Generate final benchmark report
   */
  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PROTEUS.JS PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(80));

    let overallPassed = true;
    let totalTime = 0;

    this.results.forEach(suite => {
      console.log(`\n📋 ${suite.name}`);
      console.log(`   Overall: ${suite.overall.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Total Time: ${suite.overall.totalTime.toFixed(2)}ms`);
      console.log(`   Avg Ops/sec: ${suite.overall.averageOpsPerSecond.toFixed(0)}`);
      
      if (suite.overall.memoryLeaks) {
        console.log(`   ⚠️  Memory leaks detected!`);
      }

      suite.results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        const duration = result.duration.toFixed(2);
        const target = result.target;
        const opsPerSec = result.opsPerSecond.toFixed(0);
        
        console.log(`     ${status} ${result.name}: ${duration}ms (target: <${target}ms) - ${opsPerSec} ops/sec`);
        
        if (result.memoryUsage.delta > 0) {
          const memoryMB = (result.memoryUsage.delta / 1024 / 1024).toFixed(2);
          console.log(`        Memory: +${memoryMB}MB`);
        }
      });

      if (!suite.overall.passed) {
        overallPassed = false;
      }
      totalTime += suite.overall.totalTime;
    });

    console.log('\n' + '='.repeat(80));
    console.log(`🎯 OVERALL RESULT: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`⏱️  Total Benchmark Time: ${totalTime.toFixed(2)}ms`);
    
    if (overallPassed) {
      console.log('🎉 All performance targets met! ProteusJS is ready for production.');
    } else {
      console.log('⚠️  Some performance targets not met. Review failed benchmarks.');
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  
  benchmark.runBenchmarks()
    .then(results => {
      const allPassed = results.every(suite => suite.overall.passed);
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}

export { PerformanceBenchmark, BenchmarkResult, BenchmarkSuite };
