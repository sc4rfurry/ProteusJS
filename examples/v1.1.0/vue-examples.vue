<template>
  <div class="app">
    <header>
      <h1>ProteusJS v1.1.0 Vue Examples</h1>
      <p>Demonstrating all Vue adapter capabilities</p>
    </header>
    
    <main class="examples-grid">
      <!-- View Transitions Example -->
      <div class="example-card">
        <h3>🎬 View Transitions</h3>
        <button 
          @click="toggleTheme"
          :disabled="isTransitioning"
          class="demo-button"
        >
          {{ isTransitioning ? 'Transitioning...' : `Switch to ${theme === 'light' ? 'dark' : 'light'} theme` }}
        </button>
      </div>
      
      <!-- Popover Example -->
      <div class="example-card">
        <h3>🎭 Accessible Popover</h3>
        <button 
          ref="popoverTrigger"
          @click="togglePopover"
          class="demo-button"
        >
          {{ isPopoverOpen ? 'Close Menu' : 'Open Menu' }}
        </button>
        
        <div 
          v-show="isPopoverOpen"
          ref="popoverPanel"
          class="popover-panel"
        >
          <h4>Menu Options</h4>
          <ul>
            <li><button @click="closePopover">Profile</button></li>
            <li><button @click="closePopover">Settings</button></li>
            <li><button @click="closePopover">Logout</button></li>
          </ul>
        </div>
      </div>
      
      <!-- Anchor Positioning Example -->
      <div class="example-card">
        <h3>⚓ Anchor Positioning</h3>
        <button 
          ref="anchorTrigger"
          @click="toggleFloating"
          class="demo-button"
        >
          Toggle Floating Element
        </button>
        
        <div 
          v-show="showFloating"
          ref="floatingElement"
          class="floating-element"
        >
          <p>I'm positioned relative to the button!</p>
          <button @click="showFloating = false">Close</button>
        </div>
      </div>
      
      <!-- Container Queries Example -->
      <div class="example-card">
        <h3>📦 Container Queries</h3>
        <div 
          ref="containerElement"
          class="container-demo"
          :class="`container-${currentSize}`"
        >
          <p>Current container size: <strong>{{ currentSize }}</strong></p>
          <div class="content">
            <p>This content adapts based on container size!</p>
            <p v-if="currentSize === 'large'">Extra content for large containers</p>
          </div>
        </div>
      </div>
      
      <!-- Fluid Typography Example -->
      <div class="example-card">
        <h3>🔤 Fluid Typography</h3>
        <h2 :style="headingStyle">This heading scales fluidly</h2>
        <p :style="bodyStyle">
          This paragraph text scales smoothly between minimum and maximum sizes
          based on the viewport width.
        </p>
      </div>
      
      <!-- Performance Example -->
      <div class="example-card">
        <h3>⚡ Performance Optimization</h3>
        <button @click="measurePerformance" class="demo-button">
          Measure Core Web Vitals
        </button>
        
        <div ref="performanceDemo" class="performance-demo">
          <div class="lazy-content">Optimized Content 1</div>
          <div class="lazy-content">Optimized Content 2</div>
          <div class="lazy-content">Optimized Content 3</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  useTransition,
  usePopover,
  useAnchor,
  useContainer,
  useFluidType,
  usePerformance
} from '@sc4rfurryx/proteusjs/adapters/vue';

// Reactive state
const theme = ref<'light' | 'dark'>('light');
const showFloating = ref(false);

// View Transitions
const { isTransitioning, startTransition } = useTransition();

const toggleTheme = () => {
  startTransition(() => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  });
};

// Popover
const popoverTrigger = ref<HTMLElement>();
const popoverPanel = ref<HTMLElement>();
const { isOpen: isPopoverOpen, toggle: togglePopover, close: closePopover } = usePopover(
  popoverTrigger,
  popoverPanel,
  {
    type: 'menu',
    trapFocus: true,
    restoreFocus: true
  }
);

// Anchor Positioning
const anchorTrigger = ref<HTMLElement>();
const floatingElement = ref<HTMLElement>();
const { } = useAnchor(floatingElement, anchorTrigger, {
  placement: 'bottom-start',
  offset: 8,
  flip: true,
  shift: true
});

const toggleFloating = () => {
  showFloating.value = !showFloating.value;
};

// Container Queries
const containerElement = ref<HTMLElement>();
const { matches } = useContainer(containerElement, {
  name: 'demo',
  queries: {
    small: '(max-width: 300px)',
    medium: '(min-width: 301px) and (max-width: 600px)',
    large: '(min-width: 601px)'
  }
});

const currentSize = computed(() => {
  return Object.entries(matches.value).find(([_, isMatch]) => isMatch)?.[0] || 'unknown';
});

// Fluid Typography
const { css: headingCSS } = useFluidType(1.5, 3, {
  minViewportPx: 320,
  maxViewportPx: 1200,
  lineHeight: 1.2
});

const { css: bodyCSS } = useFluidType(1, 1.25, {
  lineHeight: 1.6
});

const headingStyle = computed(() => ({ cssText: headingCSS.value }));
const bodyStyle = computed(() => ({ cssText: bodyCSS.value }));

// Performance
const performanceDemo = ref<HTMLElement>();
const { measureCWV } = usePerformance(performanceDemo, {
  contentVisibility: 'auto',
  containIntrinsicSize: '300px 200px'
});

const measurePerformance = async () => {
  const metrics = await measureCWV();
  console.log('Core Web Vitals:', metrics);
  alert(`CLS: ${metrics.cls}, FID: ${metrics.fid}, LCP: ${metrics.lcp}`);
};

onMounted(() => {
  console.log('🌊 ProteusJS Vue examples loaded successfully!');
});
</script>

<style scoped>
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

.example-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
}

.example-card:hover {
  transform: translateY(-8px);
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
  margin-top: 0.5rem;
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
  width: 100%;
  text-align: left;
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
  margin-top: 0.5rem;
}

.container-demo {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  resize: horizontal;
  overflow: auto;
  min-width: 200px;
  max-width: 100%;
  container-type: inline-size;
  container-name: demo;
}

.content {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin: 1rem 0;
}

.container-small .content {
  font-size: 0.875rem;
}

.container-medium .content {
  font-size: 1rem;
}

.container-large .content {
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
</style>
