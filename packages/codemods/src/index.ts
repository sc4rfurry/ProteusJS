/**
 * @sc4rfurryx/proteusjs-codemods
 * Automated migration tools for ProteusJS v1→v2 upgrade
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

import { Transform, JSCodeshift, Collection } from 'jscodeshift';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

// Migration configuration
export interface MigrationConfig {
  sourceDir: string;
  targetDir?: string;
  dryRun?: boolean;
  verbose?: boolean;
  transforms?: TransformName[];
  exclude?: string[];
  backup?: boolean;
}

export interface MigrationResult {
  file: string;
  transformed: boolean;
  changes: string[];
  errors: string[];
}

// Import transform types from transforms/index
import type { TransformName } from './transforms/index.js';
import { AVAILABLE_TRANSFORMS } from './transforms/index.js';

/**
 * Main migration runner
 */
export class MigrationRunner {
  private config: Required<MigrationConfig>;
  private results: MigrationResult[] = [];

  constructor(config: MigrationConfig) {
    this.config = {
      targetDir: config.sourceDir,
      dryRun: false,
      verbose: false,
      transforms: [...AVAILABLE_TRANSFORMS],
      exclude: ['node_modules/**', 'dist/**', '**/*.d.ts'],
      backup: true,
      ...config
    };
  }

  async run(): Promise<MigrationResult[]> {
    console.log(chalk.blue('🚀 ProteusJS v1→v2 Migration Tool'));
    console.log(chalk.gray('====================================='));

    const files = await this.findFiles();
    console.log(chalk.cyan(`📁 Found ${files.length} files to process`));

    if (this.config.dryRun) {
      console.log(chalk.yellow('🔍 Running in dry-run mode (no files will be modified)'));
    }

    for (const file of files) {
      await this.processFile(file);
    }

    this.printSummary();
    return this.results;
  }

