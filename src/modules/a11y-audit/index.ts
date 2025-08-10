/**
 * @sc4rfurryx/proteusjs/a11y-audit
 * Accessibility audits for development (dev-only)
 * 
 * @version 1.1.0
 * @author sc4rfurry
 * @license MIT
 */

export interface AuditOptions {
  rules?: string[];
  format?: 'console' | 'json';
  openInBrowser?: boolean;
}

export interface AuditViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  nodes: number;
  help: string;
  fix: string;
  elements?: Element[];
}

export interface AuditReport {
  violations: AuditViolation[];
  passes: number;
  incomplete: number;
  timestamp: number;
  url: string;
}

/**
 * Run accessibility audits with actionable output
 * DEV-ONLY: This module should be tree-shaken in production
 */
export async function audit(
  target: Document | Element = document,
  options: AuditOptions = {}
): Promise<AuditReport> {
  // Ensure this only runs in development
  if (process.env['NODE_ENV'] === 'production') {
    console.warn('a11y-audit should not be used in production');
    return {
      violations: [],
      passes: 0,
      incomplete: 0,
      timestamp: Date.now(),
      url: window.location.href
    };
  }

  const {
    rules = ['color-contrast', 'heading-order', 'image-alt', 'label', 'link-name', 'button-name'],
    format = 'console',
    openInBrowser = false
  } = options;

  const violations: AuditViolation[] = [];
  let passes = 0;
  let incomplete = 0;

  // Basic accessibility checks
  const checks = {
    'color-contrast': checkColorContrast,
    'heading-order': checkHeadingOrder,
    'image-alt': checkImageAlt,
    'label': checkFormLabels,
    'link-name': checkLinkNames,
    'button-name': checkButtonNames,
    'focus-visible': checkFocusVisible,
    'aria-labels': checkAriaLabels,
    'landmark-roles': checkLandmarkRoles,
    'skip-links': checkSkipLinks
  };

  // Run selected checks
  for (const ruleId of rules) {
    if (checks[ruleId as keyof typeof checks]) {
      try {
        const result = await checks[ruleId as keyof typeof checks](target);
        if (result.violations.length > 0) {
          violations.push(...result.violations);
        } else {
          passes++;
        }
      } catch (error) {
        incomplete++;
        console.warn(`Failed to run accessibility check: ${ruleId}`, error);
      }
    }
  }

  const report: AuditReport = {
    violations,
    passes,
    incomplete,
    timestamp: Date.now(),
    url: window.location.href
  };

  // Output results
  if (format === 'console') {
    outputToConsole(report);
  }

  if (openInBrowser) {
    openReportInBrowser(report);
  }

  return report;
}

// Individual check functions
async function checkColorContrast(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];
  const elements = target.querySelectorAll('*');

  elements.forEach(element => {
    const style = getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    // Simple contrast check (would need more sophisticated implementation)
    if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const contrast = calculateContrast(color, backgroundColor);
      if (contrast < 4.5) {
        violations.push({
          id: 'color-contrast',
          impact: 'serious',
          nodes: 1,
          help: 'Elements must have sufficient color contrast',
          fix: `Increase contrast ratio to at least 4.5:1. Current: ${contrast.toFixed(2)}:1`,
          elements: [element]
        });
      }
    }
  });

  return { violations };
}

async function checkHeadingOrder(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];
  const headings = target.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > lastLevel + 1) {
      violations.push({
        id: 'heading-order',
        impact: 'moderate',
        nodes: 1,
        help: 'Heading levels should only increase by one',
        fix: `Change ${heading.tagName} to H${lastLevel + 1} or add intermediate headings`,
        elements: [heading]
      });
    }
    lastLevel = level;
  });

  return { violations };
}

async function checkImageAlt(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];
  const images = target.querySelectorAll('img');

  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      violations.push({
        id: 'image-alt',
        impact: 'critical',
        nodes: 1,
        help: 'Images must have alternative text',
        fix: 'Add alt attribute with descriptive text or alt="" for decorative images',
        elements: [img]
      });
    }
  });

  return { violations };
}

async function checkFormLabels(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];
  const inputs = target.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    const hasLabel = input.hasAttribute('aria-label') || 
                    input.hasAttribute('aria-labelledby') ||
                    target.querySelector(`label[for="${input.id}"]`) ||
                    input.closest('label');

    if (!hasLabel) {
      violations.push({
        id: 'label',
        impact: 'critical',
        nodes: 1,
        help: 'Form elements must have labels',
        fix: 'Add a label element, aria-label, or aria-labelledby attribute',
        elements: [input]
      });
    }
  });

  return { violations };
}

async function checkLinkNames(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];
  const links = target.querySelectorAll('a[href]');

  links.forEach(link => {
    const text = link.textContent?.trim();
    const ariaLabel = link.getAttribute('aria-label');
    
    if (!text && !ariaLabel) {
      violations.push({
        id: 'link-name',
        impact: 'serious',
        nodes: 1,
        help: 'Links must have discernible text',
        fix: 'Add descriptive text content or aria-label attribute',
        elements: [link]
      });
    }
  });

  return { violations };
}

