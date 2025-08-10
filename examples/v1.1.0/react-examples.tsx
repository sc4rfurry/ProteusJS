/**
 * ProteusJS v1.1.0 React Examples
 * Demonstrates all React adapter hooks and components
 */

import React, { useState } from 'react';
import {
  useTransition,
  usePopover,
  useAnchor,
  useContainer,
  useFluidType,
  usePerformance,
  ProteusProvider
} from '@sc4rfurryx/proteusjs/adapters/react';

// Example 1: View Transitions Hook
function TransitionExample() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isTransitioning, startTransition] = useTransition();

  const toggleTheme = () => {
    startTransition(() => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
    });
  };

  return (
    <div className={`theme-${theme}`}>
      <h3>🎬 View Transitions</h3>
      <button 
        onClick={toggleTheme}
        disabled={isTransitioning}
        className="demo-button"
      >
        {isTransitioning ? 'Transitioning...' : `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      </button>
    </div>
  );
}

// Example 2: Popover Hook
function PopoverExample() {
  const { triggerRef, panelRef, isOpen, toggle, close } = usePopover({
    type: 'menu',
    trapFocus: true,
    restoreFocus: true
  });

  return (
    <div>
      <h3>🎭 Accessible Popover</h3>
      <button ref={triggerRef} onClick={toggle} className="demo-button">
        {isOpen ? 'Close Menu' : 'Open Menu'}
      </button>
      
      {isOpen && (
        <div ref={panelRef} className="popover-panel">
          <h4>Menu Options</h4>
          <ul>
            <li><button onClick={close}>Profile</button></li>
            <li><button onClick={close}>Settings</button></li>
            <li><button onClick={close}>Logout</button></li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Example 3: Anchor Positioning Hook
function AnchorExample() {
  const [showFloating, setShowFloating] = useState(false);
  const { anchorRef, floatingRef } = useAnchor({
    placement: 'bottom-start',
    offset: 8,
    flip: true,
    shift: true
  });

  return (
    <div>
      <h3>⚓ Anchor Positioning</h3>
      <button 
        ref={anchorRef}
        onClick={() => setShowFloating(!showFloating)}
        className="demo-button"
      >
        Toggle Floating Element
      </button>
      
      {showFloating && (
        <div ref={floatingRef} className="floating-element">
          <p>I'm positioned relative to the button!</p>
          <button onClick={() => setShowFloating(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// Example 4: Container Queries Hook
function ContainerExample() {
  const { containerRef, matches } = useContainer({
    name: 'sidebar',
    queries: {
      small: '(max-width: 300px)',
      medium: '(min-width: 301px) and (max-width: 600px)',
      large: '(min-width: 601px)'
    }
  });

  const currentSize = Object.entries(matches).find(([_, isMatch]) => isMatch)?.[0] || 'unknown';

  return (
    <div ref={containerRef} className="container-demo">
      <h3>📦 Container Queries</h3>
      <p>Current container size: <strong>{currentSize}</strong></p>
      <div className={`content content-${currentSize}`}>
        <p>This content adapts based on container size, not viewport!</p>
        {matches.large && <p>Extra content for large containers</p>}
      </div>
    </div>
  );
}

// Example 5: Fluid Typography Hook
function TypographyExample() {
  const headingStyle = useFluidType(1.5, 3, {
    minViewportPx: 320,
    maxViewportPx: 1200,
    lineHeight: 1.2
  });

  const bodyStyle = useFluidType(1, 1.25, {
    lineHeight: 1.6
  });

  return (
    <div>
      <h3>🔤 Fluid Typography</h3>
      <h2 style={headingStyle}>This heading scales fluidly</h2>
      <p style={bodyStyle}>
        This paragraph text also scales smoothly between minimum and maximum sizes
        based on the viewport width, creating a responsive typography system.
      </p>
    </div>
  );
}

// Example 6: Performance Hook
function PerformanceExample() {
  const { contentVisibilityRef, measureCWV } = usePerformance({
    contentVisibility: 'auto',
    containIntrinsicSize: '300px 200px'
  });

  const handleMeasureCWV = async () => {
    const metrics = await measureCWV();
    console.log('Core Web Vitals:', metrics);
    alert(`CLS: ${metrics.cls}, FID: ${metrics.fid}, LCP: ${metrics.lcp}`);
  };

  return (
    <div>
      <h3>⚡ Performance Optimization</h3>
      <button onClick={handleMeasureCWV} className="demo-button">
        Measure Core Web Vitals
      </button>
      
      <div ref={contentVisibilityRef} className="performance-demo">
        <div className="lazy-content">Optimized Content 1</div>
        <div className="lazy-content">Optimized Content 2</div>
        <div className="lazy-content">Optimized Content 3</div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <ProteusProvider>
      <div className="app">
        <header>
          <h1>ProteusJS v1.1.0 React Examples</h1>
          <p>Demonstrating all React adapter capabilities</p>
        </header>
        
        <main className="examples-grid">
          <TransitionExample />
          <PopoverExample />
          <AnchorExample />
          <ContainerExample />
          <TypographyExample />
          <PerformanceExample />
        </main>
      </div>
    </ProteusProvider>
  );
}

export default App;

// CSS-in-JS styles (or use external CSS)
const styles = `
  .app {
    font-family: system-ui, sans-serif;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: white;
  }
  
  .examples-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    margin: 2rem 0;
  }
  
  .demo-button {
    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
    border: none;
    color: white;
    padding: 1rem 2rem;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 1rem 0;
  }
  
  .demo-button:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 20px rgba(255, 107, 107, 0.4);
  }
  
  .demo-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .popover-panel {
    background: white;
    color: #333;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: absolute;
    z-index: 1000;
  }
  
  .popover-panel ul {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0 0;
  }
  
  .popover-panel li {
    margin: 0.5rem 0;
  }
  
  .popover-panel button {
    background: none;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
  }
  
  .popover-panel button:hover {
    background: #f0f0f0;
  }
  
  .floating-element {
    background: linear-gradient(45deg, #4ecdc4, #44a08d);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    position: absolute;
    z-index: 100;
    max-width: 200px;
  }
  
  .container-demo {
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 8px;
    resize: horizontal;
    overflow: auto;
    min-width: 200px;
    max-width: 100%;
  }
  
  .content {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    margin: 1rem 0;
  }
  
  .content-small {
    font-size: 0.875rem;
  }
  
  .content-medium {
    font-size: 1rem;
  }
  
  .content-large {
    font-size: 1.125rem;
  }
  
  .performance-demo {
    height: 200px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .lazy-content {
    height: 100px;
    background: linear-gradient(45deg, #ff9a9e, #fecfef);
    margin: 1rem 0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    font-weight: 600;
  }
  
  .theme-light {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .theme-dark {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
