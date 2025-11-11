/**
 * Event Schema Foundation - The API spec for our entire learning model
 * This is what B2B customers are buying: rich, actionable learning analytics
 */

export interface BaseEvent {
  id: string;
  sessionId: string;
  capsuleId: string;
  userId: string;
  timestamp: Date;
  type: LearningEventType;
}

export type LearningEventType = 
  | 'session_start'
  | 'session_end'
  | 'session_timeout'
  | 'code_run_initiated'
  | 'code_run_completed'
  | 'test_case_passed'
  | 'test_case_failed'
  | 'all_tests_passed'
  | 'hint_requested'
  | 'hint_viewed'
  | 'solution_viewed'
  | 'reset_attempted'
  | 'give_up_detected'
  | 'content_edited'
  | 'focus_gained'
  | 'focus_lost';

// ===== CORE LEARNING EVENTS =====

export interface SessionStartEvent extends BaseEvent {
  type: 'session_start';
  data: {
    capsuleType: string;
    difficulty: string;
    userLevel?: string;
    referrer?: string;
  };
}

export interface SessionEndEvent extends BaseEvent {
  type: 'session_end';
  data: {
    outcome: 'completed' | 'abandoned' | 'timeout';
    totalDuration: number; // milliseconds
    solutionViewed: boolean;
    hintsUsed: number;
    totalAttempts: number;
  };
}

export interface CodeRunInitiatedEvent extends BaseEvent {
  type: 'code_run_initiated';
  data: {
    runNumber: number;
    codeLength: number;
    timeSinceLastRun?: number;
    timeSinceSessionStart: number;
  };
}

export interface CodeRunCompletedEvent extends BaseEvent {
  type: 'code_run_completed';
  data: {
    runNumber: number;
    success: boolean;
    executionTime: number;
    output?: string;
    error?: string;
    runtimeTarget: 'wasm' | 'docker';
  };
}

export interface TestCasePassedEvent extends BaseEvent {
  type: 'test_case_passed';
  data: {
    testCaseId: string;
    testCaseName: string;
    attemptNumber: number;
    timeSinceFirstAttempt: number;
  };
}

export interface TestCaseFailedEvent extends BaseEvent {
  type: 'test_case_failed';
  data: {
    testCaseId: string;
    testCaseName: string;
    attemptNumber: number;
    expectedOutput: string;
    actualOutput: string;
    errorType: 'syntax' | 'runtime' | 'logic' | 'timeout';
    errorMessage?: string;
  };
}

export interface AllTestsPassedEvent extends BaseEvent {
  type: 'all_tests_passed';
  data: {
    totalAttempts: number;
    timeToCompletion: number; // milliseconds since session_start
    hintsUsed: number;
    solutionViewed: boolean;
  };
}

export interface HintRequestedEvent extends BaseEvent {
  type: 'hint_requested';
  data: {
    hintIndex: number;
    hintType: 'progressive' | 'specific' | 'solution';
    currentAttempts: number;
    timeSinceLastAttempt: number;
    strugglingTestCase?: string;
  };
}

export interface HintViewedEvent extends BaseEvent {
  type: 'hint_viewed';
  data: {
    hintIndex: number;
    hintContent: string;
    viewDuration: number;
    actionAfterHint: 'code_run' | 'another_hint' | 'give_up' | 'session_end';
  };
}

export interface SolutionViewedEvent extends BaseEvent {
  type: 'solution_viewed';
  data: {
    totalAttempts: number;
    timeSpentBeforeViewing: number;
    hintsUsedBeforeViewing: number;
    lastFailedTestCase?: string;
    viewReason: 'give_up' | 'curiosity' | 'verification';
  };
}

export interface GiveUpDetectedEvent extends BaseEvent {
  type: 'give_up_detected';
  data: {
    detectionMethod: 'solution_viewed' | 'session_timeout' | 'explicit_quit';
    finalAttempts: number;
    finalHintsUsed: number;
    timeSpentTotal: number;
    lastFailedTestCase?: string;
    strugglingConcept?: string;
  };
}

// ===== AGGREGATE EVENT TYPES =====

export type LearningEvent = 
  | SessionStartEvent
  | SessionEndEvent
  | CodeRunInitiatedEvent
  | CodeRunCompletedEvent
  | TestCasePassedEvent
  | TestCaseFailedEvent
  | AllTestsPassedEvent
  | HintRequestedEvent
  | HintViewedEvent
  | SolutionViewedEvent
  | GiveUpDetectedEvent;

// ===== B2B ANALYTICS INTERFACES =====

/**
 * Time-to-First-Run (TTFR)
 * B2B Insight: How long does it take learners to get over the 'cold start'?
 */
export interface TTFRMetric {
  capsuleId: string;
  averageTTFR: number; // milliseconds
  medianTTFR: number;
  slowestTTFR: number;
  fastestTTFR: number;
  sampleSize: number;
}

/**
 * Run-to-Pass Ratio (RPR)
 * B2B Insight: Core difficulty score - how many attempts before success?
 */
export interface RPRMetric {
  capsuleId: string;
  averageRPR: number;
  medianRPR: number;
  difficultyScore: 'too_easy' | 'optimal' | 'too_hard';
  sampleSize: number;
}

/**
 * Specific Test Case Failure Rate
 * B2B Insight: Exactly where are students stuck?
 */
export interface TestCaseFailureMetric {
  capsuleId: string;
  testCaseId: string;
  testCaseName: string;
  failureRate: number; // 0.0 to 1.0
  averageAttempts: number;
  commonErrorTypes: string[];
  strugglingConcept: string;
}

/**
 * Give-Up Rate
 * B2B Insight: Which problems are demoralizing learners?
 */
export interface GiveUpMetric {
  capsuleId: string;
  giveUpRate: number; // 0.0 to 1.0
  averageTimeBeforeGiveUp: number;
  averageAttemptsBeforeGiveUp: number;
  commonGiveUpPoints: string[];
}

/**
 * Hint Utilization Rate
 * B2B Insight: Are hints useful or ignored?
 */
export interface HintUtilizationMetric {
  capsuleId: string;
  hintRequestRate: number; // 0.0 to 1.0
  averageHintsPerSession: number;
  hintEffectivenessScore: number; // success rate after hint viewing
  mostRequestedHints: string[];
}

// ===== EVENT COLLECTION INTERFACE =====

export interface EventCollector {
  track(event: LearningEvent): Promise<void>;
  getMetrics(capsuleId: string): Promise<LearningMetrics>;
  getBatchMetrics(capsuleIds: string[]): Promise<LearningMetrics[]>;
}

export interface LearningMetrics {
  capsuleId: string;
  timeRange: { start: Date; end: Date };
  ttfr: TTFRMetric;
  rpr: RPRMetric;
  testCaseFailures: TestCaseFailureMetric[];
  giveUpRate: GiveUpMetric;
  hintUtilization: HintUtilizationMetric;
  totalSessions: number;
  completionRate: number;
}