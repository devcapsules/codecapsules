/**
 * Embed Analytics - Event tracking for embedded capsule widgets
 * 
 * This handles real-time analytics collection for embedded widgets,
 * tracking pedagogical intelligence and content engagement metrics.
 * 
 * Learner Identity (Passive-Aggressive Upgrade):
 *   - Default: auto-generated persistent UUID via localStorage ("Student #abc123")
 *   - After a successful test pass, a non-blocking toast asks for a name
 *   - If the learner enters a name, we merge it with their UUID so the
 *     creator dashboard shows "Alice" instead of "Student #abc123"
 */

export interface AnalyticsEvent {
  type: 'test_failed' | 'test_passed' | 'run_clicked' | 'hint_viewed' | 'solution_viewed' | 'session_started' | 'session_completed' | 'learner_identified'
  capsuleId: string
  widgetId: string
  /** Headless Playlist context — courseId for analytics grouping */
  courseId?: string
  timestamp: number
  sessionId: string
  learnerId?: string
  learnerName?: string | null
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

/* ── localStorage keys ── */
const LEARNER_ID_KEY  = 'edgeforge_learner_id'
const LEARNER_NAME_KEY = 'edgeforge_learner_name'
/** Once the learner dismisses or submits the toast, don't show again in this browser */
const LEARNER_PROMPTED_KEY = 'edgeforge_learner_prompted'

class EmbedAnalytics {
  private sessionId: string
  private apiUrl: string
  private eventQueue: AnalyticsEvent[] = []
  private flushInterval?: number
  private sessionStart: number
  private attemptsCount: number = 0
  /** Headless Playlist courseId — set once from URL and attached to all events */
  public courseId: string | null = null

  /** Persistent learner UUID (survives page reloads / cross-capsule on same domain) */
  public learnerId: string
  /** Human-readable name, null until the learner self-identifies */
  public learnerName: string | null = null
  /** Whether the name-prompt toast has already been shown this session */
  private _prompted = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    this.sessionStart = Date.now()

    // ── Persistent Learner ID (Sol 1) ─────────────────────────────────────
    this.learnerId  = this.getOrCreateLearnerId()
    this.learnerName = this.getStoredLearnerName()
    this._prompted  = localStorage.getItem(LEARNER_PROMPTED_KEY) === '1'
    
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

  /* ══════════════════════════════════════════════════════════════════════════
     Learner Identity helpers
     ══════════════════════════════════════════════════════════════════════════ */

  private getOrCreateLearnerId(): string {
    try {
      let id = localStorage.getItem(LEARNER_ID_KEY)
      if (!id) {
        // crypto.randomUUID() is available in all modern browsers + iframes
        id = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`
        localStorage.setItem(LEARNER_ID_KEY, id)
      }
      return id
    } catch {
      // localStorage blocked (e.g. Safari cross-origin iframe with ITP)
      return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
    }
  }

  private getStoredLearnerName(): string | null {
    try { return localStorage.getItem(LEARNER_NAME_KEY) } catch { return null }
  }

  /** Called when the learner enters a name in the leaderboard toast */
  public setLearnerName(name: string, capsuleId: string, widgetId: string) {
    const trimmed = name.trim().slice(0, 100)
    if (!trimmed) return
    this.learnerName = trimmed
    try {
      localStorage.setItem(LEARNER_NAME_KEY, trimmed)
      localStorage.setItem(LEARNER_PROMPTED_KEY, '1')
    } catch { /* ignore */ }
    this._prompted = true

    // Fire a special event so the backend can backfill the name for this learnerId
    this.track('learner_identified', capsuleId, widgetId, {})
  }

  /** Mark toast as dismissed (don't show again) */
  public dismissNamePrompt() {
    this._prompted = true
    try { localStorage.setItem(LEARNER_PROMPTED_KEY, '1') } catch { /* ignore */ }
  }

  /** Should we show the "enter your name" toast? */
  public shouldPromptForName(): boolean {
    return !this._prompted && !this.learnerName
  }

  private generateSessionId(): string {
    return `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private track(eventType: AnalyticsEvent['type'], capsuleId: string, widgetId: string, metadata?: AnalyticsEvent['metadata']) {
    const event: AnalyticsEvent = {
      type: eventType,
      capsuleId,
      widgetId,
      courseId: this.courseId || undefined,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      learnerId: this.learnerId,
      learnerName: this.learnerName,
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
    if (['test_passed', 'session_completed', 'learner_identified'].includes(eventType)) {
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
      await fetch(`${this.apiUrl}/analytics/track`, {
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