/**
 * Responsive Images System for ProteusJS
 * Next-generation image optimization with container-based sizing
 */

export interface ImageConfig {
  formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
  sizes: number[];
  quality: number;
  lazyLoading: boolean;
  artDirection: boolean;
  containerBased: boolean;
  placeholder: 'blur' | 'color' | 'svg' | 'none';
  placeholderColor?: string;
  fadeInDuration: number;
  retina: boolean;
  progressive: boolean;
}

export interface ImageSource {
  src: string;
  format: string;
  width: number;
  height: number;
  quality: number;
  media?: string;
}

export interface ImageState {
  loaded: boolean;
  loading: boolean;
  error: boolean;
  currentSrc: string;
  containerSize: { width: number; height: number };
  optimalSource: ImageSource | null;
  intersecting: boolean;
}

export class ResponsiveImages {
  private element: Element;
  private config: Required<ImageConfig>;
  private state: ImageState;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private sources: ImageSource[] = [];

  private static readonly FORMAT_SUPPORT = new Map<string, boolean>();
  private static readonly MIME_TYPES = {
    'webp': 'image/webp',
    'avif': 'image/avif',
    'jpeg': 'image/jpeg',
    'png': 'image/png'
  };

  constructor(element: Element, config: Partial<ImageConfig> = {}) {
    this.element = element;
    this.config = {
      formats: ['avif', 'webp', 'jpeg'],
      sizes: [320, 640, 768, 1024, 1280, 1920],
      quality: 80,
      lazyLoading: true,
      artDirection: false,
      containerBased: true,
      placeholder: 'blur',
      placeholderColor: '#f0f0f0',
      fadeInDuration: 300,
      retina: true,
      progressive: true,
      ...config
    };

    this.state = this.createInitialState();
    this.setupImage();
  }

  /**
   * Activate responsive image system
   */
  public activate(): void {
    this.detectFormatSupport();
    this.generateSources();
    this.setupObservers();
    
    if (!this.config.lazyLoading) {
      this.loadImage();
    }
  }

  /**
   * Deactivate and clean up
   */
  public deactivate(): void {
    this.cleanupObservers();
    this.removeImageFeatures();
  }

  /**
   * Update image configuration
   */
  public updateConfig(newConfig: Partial<ImageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.generateSources();
    this.updateImage();
  }

  /**
   * Get current image state
   */
  public getState(): ImageState {
    return { ...this.state };
  }

  /**
   * Force image load
   */
  public load(): void {
    this.loadImage();
  }

  /**
   * Preload image
   */
  public preload(): Promise<void> {
    return new Promise((resolve, reject) => {
      const optimalSource = this.getOptimalSource();
      if (!optimalSource) {
        reject(new Error('No optimal source found'));
        return;
      }

      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to preload image'));
      img.src = optimalSource.src;
    });
  }

  /**
   * Setup initial image
   */
  private setupImage(): void {
    this.addPlaceholder();
    this.setupImageElement();
  }

  /**
   * Detect browser format support
   */
  private async detectFormatSupport(): Promise<void> {
    const formats = ['webp', 'avif'];
    
    for (const format of formats) {
      if (!ResponsiveImages.FORMAT_SUPPORT.has(format)) {
        const supported = await this.testFormatSupport(format);
        ResponsiveImages.FORMAT_SUPPORT.set(format, supported);
      }
    }
  }

