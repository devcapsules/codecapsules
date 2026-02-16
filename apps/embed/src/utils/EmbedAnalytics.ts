/**
 * Embed Analytics - Event tracking for embedded capsule widgets
 * 
 * This handles real-time analytics collection for embedded widgets,
 * tracking pedagogical intelligence and content engagement metrics.
 */

export interface AnalyticsEvent {
  type: 'test_failed' | 'test_passed' | 'run_clicked' | 'hint_viewed' | 'solution_viewed' | 'session_started' | 'session_completed'
  capsuleId: string
  widgetId: string
  timestamp: number
  sessionId: string
  metadata?: {
    // Test execution specific
    language?: string
    difficulty?: string
    testCaseIndex?: number
    executionTime?: number
    errorType?: string
    passedTests?: number
    totalTests?: number
    
    // Pedagogical metrics
    hintsUsed?: number
    solutionViewed?: boolean
    timeToCompletion?: number
    attemptsCount?: number
    
    // Context data
    userAgent?: string
    referrer?: string
    embeddedDomain?: string
  }
}

class EmbedAnalytics {
  private sessionId: string
  private apiUrl: string
  private eventQueue: AnalyticsEvent[] = []
  private flushInterval?: number
  private sessionStart: number
  private attemptsCount: number = 0

  constructor() {
    this.sessionId = this.generateSessionId()
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    this.sessionStart = Date.now()
    
    // Auto-flush events every 5 seconds
    this.flushInterval = window.setInterval(() => {
      this.flush()
    }, 5000)

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.trackSessionCompleted()
      this.flush()
    })
  }

  private generateSessionId(): string {
    return `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private track(eventType: AnalyticsEvent['type'], capsuleId: string, widgetId: string, metadata?: AnalyticsEvent['metadata']) {
    const event: AnalyticsEvent = {
      type: eventType,
      capsuleId,
      widgetId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        embeddedDomain: window.location.hostname
      }
    }

    this.eventQueue.push(event)
    console.log(`📊 Analytics Event: ${eventType}`, event)

    // Auto-flush high-priority events immediately
    if (['test_passed', 'session_completed'].includes(eventType)) {
      this.flush()
    }
  }

  public trackSessionStarted(capsuleId: string, widgetId: string, language: string, difficulty: string) {
    this.track('session_started', capsuleId, widgetId, {
      language,
      difficulty
    })
  }

  public trackRunClicked(capsuleId: string, widgetId: string, language: string) {
    this.attemptsCount++
    this.track('run_clicked', capsuleId, widgetId, {
      language,
      attemptsCount: this.attemptsCount
    })
  }

  public trackTestFailed(capsuleId: string, widgetId: string, failedTests: any[], passedTests: number, totalTests: number, language: string, executionTime: number) {
    this.track('test_failed', capsuleId, widgetId, {
      language,
      passedTests,
      totalTests,
      executionTime,
      attemptsCount: this.attemptsCount,
      errorType: failedTests[0]?.error || 'test_failure'
    })
  }

  public trackTestPassed(capsuleId: string, widgetId: string, language: string, executionTime: number, totalTests: number) {
    const timeToCompletion = Date.now() - this.sessionStart
    this.track('test_passed', capsuleId, widgetId, {
      language,
      totalTests,
      executionTime,
      timeToCompletion,
      attemptsCount: this.attemptsCount
    })
  }

  public trackHintViewed(capsuleId: string, widgetId: string, hintIndex: number) {
    this.track('hint_viewed', capsuleId, widgetId, {
      testCaseIndex: hintIndex
    })
  }

  public trackSolutionViewed(capsuleId: string, widgetId: string) {
    this.track('solution_viewed', capsuleId, widgetId, {
      solutionViewed: true,
      attemptsCount: this.attemptsCount
    })
  }

  public trackSessionCompleted(success?: boolean) {
    // This will be called when widget session ends
  }

  private async flush() {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await fetch(`${this.apiUrl}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      })
    } catch (error) {
      console.warn('📊 Analytics flush failed:', error)
      // Re-queue events on failure
      this.eventQueue.unshift(...events)
    }
  }

  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

// Global analytics instance for the embed
export const embedAnalytics = new EmbedAnalytics()