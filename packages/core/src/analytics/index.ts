/**
 * Analytics System - Feedback Flywheel for Continuous Improvement
 * 
 * Exports all components of the feedback flywheel system:
 * - EventTracker: Captures user interactions
 * - AnalyticsCollector: Processes events and computes metrics
 * - QualityMetrics: Identifies improvement opportunities
 * - FeedbackProcessor: Automatically triggers content regeneration
 * - FeedbackFlywheel: Main orchestrator
 */

// Core analytics types
export * from '../types/analytics';

// Individual components
export { EventTracker, getEventTracker, initializeEventTracker } from './event-tracker';
export type { EventTrackerConfig } from './event-tracker';

export { AnalyticsCollector } from './analytics-collector';
export type { AnalyticsCollectorConfig } from './analytics-collector';

export { QualityMetrics } from './quality-metrics';
export type { QualityMetricsConfig } from './quality-metrics';

export { FeedbackProcessor } from './feedback-processor';
export type { 
  FeedbackProcessorConfig, 
  RegenerationRequest, 
  RegenerationResult 
} from './feedback-processor';

// Main orchestrator
export { FeedbackFlywheel, createFeedbackFlywheel, getFeedbackFlywheel } from './feedback-flywheel';
export type { FeedbackFlywheelStats } from './feedback-flywheel';

// AI Mentor System
export { AIMentor, createAIMentor } from './ai-mentor';
export type { MentorConfig } from '../types/analytics';

// Convenience exports for common use cases
export { createFeedbackFlywheel as createAnalyticsSystem } from './feedback-flywheel';
export { getEventTracker as trackEvent } from './event-tracker';