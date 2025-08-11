/**
 * @sc4rfurryx/proteusjs-vite
 * Vite plugin for ProteusJS development and production optimizations
 * 
 * @version 1.1.1
 * @author sc4rfurry
 * @license MIT
 */

import type { Plugin } from 'vite';

export interface ProteusViteOptions {
  /**
   * Enable dev overlays for container queries and other debugging tools
   * @default true in development, false in production
   */
  devOverlay?: boolean;

  /**
   * Inject speculation rules for prerendering and prefetching
   * @default false in development, true in production
   */
  injectSpeculation?: boolean;

  /**
   * Emit typography CSS from design tokens
   * @default true
   */
  emitTypographyCSS?: boolean;

  /**
   * Speculation rules configuration
   */
  speculation?: {
    prerender?: string[];
    prefetch?: string[];
    sameOriginOnly?: boolean;
  };

  /**
   * Typography configuration
   */
  typography?: {
    tokensFile?: string;
    outputFile?: string;
  };
}

export function proteusjs(options: ProteusViteOptions = {}): Plugin {
  const {
    devOverlay,
    injectSpeculation,
    emitTypographyCSS = true,
    speculation = {},
    typography = {}
  } = options;

  return {
    name: 'proteusjs',
    configResolved(config) {
      // Set defaults based on environment
      const isDev = config.command === 'serve';
      
      if (devOverlay === undefined) {
        options.devOverlay = isDev;
      }
      
      if (injectSpeculation === undefined) {
        options.injectSpeculation = !isDev;
      }
    },

    transformIndexHtml: {
      enforce: 'pre',
      transform(html, context) {
        let transformedHtml = html;

        // Inject dev overlay in development
        if (options.devOverlay && context.server) {
          transformedHtml = injectDevOverlay(transformedHtml);
        }

        // Inject speculation rules in production
        if (options.injectSpeculation && !context.server) {
          transformedHtml = injectSpeculationRules(transformedHtml, speculation);
        }

        return transformedHtml;
      }
    },

    generateBundle(outputOptions, bundle) {
      // Emit typography CSS if enabled
      if (emitTypographyCSS) {
        const typographyCSS = generateTypographyCSS(typography);
        if (typographyCSS) {
          this.emitFile({
            type: 'asset',
            fileName: typography.outputFile || 'proteus-typography.css',
            source: typographyCSS
          });
        }
      }
    },

    configureServer(server) {
      // Add middleware for dev tools
      server.middlewares.use('/proteus-dev', (req, res, next) => {
        if (req.url === '/proteus-dev/overlay.js') {
          res.setHeader('Content-Type', 'application/javascript');
          res.end(getDevOverlayScript());
        } else {
          next();
        }
      });
    }
  };
}

function injectDevOverlay(html: string): string {
  const overlayScript = `
    <script type="module">
      // ProteusJS Dev Overlay
      window.__PROTEUS_DEV__ = true;
      
      // Import dev overlay script
      import('/proteus-dev/overlay.js');
    </script>
  `;

  return html.replace('</head>', `${overlayScript}</head>`);
}

function injectSpeculationRules(html: string, speculation: any): string {
  const rules: any = {};

  if (speculation.prerender?.length) {
    rules.prerender = speculation.prerender.map((url: string) => ({
      where: { href_matches: url }
    }));
  }

  if (speculation.prefetch?.length) {
    rules.prefetch = speculation.prefetch.map((url: string) => ({
      where: { href_matches: url }
    }));
  }

  if (Object.keys(rules).length === 0) {
    return html;
  }

  const speculationScript = `
    <script type="speculationrules">
      ${JSON.stringify(rules, null, 2)}
    </script>
  `;

  return html.replace('</head>', `${speculationScript}</head>`);
}

function generateTypographyCSS(typography: any): string | null {
  // This would read from tokens file and generate fluid typography CSS
  // For now, return a basic implementation
  return `
/* ProteusJS Typography - Generated */
:root {
  --font-size-xs: clamp(0.75rem, 0.5vw + 0.7rem, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.75vw + 0.8rem, 1rem);
  --font-size-base: clamp(1rem, 1vw + 0.9rem, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1.5vw + 1rem, 1.25rem);
  --font-size-xl: clamp(1.25rem, 2vw + 1.1rem, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 3vw + 1.2rem, 2rem);
  --font-size-3xl: clamp(2rem, 4vw + 1.5rem, 3rem);
}

.proteus-text-xs { font-size: var(--font-size-xs); }
.proteus-text-sm { font-size: var(--font-size-sm); }
.proteus-text-base { font-size: var(--font-size-base); }
.proteus-text-lg { font-size: var(--font-size-lg); }
.proteus-text-xl { font-size: var(--font-size-xl); }
.proteus-text-2xl { font-size: var(--font-size-2xl); }
.proteus-text-3xl { font-size: var(--font-size-3xl); }
  `.trim();
}

function getDevOverlayScript(): string {
  return `
// ProteusJS Dev Overlay Script
console.log('🌊 ProteusJS Dev Overlay loaded');

// Container query visualization
function addContainerOverlays() {
  const containers = document.querySelectorAll('[style*="container-type"], [style*="container-name"]');
  
  containers.forEach(container => {
    if (container.querySelector('.proteus-dev-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'proteus-dev-overlay';
    overlay.style.cssText = \`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      border: 2px dashed rgba(255, 0, 255, 0.5);
      background: rgba(255, 0, 255, 0.05);
      z-index: 9999;
    \`;
    
    const label = document.createElement('div');
    label.style.cssText = \`
      position: absolute;
      top: -20px;
      left: 0;
      background: rgba(255, 0, 255, 0.9);
      color: white;
      padding: 2px 6px;
      font-size: 10px;
      font-family: monospace;
    \`;
    label.textContent = 'Container Query';
    
    overlay.appendChild(label);
    container.style.position = container.style.position || 'relative';
    container.appendChild(overlay);
  });
}

// Initialize overlays
addContainerOverlays();

// Re-run on DOM changes
const observer = new MutationObserver(addContainerOverlays);
observer.observe(document.body, { childList: true, subtree: true });
  `;
}

export default proteusjs;
