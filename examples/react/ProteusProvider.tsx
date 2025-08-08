/**
 * React Provider for ProteusJS
 * Provides ProteusJS context and lifecycle management for React applications
 */

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
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

interface ProteusContextValue {
  proteus: ProteusJS | null;
  smartContainers: SmartContainers | null;
  containerBreakpoints: ContainerBreakpoints | null;
  fluidTypography: FluidTypography | null;
  performanceMonitor: PerformanceMonitor | null;
  isInitialized: boolean;
}

const ProteusContext = createContext<ProteusContextValue>({
  proteus: null,
  smartContainers: null,
  containerBreakpoints: null,
  fluidTypography: null,
  performanceMonitor: null,
  isInitialized: false
});

export interface ProteusProviderProps {
  children: ReactNode;
  config?: ProteusConfig;
}

export const ProteusProvider: React.FC<ProteusProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const proteusRef = useRef<ProteusJS | null>(null);
  const smartContainersRef = useRef<SmartContainers | null>(null);
  const containerBreakpointsRef = useRef<ContainerBreakpoints | null>(null);
  const fluidTypographyRef = useRef<FluidTypography | null>(null);
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const initializeProteus = async () => {
      try {
        // Initialize core systems
        smartContainersRef.current = new SmartContainers();
        containerBreakpointsRef.current = new ContainerBreakpoints();
        fluidTypographyRef.current = new FluidTypography();
        
        if (config.performance?.monitoring) {
          performanceMonitorRef.current = new PerformanceMonitor({
            minFrameRate: config.performance.targetFrameRate || 55
          });
          performanceMonitorRef.current.start();
        }

        // Initialize ProteusJS with configuration
        proteusRef.current = new ProteusJS({
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

        await proteusRef.current.initialize();

        // Auto-detect containers if enabled
        if (config.containers?.autoDetect !== false) {
          await smartContainersRef.current.detectContainers({
            includeInline: config.containers?.includeInline || false
          });
          smartContainersRef.current.startMonitoring();
        }

        setIsInitialized(true);
        console.log('ProteusJS initialized successfully in React');

      } catch (error) {
        console.error('Failed to initialize ProteusJS:', error);
      }
    };

    initializeProteus();

    // Cleanup on unmount
    return () => {
      if (proteusRef.current) {
        proteusRef.current.destroy();
      }
      if (smartContainersRef.current) {
        smartContainersRef.current.destroy();
      }
      if (containerBreakpointsRef.current) {
        containerBreakpointsRef.current.destroy();
      }
      if (fluidTypographyRef.current) {
        fluidTypographyRef.current.destroy();
      }
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.stop();
      }
    };
  }, [config]);

  const contextValue: ProteusContextValue = {
    proteus: proteusRef.current,
    smartContainers: smartContainersRef.current,
    containerBreakpoints: containerBreakpointsRef.current,
    fluidTypography: fluidTypographyRef.current,
    performanceMonitor: performanceMonitorRef.current,
    isInitialized
  };

  return (
    <ProteusContext.Provider value={contextValue}>
      {children}
    </ProteusContext.Provider>
  );
};

/**
 * Hook to access ProteusJS context
 */
export const useProteus = (): ProteusContextValue => {
  const context = useContext(ProteusContext);
  if (!context) {
    throw new Error('useProteus must be used within a ProteusProvider');
  }
  return context;
};

/**
 * Hook for container breakpoints
 */
export const useContainerBreakpoints = (
  elementRef: React.RefObject<HTMLElement>,
  breakpoints: Record<string, string>,
  callback?: (breakpoint: string, data: any) => void
) => {
  const { containerBreakpoints, isInitialized } = useProteus();
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<string>('');
  const registrationIdRef = useRef<string>('');

  useEffect(() => {
    if (!isInitialized || !containerBreakpoints || !elementRef.current) {
      return;
    }

    const handleBreakpointChange = (breakpoint: string, data: any) => {
      setCurrentBreakpoint(breakpoint);
      if (callback) {
        callback(breakpoint, data);
      }
    };

    registrationIdRef.current = containerBreakpoints.register(
      elementRef.current,
      breakpoints,
      handleBreakpointChange
    );

    return () => {
      if (registrationIdRef.current) {
        containerBreakpoints.unregister(registrationIdRef.current);
      }
    };
  }, [isInitialized, containerBreakpoints, elementRef.current, breakpoints, callback]);

  return currentBreakpoint;
};

/**
 * Hook for fluid typography
 */
export const useFluidTypography = (
  elementRef: React.RefObject<HTMLElement>,
  config: {
    minSize: number;
    maxSize: number;
    minViewport?: number;
    maxViewport?: number;
    accessibility?: 'none' | 'AA' | 'AAA';
  }
) => {
  const { fluidTypography, isInitialized } = useProteus();

  useEffect(() => {
    if (!isInitialized || !fluidTypography || !elementRef.current) {
      return;
    }

    fluidTypography.applyFluidScaling(elementRef.current, config);

    return () => {
      if (elementRef.current) {
        fluidTypography.removeFluidScaling(elementRef.current);
      }
    };
  }, [isInitialized, fluidTypography, elementRef.current, config]);
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const { performanceMonitor, isInitialized } = useProteus();
  const [metrics, setMetrics] = React.useState<any>(null);

  useEffect(() => {
    if (!isInitialized || !performanceMonitor) {
      return;
    }

    const updateMetrics = (newMetrics: any) => {
      setMetrics(newMetrics);
    };

    performanceMonitor.addCallback(updateMetrics);

    return () => {
      performanceMonitor.removeCallback(updateMetrics);
    };
  }, [isInitialized, performanceMonitor]);

  return {
    metrics,
    recordOperation: () => performanceMonitor?.recordOperation(),
    getRecommendations: () => performanceMonitor?.getRecommendations() || []
  };
};

export default ProteusProvider;
