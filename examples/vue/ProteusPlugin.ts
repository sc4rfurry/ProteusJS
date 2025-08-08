/**
 * Vue Plugin for ProteusJS
 * Provides ProteusJS integration for Vue 3 applications
 */

import { App, Plugin, ref, reactive, onMounted, onUnmounted, Ref } from 'vue';
import { ProteusJS } from '../../src/core/ProteusJS';
import { SmartContainers } from '../../src/containers/SmartContainers';
import { ContainerBreakpoints } from '../../src/containers/ContainerBreakpoints';
import { FluidTypography } from '../../src/typography/FluidTypography';
import { PerformanceMonitor } from '../../src/performance/PerformanceMonitor';

export interface ProteusConfig {
  autoInit?: boolean;
  performance?: {
    monitoring?: boolean;
    targetFrameRate?: number;
  };
  typography?: {
    accessibility?: 'none' | 'AA' | 'AAA';
    enforceAccessibility?: boolean;
  };
  containers?: {
    autoDetect?: boolean;
    includeInline?: boolean;
  };
}

export interface ProteusInstance {
  proteus: ProteusJS | null;
  smartContainers: SmartContainers | null;
  containerBreakpoints: ContainerBreakpoints | null;
  fluidTypography: FluidTypography | null;
  performanceMonitor: PerformanceMonitor | null;
  isInitialized: boolean;
}

// Global ProteusJS instance
let proteusInstance: ProteusInstance | null = null;

/**
 * Vue Plugin for ProteusJS
 */
export const ProteusPlugin: Plugin = {
  install(app: App, config: ProteusConfig = {}) {
    // Initialize ProteusJS instance
    const initializeProteus = async () => {
      try {
        const smartContainers = new SmartContainers();
        const containerBreakpoints = new ContainerBreakpoints();
        const fluidTypography = new FluidTypography();
        
        let performanceMonitor: PerformanceMonitor | null = null;
        if (config.performance?.monitoring) {
          performanceMonitor = new PerformanceMonitor({
            minFrameRate: config.performance.targetFrameRate || 55
          });
          performanceMonitor.start();
        }

        const proteus = new ProteusJS({
          autoInit: config.autoInit !== false,
          performance: {
            monitoring: config.performance?.monitoring || false,
            targetFrameRate: config.performance?.targetFrameRate || 60
          },
          typography: {
            accessibility: config.typography?.accessibility || 'AA',
            enforceAccessibility: config.typography?.enforceAccessibility !== false
          },
          containers: {
            autoDetect: config.containers?.autoDetect !== false,
            includeInline: config.containers?.includeInline || false
          }
        });

        await proteus.initialize();

        // Auto-detect containers if enabled
        if (config.containers?.autoDetect !== false) {
          await smartContainers.detectContainers({
            includeInline: config.containers?.includeInline || false
          });
          smartContainers.startMonitoring();
        }

        proteusInstance = {
          proteus,
          smartContainers,
          containerBreakpoints,
          fluidTypography,
          performanceMonitor,
          isInitialized: true
        };

        console.log('ProteusJS initialized successfully in Vue');

      } catch (error) {
        console.error('Failed to initialize ProteusJS:', error);
        proteusInstance = {
          proteus: null,
          smartContainers: null,
          containerBreakpoints: null,
          fluidTypography: null,
          performanceMonitor: null,
          isInitialized: false
        };
      }
    };

    // Initialize on app mount
    initializeProteus();

    // Provide ProteusJS instance to all components
    app.provide('proteus', proteusInstance);

    // Global properties
    app.config.globalProperties.$proteus = proteusInstance;

    // Cleanup on app unmount
    app.mixin({
      beforeUnmount() {
        if (proteusInstance) {
          proteusInstance.proteus?.destroy();
          proteusInstance.smartContainers?.destroy();
          proteusInstance.containerBreakpoints?.destroy();
          proteusInstance.fluidTypography?.destroy();
          proteusInstance.performanceMonitor?.stop();
        }
      }
    });
  }
};

/**
 * Composable for using ProteusJS in Vue components
 */
