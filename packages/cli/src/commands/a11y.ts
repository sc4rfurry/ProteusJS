/**
 * proteus a11y command
 * Run accessibility audits and generate reports
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { glob } from 'glob';

export interface A11yOptions {
  fix?: boolean;
  format: 'console' | 'json' | 'html';
  rules?: string;
}

interface A11yIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

const A11Y_RULES = {
  'missing-alt': {
    pattern: /<img(?![^>]*alt=)/gi,
    message: 'Image missing alt attribute',
    severity: 'error' as const,
    fix: 'Add alt="" for decorative images or descriptive alt text'
  },
  'missing-lang': {
    pattern: /<html(?![^>]*lang=)/gi,
    message: 'HTML element missing lang attribute',
    severity: 'error' as const,
    fix: 'Add lang="en" or appropriate language code'
  },
  'missing-title': {
    pattern: /<title>\s*<\/title>|<head>(?![\s\S]*<title>)/gi,
    message: 'Page missing or empty title',
    severity: 'error' as const,
    fix: 'Add descriptive <title> element'
  },
  'missing-heading': {
    pattern: /^(?![\s\S]*<h[1-6])/gi,
    message: 'Page missing heading structure',
    severity: 'warning' as const,
    fix: 'Add proper heading hierarchy starting with h1'
  },
  'missing-skip-link': {
    pattern: /^(?![\s\S]*href="#main"|[\s\S]*href="#content")/gi,
    message: 'Page missing skip navigation link',
    severity: 'warning' as const,
    fix: 'Add skip link: <a href="#main">Skip to main content</a>'
  },
  'missing-focus-visible': {
    pattern: /:focus(?!\-visible)/gi,
    message: 'Use :focus-visible instead of :focus for better UX',
    severity: 'info' as const,
    fix: 'Replace :focus with :focus-visible'
  }
};

export async function a11yCommand(options: A11yOptions) {
  console.log(chalk.blue('♿ Running ProteusJS accessibility audit...'));

  const { fix = false, format = 'console', rules } = options;
  const selectedRules = rules ? rules.split(',') : Object.keys(A11Y_RULES);

  // Find HTML, CSS, and JS files
  const htmlFiles = await glob('**/*.html', { ignore: ['node_modules/**', 'dist/**'] });
  const cssFiles = await glob('**/*.css', { ignore: ['node_modules/**', 'dist/**'] });
  const jsFiles = await glob('**/*.{js,ts,jsx,tsx}', { ignore: ['node_modules/**', 'dist/**'] });

  const allIssues: A11yIssue[] = [];

  // Audit HTML files
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (const ruleName of selectedRules) {
      const rule = A11Y_RULES[ruleName as keyof typeof A11Y_RULES];
      if (!rule) continue;

      const matches = content.match(rule.pattern);
      if (matches) {
        for (const match of matches) {
          const lineIndex = content.indexOf(match);
          const lineNumber = content.substring(0, lineIndex).split('\n').length;
          const columnNumber = lineIndex - content.lastIndexOf('\n', lineIndex - 1);

          allIssues.push({
            file,
            line: lineNumber,
            column: columnNumber,
            rule: ruleName,
            severity: rule.severity,
            message: rule.message,
            fix: rule.fix
          });
        }
      }
    }
  }

  // Generate report based on format
  switch (format) {
    case 'console':
      outputConsoleReport(allIssues);
      break;
    case 'json':
      outputJsonReport(allIssues);
      break;
    case 'html':
      outputHtmlReport(allIssues);
      break;
  }

  // Apply fixes if requested
  if (fix && allIssues.length > 0) {
    console.log(chalk.yellow('\n🔧 Applying automatic fixes...'));
    applyFixes(allIssues);
  }

  // Exit with error code if issues found
  const errorCount = allIssues.filter(issue => issue.severity === 'error').length;
  if (errorCount > 0) {
    console.log(chalk.red(`\n❌ Found ${errorCount} accessibility errors`));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ No critical accessibility issues found'));
  }
}

function outputConsoleReport(issues: A11yIssue[]) {
  if (issues.length === 0) {
    console.log(chalk.green('✅ No accessibility issues found!'));
    return;
  }

  console.log(chalk.yellow(`\n📋 Found ${issues.length} accessibility issues:\n`));

  const groupedByFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, A11yIssue[]>);

  for (const [file, fileIssues] of Object.entries(groupedByFile)) {
    console.log(chalk.bold.underline(`\n${file}:`));
    
    for (const issue of fileIssues) {
      const severityColor = issue.severity === 'error' ? chalk.red : 
                           issue.severity === 'warning' ? chalk.yellow : chalk.blue;
      
      console.log(`  ${severityColor(issue.severity.toUpperCase())} ${issue.line}:${issue.column} ${issue.message}`);
      if (issue.fix) {
        console.log(`    ${chalk.gray('💡 Fix:')} ${issue.fix}`);
      }
    }
  }
}

function outputJsonReport(issues: A11yIssue[]) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length
    },
    issues
  };

  const outputFile = 'a11y-report.json';
  writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(chalk.green(`📄 JSON report saved to ${outputFile}`));
}

function outputHtmlReport(issues: A11yIssue[]) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProteusJS Accessibility Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    .summary { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
    .issue { margin: 1rem 0; padding: 1rem; border-left: 4px solid #ccc; }
    .error { border-color: #e74c3c; background: #fdf2f2; }
    .warning { border-color: #f39c12; background: #fef9e7; }
    .info { border-color: #3498db; background: #ebf3fd; }
    .file { font-weight: bold; color: #2c3e50; }
    .location { color: #7f8c8d; font-size: 0.9em; }
    .fix { color: #27ae60; font-style: italic; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>🌊 ProteusJS Accessibility Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Issues: ${issues.length}</p>
    <p>Errors: ${issues.filter(i => i.severity === 'error').length}</p>
    <p>Warnings: ${issues.filter(i => i.severity === 'warning').length}</p>
    <p>Info: ${issues.filter(i => i.severity === 'info').length}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  ${issues.map(issue => `
    <div class="issue ${issue.severity}">
      <div class="file">${issue.file}</div>
      <div class="location">Line ${issue.line}, Column ${issue.column}</div>
      <div class="message">${issue.message}</div>
      ${issue.fix ? `<div class="fix">💡 ${issue.fix}</div>` : ''}
    </div>
  `).join('')}
</body>
</html>`;

  const outputFile = 'a11y-report.html';
  writeFileSync(outputFile, html);
  console.log(chalk.green(`📄 HTML report saved to ${outputFile}`));
}

function applyFixes(issues: A11yIssue[]) {
  // This is a simplified implementation - in practice, you'd want more sophisticated AST-based fixes
  console.log(chalk.yellow('⚠️  Automatic fixes are limited. Manual review recommended.'));
  
  const fixableIssues = issues.filter(issue => issue.fix && issue.rule === 'missing-focus-visible');
  
  for (const issue of fixableIssues) {
    try {
      const content = readFileSync(issue.file, 'utf-8');
      const fixedContent = content.replace(/:focus(?!\-visible)/g, ':focus-visible');
      writeFileSync(issue.file, fixedContent);
      console.log(chalk.green(`✅ Fixed ${issue.rule} in ${issue.file}`));
    } catch (error) {
      console.log(chalk.red(`❌ Failed to fix ${issue.file}: ${error}`));
    }
  }
}