  /**
   * Test if browser supports image format
   */
  private testFormatSupport(format: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
      
      // Test images (1x1 pixel)
      const testImages = {
        'webp': 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
        'avif': 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      };
      
      img.src = testImages[format as keyof typeof testImages] || '';
    });
  }

  /**
   * Generate image sources
   */
  private generateSources(): void {
    const baseSrc = this.getBaseSrc();
    if (!baseSrc) return;

    this.sources = [];
    
    // Generate sources for each format and size
    this.config.formats.forEach(format => {
      if (this.isFormatSupported(format)) {
        this.config.sizes.forEach(width => {
          const source: ImageSource = {
            src: this.generateSrcUrl(baseSrc, format, width),
            format,
            width,
            height: this.calculateHeight(width),
            quality: this.config.quality
          };
          
          if (this.config.containerBased) {
            source.media = `(min-width: ${width}px)`;
          }
          
          this.sources.push(source);
          
          // Add retina version
          if (this.config.retina) {
            const retinaSource = {
              ...source,
              src: this.generateSrcUrl(baseSrc, format, width * 2),
              width: width * 2,
              height: this.calculateHeight(width * 2)
            };
            if (source.media) {
              retinaSource.media = `${source.media} and (-webkit-min-device-pixel-ratio: 2)`;
            }
            this.sources.push(retinaSource);
          }
        });
      }
    });
    
    // Sort by format preference and size
    this.sources.sort((a, b) => {
      const formatPriorityA = this.config.formats.indexOf(a.format as any);
      const formatPriorityB = this.config.formats.indexOf(b.format as any);
      
      if (formatPriorityA !== formatPriorityB) {
        return formatPriorityA - formatPriorityB;
      }
      
      return a.width - b.width;
    });
  }

  /**
   * Get optimal image source
   */
  private getOptimalSource(): ImageSource | null {
    if (this.sources.length === 0) return null;
    
    const containerWidth = this.state.containerSize.width;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const targetWidth = containerWidth * devicePixelRatio;
    
    // Find best size match
    const suitableSources = this.sources.filter(source => 
      source.width >= targetWidth || source === this.sources[this.sources.length - 1]
    );
    
    // Return smallest suitable source
    return suitableSources[0] || this.sources[this.sources.length - 1] || null;
  }

  /**
   * Load image
   */
  private loadImage(): void {
    if (this.state.loading || this.state.loaded) return;
    
    this.state.loading = true;
    const optimalSource = this.getOptimalSource();
    
    if (!optimalSource) {
      this.state.loading = false;
      this.state.error = true;
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      this.state.loaded = true;
      this.state.loading = false;
      this.state.currentSrc = optimalSource.src;
      this.state.optimalSource = optimalSource;
      
      this.applyImage(img);
      this.removePlaceholder();
    };
    
    img.onerror = () => {
      this.state.loading = false;
      this.state.error = true;
      this.handleImageError();
    };
    
    img.src = optimalSource.src;
  }

  /**
   * Apply loaded image
   */
  private applyImage(img: HTMLImageElement): void {
    if (this.element.tagName === 'IMG') {
      const imgElement = this.element as HTMLImageElement;
      imgElement.src = img.src;
      imgElement.style.opacity = '0';
      
      // Fade in animation
      requestAnimationFrame(() => {
        imgElement.style.transition = `opacity ${this.config.fadeInDuration}ms ease-in-out`;
        imgElement.style.opacity = '1';
      });
    } else {
      // Apply as background image
      const htmlElement = this.element as HTMLElement;
      htmlElement.style.backgroundImage = `url(${img.src})`;
      htmlElement.style.backgroundSize = 'cover';
      htmlElement.style.backgroundPosition = 'center';
      htmlElement.style.opacity = '0';
      
      requestAnimationFrame(() => {
        htmlElement.style.transition = `opacity ${this.config.fadeInDuration}ms ease-in-out`;
        htmlElement.style.opacity = '1';
      });
    }
  }

  /**
   * Add placeholder
   */
  private addPlaceholder(): void {
    if (this.config.placeholder === 'none') return;
    
    const htmlElement = this.element as HTMLElement;
    
    switch (this.config.placeholder) {
      case 'color':
        htmlElement.style.backgroundColor = this.config.placeholderColor || '#f0f0f0';
        break;
      case 'blur':
        this.addBlurPlaceholder();
        break;
      case 'svg':
        this.addSvgPlaceholder();
        break;
    }
  }

  /**
   * Add blur placeholder
   */
  private addBlurPlaceholder(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 30;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 40, 30);
      gradient.addColorStop(0, '#f0f0f0');
      gradient.addColorStop(1, '#e0e0e0');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 40, 30);
    }
    
    const blurDataUrl = canvas.toDataURL();
    const htmlElement = this.element as HTMLElement;
    
    if (this.element.tagName === 'IMG') {
      (this.element as HTMLImageElement).src = blurDataUrl;
    } else {
      htmlElement.style.backgroundImage = `url(${blurDataUrl})`;
      htmlElement.style.filter = 'blur(5px)';
    }
  }

  /**
   * Add SVG placeholder
   */
  private addSvgPlaceholder(): void {
    const svg = `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="${this.config.placeholderColor}"/>
        <circle cx="200" cy="150" r="50" fill="#ddd"/>
      </svg>
    `)}`;
    
    if (this.element.tagName === 'IMG') {
      (this.element as HTMLImageElement).src = svg;
    } else {
      (this.element as HTMLElement).style.backgroundImage = `url(${svg})`;
    }
  }

  /**
   * Remove placeholder
   */
  private removePlaceholder(): void {
    const htmlElement = this.element as HTMLElement;
    
    if (this.config.placeholder === 'blur') {
      htmlElement.style.filter = '';
    }
    
    if (this.config.placeholder === 'color') {
      htmlElement.style.backgroundColor = '';
    }
  }

  /**
   * Handle image loading error
   */
  private handleImageError(): void {
    console.warn('ProteusJS: Failed to load image', this.element);
    
    // Try fallback format
    const fallbackSource = this.sources.find(source => source.format === 'jpeg');
    if (fallbackSource && fallbackSource !== this.state.optimalSource) {
      this.state.error = false;
      this.state.loading = true;
      
      const img = new Image();
      img.onload = () => {
        this.state.loaded = true;
        this.state.loading = false;
        this.applyImage(img);
      };
      img.src = fallbackSource.src;
    }
  }

  /**
   * Setup image element
   */
  private setupImageElement(): void {
    if (this.element.tagName === 'IMG') {
      const imgElement = this.element as HTMLImageElement;
      imgElement.loading = this.config.lazyLoading ? 'lazy' : 'eager';
      imgElement.decoding = 'async';
    }
  }

  /**
   * Update image based on container size
   */
  private updateImage(): void {
    const newOptimalSource = this.getOptimalSource();
    
    if (newOptimalSource && newOptimalSource !== this.state.optimalSource) {
      this.state.loaded = false;
      this.loadImage();
    }
  }

  /**
   * Get base source URL
   */
  private getBaseSrc(): string | null {
    if (this.element.tagName === 'IMG') {
      return (this.element as HTMLImageElement).src ||
             (this.element as HTMLImageElement).dataset['src'] || null;
    }

    return (this.element as HTMLElement).dataset['src'] || null;
  }

  /**
   * Generate source URL with format and size
   */
  private generateSrcUrl(baseSrc: string, format: string, width: number): string {
    // This would typically integrate with an image CDN or processing service
    // For now, return the base URL with query parameters
    const url = new URL(baseSrc, window.location.origin);
    url.searchParams.set('format', format);
    url.searchParams.set('width', width.toString());
    url.searchParams.set('quality', this.config.quality.toString());
    
    if (this.config.progressive) {
      url.searchParams.set('progressive', 'true');
    }
    
    return url.toString();
  }

  /**
   * Calculate height based on width (maintaining aspect ratio)
   */
  private calculateHeight(width: number): number {
    // Default 16:9 aspect ratio, could be made configurable
    return Math.round(width * (9 / 16));
  }

  /**
   * Check if format is supported
   */
  private isFormatSupported(format: string): boolean {
    if (format === 'jpeg' || format === 'png') return true;
    return ResponsiveImages.FORMAT_SUPPORT.get(format) || false;
  }

  /**
   * Setup observers
   */
  private setupObservers(): void {
    // Container size observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.state.containerSize = {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        };
        
        if (this.config.containerBased) {
          this.updateImage();
        }
      }
    });
    this.resizeObserver.observe(this.element);
    
    // Lazy loading observer
    if (this.config.lazyLoading) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.state.intersecting = true;
            this.loadImage();
            this.intersectionObserver?.unobserve(this.element);
          }
        }
      }, { rootMargin: '50px' });
      
      this.intersectionObserver.observe(this.element);
    }
  }

  /**
   * Clean up observers
   */
  private cleanupObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }

  /**
   * Remove image features
   */
  private removeImageFeatures(): void {
    this.removePlaceholder();
    
    const htmlElement = this.element as HTMLElement;
    htmlElement.style.transition = '';
    htmlElement.style.opacity = '';
    htmlElement.style.filter = '';
  }

  /**
   * Create initial state
   */
  private createInitialState(): ImageState {
    return {
      loaded: false,
      loading: false,
      error: false,
      currentSrc: '',
      containerSize: { width: 0, height: 0 },
      optimalSource: null,
      intersecting: false
    };
  }
}
