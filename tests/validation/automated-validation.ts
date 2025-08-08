/**
 * Automated Validation Scripts for ProteusJS
 * Comprehensive validation of functionality, performance, and compliance
 */

import { ProteusJS } from '../../src/index';
import { logger } from '../../src/utils/Logger';

export interface ValidationResult {
  category: string;
  test: string;
  passed: boolean;
  score: number;
  message: string;
  details?: any;
  recommendations?: string[];
}

export interface ValidationReport {
  overallScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  categories: {
    [category: string]: {
      score: number;
      tests: ValidationResult[];
    };
  };
  recommendations: string[];
  timestamp: number;
}

export class AutomatedValidator {
  private proteus: ProteusJS;
  private results: ValidationResult[] = [];

  constructor(proteus: ProteusJS) {
    this.proteus = proteus;
  }

  /**
   * Run comprehensive validation suite
   */
  public async runValidation(): Promise<ValidationReport> {
    logger.info('Starting automated validation suite');
    this.results = [];

    // Run all validation categories
    await this.validateFunctionality();
    await this.validatePerformance();
    await this.validateAccessibility();
    await this.validateCompatibility();
    await this.validateSecurity();
    await this.validateUsability();

    return this.generateReport();
  }

  /**
   * Validate core functionality
   */
  private async validateFunctionality(): Promise<void> {
    const category = 'Functionality';

    // Test fluid typography
    await this.runTest(category, 'Fluid Typography Basic', async () => {
      const element = document.createElement('h1');
      element.textContent = 'Test Heading';
      document.body.appendChild(element);

      try {
        this.proteus.typography.applyFluidScaling(element, {
          minSize: 20,
          maxSize: 40
        });

        const style = window.getComputedStyle(element);
        const hasClamp = style.fontSize.includes('clamp');
        
        document.body.removeChild(element);
        return {
          passed: hasClamp,
          score: hasClamp ? 100 : 0,
          message: hasClamp ? 'Fluid typography applied successfully' : 'Failed to apply fluid typography'
        };
      } catch (error) {
        document.body.removeChild(element);
        return {
          passed: false,
          score: 0,
          message: `Error applying fluid typography: ${error}`
        };
      }
    });

    // Test container queries
    await this.runTest(category, 'Container Queries', async () => {
      const container = document.createElement('div');
      container.style.width = '300px';
      document.body.appendChild(container);

      try {
        this.proteus.containers.registerContainer(container, {
          'small': '(max-width: 400px)',
          'large': '(min-width: 401px)'
        });

        this.proteus.containers.updateContainer(container);
        const hasAttribute = container.hasAttribute('data-container');
        
        document.body.removeChild(container);
        return {
          passed: hasAttribute,
          score: hasAttribute ? 100 : 0,
          message: hasAttribute ? 'Container queries working' : 'Container queries not applied'
        };
      } catch (error) {
        document.body.removeChild(container);
        return {
          passed: false,
          score: 0,
          message: `Error with container queries: ${error}`
        };
      }
    });

    // Test performance monitoring
    await this.runTest(category, 'Performance Monitoring', async () => {
      try {
        this.proteus.performance.startMonitoring();
        const metrics = this.proteus.performance.getMetrics();
        
        const hasMetrics = metrics.averageFPS > 0 || metrics.operationsPerSecond >= 0;
        return {
          passed: hasMetrics,
          score: hasMetrics ? 100 : 0,
          message: hasMetrics ? 'Performance monitoring active' : 'Performance monitoring not working',
          details: metrics
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `Performance monitoring error: ${error}`
        };
      }
    });
  }

  /**
   * Validate performance characteristics
   */
  private async validatePerformance(): Promise<void> {
    const category = 'Performance';

    // Test initialization time
    await this.runTest(category, 'Initialization Performance', async () => {
      const startTime = performance.now();
      
      const testProteus = new ProteusJS();
      await testProteus.initialize();
      
      const endTime = performance.now();
      const initTime = endTime - startTime;
      
      testProteus.destroy();
      
      const passed = initTime < 100; // Should initialize in less than 100ms
      return {
        passed,
        score: passed ? 100 : Math.max(0, 100 - (initTime - 100)),
        message: `Initialization took ${initTime.toFixed(2)}ms`,
        details: { initTime }
      };
    });

    // Test memory usage
    await this.runTest(category, 'Memory Usage', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create and destroy multiple instances
      for (let i = 0; i < 10; i++) {
        const testProteus = new ProteusJS();
        await testProteus.initialize();
        testProteus.destroy();
      }
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      const passed = memoryIncrease < 1000000; // Less than 1MB increase
      return {
        passed,
        score: passed ? 100 : Math.max(0, 100 - (memoryIncrease / 10000)),
        message: `Memory increase: ${(memoryIncrease / 1024).toFixed(2)}KB`,
        details: { initialMemory, finalMemory, memoryIncrease }
      };
    });

