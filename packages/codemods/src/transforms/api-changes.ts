/**
 * API Changes Transform
 * Updates API calls from v1.x to v2.0.0 breaking changes
 */

import { Transform, JSCodeshift } from 'jscodeshift';

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasChanges = false;

  // Transform ProteusJS constructor calls
  root.find(j.NewExpression, {
    callee: { name: 'ProteusJS' }
  }).forEach(path => {
    // v1: new ProteusJS(config)
    // v2: ProteusJS.init(config) or individual package usage
    
    const args = path.node.arguments;
    const newCall = j.callExpression(
      j.memberExpression(j.identifier('ProteusJS'), j.identifier('init')),
      args
    );
    
    j(path).replaceWith(newCall);
    hasChanges = true;
  });

  // Transform transition API calls
  root.find(j.CallExpression, {
    callee: { name: 'transition' }
  }).forEach(path => {
    // v1: transition(callback, options)
    // v2: viewTransition(callback, options)
    
    if (path.node.callee.type === 'Identifier') {
      path.node.callee.name = 'viewTransition';
      hasChanges = true;
    }
  });

  // Transform navigation API calls
  root.find(j.CallExpression).forEach(path => {
    if (j.MemberExpression.check(path.node.callee)) {
      const obj = path.node.callee.object;
      const prop = path.node.callee.property;
      
      // v1: proteus.navigate(url)
      // v2: navigate(url, options)
      if (j.Identifier.check(obj) && j.Identifier.check(prop)) {
        if (obj.name === 'proteus' && prop.name === 'navigate') {
          // Replace with direct function call
          path.node.callee = j.identifier('navigate');
          hasChanges = true;
        }
        
        // Similar transformations for other methods
        const methodMappings = {
          'back': 'back',
          'forward': 'forward',
          'reload': 'reload'
        };
        
        if (obj.name === 'proteus' && methodMappings[prop.name as keyof typeof methodMappings]) {
          path.node.callee = j.identifier(methodMappings[prop.name as keyof typeof methodMappings]);
          hasChanges = true;
        }
      }
    }
  });

  // Transform popover API calls
  root.find(j.CallExpression).forEach(path => {
    if (j.MemberExpression.check(path.node.callee)) {
      const obj = path.node.callee.object;
      const prop = path.node.callee.property;
      
      if (j.Identifier.check(obj) && j.Identifier.check(prop)) {
        // v1: proteus.createPopover(trigger, content, options)
        // v2: popover(trigger, content, options)
        if (obj.name === 'proteus' && prop.name === 'createPopover') {
          path.node.callee = j.identifier('popover');
          hasChanges = true;
        }
        
        // v1: proteus.createTooltip(trigger, content, options)
        // v2: tooltip(trigger, content, options)
        if (obj.name === 'proteus' && prop.name === 'createTooltip') {
          path.node.callee = j.identifier('tooltip');
          hasChanges = true;
        }
      }
    }
  });

  // Transform performance API calls
  root.find(j.CallExpression).forEach(path => {
    if (j.MemberExpression.check(path.node.callee)) {
      const obj = path.node.callee.object;
      const prop = path.node.callee.property;
      
      if (j.Identifier.check(obj) && j.Identifier.check(prop)) {
        // v1: proteus.scheduleTask(callback, options)
        // v2: postTask(callback, options)
        if (obj.name === 'proteus' && prop.name === 'scheduleTask') {
          path.node.callee = j.identifier('postTask');
          hasChanges = true;
        }
        
        // v1: proteus.yieldControl()
        // v2: yieldToMain()
        if (obj.name === 'proteus' && prop.name === 'yieldControl') {
          path.node.callee = j.identifier('yieldToMain');
          hasChanges = true;
        }
      }
    }
  });

  // Transform configuration object properties
  root.find(j.ObjectExpression).forEach(path => {
    path.node.properties.forEach(prop => {
      if (j.Property.check(prop) && j.Identifier.check(prop.key)) {
        // Update deprecated configuration options
        const deprecatedOptions = {
          'enablePolyfills': 'compatibility.polyfills',
          'autoInit': 'initialization.auto',
          'debugMode': 'development.debug'
        };
        
        if (deprecatedOptions[prop.key.name as keyof typeof deprecatedOptions]) {
          // Add comment about deprecated option
          const comment = j.commentLine(` TODO: Update deprecated option '${prop.key.name}' - see migration guide`);
          prop.comments = [comment];
          hasChanges = true;
        }
      }
    });
  });

  // Transform CSS class names
  root.find(j.Literal).forEach(path => {
    if (typeof path.node.value === 'string') {
      const value = path.node.value;
      
      // Update CSS class prefixes
      if (value.includes('proteus-')) {
        const updated = value.replace(/proteus-/g, 'proteus-v2-');
        if (updated !== value) {
          path.node.value = updated;
          hasChanges = true;
        }
      }
    }
  });

  // Transform event names
  root.find(j.CallExpression).forEach(path => {
    if (j.MemberExpression.check(path.node.callee)) {
      const prop = path.node.callee.property;
      
      if (j.Identifier.check(prop) && (prop.name === 'addEventListener' || prop.name === 'removeEventListener')) {
        const eventArg = path.node.arguments[0];
        
        if (j.Literal.check(eventArg) && typeof eventArg.value === 'string') {
          // Update event names
          const eventMappings = {
            'proteus:navigate': 'proteus:navigation',
            'proteus:transition': 'proteus:view-transition',
            'proteus:popover': 'proteus:layer-change'
          };
          
          const newEventName = eventMappings[eventArg.value as keyof typeof eventMappings];
          if (newEventName) {
            eventArg.value = newEventName;
            hasChanges = true;
          }
        }
      }
    }
  });

  // Add compatibility imports if needed
  if (hasChanges) {
    // Check if we need to add compatibility mode
    const hasCompatibilityNeeds = root.find(j.Identifier, { name: 'proteus' }).length > 0;
    
    if (hasCompatibilityNeeds) {
      // Add compatibility import at the top
      const compatImport = j.importDeclaration(
        [],
        j.literal('@sc4rfurryx/proteusjs/compat')
      );
      
      // Add comment explaining compatibility mode
      compatImport.comments = [
        j.commentBlock(' Enable v1 compatibility mode - remove after full migration ')
      ];
      
      root.find(j.Program).get('body', 0).insertBefore(compatImport);
    }
  }

  return hasChanges ? root.toSource() : null;
};

export default transform;
