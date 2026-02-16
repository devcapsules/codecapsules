// ========== CORE EVENT SYSTEM ==========
// Strategic B2B Analytics - Your Data Moat

export interface AnalyticsEvent {
  id: string;
  event_type: CoreEventType;
  capsule_id: string;
  session_id: string;
  user_id?: string; // null for anonymous users
  timestamp: number; // Unix timestamp
  data: EventData;
  user_agent?: string;
  ip_address?: string;
}

// Core Events - Optimized for B2B Intelligence
export type CoreEventType = 
  | 'session_start'     // Widget loaded
  | 'run_click'         // Run button clicked
  | 'test_passed'       // Specific test case passed
  | 'test_failed'       // Specific test case failed
  | 'hint_requested'    // Student requested help
  | 'solution_viewed'   // Student gave up
  | 'session_completed' // All tests passed
  | 'code_changed'      // Student modified code
  | 'session_timeout';  // Student abandoned

export interface EventData {
  // Common fields
  run_duration_ms?: number;
  user_code_length?: number;
  
  // Test-specific fields  
  test_case_id?: string;
  test_case_name?: string;
  error_message?: string;
  error_type?: string;
  user_code_snippet?: string;
  
  // Hint-specific fields
  hint_id?: string;
  hint_sequence_number?: number;
  
  // Performance fields
  execution_time_ms?: number;
  memory_used_mb?: number;
}

// Legacy compatibility
export type AnalyticsAction = CoreEventType;

// ========== B2B DASHBOARD METRICS ==========

// Pro Tier Metrics (Content Creators/Bloggers)
export interface ContentEngagementMetrics {
  capsule_id: string;
  time_range: { start: Date; end: Date };
  
  // Primary KPIs
  impressions: number;              // Total widget loads
  engagement_rate: number;          // (runs / impressions) %
  completion_rate: number;          // (completions / runs) %
  
  // Funnel Analysis
  funnel: {
    impressions: number;
    runs: number;
    completions: number;
    drop_off_at_run: number;        // % who viewed but never ran
    drop_off_at_completion: number; // % who ran but never completed
  };
  
  // Engagement Quality
  avg_time_to_first_run: number;    // seconds
  avg_session_duration: number;     // seconds
  return_user_rate: number;         // % who came back
}

// B2B Tier Metrics (Bootcamps/Enterprise)
export interface PedagogicalMetrics {
  capsule_id: string;
  cohort_id?: string;
  time_range: { start: Date; end: Date };
  
  // Learning Outcomes
  student_count: number;
  avg_run_to_pass_ratio: number;    // Difficulty indicator
  avg_time_to_first_run: number;    // Problem clarity indicator
  at_risk_students: AtRiskStudent[];
  
  // Test Case Intelligence
  failing_test_cases: FailingTestCase[];
  
  // Cohort Performance
  cohort_progress: StudentProgress[];
}

export interface AtRiskStudent {
  user_id: string;
  student_name?: string;
  run_to_pass_ratio: number;
  stuck_test_cases: string[];
  time_since_last_attempt: number; // hours
  needs_help_score: number;        // 0-100
}

export interface FailingTestCase {
  test_case_id: string;
  test_case_name: string;
  failure_rate: number;            // %
  common_errors: ErrorPattern[];
  student_count: number;
}

export interface ErrorPattern {
  error_type: string;
  error_message: string;
  frequency: number;
  example_code: string;
}

export interface StudentProgress {
  user_id: string;
  student_name?: string;
  capsules_completed: number;
  capsules_attempted: number;
  avg_attempts_per_capsule: number;
  last_activity: Date;
  performance_trend: 'improving' | 'declining' | 'stable';
}

export interface UserProgress {
  userId: string;
  widgetId: string;
  attempts: number;
  completed: boolean;
  lastAttemptAt: Date;
  bestScore?: number;
  totalTimeSpent: number; // in seconds
  hintsUsed: string[]; // hint IDs used
}

