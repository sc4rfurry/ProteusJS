/**
 * Event System for ProteusJS
 * Handles all internal and external events
 */

import type { ProteusEvent } from '../types';

export type EventCallback = (event: ProteusEvent) => void;

export class EventSystem {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize the event system
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Add event listener
   */
  public on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const callbacks = this.listeners.get(eventType)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Add one-time event listener
   */
  public once(eventType: string, callback: EventCallback): () => void {
    const unsubscribe = this.on(eventType, (event) => {
      callback(event);
      unsubscribe();
    });
    return unsubscribe;
  }

  /**
   * Remove event listener
   */
  public off(eventType: string, callback?: EventCallback): void {
    if (!callback) {
      // Remove all listeners for this event type
      this.listeners.delete(eventType);
      return;
    }

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit event
   */
  public emit(eventType: string, detail?: any, target?: Element): void {
    const callbacks = this.listeners.get(eventType);
    if (!callbacks || callbacks.size === 0) return;

    const event: ProteusEvent = {
      type: eventType,
      target: target || document.documentElement,
      detail,
      timestamp: Date.now()
    };

    // Execute callbacks
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`ProteusJS: Error in event listener for "${eventType}":`, error);
      }
    });
  }

  /**
   * Get all event types with listeners
   */
  public getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get listener count for event type
   */
  public getListenerCount(eventType: string): number {
    const callbacks = this.listeners.get(eventType);
    return callbacks ? callbacks.size : 0;
  }

  /**
   * Check if event type has listeners
   */
  public hasListeners(eventType: string): boolean {
    return this.getListenerCount(eventType) > 0;
  }

  /**
   * Clear all listeners
   */
  public clear(): void {
    this.listeners.clear();
  }

  /**
   * Destroy the event system
   */
  public destroy(): void {
    this.clear();
    this.initialized = false;
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): object {
    const info: Record<string, number> = {};
    this.listeners.forEach((callbacks, eventType) => {
      info[eventType] = callbacks.size;
    });
    return {
      initialized: this.initialized,
      totalEventTypes: this.listeners.size,
      listeners: info
    };
  }
}
