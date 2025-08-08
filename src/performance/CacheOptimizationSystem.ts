/**
 * Cache Optimization System for ProteusJS
 * Intelligent caching with memory pressure-based eviction
 */

export interface CacheConfig {
  maxSize: number;
  maxAge: number;
  memoryThreshold: number;
  evictionStrategy: 'lru' | 'lfu' | 'ttl' | 'adaptive';
  compressionEnabled: boolean;
  persistentStorage: boolean;
  storageKey: string;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  ttl?: number;
  compressed?: boolean;
}

export interface CacheMetrics {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  compressionRatio: number;
}

export class CacheOptimizationSystem<T = any> {
  private config: Required<CacheConfig>;
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private metrics: CacheMetrics;
  private cleanupTimer: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100,
      maxAge: 300000, // 5 minutes
      memoryThreshold: 10 * 1024 * 1024, // 10MB
      evictionStrategy: 'adaptive',
      compressionEnabled: true,
      persistentStorage: false,
      storageKey: 'proteus-cache',
      ...config
    };

    this.metrics = this.createInitialMetrics();
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Get value from cache
   */
  public get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.missRate++;
      return null;
    }

    // Check TTL
    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      this.metrics.missRate++;
      return null;
    }

    // Update access info
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.updateAccessOrder(key);
    
    this.metrics.hitRate++;
    
    // Decompress if needed
    let value = entry.value;
    if (entry.compressed && this.config.compressionEnabled) {
      value = this.decompress(value);
    }
    
    return value;
  }

  /**
   * Set value in cache
   */
  public set(key: string, value: T, ttl?: number): void {
    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictEntries(1);
    }

    // Compress value if enabled
    let finalValue = value;
    let compressed = false;
    if (this.config.compressionEnabled && this.shouldCompress(value)) {
      finalValue = this.compress(value);
      compressed = true;
    }

    const size = this.calculateSize(finalValue);
    const entry: CacheEntry<T> = {
      key,
      value: finalValue,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      size,
      ...(ttl !== undefined && { ttl }),
      compressed
    };

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.updateMetrics();

    // Check memory pressure
    this.checkMemoryPressure();
  }

  /**
   * Delete entry from cache
   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.updateMetrics();
    }
    return deleted;
  }

  /**
   * Check if key exists in cache
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.updateMetrics();
  }

  /**
   * Get cache metrics
   */
  public getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Cache calculation result with automatic key generation
   */
  public cacheCalculation<R>(
    fn: () => R,
    keyParts: (string | number)[],
    ttl?: number
  ): R {
    const key = this.generateKey('calc', keyParts);
    
    let result = this.get(key) as R;
    if (result === null) {
      result = fn();
      this.set(key, result as unknown as T, ttl);
    }
    
    return result;
  }

  /**
   * Cache layout measurement
   */
  public cacheLayoutMeasurement(
    element: Element,
    measurement: () => DOMRect | number,
    ttl: number = 1000 // Short TTL for layout measurements
  ): DOMRect | number {
    const key = this.generateKey('layout', [
      element.tagName,
      element.className,
      element.id || 'no-id'
    ]);
    
    let result = this.get(key) as DOMRect | number;
    if (result === null) {
      result = measurement();
      this.set(key, result as unknown as T, ttl);
    }
    
    return result;
  }

  /**
   * Cache container state
   */
  public cacheContainerState(
    containerId: string,
    state: any,
    ttl: number = 5000
  ): void {
    const key = this.generateKey('container', [containerId]);
    this.set(key, state, ttl);
  }

  /**
   * Get cached container state
   */
  public getCachedContainerState(containerId: string): any {
    const key = this.generateKey('container', [containerId]);
    return this.get(key);
  }

  /**
   * Cache computed styles
   */
  public cacheComputedStyles(
    element: Element,
    properties: string[],
    ttl: number = 2000
  ): CSSStyleDeclaration | null {
    const key = this.generateKey('styles', [
      element.tagName,
      element.className,
      properties.join(',')
    ]);
    
    let styles = this.get(key) as CSSStyleDeclaration;
    if (styles === null) {
      styles = window.getComputedStyle(element);
      // Create a plain object to avoid caching live CSSStyleDeclaration
      const stylesObj: Record<string, string> = {};
      properties.forEach(prop => {
        stylesObj[prop] = styles.getPropertyValue(prop);
      });
      this.set(key, stylesObj as any, ttl);
      return stylesObj as any;
    }
    
    return styles;
  }

  /**
   * Optimize cache based on memory pressure
   */
  public optimize(): void {
    // Remove expired entries
    this.removeExpiredEntries();
    
    // Check memory pressure and evict if needed
    this.checkMemoryPressure();
    
    // Compress large entries
    this.compressLargeEntries();
    
    // Update metrics
    this.updateMetrics();
  }

  /**
   * Destroy cache system
   */
  public destroy(): void {
    this.stopCleanupTimer();
    this.saveToStorage();
    this.clear();
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(count: number): void {
    const strategy = this.config.evictionStrategy;
    let keysToEvict: string[] = [];

    switch (strategy) {
      case 'lru':
        keysToEvict = this.getLRUKeys(count);
        break;
      case 'lfu':
        keysToEvict = this.getLFUKeys(count);
        break;
      case 'ttl':
        keysToEvict = this.getTTLKeys(count);
        break;
      case 'adaptive':
        keysToEvict = this.getAdaptiveKeys(count);
        break;
    }

    keysToEvict.forEach(key => {
      this.delete(key);
      this.metrics.evictions++;
    });
  }

  /**
   * Get LRU (Least Recently Used) keys
   */
  private getLRUKeys(count: number): string[] {
    return this.accessOrder.slice(0, count);
  }

  /**
   * Get LFU (Least Frequently Used) keys
   */
  private getLFUKeys(count: number): string[] {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    return entries.slice(0, count).map(([key]) => key);
  }

  /**
   * Get TTL-based keys (oldest first)
   */
  private getTTLKeys(count: number): string[] {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    return entries.slice(0, count).map(([key]) => key);
  }

  /**
   * Get adaptive eviction keys (combination of strategies)
   */
  private getAdaptiveKeys(count: number): string[] {
    const entries = Array.from(this.cache.entries());
    
    // Score based on age, access frequency, and size
    entries.forEach(([key, entry]) => {
      const age = Date.now() - entry.lastAccessed;
      const frequency = entry.accessCount;
      const size = entry.size;
      
      // Lower score = higher priority for eviction
      (entry as any).score = (age / 1000) + (size / 1024) - (frequency * 10);
    });
    
    entries.sort((a, b) => (b[1] as any).score - (a[1] as any).score);
    return entries.slice(0, count).map(([key]) => key);
  }

  /**
   * Check memory pressure and evict if needed
   */
  private checkMemoryPressure(): void {
    const totalSize = this.getTotalSize();
    
    if (totalSize > this.config.memoryThreshold) {
      const evictCount = Math.ceil(this.cache.size * 0.2); // Evict 20%
      this.evictEntries(evictCount);
    }
  }

  /**
   * Remove expired entries
   */
  private removeExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      const isExpired = entry.ttl 
        ? now > entry.timestamp + entry.ttl
        : now > entry.timestamp + this.config.maxAge;
      
      if (isExpired) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Compress large entries
   */
  private compressLargeEntries(): void {
    if (!this.config.compressionEnabled) return;

    this.cache.forEach((entry, key) => {
      if (!entry.compressed && entry.size > 1024) { // 1KB threshold
        const compressed = this.compress(entry.value);
        const compressedSize = this.calculateSize(compressed);
        
        if (compressedSize < entry.size * 0.8) { // Only if 20% reduction
          entry.value = compressed;
          entry.size = compressedSize;
          entry.compressed = true;
        }
      }
    });
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Generate cache key
   */
  private generateKey(prefix: string, parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Calculate size of value
   */
  private calculateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2; // Approximate UTF-16 size
    }
    
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024; // Default estimate
    }
  }

  /**
   * Get total cache size
   */
  private getTotalSize(): number {
    let total = 0;
    this.cache.forEach(entry => {
      total += entry.size;
    });
    return total;
  }

  /**
   * Check if value should be compressed
   */
  private shouldCompress(value: any): boolean {
    const size = this.calculateSize(value);
    return size > 512; // Compress values larger than 512 bytes
  }

  /**
   * Compress value (simple implementation)
   */
  private compress(value: any): any {
    // In a real implementation, you might use a compression library
    // For now, we'll just stringify and indicate it's compressed
    return {
      __compressed: true,
      data: JSON.stringify(value)
    };
  }

  /**
   * Decompress value
   */
  private decompress(value: any): any {
    if (value && value.__compressed) {
      return JSON.parse(value.data);
    }
    return value;
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.totalEntries = this.cache.size;
    this.metrics.totalSize = this.getTotalSize();

    const totalRequests = this.metrics.hitRate + this.metrics.missRate;
    if (totalRequests > 0) {
      this.metrics.hitRate = this.metrics.hitRate / totalRequests;
      this.metrics.missRate = this.metrics.missRate / totalRequests;
    }

    // Calculate compression ratio
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let compressedCount = 0;

    this.cache.forEach(entry => {
      if (entry.compressed) {
        compressedCount++;
        totalCompressedSize += entry.size;
        // Estimate original size (compressed data is typically 30-70% of original)
        totalOriginalSize += entry.size / 0.5; // Assume 50% compression
      }
    });

    if (compressedCount > 0 && totalOriginalSize > 0) {
      this.metrics.compressionRatio = totalCompressedSize / totalOriginalSize;
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.optimize();
    }, 30000); // Cleanup every 30 seconds
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Load cache from persistent storage
   */
  private loadFromStorage(): void {
    if (!this.config.persistentStorage) return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((entry: CacheEntry<T>) => {
          this.cache.set(entry.key, entry);
          this.accessOrder.push(entry.key);
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to persistent storage
   */
  private saveToStorage(): void {
    if (!this.config.persistentStorage) return;

    try {
      const data = Array.from(this.cache.values());
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): CacheMetrics {
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      compressionRatio: 0
    };
  }
}