// ========================================
// FEEDBACK FLYWHEEL ANALYTICS SYSTEM
// ========================================

export interface UserEvent {
  id: string;
  user_id: string;
  session_id: string;
  timestamp: Date;
  event_type: EventType;
  capsule_id?: string;
  playlist_id?: string;
  data: EventData;
}

export type EventType = 
  | 'capsule_started'
  | 'capsule_completed' 
  | 'capsule_abandoned'
  | 'code_submitted'
  | 'code_executed'
  | 'error_encountered'
  | 'hint_requested'
  | 'time_spent'
  | 'playlist_started'
  | 'playlist_completed'
  | 'navigation_event';

export interface EventData {
  // Time tracking
  duration_seconds?: number;
  start_time?: Date;
  end_time?: Date;
  
  // Code interaction
  code_content?: string;
  execution_result?: 'success' | 'error' | 'timeout';
  error_message?: string;
  attempt_number?: number;
  
  // Learning metrics
  difficulty_rating?: number; // 1-5 user rating
  confidence_level?: number; // 1-5 user rating
  success_rate?: number; // 0-1
  
  // Navigation
  from_capsule?: string;
  to_capsule?: string;
  navigation_method?: 'next' | 'previous' | 'jump' | 'search';
  
  // Context
  browser_info?: string;
  device_type?: 'desktop' | 'tablet' | 'mobile';
  learning_context?: 'self_paced' | 'instructor_led' | 'assessment';
}

export interface ContentMetrics {
  capsule_id: string;
  created_at: Date;
  last_updated: Date;
  
  // Performance metrics
  completion_rate: number; // 0-1
  average_time_seconds: number;
  success_rate: number; // 0-1
  abandonment_rate: number; // 0-1
  
  // Quality indicators
  error_frequency: number; // errors per attempt
  hint_request_rate: number; // hints per completion
  difficulty_score: number; // 1-5 average user rating
  satisfaction_score: number; // 1-5 average user rating
  
  // Learning effectiveness
  knowledge_retention: number; // based on follow-up assessments
  prerequisite_coverage: number; // how well it builds on previous content
  concept_mastery: number; // depth of understanding achieved
  
  // Usage patterns
  total_attempts: number;
  unique_users: number;
  repeat_learners: number;
  peak_usage_hours: number[];
  
  // AI generation metadata
  generation_method: 'pedagogist_coder_debugger' | 'manual' | 'hybrid';
  validation_score: number; // 0-1 from validators
  generation_iterations: number; // how many attempts to get it right
}

export interface QualityThresholds {
  min_completion_rate: number; // 0.7 = 70%
  max_abandonment_rate: number; // 0.3 = 30%
  min_success_rate: number; // 0.8 = 80%
  max_average_time_minutes: number; // 15 minutes
  min_satisfaction_score: number; // 3.5/5
  max_error_frequency: number; // 2 errors per completion
}

export interface ImprovementSuggestion {
  id: string;
  capsule_id: string;
  created_at: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: ImprovementCategory;
  issue_description: string;
  suggested_action: string;
  confidence_score: number; // 0-1
  estimated_impact: number; // 0-1
  
  // Supporting data
  metrics_snapshot: ContentMetrics;
  user_feedback: string[];
  error_patterns: ErrorPattern[];
}

export type ImprovementCategory = 
  | 'content_difficulty'
  | 'explanation_clarity' 
  | 'code_examples'
  | 'prerequisites'
  | 'technical_issues'
  | 'user_experience'
  | 'learning_objectives'
  | 'assessment_design';

export interface ErrorPattern {
  error_type: string;
  frequency: number;
  common_messages: string[];
  user_segments: string[]; // 'beginner', 'intermediate', 'advanced'
  time_of_occurrence: 'early' | 'middle' | 'late'; // in learning session
}

