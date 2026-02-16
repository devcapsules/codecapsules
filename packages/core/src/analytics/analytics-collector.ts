/**
 * AnalyticsCollector - Processes user events and computes content metrics
 * Part of the Feedback Flywheel system for continuous improvement
 */

import { 
  UserEvent, 
  ContentMetrics, 
  LearningPath, 
  ErrorPattern,
  QualityThresholds 
} from '../types/analytics';

export interface AnalyticsCollectorConfig {
  metrics_calculation_interval_hours: number; // 1
  min_events_for_metrics: number; // 10
  retention_days: number; // 30
  debug_mode: boolean;
}

export class AnalyticsCollector {
  private config: AnalyticsCollectorConfig;
  private metricsCache: Map<string, ContentMetrics> = new Map();
  private lastCalculationTime: Date = new Date();

  constructor(config: Partial<AnalyticsCollectorConfig> = {}) {
    this.config = {
      metrics_calculation_interval_hours: 1,
      min_events_for_metrics: 10,
      retention_days: 30,
      debug_mode: false,
      ...config
    };

    if (this.config.debug_mode) {
      console.log('[AnalyticsCollector] Initialized with config:', this.config);
    }
  }

  /**
   * Process a batch of events and update metrics
   */
  async processEvents(events: UserEvent[]): Promise<void> {
    if (events.length === 0) return;

    const groupedEvents = this.groupEventsByCapsule(events);

    for (const [capsuleId, capsuleEvents] of groupedEvents.entries()) {
      await this.updateCapsuleMetrics(capsuleId, capsuleEvents);
    }

    this.lastCalculationTime = new Date();

    if (this.config.debug_mode) {
      console.log(`[AnalyticsCollector] Processed ${events.length} events for ${groupedEvents.size} capsules`);
    }
  }

  /**
   * Get current metrics for a specific capsule
   */
  async getCapsuleMetrics(capsuleId: string): Promise<ContentMetrics | null> {
    // Return cached metrics if available and recent
    const cached = this.metricsCache.get(capsuleId);
    if (cached && this.isCacheValid(cached.last_updated)) {
      return cached;
    }

    // Calculate fresh metrics
    const events = await this.getEventsForCapsule(capsuleId);
    if (events.length < this.config.min_events_for_metrics) {
      return null;
    }

    const metrics = await this.calculateMetrics(capsuleId, events);
    this.metricsCache.set(capsuleId, metrics);
    
    return metrics;
  }

  /**
   * Get metrics for all capsules
   */
  async getAllCapsuleMetrics(): Promise<ContentMetrics[]> {
    const allCapsuleIds = await this.getAllCapsuleIds();
    const metrics: ContentMetrics[] = [];

    for (const capsuleId of allCapsuleIds) {
      const capsuleMetrics = await this.getCapsuleMetrics(capsuleId);
      if (capsuleMetrics) {
        metrics.push(capsuleMetrics);
      }
    }

    return metrics;
  }

  /**
   * Identify capsules that need improvement based on quality thresholds
   */
  async identifyPoorPerformingCapsules(thresholds: QualityThresholds): Promise<ContentMetrics[]> {
    const allMetrics = await this.getAllCapsuleMetrics();
    
    return allMetrics.filter(metrics => {
      return metrics.completion_rate < thresholds.min_completion_rate ||
             metrics.abandonment_rate > thresholds.max_abandonment_rate ||
             metrics.success_rate < thresholds.min_success_rate ||
             metrics.average_time_seconds > (thresholds.max_average_time_minutes * 60) ||
             metrics.satisfaction_score < thresholds.min_satisfaction_score ||
             metrics.error_frequency > thresholds.max_error_frequency;
    });
  }

  /**
   * Generate learning paths based on user behavior patterns
   */
  async generateLearningPaths(): Promise<LearningPath[]> {
    const userSessions = await this.getUserSessions();
    const learningPaths: LearningPath[] = [];

    for (const [userId, sessions] of userSessions.entries()) {
      const path = this.analyzeLearningPath(userId, sessions);
      if (path) {
        learningPaths.push(path);
      }
    }

    return learningPaths;
  }

