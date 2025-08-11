/**
 * proteus tokens command
 * Design system token utilities
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export interface TokensOptions {
  input: string;
  output: string;
  format: 'css' | 'scss' | 'js';
}

interface DesignTokens {
  colors?: Record<string, string>;
  typography?: {
    fontSizes?: Record<string, { min: number; max: number; }>;
    fontFamilies?: Record<string, string>;
    lineHeights?: Record<string, number>;
    fontWeights?: Record<string, number>;
  };
  spacing?: Record<string, string>;
  breakpoints?: Record<string, string>;
  shadows?: Record<string, string>;
  borderRadius?: Record<string, string>;
}

export async function tokensCommand(options: TokensOptions) {
  console.log(chalk.blue('🎨 Processing design tokens...'));

  const { input, output, format } = options;

  // Check if input file exists
  if (!existsSync(input)) {
    console.error(chalk.red(`❌ Input file not found: ${input}`));
    console.log(chalk.yellow('💡 Create a tokens.json file with your design system tokens'));
    process.exit(1);
  }

  try {
    // Read and parse tokens
    const tokensContent = readFileSync(input, 'utf-8');
    const tokens: DesignTokens = JSON.parse(tokensContent);

    // Generate output based on format
    let outputContent: string;
    
    switch (format) {
      case 'css':
        outputContent = generateCSS(tokens);
        break;
      case 'scss':
        outputContent = generateSCSS(tokens);
        break;
      case 'js':
        outputContent = generateJS(tokens);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Write output file
    writeFileSync(output, outputContent);
    console.log(chalk.green(`✅ Tokens generated: ${output}`));
    
    // Show summary
    const stats = getTokenStats(tokens);
    console.log(chalk.blue('\n📊 Token Summary:'));
    Object.entries(stats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} tokens`);
    });

  } catch (error) {
    console.error(chalk.red(`❌ Error processing tokens: ${error}`));
    process.exit(1);
  }
}

function generateCSS(tokens: DesignTokens): string {
  const lines: string[] = [
    '/* ProteusJS Design Tokens */',
    '/* Generated automatically - do not edit manually */',
    '',
    ':root {'
  ];

  // Colors
  if (tokens.colors) {
    lines.push('  /* Colors */');
    Object.entries(tokens.colors).forEach(([name, value]) => {
      // Convert to OKLCH if hex color
      const oklchValue = convertToOKLCH(value);
      lines.push(`  --color-${name}: ${oklchValue};`);
    });
    lines.push('');
  }

  // Typography
  if (tokens.typography) {
    lines.push('  /* Typography */');
    
    if (tokens.typography.fontFamilies) {
      Object.entries(tokens.typography.fontFamilies).forEach(([name, value]) => {
        lines.push(`  --font-family-${name}: ${value};`);
      });
    }

    if (tokens.typography.fontWeights) {
      Object.entries(tokens.typography.fontWeights).forEach(([name, value]) => {
        lines.push(`  --font-weight-${name}: ${value};`);
      });
    }

    if (tokens.typography.lineHeights) {
      Object.entries(tokens.typography.lineHeights).forEach(([name, value]) => {
        lines.push(`  --line-height-${name}: ${value};`);
      });
    }

    if (tokens.typography.fontSizes) {
      Object.entries(tokens.typography.fontSizes).forEach(([name, config]) => {
        const fluidValue = generateFluidType(config.min, config.max);
        lines.push(`  --font-size-${name}: ${fluidValue};`);
      });
    }
    lines.push('');
  }

  // Spacing
  if (tokens.spacing) {
    lines.push('  /* Spacing */');
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      lines.push(`  --spacing-${name}: ${value};`);
    });
    lines.push('');
  }

  // Breakpoints
  if (tokens.breakpoints) {
    lines.push('  /* Breakpoints */');
    Object.entries(tokens.breakpoints).forEach(([name, value]) => {
      lines.push(`  --breakpoint-${name}: ${value};`);
    });
    lines.push('');
  }

  // Shadows
  if (tokens.shadows) {
    lines.push('  /* Shadows */');
    Object.entries(tokens.shadows).forEach(([name, value]) => {
      lines.push(`  --shadow-${name}: ${value};`);
    });
    lines.push('');
  }

  // Border Radius
  if (tokens.borderRadius) {
    lines.push('  /* Border Radius */');
    Object.entries(tokens.borderRadius).forEach(([name, value]) => {
      lines.push(`  --border-radius-${name}: ${value};`);
    });
    lines.push('');
  }

  lines.push('}');
  lines.push('');

  // Add utility classes
  lines.push('/* Utility Classes */');
  
  if (tokens.typography?.fontSizes) {
    Object.keys(tokens.typography.fontSizes).forEach(name => {
      lines.push(`.text-${name} { font-size: var(--font-size-${name}); }`);
    });
  }

  if (tokens.colors) {
    Object.keys(tokens.colors).forEach(name => {
      lines.push(`.text-${name} { color: var(--color-${name}); }`);
      lines.push(`.bg-${name} { background-color: var(--color-${name}); }`);
    });
  }

  return lines.join('\n');
}