export interface LearningPath {
  user_id: string;
  capsule_sequence: string[];
  success_indicators: {
    capsule_id: string;
    mastery_level: number; // 0-1
    time_to_mastery: number; // seconds
    attempts_needed: number;
  }[];
  drop_off_point?: string; // capsule_id where user stopped
  completion_percentage: number; // 0-1
}

export interface FeedbackFlywheelConfig {
  // Analysis intervals
  metrics_update_interval_hours: number; // 24
  improvement_analysis_interval_hours: number; // 168 (weekly)
  
  // Quality thresholds
  quality_thresholds: QualityThresholds;
  
  // Auto-improvement settings
  auto_regenerate_enabled: boolean;
  regeneration_threshold_score: number; // 0-1, trigger regeneration below this
  max_regeneration_attempts: number; // 3
  
  // Learning from data
  min_data_points_for_analysis: number; // 50 user interactions
  confidence_threshold_for_action: number; // 0.8
  
  // Notification settings
  alert_on_critical_issues: boolean;
  daily_summary_enabled: boolean;
  weekly_insights_enabled: boolean;
}

// ========================================
// AI MENTOR SYSTEM TYPES
// ========================================

export interface ErrorSignature {
  error_type: string; // 'IndexError', 'SyntaxError', 'TypeError'
  error_message: string; // Raw error message
  test_case_id: string; // Which test failed
  capsule_id: string;
  code_context?: string; // Relevant code snippet that caused error
}

export interface MentorHint {
  id: string;
  error_signature_hash: string; // MD5 hash of ErrorSignature for fast lookup
  hint_text: string; // The Socratic hint from AI
  confidence_score: number; // 0-1 how confident AI was in this hint
  created_at: Date;
  usage_count: number; // How many times this cached hint was served
  effectiveness_score?: number; // 0-1 based on whether learners succeed after this hint
  
  // Analytics for hint quality
  learner_feedback: {
    helpful_votes: number;
    unhelpful_votes: number;
  };
  
  // Metadata
  capsule_id: string;
  test_case_id: string;
  error_type: string;
}

export interface MentorRequest {
  user_id: string;
  capsule_id: string;
  test_case_id: string;
  submitted_code: string;
  error_signature: ErrorSignature;
  timestamp: Date;
}

export interface MentorResponse {
  hint_id: string;
  hint_text: string;
  is_cached: boolean; // true = served from cache, false = new AI generation
  confidence_score: number;
  response_time_ms: number;
  cost_saved?: number; // estimated cost saved if served from cache
}

export interface MentorAnalytics {
  // Cost efficiency metrics
  total_requests: number;
  cache_hit_rate: number; // 0-1 percentage served from cache
  total_cost_saved: number; // estimated dollars saved through caching
  avg_response_time_ms: number;
  
  // Quality metrics
  hint_effectiveness_rate: number; // 0-1 how often hints lead to success
  learner_satisfaction_score: number; // 1-5 based on feedback votes
  
  // Popular error patterns
  top_error_signatures: Array<{
    error_signature_hash: string;
    frequency: number;
    hint_text: string;
    effectiveness_score: number;
  }>;
}

export interface MentorConfig {
  // AI settings
  ai_model: string; // 'gemini-2.5-pro' | 'llama-3' | 'gpt-4o-mini'
  max_hint_length: number; // 150 characters for UI
  temperature: number; // 0.3 for consistency
  
  // Caching strategy
  enable_caching: boolean; // true
  cache_ttl_days: number; // 30 days
  min_usage_for_permanent_cache: number; // 5 uses = permanent
  
  // Cost control
  max_ai_calls_per_hour: number; // 1000 calls/hour rate limit
  fallback_hint: string; // "Try reviewing the error message and checking your logic step by step."
  
  // Quality control  
  min_confidence_threshold: number; // 0.7 - regenerate if AI confidence too low
  enable_hint_voting: boolean; // allow learners to vote on hint quality
  auto_retire_bad_hints: boolean; // retire hints with low effectiveness
}