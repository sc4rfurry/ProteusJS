#!/usr/bin/env node

/**
 * ProteusJS Migration CLI Tool
 * 
 * Usage:
 *   npx @sc4rfurryx/proteusjs-codemods migrate ./src
 *   proteusjs-migrate ./src --dry-run
 *   proteusjs-migrate ./src --transforms=import-updates,api-changes
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { migrate, detectProteusJSUsage, generateMigrationReport, AVAILABLE_TRANSFORMS } from '../dist/index.js';

const program = new Command();

program
  .name('proteusjs-migrate')
  .description('Automated migration tool for upgrading ProteusJS v1.x to v2.0.0')
  .version('2.0.0');

program
  .command('migrate')
  .description('Migrate ProteusJS code from v1.x to v2.0.0')
  .argument('<source>', 'Source directory to migrate')
  .option('-t, --target <dir>', 'Target directory (defaults to source)')
  .option('-d, --dry-run', 'Preview changes without modifying files')
  .option('-v, --verbose', 'Show detailed output')
  .option('--transforms <list>', 'Comma-separated list of transforms to apply')
  .option('--exclude <patterns>', 'Comma-separated list of glob patterns to exclude')
  .option('--no-backup', 'Skip creating backup files')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (source, options) => {
    try {
      await runMigration(source, options);
    } catch (error) {
      console.error(chalk.red('❌ Migration failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('detect')
  .description('Detect ProteusJS usage in a project')
  .argument('<project>', 'Project directory to analyze')
  .action(async (project) => {
    try {
      await runDetection(project);
    } catch (error) {
      console.error(chalk.red('❌ Detection failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize migration configuration')
  .argument('[project]', 'Project directory (defaults to current directory)')
  .action(async (project = '.') => {
    try {
      await runInit(project);
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), error.message);
      process.exit(1);
    }
  });

async function runMigration(source, options) {
  console.log(chalk.blue('🚀 ProteusJS v1→v2 Migration Tool'));
  console.log(chalk.gray('=====================================\n'));

  // Validate source directory
  if (!existsSync(source)) {
    throw new Error(`Source directory does not exist: ${source}`);
  }

  // Detect ProteusJS usage
  console.log(chalk.cyan('🔍 Detecting ProteusJS usage...'));
  const detection = detectProteusJSUsage(source);
  
  if (!detection.hasProteusJS) {
    console.log(chalk.yellow('⚠️  No ProteusJS usage detected in the project'));
    console.log(chalk.gray('Make sure you\'re running this in the correct directory'));
    return;
  }

  console.log(chalk.green('✅ ProteusJS usage detected'));
  if (detection.version) {
    console.log(chalk.gray(`   Current version: ${detection.version}`));
  }
  console.log(chalk.gray(`   Usage found in ${detection.usagePatterns.length} files`));

  // Parse transforms
  const transforms = options.transforms 
    ? options.transforms.split(',').map(t => t.trim())
    : [...AVAILABLE_TRANSFORMS];

  // Validate transforms
  const invalidTransforms = transforms.filter(t => !AVAILABLE_TRANSFORMS.includes(t));
  if (invalidTransforms.length > 0) {
    throw new Error(`Invalid transforms: ${invalidTransforms.join(', ')}`);
  }

  // Parse exclude patterns
  const exclude = options.exclude 
    ? options.exclude.split(',').map(p => p.trim())
    : ['node_modules/**', 'dist/**', '**/*.d.ts'];

  // Show configuration
  console.log(chalk.cyan('\n📋 Migration Configuration:'));
  console.log(chalk.gray(`   Source: ${source}`));
  console.log(chalk.gray(`   Target: ${options.target || source}`));
  console.log(chalk.gray(`   Transforms: ${transforms.join(', ')}`));
  console.log(chalk.gray(`   Dry run: ${options.dryRun ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`   Backup: ${options.backup !== false ? 'Yes' : 'No'}`));

  // Confirmation prompt
  if (!options.yes && !options.dryRun) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'This will modify your source files. Continue?',
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Migration cancelled'));
      return;
    }
  }

  // Run migration
  console.log(chalk.cyan('\n🔄 Running migration...'));
  
  const config = {
    sourceDir: source,
    targetDir: options.target,
    dryRun: options.dryRun,
    verbose: options.verbose,
    transforms,
    exclude,
    backup: options.backup !== false
  };

  const results = await migrate(config);

  // Generate report
  if (options.verbose || options.dryRun) {
    const report = generateMigrationReport(results);
    console.log(chalk.cyan('\n📄 Migration Report:'));
    console.log(chalk.gray('==================='));
    console.log(report);
  }

  // Next steps
  if (!options.dryRun && results.some(r => r.transformed)) {
    console.log(chalk.green('\n🎉 Migration completed!'));
    console.log(chalk.cyan('\n📚 Next Steps:'));
    console.log(chalk.gray('1. Update your package.json dependencies:'));
    console.log(chalk.white('   npm install @sc4rfurryx/proteusjs@2.0.0'));
    console.log(chalk.white('   npm install @sc4rfurryx/proteusjs-router@2.0.0'));
    console.log(chalk.white('   npm install @sc4rfurryx/proteusjs-transitions@2.0.0'));
    console.log(chalk.gray('2. Review the changes and test your application'));
    console.log(chalk.gray('3. Check the migration guide for manual steps'));
    console.log(chalk.gray('4. Remove backup files when satisfied with the migration'));
  }
}

async function runDetection(project) {
  console.log(chalk.blue('🔍 ProteusJS Usage Detection'));
  console.log(chalk.gray('============================\n'));

  if (!existsSync(project)) {
    throw new Error(`Project directory does not exist: ${project}`);
  }

  const detection = detectProteusJSUsage(project);

  if (detection.hasProteusJS) {
    console.log(chalk.green('✅ ProteusJS usage detected'));
    
    if (detection.version) {
      console.log(chalk.cyan(`📦 Version: ${detection.version}`));
      
      // Check if it's v1.x
      if (detection.version.startsWith('1.') || detection.version.startsWith('^1.') || detection.version.startsWith('~1.')) {
        console.log(chalk.yellow('⚠️  This project uses ProteusJS v1.x and can be migrated to v2.0.0'));
      } else if (detection.version.startsWith('2.') || detection.version.startsWith('^2.') || detection.version.startsWith('~2.')) {
        console.log(chalk.green('✅ This project already uses ProteusJS v2.x'));
      }
    }

    if (detection.usagePatterns.length > 0) {
      console.log(chalk.cyan(`📁 Usage found in ${detection.usagePatterns.length} files:`));
      detection.usagePatterns.slice(0, 10).forEach(file => {
        console.log(chalk.gray(`   • ${file}`));
      });
      
      if (detection.usagePatterns.length > 10) {
        console.log(chalk.gray(`   ... and ${detection.usagePatterns.length - 10} more files`));
      }
    }

    console.log(chalk.cyan('\n🚀 To migrate this project to v2.0.0, run:'));
    console.log(chalk.white(`   proteusjs-migrate migrate ${project}`));
    
  } else {
    console.log(chalk.yellow('⚠️  No ProteusJS usage detected'));
    console.log(chalk.gray('This project doesn\'t appear to use ProteusJS'));
  }
}

async function runInit(project) {
  console.log(chalk.blue('🔧 Initialize ProteusJS Migration'));
  console.log(chalk.gray('==================================\n'));

  const configPath = join(project, '.proteusjs-migration.json');
  
  if (existsSync(configPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Migration config already exists. Overwrite?',
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Initialization cancelled'));
      return;
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'sourceDir',
      message: 'Source directory to migrate:',
      default: './src'
    },
    {
      type: 'checkbox',
      name: 'transforms',
      message: 'Select transforms to apply:',
      choices: AVAILABLE_TRANSFORMS.map(t => ({ name: t, value: t, checked: true }))
    },
    {
      type: 'input',
      name: 'exclude',
      message: 'Exclude patterns (comma-separated):',
      default: 'node_modules/**,dist/**,**/*.d.ts'
    },
    {
      type: 'confirm',
      name: 'backup',
      message: 'Create backup files?',
      default: true
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Enable verbose output?',
      default: false
    }
  ]);

  const config = {
    sourceDir: answers.sourceDir,
    transforms: answers.transforms,
    exclude: answers.exclude.split(',').map(p => p.trim()),
    backup: answers.backup,
    verbose: answers.verbose
  };

  // Write config file
  const fs = await import('fs/promises');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  console.log(chalk.green(`✅ Migration config created: ${configPath}`));
  console.log(chalk.cyan('\n🚀 To run the migration:'));
  console.log(chalk.white(`   proteusjs-migrate migrate ${answers.sourceDir}`));
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 Uncaught exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('💥 Unhandled rejection:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();