function generateSCSS(tokens: DesignTokens): string {
  const lines: string[] = [
    '// ProteusJS Design Tokens',
    '// Generated automatically - do not edit manually',
    ''
  ];

  // Colors as SCSS variables
  if (tokens.colors) {
    lines.push('// Colors');
    Object.entries(tokens.colors).forEach(([name, value]) => {
      const oklchValue = convertToOKLCH(value);
      lines.push(`$color-${name}: ${oklchValue};`);
    });
    lines.push('');
  }

  // Typography
  if (tokens.typography) {
    lines.push('// Typography');
    
    if (tokens.typography.fontFamilies) {
      Object.entries(tokens.typography.fontFamilies).forEach(([name, value]) => {
        lines.push(`$font-family-${name}: ${value};`);
      });
    }

    if (tokens.typography.fontSizes) {
      Object.entries(tokens.typography.fontSizes).forEach(([name, config]) => {
        const fluidValue = generateFluidType(config.min, config.max);
        lines.push(`$font-size-${name}: ${fluidValue};`);
      });
    }
    lines.push('');
  }

  // Add mixins
  lines.push('// Mixins');
  lines.push('@mixin fluid-type($min, $max, $min-vw: 320px, $max-vw: 1200px) {');
  lines.push('  font-size: clamp(#{$min}, #{$min} + (#{$max} - #{$min}) * ((100vw - #{$min-vw}) / (#{$max-vw} - #{$min-vw})), #{$max});');
  lines.push('}');

  return lines.join('\n');
}

function generateJS(tokens: DesignTokens): string {
  const jsTokens = {
    colors: tokens.colors || {},
    typography: tokens.typography || {},
    spacing: tokens.spacing || {},
    breakpoints: tokens.breakpoints || {},
    shadows: tokens.shadows || {},
    borderRadius: tokens.borderRadius || {}
  };

  return `// ProteusJS Design Tokens
// Generated automatically - do not edit manually

export const tokens = ${JSON.stringify(jsTokens, null, 2)};

export default tokens;
`;
}

function convertToOKLCH(color: string): string {
  // Simplified OKLCH conversion - in practice, you'd use a proper color library
  if (color.startsWith('#')) {
    // This is a placeholder - real implementation would convert hex to OKLCH
    return color; // For now, return as-is
  }
  return color;
}

function generateFluidType(min: number, max: number, minVw = 320, maxVw = 1200): string {
  const minRem = min / 16;
  const maxRem = max / 16;
  const slope = (max - min) / (maxVw - minVw);
  const yAxisIntersection = -minVw * slope + min;
  const yAxisIntersectionRem = yAxisIntersection / 16;
  const vwUnit = slope * 100;

  return `clamp(${minRem}rem, ${yAxisIntersectionRem.toFixed(4)}rem + ${vwUnit.toFixed(4)}vw, ${maxRem}rem)`;
}

function getTokenStats(tokens: DesignTokens): Record<string, number> {
  const stats: Record<string, number> = {};

  if (tokens.colors) stats.colors = Object.keys(tokens.colors).length;
  if (tokens.typography?.fontSizes) stats.fontSizes = Object.keys(tokens.typography.fontSizes).length;
  if (tokens.typography?.fontFamilies) stats.fontFamilies = Object.keys(tokens.typography.fontFamilies).length;
  if (tokens.spacing) stats.spacing = Object.keys(tokens.spacing).length;
  if (tokens.breakpoints) stats.breakpoints = Object.keys(tokens.breakpoints).length;
  if (tokens.shadows) stats.shadows = Object.keys(tokens.shadows).length;
  if (tokens.borderRadius) stats.borderRadius = Object.keys(tokens.borderRadius).length;

  return stats;
}
