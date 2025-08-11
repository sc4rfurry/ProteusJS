/**
 * Global Setup for ProteusJS E2E Tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🌊 Setting up ProteusJS E2E test environment...');
  
  // Ensure test results directory exists
  const testResultsDir = path.join(process.cwd(), 'test-results');
  await fs.mkdir(testResultsDir, { recursive: true });
  
  // Ensure dist directory exists and is built
  const distDir = path.join(process.cwd(), 'dist');
  try {
    await fs.access(distDir);
    console.log('✅ Dist directory found');
  } catch {
    console.log('🔨 Building ProteusJS...');
    await buildProteusJS();
  }
  
  // Create test server files
  await createTestServer();
  
  // Verify browser capabilities
  await verifyBrowserCapabilities();
  
  console.log('✅ ProteusJS E2E test environment ready');
}

async function buildProteusJS() {
  return new Promise<void>((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

async function createTestServer() {
  const serverContent = `
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from dist directory
app.use('/dist', express.static(path.join(__dirname, '../../dist')));

// Serve test files
app.use('/tests', express.static(path.join(__dirname, '../../tests')));

// Basic HTML page for testing
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ProteusJS Test Server</title>
    </head>
    <body>
      <h1>ProteusJS Test Server</h1>
      <p>E2E testing environment is ready.</p>
      <script type="module">
        console.log('ProteusJS test server loaded');
      </script>
    </body>
    </html>
  \`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(port, () => {
  console.log(\`ProteusJS test server running at http://localhost:\${port}\`);
});
`;

  const serverPath = path.join(process.cwd(), 'tests/e2e/test-server.js');
  await fs.writeFile(serverPath, serverContent);
  
  // Create package.json script for test server
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  
  if (!packageJson.scripts['serve:test']) {
    packageJson.scripts['serve:test'] = 'node tests/e2e/test-server.js';
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

async function verifyBrowserCapabilities() {
  console.log('🔍 Verifying browser capabilities...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Check for modern web features
  const capabilities = await page.evaluate(() => {
    return {
      viewTransitions: 'startViewTransition' in document,
      anchorPositioning: CSS.supports('anchor-name', '--test'),
      containerQueries: CSS.supports('container-type', 'inline-size'),
      contentVisibility: CSS.supports('content-visibility', 'auto'),
      customElements: 'customElements' in window,
      modules: 'noModule' in HTMLScriptElement.prototype
    };
  });
  
  console.log('Browser capabilities:', capabilities);
  
  // Save capabilities for test reference
  const capabilitiesPath = path.join(process.cwd(), 'test-results/browser-capabilities.json');
  await fs.writeFile(capabilitiesPath, JSON.stringify(capabilities, null, 2));
  
  await browser.close();
}

export default globalSetup;