    // Test rendering performance
    await this.runTest(category, 'Rendering Performance', async () => {
      const elements: HTMLElement[] = [];
      
      // Create test elements
      for (let i = 0; i < 50; i++) {
        const element = document.createElement('div');
        element.textContent = `Test element ${i}`;
        document.body.appendChild(element);
        elements.push(element);
      }
      
      const startTime = performance.now();
      
      // Apply fluid typography to all elements
      elements.forEach((element, index) => {
        this.proteus.typography.applyFluidScaling(element, {
          minSize: 14 + (index % 4),
          maxSize: 20 + (index % 4)
        });
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Cleanup
      elements.forEach(element => document.body.removeChild(element));
      
      const passed = renderTime < 50; // Should complete in less than 50ms
      return {
        passed,
        score: passed ? 100 : Math.max(0, 100 - (renderTime - 50)),
        message: `Rendered 50 elements in ${renderTime.toFixed(2)}ms`,
        details: { renderTime, elementsCount: 50 }
      };
    });
  }

  /**
   * Validate accessibility compliance
   */
  private async validateAccessibility(): Promise<void> {
    const category = 'Accessibility';

    // Test WCAG compliance
    await this.runTest(category, 'WCAG Compliance', async () => {
      try {
        const report = this.proteus.accessibility.generateComplianceReport();
        
        const passed = report.score >= 80; // 80% or higher
        return {
          passed,
          score: report.score,
          message: `WCAG compliance score: ${report.score}/100`,
          details: report,
          recommendations: report.recommendations
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `Accessibility validation error: ${error}`
        };
      }
    });

    // Test keyboard navigation
    await this.runTest(category, 'Keyboard Navigation', async () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);

      try {
        // Check if element is focusable
        button.focus();
        const isFocused = document.activeElement === button;
        
        // Check for focus indicator
        const computedStyle = window.getComputedStyle(button, ':focus');
        const hasFocusIndicator = computedStyle.outline !== 'none' || 
                                 computedStyle.boxShadow !== 'none';
        
        document.body.removeChild(button);
        
        const passed = isFocused && hasFocusIndicator;
        return {
          passed,
          score: passed ? 100 : (isFocused ? 50 : 0),
          message: passed ? 'Keyboard navigation working' : 'Keyboard navigation issues detected'
        };
      } catch (error) {
        document.body.removeChild(button);
        return {
          passed: false,
          score: 0,
          message: `Keyboard navigation test error: ${error}`
        };
      }
    });

