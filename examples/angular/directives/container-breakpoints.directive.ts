/**
 * Angular Directive for Container Breakpoints
 * Provides declarative container breakpoint functionality
 */

import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ProteusService } from '../proteus.service';

export interface BreakpointChangeEvent {
  breakpoint: string;
  width: number;
  height: number;
  element: HTMLElement;
  previousBreakpoint?: string;
}

@Directive({
  selector: '[proteusContainerBreakpoints]'
})
export class ContainerBreakpointsDirective implements OnInit, OnDestroy, OnChanges {
  @Input('proteusContainerBreakpoints') breakpoints: Record<string, string> = {};
  @Output() breakpointChange = new EventEmitter<BreakpointChangeEvent>();
  @Output() proteusBreakpointChange = new EventEmitter<BreakpointChangeEvent>();

  private registrationId: string = '';
  private currentBreakpoint: string = '';

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private proteusService: ProteusService
  ) {}

  ngOnInit(): void {
    this.registerBreakpoints();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['breakpoints'] && !changes['breakpoints'].firstChange) {
      this.unregisterBreakpoints();
      this.registerBreakpoints();
    }
  }

  ngOnDestroy(): void {
    this.unregisterBreakpoints();
  }

  private registerBreakpoints(): void {
    if (!this.proteusService.isInitialized() || !this.breakpoints || Object.keys(this.breakpoints).length === 0) {
      return;
    }

    try {
      this.registrationId = this.proteusService.registerContainerBreakpoints(
        this.elementRef.nativeElement,
        this.breakpoints,
        (breakpoint: string, data: any) => {
          const event: BreakpointChangeEvent = {
            breakpoint,
            width: data.width,
            height: data.height,
            element: data.element,
            previousBreakpoint: this.currentBreakpoint || undefined
          };

          this.currentBreakpoint = breakpoint;

          // Emit both events for flexibility
          this.breakpointChange.emit(event);
          this.proteusBreakpointChange.emit(event);

          // Add CSS classes for styling
          this.updateBreakpointClasses(breakpoint);
        }
      );
    } catch (error) {
      console.error('Failed to register container breakpoints:', error);
    }
  }

  private unregisterBreakpoints(): void {
    if (this.registrationId) {
      this.proteusService.unregisterContainerBreakpoints(this.registrationId);
      this.registrationId = '';
    }
  }

  private updateBreakpointClasses(breakpoint: string): void {
    const element = this.elementRef.nativeElement;
    
    // Remove existing breakpoint classes
    const existingClasses = Array.from(element.classList).filter(cls => cls.startsWith('proteus-bp-'));
    existingClasses.forEach(cls => element.classList.remove(cls));

    // Add new breakpoint class
    element.classList.add(`proteus-bp-${breakpoint}`);
    
    // Set data attribute
    element.setAttribute('data-proteus-breakpoint', breakpoint);
  }

  /**
   * Get current breakpoint
   */
  public getCurrentBreakpoint(): string {
    return this.currentBreakpoint;
  }
}

/**
 * Fluid Typography Directive
 */
@Directive({
  selector: '[proteusFluidTypography]'
})
export class FluidTypographyDirective implements OnInit, OnDestroy, OnChanges {
  @Input('proteusFluidTypography') config: {
    minSize: number;
    maxSize: number;
    minViewport?: number;
    maxViewport?: number;
    accessibility?: 'none' | 'AA' | 'AAA';
  } = { minSize: 14, maxSize: 18 };

  private isApplied: boolean = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private proteusService: ProteusService
  ) {}

  ngOnInit(): void {
    this.applyFluidTypography();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.removeFluidTypography();
      this.applyFluidTypography();
    }
  }

  ngOnDestroy(): void {
    this.removeFluidTypography();
  }

  private applyFluidTypography(): void {
    if (!this.proteusService.isInitialized() || this.isApplied) {
      return;
    }

    try {
      this.proteusService.applyFluidTypography(this.elementRef.nativeElement, this.config);
      this.isApplied = true;
    } catch (error) {
      console.error('Failed to apply fluid typography:', error);
    }
  }

  private removeFluidTypography(): void {
    if (this.isApplied) {
      this.proteusService.removeFluidTypography(this.elementRef.nativeElement);
      this.isApplied = false;
    }
  }
}

/**
 * Performance Tracking Directive
 */
@Directive({
  selector: '[proteusPerformanceTracker]'
})
export class PerformanceTrackerDirective implements OnInit {
  @Input('proteusPerformanceTracker') trackEvents: string[] = ['click', 'scroll'];

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private proteusService: ProteusService
  ) {}

  ngOnInit(): void {
    this.setupEventTracking();
  }

  private setupEventTracking(): void {
    if (!this.proteusService.isInitialized()) {
      return;
    }

    const element = this.elementRef.nativeElement;

    this.trackEvents.forEach(eventType => {
      element.addEventListener(eventType, () => {
        this.proteusService.recordOperation();
      });
    });
  }
}

/**
 * Responsive Container Directive
 */
@Directive({
  selector: '[proteusResponsiveContainer]'
})
export class ResponsiveContainerDirective implements OnInit {
  @Input('proteusResponsiveContainer') options: {
    autoDetect?: boolean;
    includeInline?: boolean;
  } = {};

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private proteusService: ProteusService
  ) {}

  ngOnInit(): void {
    this.setupResponsiveContainer();
  }

  private async setupResponsiveContainer(): Promise<void> {
    if (!this.proteusService.isInitialized()) {
      return;
    }

    try {
      // Detect containers within this element
      await this.proteusService.detectContainers({
        ...this.options,
        rootElement: this.elementRef.nativeElement
      });

      // Add container class for styling
      this.elementRef.nativeElement.classList.add('proteus-responsive-container');
      
    } catch (error) {
      console.error('Failed to setup responsive container:', error);
    }
  }
}

/**
 * Export all directives
 */
export const PROTEUS_DIRECTIVES = [
  ContainerBreakpointsDirective,
  FluidTypographyDirective,
  PerformanceTrackerDirective,
  ResponsiveContainerDirective
];
