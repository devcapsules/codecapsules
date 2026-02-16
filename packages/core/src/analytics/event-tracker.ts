/**
 * EventTracker - Captures and queues user interactions for analytics processing
 * Part of the Feedback Flywheel system for continuous improvement
 */

import { UserEvent, EventType, EventData } from '../types/analytics';

export interface EventTrackerConfig {
  batch_size: number; // 50
  flush_interval_ms: number; // 5000 (5 seconds)
  max_queue_size: number; // 1000
  retry_attempts: number; // 3
  storage_enabled: boolean; // persist events locally
  debug_mode: boolean;
}

export class EventTracker {
  private eventQueue: UserEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private config: EventTrackerConfig;

  constructor(config: Partial<EventTrackerConfig> = {}) {
    this.config = {
      batch_size: 50,
      flush_interval_ms: 5000,
      max_queue_size: 1000,
      retry_attempts: 3,
      storage_enabled: true,
      debug_mode: false,
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    
    if (this.config.debug_mode) {
      console.log('[EventTracker] Initialized with config:', this.config);
    }
  }

  /**
   * Track a user event - primary interface for all interactions
   */
  track(
    eventType: EventType, 
    userId: string, 
    data: EventData = {}, 
    capsuleId?: string, 
    playlistId?: string
  ): void {
    const event: UserEvent = {
      id: this.generateEventId(),
      user_id: userId,
      session_id: this.sessionId,
      timestamp: new Date(),
      event_type: eventType,
      capsule_id: capsuleId,
      playlist_id: playlistId,
      data: {
        ...data,
        // Auto-capture common context
        browser_info: this.getBrowserInfo(),
        device_type: this.getDeviceType(),
      }
    };

    this.addToQueue(event);
    
    if (this.config.debug_mode) {
      console.log('[EventTracker] Tracked event:', event);
    }
  }

  /**
   * High-level convenience methods for common interactions
   */
  trackCapsuleStarted(userId: string, capsuleId: string, playlistId?: string): void {
    this.track('capsule_started', userId, {
      start_time: new Date()
    }, capsuleId, playlistId);
  }

  trackCapsuleCompleted(userId: string, capsuleId: string, durationSeconds: number, playlistId?: string): void {
    this.track('capsule_completed', userId, {
      duration_seconds: durationSeconds,
      end_time: new Date(),
      success_rate: 1.0
    }, capsuleId, playlistId);
  }

  trackCapsuleAbandoned(userId: string, capsuleId: string, durationSeconds: number, playlistId?: string): void {
    this.track('capsule_abandoned', userId, {
      duration_seconds: durationSeconds,
      end_time: new Date()
    }, capsuleId, playlistId);
  }

  trackCodeSubmitted(
    userId: string, 
    capsuleId: string, 
    code: string, 
    result: 'success' | 'error' | 'timeout',
    errorMessage?: string,
    attemptNumber: number = 1
  ): void {
    this.track('code_submitted', userId, {
      code_content: code,
      execution_result: result,
      error_message: errorMessage,
      attempt_number: attemptNumber
    }, capsuleId);
  }

  trackErrorEncountered(
    userId: string, 
    capsuleId: string, 
    errorMessage: string, 
    code?: string,
    attemptNumber: number = 1
  ): void {
    this.track('error_encountered', userId, {
      error_message: errorMessage,
      code_content: code,
      attempt_number: attemptNumber
    }, capsuleId);
  }

  trackHintRequested(userId: string, capsuleId: string, hintType?: string): void {
    this.track('hint_requested', userId, {
      // Store hint type in code_content field for now
      code_content: hintType
    }, capsuleId);
  }

  trackUserRating(
    userId: string, 
    capsuleId: string, 
    difficultyRating: number, 
    confidenceLevel: number
  ): void {
    this.track('time_spent', userId, {
      difficulty_rating: difficultyRating,
      confidence_level: confidenceLevel
    }, capsuleId);
  }

  trackNavigation(
    userId: string, 
    fromCapsule: string, 
    toCapsule: string, 
    method: 'next' | 'previous' | 'jump' | 'search',
    playlistId?: string
  ): void {
    this.track('navigation_event', userId, {
      from_capsule: fromCapsule,
      to_capsule: toCapsule,
      navigation_method: method
    }, toCapsule, playlistId);
  }

  /**
   * Force immediate flush of all queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(eventsToFlush);
      
      if (this.config.debug_mode) {
        console.log(`[EventTracker] Flushed ${eventsToFlush.length} events`);
      }
    } catch (error) {
      // Re-queue failed events with retry logic
      this.handleFlushError(eventsToFlush, error);
    }
  }

  /**
   * Clean shutdown - flush remaining events
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    await this.flush();
  }

  private addToQueue(event: UserEvent): void {
    // Prevent queue overflow
    if (this.eventQueue.length >= this.config.max_queue_size) {
      console.warn('[EventTracker] Queue full, dropping oldest event');
      this.eventQueue.shift();
    }

    this.eventQueue.push(event);

    // Store locally if enabled
    if (this.config.storage_enabled) {
      this.storeEventLocally(event);
    }

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.config.batch_size) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flush_interval_ms);
  }

  private async sendEvents(events: UserEvent[]): Promise<void> {
    // TODO: Implement actual API call to analytics service
    // For now, simulate with timeout
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate simulation
          resolve();
        } else {
          reject(new Error('Simulated network error'));
        }
      }, 100);
    });
  }

  private handleFlushError(events: UserEvent[], error: any): void {
    console.error('[EventTracker] Failed to flush events:', error);
    
    // Re-queue events for retry (simplified retry logic)
    events.forEach(event => {
      if (this.eventQueue.length < this.config.max_queue_size) {
        this.eventQueue.unshift(event);
      }
    });
  }

  private storeEventLocally(event: UserEvent): void {
    try {
      const storageKey = `codecapsule_events_${this.sessionId}`;
      const stored = localStorage.getItem(storageKey);
      const events = stored ? JSON.parse(stored) : [];
      
      events.push(event);
      
      // Keep only last 100 events locally
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch (error) {
      console.warn('[EventTracker] Failed to store event locally:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBrowserInfo(): string {
    if (typeof navigator !== 'undefined') {
      return `${navigator.userAgent}`;
    }
    return 'unknown';
  }

  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}

// Singleton instance for global use
let globalTracker: EventTracker | null = null;

export function getEventTracker(config?: Partial<EventTrackerConfig>): EventTracker {
  if (!globalTracker) {
    globalTracker = new EventTracker(config);
  }
  return globalTracker;
}

export function initializeEventTracker(config: Partial<EventTrackerConfig> = {}): EventTracker {
  globalTracker = new EventTracker(config);
  return globalTracker;
}