async function checkButtonNames(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];
  const buttons = target.querySelectorAll('button, input[type="button"], input[type="submit"]');

  buttons.forEach(button => {
    const text = button.textContent?.trim();
    const ariaLabel = button.getAttribute('aria-label');
    const value = button.getAttribute('value');
    
    if (!text && !ariaLabel && !value) {
      violations.push({
        id: 'button-name',
        impact: 'serious',
        nodes: 1,
        help: 'Buttons must have discernible text',
        fix: 'Add text content, aria-label, or value attribute',
        elements: [button]
      });
    }
  });

  return { violations };
}

async function checkFocusVisible(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];
  const focusableElements = target.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  focusableElements.forEach(element => {
    const styles = getComputedStyle(element as HTMLElement);
    const hasVisibleFocus = styles.outline !== 'none' && styles.outline !== '0px' &&
                           styles.outline !== '0' && styles.outlineWidth !== '0px';

    // Check if element has custom focus styles
    const hasCustomFocus = styles.boxShadow.includes('inset') ||
                          styles.border !== styles.borderColor ||
                          element.hasAttribute('data-focus-visible');

    if (!hasVisibleFocus && !hasCustomFocus) {
      violations.push({
        id: 'focus-visible',
        impact: 'serious',
        nodes: 1,
        help: 'Interactive elements must have visible focus indicators',
        fix: 'Add outline, box-shadow, or other visible focus styles',
        elements: [element]
      });
    }
  });

  return { violations };
}

async function checkAriaLabels(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];

  // Check for aria-labelledby pointing to non-existent elements
  const elementsWithLabelledBy = target.querySelectorAll('[aria-labelledby]');
  elementsWithLabelledBy.forEach(element => {
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelIds = labelledBy.split(' ');
      const missingIds = labelIds.filter(id => !target.querySelector(`#${id}`));

      if (missingIds.length > 0) {
        violations.push({
          id: 'aria-labelledby-invalid',
          impact: 'serious',
          nodes: 1,
          help: 'aria-labelledby must reference existing elements',
          fix: `Fix or remove references to missing IDs: ${missingIds.join(', ')}`,
          elements: [element]
        });
      }
    }
  });

  // Check for aria-describedby pointing to non-existent elements
  const elementsWithDescribedBy = target.querySelectorAll('[aria-describedby]');
  elementsWithDescribedBy.forEach(element => {
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const descriptionIds = describedBy.split(' ');
      const missingIds = descriptionIds.filter(id => !target.querySelector(`#${id}`));

      if (missingIds.length > 0) {
        violations.push({
          id: 'aria-describedby-invalid',
          impact: 'moderate',
          nodes: 1,
          help: 'aria-describedby must reference existing elements',
          fix: `Fix or remove references to missing IDs: ${missingIds.join(', ')}`,
          elements: [element]
        });
      }
    }
  });

  return { violations };
}

async function checkLandmarkRoles(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];

  // Check for missing main landmark
  const mainElements = target.querySelectorAll('main, [role="main"]');
  if (mainElements.length === 0) {
    violations.push({
      id: 'landmark-main-missing',
      impact: 'moderate',
      nodes: 0,
      help: 'Page should have a main landmark',
      fix: 'Add a <main> element or role="main" to identify the main content area'
    });
  } else if (mainElements.length > 1) {
    violations.push({
      id: 'landmark-main-multiple',
      impact: 'moderate',
      nodes: mainElements.length,
      help: 'Page should have only one main landmark',
      fix: 'Ensure only one main element or role="main" exists per page',
      elements: Array.from(mainElements)
    });
  }

  // Check for navigation landmarks without labels when multiple exist
  const navElements = target.querySelectorAll('nav, [role="navigation"]');
  if (navElements.length > 1) {
    navElements.forEach(nav => {
      const hasLabel = nav.hasAttribute('aria-label') ||
                      nav.hasAttribute('aria-labelledby') ||
                      nav.querySelector('h1, h2, h3, h4, h5, h6');

      if (!hasLabel) {
        violations.push({
          id: 'landmark-nav-unlabeled',
          impact: 'moderate',
          nodes: 1,
          help: 'Multiple navigation landmarks should be labeled',
          fix: 'Add aria-label or aria-labelledby to distinguish navigation areas',
          elements: [nav]
        });
      }
    });
  }

  return { violations };
}

