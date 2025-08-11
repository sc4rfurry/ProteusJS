/**
 * @sc4rfurryx/proteusjs-eslint-plugin
 * ESLint rules for ProteusJS best practices
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

import type { ESLint, Rule } from 'eslint';

// Rule: no-missing-container-name
const noMissingContainerName: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require container-name when using container-type',
      category: 'Best Practices',
      recommended: true
    },
    fixable: 'code',
    schema: []
  },
  create(context) {
    return {
      Property(node: any) {
        if (node.key.name === 'containerType' || 
            (node.key.type === 'Literal' && node.key.value === 'container-type')) {
          
          // Check if container-name is also present
          const parent = node.parent;
          const hasContainerName = parent.properties?.some((prop: any) => 
            prop.key.name === 'containerName' || 
            (prop.key.type === 'Literal' && prop.key.value === 'container-name')
          );

          if (!hasContainerName) {
            context.report({
              node,
              message: 'Container queries should have a container-name for better debugging and specificity',
              fix(fixer) {
                const containerNameProp = `containerName: 'container-${Math.random().toString(36).substr(2, 6)}'`;
                return fixer.insertTextAfter(node, `, ${containerNameProp}`);
              }
            });
          }
        }
      }
    };
  }
};

// Rule: no-aria-violations-basic
const noAriaViolationsBasic: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent basic ARIA violations',
      category: 'Accessibility',
      recommended: true
    },
    schema: []
  },
  create(context) {
    return {
      JSXOpeningElement(node: any) {
        const attributes = node.attributes || [];
        
        // Check for aria-label without role
        const hasAriaLabel = attributes.some((attr: any) => 
          attr.name?.name === 'aria-label'
        );
        const hasRole = attributes.some((attr: any) => 
          attr.name?.name === 'role'
        );

        if (hasAriaLabel && !hasRole && node.name.name === 'div') {
          context.report({
            node,
            message: 'Elements with aria-label should have an appropriate role'
          });
        }

        // Check for button without accessible name
        if (node.name.name === 'button') {
          const hasAccessibleName = attributes.some((attr: any) => 
            ['aria-label', 'aria-labelledby'].includes(attr.name?.name)
          );
          
          if (!hasAccessibleName) {
            context.report({
              node,
              message: 'Buttons should have an accessible name (text content, aria-label, or aria-labelledby)'
            });
          }
        }
      }
    };
  }
};

// Rule: no-unsafe-popover
const noUnsafePopover: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent unsafe popover usage patterns',
      category: 'Best Practices',
      recommended: true
    },
    schema: []
  },
  create(context) {
    return {
      CallExpression(node: any) {
        if (node.callee.name === 'attach' || 
            (node.callee.property && node.callee.property.name === 'attach')) {
          
          const args = node.arguments;
          if (args.length >= 3) {
            const options = args[2];
            
            // Check for missing focus management
            if (options.type === 'ObjectExpression') {
              const hasRestoreFocus = options.properties.some((prop: any) => 
                prop.key.name === 'restoreFocus'
              );
              const hasTrapFocus = options.properties.some((prop: any) => 
                prop.key.name === 'trapFocus'
              );

              if (!hasRestoreFocus && !hasTrapFocus) {
                context.report({
                  node,
                  message: 'Popovers should specify focus management (restoreFocus or trapFocus)'
                });
              }
            }
          }
        }
      }
    };
  }
};

// Plugin configuration
const plugin: ESLint.Plugin = {
  meta: {
    name: '@sc4rfurryx/proteusjs-eslint-plugin',
    version: '2.0.0'
  },
  rules: {
    'no-missing-container-name': noMissingContainerName,
    'no-aria-violations-basic': noAriaViolationsBasic,
    'no-unsafe-popover': noUnsafePopover
  },
  configs: {
    recommended: {
      plugins: ['@sc4rfurryx/proteusjs'],
      rules: {
        '@sc4rfurryx/proteusjs/no-missing-container-name': 'warn',
        '@sc4rfurryx/proteusjs/no-aria-violations-basic': 'error',
        '@sc4rfurryx/proteusjs/no-unsafe-popover': 'warn'
      }
    },
    strict: {
      plugins: ['@sc4rfurryx/proteusjs'],
      rules: {
        '@sc4rfurryx/proteusjs/no-missing-container-name': 'error',
        '@sc4rfurryx/proteusjs/no-aria-violations-basic': 'error',
        '@sc4rfurryx/proteusjs/no-unsafe-popover': 'error'
      }
    }
  }
};

export default plugin;