  private async findFiles(): Promise<string[]> {
    const patterns = [
      `${this.config.sourceDir}/**/*.js`,
      `${this.config.sourceDir}/**/*.jsx`,
      `${this.config.sourceDir}/**/*.ts`,
      `${this.config.sourceDir}/**/*.tsx`
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        ignore: this.config.exclude
      });
      files.push(...matches);
    }

    return [...new Set(files)];
  }

  private async processFile(filePath: string): Promise<void> {
    const result: MigrationResult = {
      file: filePath,
      transformed: false,
      changes: [],
      errors: []
    };

    try {
      const source = readFileSync(filePath, 'utf8');
      let transformedSource = source;
      let hasChanges = false;

      // Apply each transform
      for (const transformName of this.config.transforms) {
        const transform = await this.getTransform(transformName);
        if (transform) {
          const transformResult = transform(
            { path: filePath, source: transformedSource },
            { jscodeshift: require('jscodeshift') },
            {}
          );

          if (transformResult && transformResult !== transformedSource) {
            transformedSource = transformResult;
            hasChanges = true;
            result.changes.push(`Applied ${transformName} transform`);
          }
        }
      }

      if (hasChanges) {
        result.transformed = true;

        if (!this.config.dryRun) {
          // Create backup if requested
          if (this.config.backup) {
            writeFileSync(`${filePath}.backup`, source);
          }

          // Write transformed file
          writeFileSync(filePath, transformedSource);
        }

        if (this.config.verbose) {
          console.log(chalk.green(`✅ Transformed: ${filePath}`));
          result.changes.forEach(change => {
            console.log(chalk.gray(`   • ${change}`));
          });
        }
      } else if (this.config.verbose) {
        console.log(chalk.gray(`⏭️  No changes: ${filePath}`));
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      console.log(chalk.red(`❌ Error processing ${filePath}: ${result.errors[0]}`));
    }

    this.results.push(result);
  }

  private async getTransform(name: TransformName): Promise<Transform | null> {
    try {
      const transformPath = join(__dirname, 'transforms', `${name}.js`);
      if (existsSync(transformPath)) {
        const { default: transform } = await import(transformPath);
        return transform;
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not load transform: ${name}`));
    }
    return null;
  }

  private printSummary(): void {
    const transformed = this.results.filter(r => r.transformed).length;
    const errors = this.results.filter(r => r.errors.length > 0).length;
    const total = this.results.length;

    console.log(chalk.blue('\n📊 Migration Summary'));
    console.log(chalk.gray('=================='));
    console.log(`📁 Total files processed: ${total}`);
    console.log(`✅ Files transformed: ${chalk.green(transformed)}`);
    console.log(`❌ Files with errors: ${chalk.red(errors)}`);
    console.log(`⏭️  Files unchanged: ${chalk.gray(total - transformed - errors)}`);

    if (transformed > 0) {
      console.log(chalk.green('\n🎉 Migration completed successfully!'));
      console.log(chalk.cyan('📚 Next steps:'));
      console.log(chalk.gray('   1. Review the changes in your code'));
      console.log(chalk.gray('   2. Update your package.json dependencies'));
      console.log(chalk.gray('   3. Run your tests to ensure everything works'));
      console.log(chalk.gray('   4. Check the migration guide for manual steps'));
    }

    if (errors > 0) {
      console.log(chalk.red('\n⚠️  Some files had errors during migration'));
      console.log(chalk.gray('Please review the error messages above and fix them manually'));
    }
  }
}

/**
 * Run migration with configuration
 */
export async function migrate(config: MigrationConfig): Promise<MigrationResult[]> {
  const runner = new MigrationRunner(config);
  return runner.run();
}

/**
 * Check if a project uses ProteusJS v1.x
 */
export function detectProteusJSUsage(projectPath: string): {
  hasProteusJS: boolean;
  version: string | null;
  usagePatterns: string[];
} {
  const packageJsonPath = join(projectPath, 'package.json');
  const result = {
    hasProteusJS: false,
    version: null as string | null,
    usagePatterns: [] as string[]
  };

  // Check package.json
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps['@sc4rfurryx/proteusjs']) {
        result.hasProteusJS = true;
        result.version = deps['@sc4rfurryx/proteusjs'];
      }
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  // Check for import patterns in source files
  try {
    const sourceFiles = glob.sync(`${projectPath}/**/*.{js,jsx,ts,tsx}`, {
      ignore: ['node_modules/**', 'dist/**']
    });

    const patterns = [
      /import.*from.*['"]@sc4rfurryx\/proteusjs['"]/,
      /require\(['"]@sc4rfurryx\/proteusjs['"]\)/,
      /new ProteusJS\(/,
      /proteus\./
    ];

    for (const file of sourceFiles) {
      try {
        const content = readFileSync(file, 'utf8');
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            result.hasProteusJS = true;
            result.usagePatterns.push(file);
            break;
          }
        }
      } catch (error) {
        // Ignore file read errors
      }
    }
  } catch (error) {
    // Ignore glob errors
  }

  return result;
}

/**
 * Generate migration report
 */
export function generateMigrationReport(results: MigrationResult[]): string {
  const report = [];
  
  report.push('# ProteusJS v1→v2 Migration Report');
  report.push('');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');

  const stats = {
    total: results.length,
    transformed: results.filter(r => r.transformed).length,
    errors: results.filter(r => r.errors.length > 0).length
  };

  report.push('## Summary');
  report.push('');
  report.push(`- Total files processed: ${stats.total}`);
  report.push(`- Files transformed: ${stats.transformed}`);
  report.push(`- Files with errors: ${stats.errors}`);
  report.push(`- Success rate: ${((stats.transformed / stats.total) * 100).toFixed(1)}%`);
  report.push('');

  if (stats.transformed > 0) {
    report.push('## Transformed Files');
    report.push('');
    results.filter(r => r.transformed).forEach(result => {
      report.push(`### ${result.file}`);
      result.changes.forEach(change => {
        report.push(`- ${change}`);
      });
      report.push('');
    });
  }

  if (stats.errors > 0) {
    report.push('## Files with Errors');
    report.push('');
    results.filter(r => r.errors.length > 0).forEach(result => {
      report.push(`### ${result.file}`);
      result.errors.forEach(error => {
        report.push(`- ❌ ${error}`);
      });
      report.push('');
    });
  }

  report.push('## Next Steps');
  report.push('');
  report.push('1. **Review Changes**: Carefully review all transformed files');
  report.push('2. **Update Dependencies**: Update package.json to use ProteusJS v2.0.0');
  report.push('3. **Run Tests**: Execute your test suite to verify functionality');
  report.push('4. **Manual Migration**: Some changes may require manual intervention');
  report.push('5. **Documentation**: Refer to the migration guide for detailed instructions');
  report.push('');

  return report.join('\n');
}

// Export types and utilities
export * from './transforms/index.js';
