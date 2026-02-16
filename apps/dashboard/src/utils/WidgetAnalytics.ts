// ========== WIDGET ANALYTICS TRACKER ==========
// The "Front Door" - Event Collection from Embedded Widgets
// This is your data collection foundation for the B2B analytics moat

interface AnalyticsEvent {
  event_type: string;
  capsule_id: string;
  session_id: string;
  user_id?: string;
  timestamp: number;
  data: Record<string, any>;
}

class WidgetAnalytics {
  private apiEndpoint: string;
  private sessionId: string;
  private capsuleId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private sessionStartTime: number;

  constructor(capsuleId: string, options: {
    apiEndpoint?: string;
    userId?: string;
    flushInterval?: number;
  } = {}) {
    this.apiEndpoint = options.apiEndpoint || '/api/analytics/track';
    this.capsuleId = capsuleId;
    this.userId = options.userId;
    this.flushInterval = options.flushInterval || 5000;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    // Start the session
    this.track('session_start', {});

    // Auto-flush events periodically
    setInterval(() => this.flush(), this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========== CORE EVENT TRACKING ==========

  /**
   * Track when user clicks the "Run" button
   */
  trackRunClick(userCode: string, codeLength: number) {
    this.track('run_click', {
      user_code_length: codeLength,
      run_duration_ms: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Track when a specific test case passes
   */
  trackTestPassed(testCaseId: string, testCaseName: string, executionTimeMs: number) {
    this.track('test_passed', {
      test_case_id: testCaseId,
      test_case_name: testCaseName,
      execution_time_ms: executionTimeMs
    });
  }

  /**
   * Track when a specific test case fails
   */
  trackTestFailed(testCaseId: string, testCaseName: string, errorMessage: string, errorType: string, userCodeSnippet: string) {
    this.track('test_failed', {
      test_case_id: testCaseId,
      test_case_name: testCaseName,
      error_message: errorMessage,
      error_type: errorType,
      user_code_snippet: userCodeSnippet.substring(0, 500) // Limit to 500 chars
    });
  }

  /**
   * Track when user requests a hint
   */
  trackHintRequested(hintId: string, hintSequenceNumber: number) {
    this.track('hint_requested', {
      hint_id: hintId,
      hint_sequence_number: hintSequenceNumber
    });
  }

  /**
   * Track when user views the solution (gives up)
   */
  trackSolutionViewed() {
    this.track('solution_viewed', {
      time_to_give_up_ms: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Track when user completes all test cases
   */
  trackSessionCompleted(totalAttempts: number, totalTimeMs: number) {
    this.track('session_completed', {
      total_attempts: totalAttempts,
      total_time_ms: totalTimeMs,
      completion_rate: 100
    });
  }

  /**
   * Track when user modifies code
   */
  trackCodeChanged(newCodeLength: number, changeType: 'typing' | 'paste' | 'reset') {
    this.track('code_changed', {
      user_code_length: newCodeLength,
      change_type: changeType
    });
  }

  /**
   * Track when session times out (user abandons)
   */
  trackSessionTimeout(timeSpentMs: number) {
    this.track('session_timeout', {
      time_spent_ms: timeSpentMs,
      abandoned: true
    });
  }

  // ========== LOW-LEVEL EVENT SYSTEM ==========

  private track(eventType: string, data: Record<string, any>) {
    const event: AnalyticsEvent = {
      event_type: eventType,
      capsule_id: this.capsuleId,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: Date.now(),
      data
    };

    this.eventQueue.push(event);
    
    // Console log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Analytics Event: ${eventType}`, data);
    }

    // Auto-flush if queue gets too large
    if (this.eventQueue.length >= 10) {
      this.flush();
    }
  }

  private async flush() {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventsToSend)
      });

      if (!response.ok) {
        console.error('Failed to send analytics events:', response.statusText);
        // Re-queue events on failure
        this.eventQueue.unshift(...eventsToSend);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  // ========== PUBLIC API ==========

  /**
   * Update user ID (when user logs in mid-session)
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Force flush all queued events
   */
  forceFlush() {
    this.flush();
  }

  /**
   * Get current session info
   */
  getSessionInfo() {
    return {
      session_id: this.sessionId,
      capsule_id: this.capsuleId,
      user_id: this.userId,
      session_duration_ms: Date.now() - this.sessionStartTime
    };
  }
}

// ========== USAGE EXAMPLES ==========

/*
// Initialize analytics for a capsule
const analytics = new WidgetAnalytics('capsule_123', {
  userId: 'user_456', // optional
  apiEndpoint: 'https://api.codecapsule.com/analytics/track'
});

// Track user interactions
analytics.trackRunClick(userCode, userCode.length);
analytics.trackTestFailed('test_001', 'handles_empty_array', 'IndexError: list index out of range', 'IndexError', userCode);
analytics.trackTestPassed('test_002', 'handles_positive_numbers', 150);
analytics.trackHintRequested('hint_001', 1);
analytics.trackSessionCompleted(7, 45000); // 7 attempts, 45 seconds
*/

export default WidgetAnalytics;
export type { AnalyticsEvent };