/**
 * Import Updates Transform
 * Updates import statements from v1.x to v2.0.0 package structure
 */

import { Transform, JSCodeshift, Collection } from 'jscodeshift';

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasChanges = false;

  // Import mapping from v1 to v2
  const importMappings = {
    // Main library imports
    '@sc4rfurryx/proteusjs': {
      // Core exports remain the same
      ProteusJS: '@sc4rfurryx/proteusjs',
      VERSION: '@sc4rfurryx/proteusjs',
      
      // Navigation moved to router package
      navigate: '@sc4rfurryx/proteusjs-router',
      back: '@sc4rfurryx/proteusjs-router',
      forward: '@sc4rfurryx/proteusjs-router',
      
      // Transitions moved to transitions package
      transition: '@sc4rfurryx/proteusjs-transitions',
      viewTransition: '@sc4rfurryx/proteusjs-transitions',
      
      // Layer/UI moved to layer package
      popover: '@sc4rfurryx/proteusjs-layer',
      tooltip: '@sc4rfurryx/proteusjs-layer',
      
      // Performance moved to schedule package
      postTask: '@sc4rfurryx/proteusjs-schedule',
      yieldToMain: '@sc4rfurryx/proteusjs-schedule',
      
      // PWA features moved to pwa package
      FileSystem: '@sc4rfurryx/proteusjs-pwa',
      Badging: '@sc4rfurryx/proteusjs-pwa',
      Share: '@sc4rfurryx/proteusjs-pwa',
      
      // Prefetching moved to speculate package
      prefetch: '@sc4rfurryx/proteusjs-speculate',
      prerender: '@sc4rfurryx/proteusjs-speculate'
    },
    
    // Submodule imports
    '@sc4rfurryx/proteusjs/transitions': '@sc4rfurryx/proteusjs-transitions',
    '@sc4rfurryx/proteusjs/scroll': '@sc4rfurryx/proteusjs',
    '@sc4rfurryx/proteusjs/anchor': '@sc4rfurryx/proteusjs',
    '@sc4rfurryx/proteusjs/popover': '@sc4rfurryx/proteusjs-layer',
    '@sc4rfurryx/proteusjs/container': '@sc4rfurryx/proteusjs',
    '@sc4rfurryx/proteusjs/typography': '@sc4rfurryx/proteusjs',
    '@sc4rfurryx/proteusjs/a11y-audit': '@sc4rfurryx/proteusjs',
    '@sc4rfurryx/proteusjs/a11y-primitives': '@sc4rfurryx/proteusjs',
    '@sc4rfurryx/proteusjs/perf': '@sc4rfurryx/proteusjs-schedule'
  };

  // Transform import declarations
  root.find(j.ImportDeclaration).forEach(path => {
    const source = path.node.source.value as string;
    
    if (source.startsWith('@sc4rfurryx/proteusjs')) {
      // Handle submodule imports
      if (importMappings[source as keyof typeof importMappings]) {
        path.node.source.value = importMappings[source as keyof typeof importMappings];
        hasChanges = true;
        return;
      }
      
      // Handle main package imports with specific specifiers
      if (source === '@sc4rfurryx/proteusjs' && path.node.specifiers) {
        const newImports: { [pkg: string]: string[] } = {};
        const remainingSpecifiers: any[] = [];
        
        path.node.specifiers.forEach(spec => {
          if (j.ImportSpecifier.check(spec)) {
            const importName = spec.imported.name;
            const mapping = importMappings['@sc4rfurryx/proteusjs'];
            
            if (mapping[importName as keyof typeof mapping]) {
              const targetPackage = mapping[importName as keyof typeof mapping];
              if (!newImports[targetPackage]) {
                newImports[targetPackage] = [];
              }
              newImports[targetPackage].push(importName);
            } else {
              remainingSpecifiers.push(spec);
            }
          } else {
            remainingSpecifiers.push(spec);
          }
        });
        
        // Create new import statements for moved exports
        Object.entries(newImports).forEach(([pkg, imports]) => {
          if (pkg !== '@sc4rfurryx/proteusjs') {
            const newImport = j.importDeclaration(
              imports.map(imp => j.importSpecifier(j.identifier(imp))),
              j.literal(pkg)
            );
            path.insertBefore(newImport);
            hasChanges = true;
          }
        });
        
        // Update original import with remaining specifiers
        if (remainingSpecifiers.length > 0) {
          path.node.specifiers = remainingSpecifiers;
        } else {
          // Remove the import if no specifiers remain
          j(path).remove();
        }
        
        hasChanges = true;
      }
    }
  });

  // Transform require statements
  root.find(j.CallExpression, {
    callee: { name: 'require' }
  }).forEach(path => {
    if (j.Literal.check(path.node.arguments[0])) {
      const source = path.node.arguments[0].value as string;
      
      if (importMappings[source as keyof typeof importMappings]) {
        path.node.arguments[0].value = importMappings[source as keyof typeof importMappings];
        hasChanges = true;
      }
    }
  });

  // Transform dynamic imports
  root.find(j.CallExpression, {
    callee: { type: 'Import' }
  }).forEach(path => {
    if (j.Literal.check(path.node.arguments[0])) {
      const source = path.node.arguments[0].value as string;
      
      if (importMappings[source as keyof typeof importMappings]) {
        path.node.arguments[0].value = importMappings[source as keyof typeof importMappings];
        hasChanges = true;
      }
    }
  });

  return hasChanges ? root.toSource() : null;
};

export default transform;
