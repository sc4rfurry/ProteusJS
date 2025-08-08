/**
 * Build Validator
 * Validates build outputs, bundle sizes, and distribution files
 */

import { readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

interface BuildValidationResult {
  overall: 'PASS' | 'FAIL';
  files: FileValidation[];
  bundleSize: BundleSizeValidation;
  typeDefinitions: TypeDefinitionValidation;
  packageExports: PackageExportValidation;
  issues: string[];
  recommendations: string[];
}

interface FileValidation {
  file: string;
  exists: boolean;
  size: number;
  gzipSize: number;
  format: string;
  hasSourceMap: boolean;
  hasBanner: boolean;
}

interface BundleSizeValidation {
  totalSize: number;
  gzipSize: number;
  targetSize: number;
  withinTarget: boolean;
  breakdown: { [format: string]: number };
}

interface TypeDefinitionValidation {
  exists: boolean;
  exports: string[];
  issues: string[];
}

interface PackageExportValidation {
  hasMain: boolean;
  hasModule: boolean;
  hasTypes: boolean;
  hasExports: boolean;
  issues: string[];
}

class BuildValidator {
  private distDir = 'dist';
  private targetBundleSize = 50 * 1024; // 50KB

  /**
   * Validate complete build output
   */
  public validateBuild(): BuildValidationResult {
    console.log('🔍 Validating ProteusJS Build Output...\n');

    const result: BuildValidationResult = {
      overall: 'PASS',
      files: [],
      bundleSize: this.validateBundleSize(),
      typeDefinitions: this.validateTypeDefinitions(),
      packageExports: this.validatePackageExports(),
      issues: [],
      recommendations: []
    };

    // Validate expected files
    const expectedFiles = [
      { file: 'proteus.js', format: 'UMD' },
      { file: 'proteus.min.js', format: 'UMD (minified)' },
      { file: 'proteus.esm.js', format: 'ESM' },
      { file: 'proteus.esm.min.js', format: 'ESM (minified)' },
      { file: 'proteus.cjs.js', format: 'CommonJS' },
      { file: 'proteus.d.ts', format: 'TypeScript definitions' }
    ];

    for (const expected of expectedFiles) {
      const validation = this.validateFile(expected.file, expected.format);
      result.files.push(validation);
      
      if (!validation.exists) {
        result.issues.push(`Missing build file: ${expected.file}`);
      }
    }

    // Collect issues from sub-validations
    result.issues.push(...result.typeDefinitions.issues);
    result.issues.push(...result.packageExports.issues);

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result);

    // Determine overall result
    result.overall = result.issues.length === 0 && result.bundleSize.withinTarget ? 'PASS' : 'FAIL';

    this.printValidationReport(result);
    return result;
  }

  /**
   * Validate individual file
   */
  private validateFile(filename: string, format: string): FileValidation {
    const filePath = join(this.distDir, filename);
    const exists = existsSync(filePath);
    
    const validation: FileValidation = {
      file: filename,
      exists,
      size: 0,
      gzipSize: 0,
      format,
      hasSourceMap: false,
      hasBanner: false
    };

    if (exists) {
      try {
        const content = readFileSync(filePath);
        validation.size = content.length;
        validation.gzipSize = gzipSync(content).length;
        
        const contentStr = content.toString();
        validation.hasSourceMap = existsSync(filePath + '.map') || contentStr.includes('sourceMappingURL');
        validation.hasBanner = contentStr.startsWith('/*!');
        
      } catch (error) {
        console.warn(`Warning: Could not read ${filename}: ${error.message}`);
      }
    }

    return validation;
  }

  /**
   * Validate bundle size requirements
   */
  private validateBundleSize(): BundleSizeValidation {
    const breakdown: { [format: string]: number } = {};
    let totalSize = 0;
    let totalGzipSize = 0;

    const mainFiles = ['proteus.min.js', 'proteus.esm.min.js'];
    
    for (const file of mainFiles) {
      const filePath = join(this.distDir, file);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath);
          const size = content.length;
          const gzipSize = gzipSync(content).length;
          
          breakdown[file] = gzipSize;
          totalSize += size;
          totalGzipSize += gzipSize;
        } catch (error) {
          console.warn(`Warning: Could not analyze ${file}: ${error.message}`);
        }
      }
    }

    // Use the largest minified file for target comparison
    const largestGzipSize = Math.max(...Object.values(breakdown));

    return {
      totalSize,
      gzipSize: totalGzipSize,
      targetSize: this.targetBundleSize,
      withinTarget: largestGzipSize <= this.targetBundleSize,
      breakdown
    };
  }

  /**
   * Validate TypeScript definitions
   */
  private validateTypeDefinitions(): TypeDefinitionValidation {
    const dtsPath = join(this.distDir, 'proteus.d.ts');
    const validation: TypeDefinitionValidation = {
      exists: existsSync(dtsPath),
      exports: [],
      issues: []
    };

    if (validation.exists) {
      try {
        const content = readFileSync(dtsPath, 'utf-8');
        
        // Extract exports
        const exportMatches = content.match(/export\s+(?:class|interface|type|const|function)\s+(\w+)/g);
        if (exportMatches) {
          validation.exports = exportMatches.map(match => 
            match.replace(/export\s+(?:class|interface|type|const|function)\s+/, '')
          );
        }

        // Check for essential exports
        const essentialExports = ['ProteusJS', 'SmartContainers', 'FluidTypography'];
        for (const essential of essentialExports) {
          if (!content.includes(essential)) {
            validation.issues.push(`Missing essential export: ${essential}`);
          }
        }

        // Check for syntax errors (basic)
        if (content.includes('any;') && !content.includes('// @ts-ignore')) {
          validation.issues.push('Type definitions contain "any" types');
        }

      } catch (error) {
        validation.issues.push(`Could not read type definitions: ${error.message}`);
      }
    } else {
      validation.issues.push('Type definition file missing');
    }

    return validation;
  }

  /**
   * Validate package.json exports
   */
  private validatePackageExports(): PackageExportValidation {
    const packagePath = 'package.json';
    const validation: PackageExportValidation = {
      hasMain: false,
      hasModule: false,
      hasTypes: false,
      hasExports: false,
      issues: []
    };

    try {
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      validation.hasMain = !!packageJson.main;
      validation.hasModule = !!packageJson.module;
      validation.hasTypes = !!packageJson.types;
      validation.hasExports = !!packageJson.exports;

      // Validate main field points to existing file
      if (validation.hasMain && !existsSync(packageJson.main)) {
        validation.issues.push(`Main field points to non-existent file: ${packageJson.main}`);
      }

      // Validate module field points to existing file
      if (validation.hasModule && !existsSync(packageJson.module)) {
        validation.issues.push(`Module field points to non-existent file: ${packageJson.module}`);
      }

      // Validate types field points to existing file
      if (validation.hasTypes && !existsSync(packageJson.types)) {
        validation.issues.push(`Types field points to non-existent file: ${packageJson.types}`);
      }

      // Check for modern exports field
      if (!validation.hasExports) {
        validation.issues.push('Missing modern "exports" field for better module resolution');
      }

    } catch (error) {
      validation.issues.push(`Could not read package.json: ${error.message}`);
    }

    return validation;
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(result: BuildValidationResult): string[] {
    const recommendations: string[] = [];

    // Bundle size recommendations
    if (!result.bundleSize.withinTarget) {
      recommendations.push('Bundle size exceeds 50KB target - consider code splitting or tree shaking');
      recommendations.push('Review dependencies and remove unused code');
    }

    // Missing files
    const missingFiles = result.files.filter(f => !f.exists);
    if (missingFiles.length > 0) {
      recommendations.push('Run build process to generate missing distribution files');
    }

    // Source maps
    const filesWithoutSourceMaps = result.files.filter(f => f.exists && !f.hasSourceMap && f.file.endsWith('.js'));
    if (filesWithoutSourceMaps.length > 0) {
      recommendations.push('Enable source maps for better debugging experience');
    }

    // Type definitions
    if (!result.typeDefinitions.exists) {
      recommendations.push('Generate TypeScript definition files for better developer experience');
    }

    // Package exports
    if (!result.packageExports.hasExports) {
      recommendations.push('Add modern "exports" field to package.json for better module resolution');
    }

    return recommendations;
  }

  /**
   * Print validation report
   */
  private printValidationReport(result: BuildValidationResult): void {
    console.log('='.repeat(60));
    console.log('📦 BUILD VALIDATION REPORT');
    console.log('='.repeat(60));

    console.log(`\n🎯 Overall Result: ${result.overall}`);

    // File validation
    console.log('\n📁 Distribution Files:');
    result.files.forEach(file => {
      const status = file.exists ? '✅' : '❌';
      const size = file.exists ? `${(file.size / 1024).toFixed(1)}KB` : 'N/A';
      const gzipSize = file.exists ? `${(file.gzipSize / 1024).toFixed(1)}KB gzipped` : '';
      
      console.log(`   ${status} ${file.file} (${file.format}) - ${size} ${gzipSize}`);
    });

    // Bundle size validation
    console.log('\n📊 Bundle Size Analysis:');
    console.log(`   Target: ${(result.bundleSize.targetSize / 1024).toFixed(1)}KB`);
    console.log(`   Status: ${result.bundleSize.withinTarget ? '✅ Within target' : '❌ Exceeds target'}`);
    
    Object.entries(result.bundleSize.breakdown).forEach(([file, size]) => {
      const sizeKB = (size / 1024).toFixed(1);
      const status = size <= result.bundleSize.targetSize ? '✅' : '❌';
      console.log(`   ${status} ${file}: ${sizeKB}KB gzipped`);
    });

    // Type definitions
    console.log('\n📝 TypeScript Definitions:');
    console.log(`   Status: ${result.typeDefinitions.exists ? '✅ Generated' : '❌ Missing'}`);
    if (result.typeDefinitions.exports.length > 0) {
      console.log(`   Exports: ${result.typeDefinitions.exports.length} types exported`);
    }

    // Package exports
    console.log('\n📦 Package Configuration:');
    console.log(`   Main: ${result.packageExports.hasMain ? '✅' : '❌'}`);
    console.log(`   Module: ${result.packageExports.hasModule ? '✅' : '❌'}`);
    console.log(`   Types: ${result.packageExports.hasTypes ? '✅' : '❌'}`);
    console.log(`   Exports: ${result.packageExports.hasExports ? '✅' : '❌'}`);

    // Issues
    if (result.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    if (result.overall === 'PASS') {
      console.log('🎉 BUILD VALIDATION PASSED - Ready for distribution!');
    } else {
      console.log('⚠️  BUILD VALIDATION FAILED - Address issues before release');
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new BuildValidator();
  const result = validator.validateBuild();
  process.exit(result.overall === 'PASS' ? 0 : 1);
}

export { BuildValidator, BuildValidationResult };