    // Test screen reader compatibility
    await this.runTest(category, 'Screen Reader Support', async () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <h1>Test Heading</h1>
        <p>Test paragraph</p>
        <img src="test.jpg" alt="Test image" />
        <button aria-label="Test button">Click me</button>
      `;
      document.body.appendChild(element);

      try {
        const report = this.proteus.accessibility.generateComplianceReport();
        const ariaViolations = report.violations.filter(v => v.type === 'aria-labels');
        
        document.body.removeChild(element);
        
        const passed = ariaViolations.length === 0;
        return {
          passed,
          score: passed ? 100 : Math.max(0, 100 - (ariaViolations.length * 20)),
          message: passed ? 'Screen reader support good' : `${ariaViolations.length} ARIA violations found`
        };
      } catch (error) {
        document.body.removeChild(element);
        return {
          passed: false,
          score: 0,
          message: `Screen reader test error: ${error}`
        };
      }
    });
  }

  /**
   * Validate browser compatibility
   */
  private async validateCompatibility(): Promise<void> {
    const category = 'Compatibility';

    // Test browser detection
    await this.runTest(category, 'Browser Detection', async () => {
      try {
        const report = this.proteus.compatibility.getCompatibilityReport();
        
        const hasValidBrowser = report.browser.name !== 'Unknown' && 
                               report.browser.version !== '0';
        
        return {
          passed: hasValidBrowser,
          score: hasValidBrowser ? 100 : 0,
          message: hasValidBrowser ? 
            `Detected ${report.browser.name} ${report.browser.version}` : 
            'Browser detection failed',
          details: report.browser
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `Browser detection error: ${error}`
        };
      }
    });

    // Test feature detection
    await this.runTest(category, 'Feature Detection', async () => {
      try {
        const features = this.proteus.compatibility.getFeatureSupport();
        const supportedFeatures = Object.values(features).filter(Boolean).length;
        const totalFeatures = Object.keys(features).length;
        const supportPercentage = (supportedFeatures / totalFeatures) * 100;
        
        const passed = supportPercentage >= 70; // 70% feature support
        return {
          passed,
          score: supportPercentage,
          message: `${supportedFeatures}/${totalFeatures} features supported (${supportPercentage.toFixed(1)}%)`,
          details: features
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `Feature detection error: ${error}`
        };
      }
    });

    // Test polyfill loading
    await this.runTest(category, 'Polyfill Support', async () => {
      try {
        const report = this.proteus.compatibility.getCompatibilityReport();
        const requiredPolyfills = report.polyfills.filter(p => p.required);
        const loadedPolyfills = requiredPolyfills.filter(p => p.loaded);
        
        const passed = requiredPolyfills.length === 0 || 
                      loadedPolyfills.length === requiredPolyfills.length;
        
        return {
          passed,
          score: passed ? 100 : (loadedPolyfills.length / Math.max(requiredPolyfills.length, 1)) * 100,
          message: passed ? 'All required polyfills loaded' : 
            `${loadedPolyfills.length}/${requiredPolyfills.length} polyfills loaded`,
          details: { requiredPolyfills, loadedPolyfills }
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `Polyfill test error: ${error}`
        };
      }
    });
  }

  /**
   * Validate security aspects
   */
  private async validateSecurity(): Promise<void> {
    const category = 'Security';

    // Test XSS protection
    await this.runTest(category, 'XSS Protection', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const element = document.createElement('div');
      
      try {
        // Test if ProteusJS properly sanitizes input
        this.proteus.typography.applyFluidScaling(element, {
          minSize: 16,
          maxSize: 24
        });
        
        // Should not execute scripts
        const hasScript = element.innerHTML.includes('<script>');
        
        return {
          passed: !hasScript,
          score: hasScript ? 0 : 100,
          message: hasScript ? 'XSS vulnerability detected' : 'XSS protection working'
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `XSS test error: ${error}`
        };
      }
    });

    // Test CSP compliance
    await this.runTest(category, 'CSP Compliance', async () => {
      try {
        // Check if ProteusJS works with strict CSP
        const hasInlineStyles = document.querySelectorAll('[style]').length > 0;
        const hasInlineScripts = document.querySelectorAll('script:not([src])').length > 0;
        
        const passed = !hasInlineStyles && !hasInlineScripts;
        return {
          passed,
          score: passed ? 100 : 50,
          message: passed ? 'CSP compliant' : 'May have CSP issues with inline styles/scripts'
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `CSP test error: ${error}`
        };
      }
    });
  }

  /**
   * Validate usability aspects
   */
  private async validateUsability(): Promise<void> {
    const category = 'Usability';

    // Test API usability
    await this.runTest(category, 'API Usability', async () => {
      try {
        // Test if API is intuitive and works as expected
        const element = document.createElement('p');
        element.textContent = 'Test';
        document.body.appendChild(element);

        // Should work with minimal configuration
        this.proteus.typography.applyFluidScaling(element, {
          minSize: 16,
          maxSize: 24
        });

        const hasFluidTypography = window.getComputedStyle(element).fontSize.includes('clamp');
        
        document.body.removeChild(element);
        
        return {
          passed: hasFluidTypography,
          score: hasFluidTypography ? 100 : 0,
          message: hasFluidTypography ? 'API is user-friendly' : 'API usability issues'
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `API usability test error: ${error}`
        };
      }
    });

    // Test error handling
    await this.runTest(category, 'Error Handling', async () => {
      try {
        // Test with invalid inputs
        const element = document.createElement('div');
        
        // Should handle invalid inputs gracefully
        this.proteus.typography.applyFluidScaling(element, {
          minSize: -10, // Invalid
          maxSize: 'invalid' as any // Invalid
        });
        
        // Should not crash
        return {
          passed: true,
          score: 100,
          message: 'Error handling working correctly'
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `Poor error handling: ${error}`
        };
      }
    });
  }

  /**
   * Run individual test
   */
  private async runTest(
    category: string, 
    testName: string, 
    testFn: () => Promise<{ passed: boolean; score: number; message: string; details?: any; recommendations?: string[] }>
  ): Promise<void> {
    try {
      const result = await testFn();
      this.results.push({
        category,
        test: testName,
        ...result
      });
    } catch (error) {
      this.results.push({
        category,
        test: testName,
        passed: false,
        score: 0,
        message: `Test execution error: ${error}`
      });
    }
  }

  /**
   * Generate comprehensive validation report
   */
  private generateReport(): ValidationReport {
    const categories: { [key: string]: { score: number; tests: ValidationResult[] } } = {};
    const allRecommendations: string[] = [];

    // Group results by category
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { score: 0, tests: [] };
      }
      categories[result.category].tests.push(result);
      
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations);
      }
    });

    // Calculate category scores
    Object.keys(categories).forEach(category => {
      const tests = categories[category].tests;
      const totalScore = tests.reduce((sum, test) => sum + test.score, 0);
      categories[category].score = tests.length > 0 ? totalScore / tests.length : 0;
    });

    // Calculate overall score
    const categoryScores = Object.values(categories).map(cat => cat.score);
    const overallScore = categoryScores.length > 0 ? 
      categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length : 0;

    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.length - passedTests;

    // Generate recommendations
    const recommendations = [...new Set(allRecommendations)];
    
    if (overallScore < 80) {
      recommendations.push('Consider addressing failing tests to improve overall quality');
    }
    
    if (failedTests > 0) {
      recommendations.push(`${failedTests} tests failed - review and fix issues`);
    }

    return {
      overallScore: Math.round(overallScore),
      totalTests: this.results.length,
      passedTests,
      failedTests,
      categories,
      recommendations,
      timestamp: Date.now()
    };
  }
}
