#!/usr/bin/env node

/**
 * ProteusJS Development Publishing Script
 * Publishes development versions without overwriting stable releases
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

console.log('🌊 ProteusJS Development Publisher');
console.log('==================================');

try {
  // 1. Build the project
  console.log('🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 2. Read current version
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const currentVersion = packageJson.version;
  console.log(`📦 Current version: ${currentVersion}`);
  
  // 3. Create development version
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const devVersion = `${currentVersion}-dev.${Date.now()}`;
  
  console.log(`🚀 Publishing development version: ${devVersion}`);
  
  // 4. Temporarily update version
  const originalPackageJson = { ...packageJson };
  packageJson.version = devVersion;
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  // 5. Publish with dev tag
  console.log('📤 Publishing to NPM with dev tag...');
  execSync('npm publish --access public --tag dev', { stdio: 'inherit' });
  
  // 6. Restore original version
  writeFileSync('package.json', JSON.stringify(originalPackageJson, null, 2));
  
  console.log('');
  console.log('✅ Development version published successfully!');
  console.log(`📦 Version: ${devVersion}`);
  console.log(`🔗 Install with: npm install @sc4rfurryx/proteusjs@dev`);
  console.log(`🔗 Or specific: npm install @sc4rfurryx/proteusjs@${devVersion}`);
  console.log('');
  console.log('💡 Users can install:');
  console.log('   - Latest stable: npm install @sc4rfurryx/proteusjs');
  console.log('   - Latest dev: npm install @sc4rfurryx/proteusjs@dev');
  
} catch (error) {
  console.error('❌ Development publish failed:', error.message);
  
  // Restore package.json if it was modified
  try {
    const originalPackageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    if (originalPackageJson.version.includes('-dev.')) {
      console.log('🔄 Restoring original package.json...');
      const currentVersion = originalPackageJson.version.split('-dev.')[0];
      originalPackageJson.version = currentVersion;
      writeFileSync('package.json', JSON.stringify(originalPackageJson, null, 2));
    }
  } catch (restoreError) {
    console.error('⚠️  Could not restore package.json:', restoreError.message);
  }
  
  process.exit(1);
}
