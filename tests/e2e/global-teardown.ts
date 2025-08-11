/**
 * Global Teardown for ProteusJS E2E Tests
 */

import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up ProteusJS E2E test environment...');
  
  // Generate test summary
  await generateTestSummary();
  
  // Cleanup temporary files
  await cleanupTempFiles();
  
  console.log('✅ ProteusJS E2E test cleanup complete');
}

async function generateTestSummary() {
  try {
    const resultsPath = path.join(process.cwd(), 'test-results/results.json');
    const results = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
    
    const summary = {
      timestamp: new Date().toISOString(),
      total: results.stats?.total || 0,
      passed: results.stats?.passed || 0,
      failed: results.stats?.failed || 0,
      skipped: results.stats?.skipped || 0,
      duration: results.stats?.duration || 0,
      browsers: results.config?.projects?.map((p: any) => p.name) || [],
      coverage: {
        modules: [
          'transitions',
          'anchor', 
          'container',
          'perf',
          'typography',
          'a11y-audit',
          'a11y-primitives',
          'scroll',
          'popover'
        ],
        adapters: ['react', 'vue', 'svelte']
      }
    };
    
    const summaryPath = path.join(process.cwd(), 'test-results/summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`📊 Test Summary: ${summary.passed}/${summary.total} passed`);
    
  } catch (error) {
    console.warn('Could not generate test summary:', error);
  }
}

async function cleanupTempFiles() {
  try {
    // Remove test server file
    const serverPath = path.join(process.cwd(), 'tests/e2e/test-server.js');
    await fs.unlink(serverPath).catch(() => {}); // Ignore if doesn't exist
    
    console.log('🗑️ Temporary files cleaned up');
  } catch (error) {
    console.warn('Could not cleanup temp files:', error);
  }
}

export default globalTeardown;