async function checkSkipLinks(target: Document | Element): Promise<{ violations: AuditViolation[] }> {
  const violations: AuditViolation[] = [];

  // Check for skip links in documents with navigation
  const navElements = target.querySelectorAll('nav, [role="navigation"]');
  const mainElement = target.querySelector('main, [role="main"]');

  if (navElements.length > 0 && mainElement) {
    const skipLinks = target.querySelectorAll('a[href^="#"]');
    const hasSkipToMain = Array.from(skipLinks).some(link => {
      const href = link.getAttribute('href');
      return href && (
        href === '#main' ||
        href === `#${mainElement.id}` ||
        link.textContent?.toLowerCase().includes('skip to main') ||
        link.textContent?.toLowerCase().includes('skip to content')
      );
    });

    if (!hasSkipToMain) {
      violations.push({
        id: 'skip-link-missing',
        impact: 'moderate',
        nodes: 0,
        help: 'Page with navigation should have skip links',
        fix: 'Add a skip link to the main content area for keyboard users'
      });
    }
  }

  // Check that skip links are properly positioned (should be first focusable element)
  const firstFocusable = target.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable && firstFocusable.tagName === 'A') {
    const href = firstFocusable.getAttribute('href');
    if (!href?.startsWith('#')) {
      violations.push({
        id: 'skip-link-not-first',
        impact: 'minor',
        nodes: 1,
        help: 'Skip links should be the first focusable elements',
        fix: 'Move skip links to the beginning of the document',
        elements: [firstFocusable]
      });
    }
  }

  return { violations };
}

// Utility functions
function calculateContrast(color1: string, color2: string): number {
  // Convert colors to RGB values
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) return 4.5; // Fallback if parsing fails

  // Calculate relative luminance
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    };
  }

  // Handle hex format
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch && hexMatch[1] && hexMatch[2] && hexMatch[3]) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    };
  }

  // Handle named colors (basic set)
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    'black': { r: 0, g: 0, b: 0 },
    'white': { r: 255, g: 255, b: 255 },
    'red': { r: 255, g: 0, b: 0 },
    'green': { r: 0, g: 128, b: 0 },
    'blue': { r: 0, g: 0, b: 255 }
  };

  return namedColors[color.toLowerCase()] || null;
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;

  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function outputToConsole(report: AuditReport): void {
  console.group('🔍 Accessibility Audit Results');
  
  if (report.violations.length === 0) {
    console.log('✅ No accessibility violations found!');
  } else {
    console.log(`❌ Found ${report.violations.length} accessibility violations:`);
    
    report.violations.forEach(violation => {
      const emoji = violation.impact === 'critical' ? '🚨' : 
                   violation.impact === 'serious' ? '⚠️' : 
                   violation.impact === 'moderate' ? '⚡' : 'ℹ️';
      
      console.group(`${emoji} ${violation.help}`);
      console.log(`Impact: ${violation.impact}`);
      console.log(`Fix: ${violation.fix}`);
      if (violation.elements) {
        console.log('Elements:', violation.elements);
      }
      console.groupEnd();
    });
  }
  
  console.log(`✅ ${report.passes} checks passed`);
  if (report.incomplete > 0) {
    console.log(`⚠️ ${report.incomplete} checks incomplete`);
  }
  
  console.groupEnd();
}

function openReportInBrowser(report: AuditReport): void {
  const html = generateHTMLReport(report);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const newWindow = window.open(url, '_blank');
  if (!newWindow) {
    console.warn('Could not open report in new window. Please check popup blocker settings.');
    // Fallback: download the report
    const link = document.createElement('a');
    link.href = url;
    link.download = `proteus-a11y-report-${Date.now()}.html`;
    link.click();
  }

  // Clean up the blob URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function generateHTMLReport(report: AuditReport): string {
  const violationsList = report.violations.map(violation => `
    <div class="violation violation--${violation.impact}">
      <h3>${violation.help}</h3>
      <p><strong>Impact:</strong> ${violation.impact}</p>
      <p><strong>Fix:</strong> ${violation.fix}</p>
      <p><strong>Affected elements:</strong> ${violation.nodes}</p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProteusJS Accessibility Report</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.6; }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
        .summary { background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
        .violation { border-left: 4px solid #ef4444; padding: 1rem; margin-bottom: 1rem; background: #fef2f2; }
        .violation--critical { border-color: #dc2626; background: #fef2f2; }
        .violation--serious { border-color: #ea580c; background: #fff7ed; }
        .violation--moderate { border-color: #d97706; background: #fffbeb; }
        .violation--minor { border-color: #65a30d; background: #f7fee7; }
        .violation h3 { margin-top: 0; color: #374151; }
        .no-violations { text-align: center; color: #059669; font-size: 1.25rem; padding: 2rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌊 ProteusJS Accessibility Report</h1>
        <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        <p>URL: ${report.url}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Violations:</strong> ${report.violations.length}</p>
        <p><strong>Checks passed:</strong> ${report.passes}</p>
        <p><strong>Incomplete checks:</strong> ${report.incomplete}</p>
    </div>

    ${report.violations.length === 0 ?
      '<div class="no-violations">✅ No accessibility violations found!</div>' :
      `<h2>Violations</h2>${violationsList}`
    }
</body>
</html>`;
}

// Export default object for convenience
export default {
  audit
};
