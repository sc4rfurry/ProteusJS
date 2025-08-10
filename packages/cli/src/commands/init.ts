/**
 * proteus init command
 * Scaffold ProteusJS configuration and examples
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

export interface InitOptions {
  template: string;
  dir: string;
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.blue('🌊 Initializing ProteusJS project...'));

  const { template, dir } = options;
  const targetDir = join(process.cwd(), dir);

  // Create directory if it doesn't exist
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // Ask for additional configuration
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'my-proteus-app'
    },
    {
      type: 'checkbox',
      name: 'modules',
      message: 'Which ProteusJS modules do you want to use?',
      choices: [
        { name: 'Transitions (View Transitions API)', value: 'transitions', checked: true },
        { name: 'Container Queries', value: 'container', checked: true },
        { name: 'Fluid Typography', value: 'typography', checked: true },
        { name: 'Scroll Animations', value: 'scroll' },
        { name: 'Anchor Positioning', value: 'anchor' },
        { name: 'Popover/Dialog', value: 'popover' },
        { name: 'A11y Primitives', value: 'a11y-primitives' },
        { name: 'Performance Tools', value: 'perf' }
      ]
    },
    {
      type: 'confirm',
      name: 'includeExamples',
      message: 'Include example components?',
      default: true
    }
  ]);

  // Generate configuration
  const config = {
    name: answers.projectName,
    version: '1.0.0',
    proteus: {
      modules: answers.modules,
      theme: {
        colors: {
          primary: '#0066cc',
          secondary: '#6366f1',
          accent: '#f59e0b'
        },
        typography: {
          scale: 1.25,
          baseSize: '1rem'
        }
      }
    }
  };

  // Write configuration file
  writeFileSync(
    join(targetDir, 'proteus.config.json'),
    JSON.stringify(config, null, 2)
  );

  // Generate basic HTML template
  const htmlTemplate = generateHTMLTemplate(template, answers.modules);
  writeFileSync(join(targetDir, 'index.html'), htmlTemplate);

  // Generate CSS tokens
  const cssTokens = generateCSSTokens(config.proteus.theme);
  writeFileSync(join(targetDir, 'tokens.css'), cssTokens);

  console.log(chalk.green('✅ ProteusJS project initialized successfully!'));
  console.log(chalk.yellow('\nNext steps:'));
  console.log(chalk.gray('1. Install ProteusJS: npm install @sc4rfurryx/proteusjs'));
  console.log(chalk.gray('2. Open index.html in your browser'));
  console.log(chalk.gray('3. Start building with ProteusJS!'));
}

function generateHTMLTemplate(template: string, modules: string[]): string {
  const moduleImports = modules.map(module => 
    `import { ${getModuleExports(module)} } from '@sc4rfurryx/proteusjs/${module}';`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProteusJS App</title>
    <link rel="stylesheet" href="tokens.css">
    <style>
        body {
            font-family: system-ui, sans-serif;
            margin: 0;
            padding: 2rem;
            background: var(--color-background);
            color: var(--color-text);
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to ProteusJS!</h1>
        <p>Your project is ready. Start building amazing web experiences.</p>
        
        <div class="demo-grid">
            <!-- Demo components will be generated based on selected modules -->
        </div>
    </div>

    <script type="module">
        ${moduleImports}
        
        // Initialize ProteusJS modules
        console.log('🌊 ProteusJS initialized');
    </script>
</body>
</html>`;
}

function generateCSSTokens(theme: any): string {
  return `:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  
  /* Typography */
  --font-size-base: ${theme.typography.baseSize};
  --font-scale: ${theme.typography.scale};
  
  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1a1a1a;
    --color-text: #ffffff;
  }
}`;
}

function getModuleExports(module: string): string {
  const exports: Record<string, string> = {
    'transitions': 'transition, navigate',
    'container': 'defineContainer',
    'typography': 'fluidType',
    'scroll': 'scrollAnimate',
    'anchor': 'tether',
    'popover': 'attach',
    'a11y-primitives': 'dialog, tooltip, listbox',
    'perf': 'boost'
  };
  
  return exports[module] || 'default';
}