  /**
   * Identify common error patterns across capsules
   */
  async identifyErrorPatterns(capsuleId?: string): Promise<ErrorPattern[]> {
    const events = capsuleId 
      ? await this.getEventsForCapsule(capsuleId)
      : await this.getAllErrorEvents();

    const errorEvents = events.filter(e => e.event_type === 'error_encountered');
    const patterns = new Map<string, ErrorPattern>();

    for (const event of errorEvents) {
      const errorType = this.categorizeError(event.data.error_message || '');
      const userSegment = await this.getUserSegment(event.user_id);
      const timeOccurrence = this.getTimeOfOccurrence(event);

      if (!patterns.has(errorType)) {
        patterns.set(errorType, {
          error_type: errorType,
          error_message: event.data.error_message || '',
          frequency: 0,
          example_code: event.data.code_content || '',
          common_messages: [],
          user_segments: [],
          time_of_occurrence: timeOccurrence
        });
      }

      const pattern = patterns.get(errorType)!;
      pattern.frequency++;
      
      if (event.data.error_message && !pattern.common_messages.includes(event.data.error_message)) {
        pattern.common_messages.push(event.data.error_message);
      }
      
      if (!pattern.user_segments.includes(userSegment)) {
        pattern.user_segments.push(userSegment);
      }
    }

    return Array.from(patterns.values()).sort((a, b) => b.frequency - a.frequency);
  }

  private async updateCapsuleMetrics(capsuleId: string, events: UserEvent[]): Promise<void> {
    const metrics = await this.calculateMetrics(capsuleId, events);
    this.metricsCache.set(capsuleId, metrics);
    
    // TODO: Persist to database
    await this.saveMetricsToDatabase(metrics);
  }

  private async calculateMetrics(capsuleId: string, events: UserEvent[]): Promise<ContentMetrics> {
    const startedEvents = events.filter(e => e.event_type === 'capsule_started');
    const completedEvents = events.filter(e => e.event_type === 'capsule_completed');
    const abandonedEvents = events.filter(e => e.event_type === 'capsule_abandoned');
    const errorEvents = events.filter(e => e.event_type === 'error_encountered');
    const hintEvents = events.filter(e => e.event_type === 'hint_requested');
    
    const totalAttempts = startedEvents.length;
    const totalCompletions = completedEvents.length;
    const uniqueUsers = new Set(events.map(e => e.user_id)).size;

    // Calculate completion rate
    const completionRate = totalAttempts > 0 ? totalCompletions / totalAttempts : 0;
    
    // Calculate abandonment rate
    const abandonmentRate = totalAttempts > 0 ? abandonedEvents.length / totalAttempts : 0;
    
    // Calculate average time
    const completionTimes = completedEvents
      .map(e => e.data.duration_seconds)
      .filter(t => t !== undefined) as number[];
    const averageTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
      : 0;

    // Calculate error frequency
    const errorFrequency = totalCompletions > 0 ? errorEvents.length / totalCompletions : 0;
    
    // Calculate hint request rate
    const hintRequestRate = totalCompletions > 0 ? hintEvents.length / totalCompletions : 0;
    
    // Calculate user ratings
    const ratingEvents = events.filter(e => e.data.difficulty_rating !== undefined);
    const difficultyScore = ratingEvents.length > 0
      ? ratingEvents.reduce((sum, e) => sum + (e.data.difficulty_rating || 0), 0) / ratingEvents.length
      : 0;

    // Calculate success rate (successful code executions)
    const codeEvents = events.filter(e => e.event_type === 'code_submitted');
    const successfulCode = codeEvents.filter(e => e.data.execution_result === 'success');
    const successRate = codeEvents.length > 0 ? successfulCode.length / codeEvents.length : 0;

    // Get generation metadata
    const generationMetadata = await this.getGenerationMetadata(capsuleId);

    return {
      capsule_id: capsuleId,
      created_at: generationMetadata.created_at || new Date(),
      last_updated: new Date(),
      
      // Performance metrics
      completion_rate: completionRate,
      average_time_seconds: averageTime,
      success_rate: successRate,
      abandonment_rate: abandonmentRate,
      
      // Quality indicators
      error_frequency: errorFrequency,
      hint_request_rate: hintRequestRate,
      difficulty_score: difficultyScore,
      satisfaction_score: difficultyScore, // TODO: Separate satisfaction metric
      
      // Learning effectiveness (placeholder values for now)
      knowledge_retention: 0.8, // TODO: Calculate from follow-up assessments
      prerequisite_coverage: 0.9, // TODO: Calculate from prerequisite analysis
      concept_mastery: successRate * 0.9, // Approximation based on success rate
      
      // Usage patterns
      total_attempts: totalAttempts,
      unique_users: uniqueUsers,
      repeat_learners: await this.countRepeatLearners(capsuleId, events),
      peak_usage_hours: this.calculatePeakUsageHours(events),
      
      // AI generation metadata
      generation_method: generationMetadata.method || 'pedagogist_coder_debugger',
      validation_score: generationMetadata.validation_score || 0.8,
      generation_iterations: generationMetadata.iterations || 1
    };
  }