export function useProteus() {
  if (!proteusInstance) {
    throw new Error('ProteusJS plugin not installed. Install with app.use(ProteusPlugin)');
  }

  return reactive(proteusInstance);
}

/**
 * Composable for container breakpoints
 */
export function useContainerBreakpoints(
  elementRef: Ref<HTMLElement | null>,
  breakpoints: Record<string, string>,
  callback?: (breakpoint: string, data: any) => void
) {
  const currentBreakpoint = ref('');
  const proteus = useProteus();
  let registrationId = '';

  onMounted(() => {
    if (!proteus.isInitialized || !proteus.containerBreakpoints || !elementRef.value) {
      return;
    }

    const handleBreakpointChange = (breakpoint: string, data: any) => {
      currentBreakpoint.value = breakpoint;
      if (callback) {
        callback(breakpoint, data);
      }
    };

    registrationId = proteus.containerBreakpoints.register(
      elementRef.value,
      breakpoints,
      handleBreakpointChange
    );
  });

  onUnmounted(() => {
    if (registrationId && proteus.containerBreakpoints) {
      proteus.containerBreakpoints.unregister(registrationId);
    }
  });

  return {
    currentBreakpoint: readonly(currentBreakpoint)
  };
}

/**
 * Composable for fluid typography
 */
export function useFluidTypography(
  elementRef: Ref<HTMLElement | null>,
  config: {
    minSize: number;
    maxSize: number;
    minViewport?: number;
    maxViewport?: number;
    accessibility?: 'none' | 'AA' | 'AAA';
  }
) {
  const proteus = useProteus();

  onMounted(() => {
    if (!proteus.isInitialized || !proteus.fluidTypography || !elementRef.value) {
      return;
    }

    proteus.fluidTypography.applyFluidScaling(elementRef.value, config);
  });

  onUnmounted(() => {
    if (elementRef.value && proteus.fluidTypography) {
      proteus.fluidTypography.removeFluidScaling(elementRef.value);
    }
  });
}

/**
 * Composable for performance monitoring
 */
export function usePerformanceMonitor() {
  const metrics = ref<any>(null);
  const proteus = useProteus();

  onMounted(() => {
    if (!proteus.isInitialized || !proteus.performanceMonitor) {
      return;
    }

    const updateMetrics = (newMetrics: any) => {
      metrics.value = newMetrics;
    };

    proteus.performanceMonitor.addCallback(updateMetrics);

    onUnmounted(() => {
      if (proteus.performanceMonitor) {
        proteus.performanceMonitor.removeCallback(updateMetrics);
      }
    });
  });

  return {
    metrics: readonly(metrics),
    recordOperation: () => proteus.performanceMonitor?.recordOperation(),
    getRecommendations: () => proteus.performanceMonitor?.getRecommendations() || []
  };
}

/**
 * Vue directive for container breakpoints
 */
export const vContainerBreakpoints = {
  mounted(el: HTMLElement, binding: any) {
    if (!proteusInstance?.containerBreakpoints) return;

    const { breakpoints, callback } = binding.value;
    
    const registrationId = proteusInstance.containerBreakpoints.register(
      el,
      breakpoints,
      callback
    );

    // Store registration ID for cleanup
    (el as any)._proteusBreakpointId = registrationId;
  },

  unmounted(el: HTMLElement) {
    if (!proteusInstance?.containerBreakpoints) return;

    const registrationId = (el as any)._proteusBreakpointId;
    if (registrationId) {
      proteusInstance.containerBreakpoints.unregister(registrationId);
    }
  }
};

/**
 * Vue directive for fluid typography
 */
export const vFluidTypography = {
  mounted(el: HTMLElement, binding: any) {
    if (!proteusInstance?.fluidTypography) return;

    const config = binding.value;
    proteusInstance.fluidTypography.applyFluidScaling(el, config);
  },

  unmounted(el: HTMLElement) {
    if (!proteusInstance?.fluidTypography) return;

    proteusInstance.fluidTypography.removeFluidScaling(el);
  }
};

export default ProteusPlugin;
