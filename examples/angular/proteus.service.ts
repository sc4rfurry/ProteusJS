/**
 * Angular Service for ProteusJS
 * Provides ProteusJS integration for Angular applications
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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

export interface ProteusState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProteusService implements OnDestroy {
  private proteus: ProteusJS | null = null;
  private smartContainers: SmartContainers | null = null;
  private containerBreakpoints: ContainerBreakpoints | null = null;
  private fluidTypography: FluidTypography | null = null;
  private performanceMonitor: PerformanceMonitor | null = null;

  private stateSubject = new BehaviorSubject<ProteusState>({
    isInitialized: false,
    isLoading: false,
    error: null
  });

  private metricsSubject = new BehaviorSubject<any>(null);

  public state$: Observable<ProteusState> = this.stateSubject.asObservable();
  public metrics$: Observable<any> = this.metricsSubject.asObservable();

  constructor() {}

  /**
   * Initialize ProteusJS with configuration
   */
  public async initialize(config: ProteusConfig = {}): Promise<void> {
    if (this.stateSubject.value.isInitialized) {
      console.warn('ProteusJS already initialized');
      return;
    }

    this.updateState({ isLoading: true, error: null });

    try {
      // Initialize core systems
      this.smartContainers = new SmartContainers();
      this.containerBreakpoints = new ContainerBreakpoints();
      this.fluidTypography = new FluidTypography();

      if (config.performance?.monitoring) {
        this.performanceMonitor = new PerformanceMonitor({
          minFrameRate: config.performance.targetFrameRate || 55
        });
        this.performanceMonitor.start();
        
        // Subscribe to performance metrics
        this.performanceMonitor.addCallback((metrics) => {
          this.metricsSubject.next(metrics);
        });
      }

      // Initialize ProteusJS
      this.proteus = new ProteusJS({
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

      await this.proteus.initialize();

      // Auto-detect containers if enabled
      if (config.containers?.autoDetect !== false) {
        await this.smartContainers.detectContainers({
          includeInline: config.containers?.includeInline || false
        });
        this.smartContainers.startMonitoring();
      }

      this.updateState({ isInitialized: true, isLoading: false });
      console.log('ProteusJS initialized successfully in Angular');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ isLoading: false, error: errorMessage });
      console.error('Failed to initialize ProteusJS:', error);
      throw error;
    }
  }

  /**
   * Register container breakpoints
   */
  public registerContainerBreakpoints(
    element: HTMLElement,
    breakpoints: Record<string, string>,
    callback?: (breakpoint: string, data: any) => void
  ): string {
    if (!this.containerBreakpoints) {
      throw new Error('ProteusJS not initialized. Call initialize() first.');
    }

    return this.containerBreakpoints.register(element, breakpoints, callback);
  }

  /**
   * Unregister container breakpoints
   */
  public unregisterContainerBreakpoints(registrationId: string): void {
    if (this.containerBreakpoints) {
      this.containerBreakpoints.unregister(registrationId);
    }
  }

  /**
   * Apply fluid typography
   */
  public applyFluidTypography(
    element: HTMLElement,
    config: {
      minSize: number;
      maxSize: number;
      minViewport?: number;
      maxViewport?: number;
      accessibility?: 'none' | 'AA' | 'AAA';
    }
  ): void {
    if (!this.fluidTypography) {
      throw new Error('ProteusJS not initialized. Call initialize() first.');
    }

    this.fluidTypography.applyFluidScaling(element, config);
  }

  /**
   * Remove fluid typography
   */
  public removeFluidTypography(element: HTMLElement): void {
    if (this.fluidTypography) {
      this.fluidTypography.removeFluidScaling(element);
    }
  }

  /**
   * Detect containers
   */
  public async detectContainers(options?: any): Promise<any[]> {
    if (!this.smartContainers) {
      throw new Error('ProteusJS not initialized. Call initialize() first.');
    }

    return this.smartContainers.detectContainers(options);
  }

  /**
   * Record performance operation
   */
  public recordOperation(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.recordOperation();
    }
  }

  /**
   * Get performance recommendations
   */
  public getPerformanceRecommendations(): string[] {
    if (!this.performanceMonitor) {
      return [];
    }

    return this.performanceMonitor.getRecommendations();
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): any {
    if (!this.performanceMonitor) {
      return null;
    }

    return this.performanceMonitor.getMetrics();
  }

  /**
   * Check if ProteusJS is initialized
   */
  public isInitialized(): boolean {
    return this.stateSubject.value.isInitialized;
  }

  /**
   * Get current state
   */
  public getState(): ProteusState {
    return this.stateSubject.value;
  }

  /**
   * Destroy ProteusJS and cleanup resources
   */
  public destroy(): void {
    if (this.proteus) {
      this.proteus.destroy();
      this.proteus = null;
    }

    if (this.smartContainers) {
      this.smartContainers.destroy();
      this.smartContainers = null;
    }

    if (this.containerBreakpoints) {
      this.containerBreakpoints.destroy();
      this.containerBreakpoints = null;
    }

    if (this.fluidTypography) {
      this.fluidTypography.destroy();
      this.fluidTypography = null;
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.stop();
      this.performanceMonitor = null;
    }

    this.updateState({ isInitialized: false, isLoading: false, error: null });
    this.metricsSubject.next(null);
  }

  /**
   * Angular OnDestroy lifecycle hook
   */
  ngOnDestroy(): void {
    this.destroy();
  }

  /**
   * Update internal state
   */
  private updateState(updates: Partial<ProteusState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...updates });
  }
}

/**
 * Angular Module for ProteusJS
 */
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  providers: [ProteusService]
})
export class ProteusModule {
  static forRoot(config?: ProteusConfig): ModuleWithProviders<ProteusModule> {
    return {
      ngModule: ProteusModule,
      providers: [
        ProteusService,
        {
          provide: 'PROTEUS_CONFIG',
          useValue: config || {}
        }
      ]
    };
  }
}