  private groupEventsByCapsule(events: UserEvent[]): Map<string, UserEvent[]> {
    const grouped = new Map<string, UserEvent[]>();
    
    for (const event of events) {
      if (!event.capsule_id) continue;
      
      if (!grouped.has(event.capsule_id)) {
        grouped.set(event.capsule_id, []);
      }
      
      grouped.get(event.capsule_id)!.push(event);
    }
    
    return grouped;
  }

  private isCacheValid(lastUpdated: Date): boolean {
    const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < this.config.metrics_calculation_interval_hours;
  }

  private categorizeError(errorMessage: string): string {
    if (errorMessage.includes('SyntaxError')) return 'syntax_error';
    if (errorMessage.includes('TypeError')) return 'type_error';
    if (errorMessage.includes('ReferenceError')) return 'reference_error';
    if (errorMessage.includes('timeout')) return 'timeout_error';
    if (errorMessage.includes('network')) return 'network_error';
    return 'other_error';
  }

  private getTimeOfOccurrence(event: UserEvent): 'early' | 'middle' | 'late' {
    // Simple heuristic based on attempt number
    const attemptNumber = event.data.attempt_number || 1;
    if (attemptNumber <= 2) return 'early';
    if (attemptNumber <= 5) return 'middle';
    return 'late';
  }

  private calculatePeakUsageHours(events: UserEvent[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    for (const event of events) {
      const hour = event.timestamp.getHours();
      hourCounts[hour]++;
    }
    
    // Return top 3 peak hours
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }

  private async countRepeatLearners(capsuleId: string, events: UserEvent[]): Promise<number> {
    const userSessions = new Map<string, Date[]>();
    
    for (const event of events) {
      if (event.event_type === 'capsule_started') {
        if (!userSessions.has(event.user_id)) {
          userSessions.set(event.user_id, []);
        }
        userSessions.get(event.user_id)!.push(event.timestamp);
      }
    }
    
    // Count users with multiple sessions (more than 1 day apart)
    let repeatLearners = 0;
    for (const [userId, sessions] of userSessions.entries()) {
      if (sessions.length > 1) {
        const sortedSessions = sessions.sort((a, b) => a.getTime() - b.getTime());
        const daysBetween = (sortedSessions[sortedSessions.length - 1].getTime() - sortedSessions[0].getTime()) / (1000 * 60 * 60 * 24);
        if (daysBetween > 1) {
          repeatLearners++;
        }
      }
    }
    
    return repeatLearners;
  }

  private analyzeLearningPath(userId: string, sessions: UserEvent[]): LearningPath | null {
    // TODO: Implement learning path analysis
    // This would analyze the sequence of capsules a user went through
    // and their success indicators
    return null;
  }

  // Placeholder methods for database operations
  private async getEventsForCapsule(capsuleId: string): Promise<UserEvent[]> {
    // TODO: Implement database query
    return [];
  }

  private async getAllCapsuleIds(): Promise<string[]> {
    // TODO: Implement database query
    return [];
  }

  private async getAllErrorEvents(): Promise<UserEvent[]> {
    // TODO: Implement database query
    return [];
  }

  private async getUserSessions(): Promise<Map<string, UserEvent[]>> {
    // TODO: Implement database query
    return new Map();
  }

  private async getUserSegment(userId: string): Promise<string> {
    // TODO: Implement user segmentation logic
    return 'intermediate';
  }

  private async getGenerationMetadata(capsuleId: string): Promise<{
    created_at?: Date;
    method?: 'pedagogist_coder_debugger' | 'manual' | 'hybrid';
    validation_score?: number;
    iterations?: number;
  }> {
    // TODO: Implement database query for generation metadata
    return {};
  }

  private async saveMetricsToDatabase(metrics: ContentMetrics): Promise<void> {
    // TODO: Implement database save
    if (this.config.debug_mode) {
      console.log('[AnalyticsCollector] Saving metrics for capsule:', metrics.capsule_id);
    }
  }
}