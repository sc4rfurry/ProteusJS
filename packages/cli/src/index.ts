#!/usr/bin/env node

/**
 * @sc4rfurryx/proteusjs-cli
 * CLI tools for ProteusJS development
 * 
 * @version 1.1.0
 * @author sc4rfurry
 * @license MIT
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { a11yCommand } from './commands/a11y.js';
import { tokensCommand } from './commands/tokens.js';

const program = new Command();

program
  .name('proteus')
  .description('CLI tools for ProteusJS development')
  .version('1.1.0');

// proteus init
program
  .command('init')
  .description('Scaffold config, tokens, and example recipes')
  .option('-t, --template <type>', 'Template type (vanilla, react, vue, svelte)', 'vanilla')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(initCommand);

// proteus a11y
program
  .command('a11y')
  .description('Run accessibility audits')
  .option('--fix', 'Write fix suggestions to files')
  .option('--format <type>', 'Output format (console, json, html)', 'console')
  .option('--rules <rules>', 'Comma-separated list of rules to run')
  .action(a11yCommand);

// proteus tokens
program
  .command('tokens')
  .description('Token and design system utilities')
  .command('build')
  .description('Emit CSS variables (OKLCH), fluid type rules')
  .option('--input <file>', 'Input tokens file', 'tokens.json')
  .option('--output <file>', 'Output CSS file', 'tokens.css')
  .option('--format <type>', 'Output format (css, scss, js)', 'css')
  .action(tokensCommand);

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// Parse arguments
program.parse();
