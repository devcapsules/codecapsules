/**
 * FeedbackFlywheel - Main orchestrator for the continuous improvement system
 * Coordinates EventTracker → AnalyticsCollector → QualityMetrics → FeedbackProcessor
 */

import { EventTracker, EventTrackerConfig } from './event-tracker';
import { AnalyticsCollector, AnalyticsCollectorConfig } from './analytics-collector';
import { QualityMetrics, QualityMetricsConfig } from './quality-metrics';
import { FeedbackProcessor, FeedbackProcessorConfig } from './feedback-processor';
import { GenerationPipeline } from '../agents/generation-pipeline';
import { 
  FeedbackFlywheelConfig, 
  QualityThresholds,
  UserEvent,
  ContentMetrics,
  ImprovementSuggestion 
} from '../types/analytics';

export interface FeedbackFlywheelStats {
  // System health
  total_events_processed: number;
  total_capsules_analyzed: number;
  total_improvements_suggested: number;
  total_regenerations_completed: number;
  
  // Quality metrics
  average_platform_quality: number;
  capsules_needing_improvement: number;
  quality_trend_7_days: number; // -1 to 1 (negative = declining, positive = improving)
  
  // Performance metrics
  avg_event_processing_time_ms: number;
  avg_metrics_calculation_time_ms: number;
  avg_regeneration_time_ms: number;
  
  // User impact
  estimated_learning_improvement: number; // 0-1 scale
  user_satisfaction_improvement: number; // 0-1 scale
  content_completion_improvement: number; // 0-1 scale
}

export class FeedbackFlywheel {
  private config: FeedbackFlywheelConfig;
  private eventTracker: EventTracker;
  private analyticsCollector: AnalyticsCollector;
  private qualityMetrics: QualityMetrics;
  private feedbackProcessor: FeedbackProcessor;
  
  private isRunning: boolean = false;
  private lastAnalysisTime: Date = new Date();
  private stats: FeedbackFlywheelStats;

  constructor(
    generationPipeline: GenerationPipeline,
    config: Partial<FeedbackFlywheelConfig> = {}
  ) {
    // Set default configuration
    this.config = {
      metrics_update_interval_hours: 24,
      improvement_analysis_interval_hours: 168, // Weekly
      quality_thresholds: {
        min_completion_rate: 0.7,
        max_abandonment_rate: 0.3,
        min_success_rate: 0.8,
        max_average_time_minutes: 15,
        min_satisfaction_score: 3.5,
        max_error_frequency: 2
      },
      auto_regenerate_enabled: true,
      regeneration_threshold_score: 0.6,
      max_regeneration_attempts: 3,
      min_data_points_for_analysis: 50,
      confidence_threshold_for_action: 0.8,
      alert_on_critical_issues: true,
      daily_summary_enabled: true,
      weekly_insights_enabled: true,
      ...config
    };

    // Initialize components
    this.eventTracker = new EventTracker({
      debug_mode: false
    });

    this.analyticsCollector = new AnalyticsCollector({
      debug_mode: false
    });

    this.qualityMetrics = new QualityMetrics(
      this.analyticsCollector,
      this.config.quality_thresholds,
      {
        debug_mode: false
      }
    );

    this.feedbackProcessor = new FeedbackProcessor(
      this.config,
      this.qualityMetrics,
      generationPipeline,
      {
        auto_process_enabled: this.config.auto_regenerate_enabled,
        debug_mode: false
      }
    );

    // Initialize stats
    this.stats = {
      total_events_processed: 0,
      total_capsules_analyzed: 0,
      total_improvements_suggested: 0,
      total_regenerations_completed: 0,
      average_platform_quality: 0,
      capsules_needing_improvement: 0,
      quality_trend_7_days: 0,
      avg_event_processing_time_ms: 0,
      avg_metrics_calculation_time_ms: 0,
      avg_regeneration_time_ms: 0,
      estimated_learning_improvement: 0,
      user_satisfaction_improvement: 0,
      content_completion_improvement: 0
    };

    console.log('[FeedbackFlywheel] Initialized with config:', this.config);
  }

  /**
   * Start the feedback flywheel system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[FeedbackFlywheel] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[FeedbackFlywheel] Starting continuous improvement system...');

    // Start background processing
    this.startMetricsProcessing();
    this.startImprovementAnalysis();
    
    if (this.config.daily_summary_enabled) {
      this.startDailySummaries();
    }

    console.log('[FeedbackFlywheel] System started successfully');
  }

  /**
   * Stop the feedback flywheel system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('[FeedbackFlywheel] Stopping system...');

    // Flush any remaining events
    await this.eventTracker.flush();
    
    console.log('[FeedbackFlywheel] System stopped');
  }

  /**
   * Get the event tracker for manual event logging
   */
  getEventTracker(): EventTracker {
    return this.eventTracker;
  }

  /**
   * Get current system statistics
   */
  getStats(): FeedbackFlywheelStats {
    return { ...this.stats };
  }

  /**
   * Get quality overview for dashboard
   */
  async getQualityOverview(): Promise<{
    overall_score: number;
    total_capsules: number;
    needs_improvement: number;
    critical_issues: number;
    recent_improvements: number;
    top_issues: Array<{ category: string; count: number }>;
  }> {
    const overview = await this.qualityMetrics.getPlatformQualityOverview();
    const recentImprovements = await this.getRecentImprovementCount();

    return {
      overall_score: overview.averageQualityScore,
      total_capsules: overview.totalCapsules,
      needs_improvement: overview.needingImprovement,
      critical_issues: overview.criticalIssues,
      recent_improvements: recentImprovements,
      top_issues: overview.topIssueCategories.map(cat => ({
        category: cat.category,
        count: cat.count
      }))
    };
  }

  /**
   * Manually trigger analysis for a specific capsule
   */
  async analyzeCapsule(capsuleId: string): Promise<{
    quality_score: number;
    metrics: ContentMetrics | null;
    suggestions: ImprovementSuggestion[];
  }> {
    const qualityScore = await this.qualityMetrics.getCapsuleQualityScore(capsuleId);
    const metrics = await this.analyticsCollector.getCapsuleMetrics(capsuleId);
    
    let suggestions: ImprovementSuggestion[] = [];
    if (metrics) {
      suggestions = await this.qualityMetrics.generateImprovementSuggestions();
      suggestions = suggestions.filter(s => s.capsule_id === capsuleId);
    }

    return {
      quality_score: qualityScore,
      metrics,
      suggestions
    };
  }

  /**
   * Manually trigger improvement for a specific capsule
   */
  async improveCapsule(capsuleId: string): Promise<{
    success: boolean;
    message: string;
    regeneration_id?: string;
  }> {
    try {
      const analysis = await this.analyzeCapsule(capsuleId);
      
      if (analysis.suggestions.length === 0) {
        return {
          success: false,
          message: 'No improvement suggestions found for this capsule'
        };
      }

      const result = await this.feedbackProcessor.regenerateCapsule(
        capsuleId, 
        analysis.suggestions
      );

      if (result.success) {
        this.stats.total_regenerations_completed++;
        return {
          success: true,
          message: 'Capsule improvement initiated successfully',
          regeneration_id: result.request_id
        };
      } else {
        return {
          success: false,
          message: result.error_message || 'Improvement failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process a batch of events (called by event tracker)
   */
  async processEvents(events: UserEvent[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.analyticsCollector.processEvents(events);
      this.stats.total_events_processed += events.length;
      
      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime('events', processingTime);
      
    } catch (error) {
      console.error('[FeedbackFlywheel] Error processing events:', error);
    }
  }

  private startMetricsProcessing(): void {
    const intervalMs = this.config.metrics_update_interval_hours * 60 * 60 * 1000;
    
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.updateSystemMetrics();
      } catch (error) {
        console.error('[FeedbackFlywheel] Error updating metrics:', error);
      }
    }, intervalMs);
  }

  private startImprovementAnalysis(): void {
    const intervalMs = this.config.improvement_analysis_interval_hours * 60 * 60 * 1000;
    
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.runImprovementAnalysis();
      } catch (error) {
        console.error('[FeedbackFlywheel] Error running improvement analysis:', error);
      }
    }, intervalMs);
  }

  private startDailySummaries(): void {
    const dailyMs = 24 * 60 * 60 * 1000;
    
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.generateDailySummary();
      } catch (error) {
        console.error('[FeedbackFlywheel] Error generating daily summary:', error);
      }
    }, dailyMs);
  }

  private async updateSystemMetrics(): Promise<void> {
    const startTime = Date.now();
    
    // Update quality overview
    const overview = await this.qualityMetrics.getPlatformQualityOverview();
    
    this.stats.average_platform_quality = overview.averageQualityScore;
    this.stats.total_capsules_analyzed = overview.totalCapsules;
    this.stats.capsules_needing_improvement = overview.needingImprovement;
    
    // Calculate quality trend (simplified)
    // TODO: Implement proper trend calculation using historical data
    this.stats.quality_trend_7_days = 0.05; // Placeholder positive trend
    
    const processingTime = Date.now() - startTime;
    this.updateAverageProcessingTime('metrics', processingTime);
    
    console.log('[FeedbackFlywheel] Updated system metrics');
  }

  private async runImprovementAnalysis(): Promise<void> {
    console.log('[FeedbackFlywheel] Running improvement analysis...');
    
    const suggestions = await this.qualityMetrics.generateImprovementSuggestions();
    this.stats.total_improvements_suggested += suggestions.length;
    
    if (suggestions.length > 0) {
      await this.feedbackProcessor.processSuggestions(suggestions);
      
      if (this.config.alert_on_critical_issues) {
        const criticalSuggestions = suggestions.filter(s => s.priority === 'critical');
        if (criticalSuggestions.length > 0) {
          await this.alertCriticalIssues(criticalSuggestions);
        }
      }
    }
    
    this.lastAnalysisTime = new Date();
    console.log(`[FeedbackFlywheel] Analysis complete - ${suggestions.length} suggestions generated`);
  }

  private async generateDailySummary(): Promise<void> {
    const overview = await this.getQualityOverview();
    
    console.log('[FeedbackFlywheel] Daily Summary:');
    console.log(`- Platform Quality Score: ${(overview.overall_score * 100).toFixed(1)}%`);
    console.log(`- Total Capsules: ${overview.total_capsules}`);
    console.log(`- Needing Improvement: ${overview.needs_improvement}`);
    console.log(`- Critical Issues: ${overview.critical_issues}`);
    console.log(`- Recent Improvements: ${overview.recent_improvements}`);
    
    // TODO: Send email/webhook notification if configured
  }

  private async alertCriticalIssues(suggestions: ImprovementSuggestion[]): Promise<void> {
    console.warn(`[FeedbackFlywheel] CRITICAL ISSUES DETECTED: ${suggestions.length} capsules need immediate attention`);
    
    for (const suggestion of suggestions) {
      console.warn(`- Capsule ${suggestion.capsule_id}: ${suggestion.issue_description}`);
    }
    
    // TODO: Send alerts via configured channels (email, Slack, etc.)
  }

  private async getRecentImprovementCount(): Promise<number> {
    // TODO: Query database for improvements in last 7 days
    return this.stats.total_regenerations_completed;
  }

  private updateAverageProcessingTime(type: 'events' | 'metrics' | 'regeneration', newTime: number): void {
    const statKey = `avg_${type}_processing_time_ms` as keyof FeedbackFlywheelStats;
    const currentAvg = this.stats[statKey] as number;
    
    // Simple moving average (in production, would use more sophisticated calculation)
    this.stats[statKey] = (currentAvg * 0.9 + newTime * 0.1) as any;
  }
}

// Export singleton factory
let globalFlywheel: FeedbackFlywheel | null = null;

export function createFeedbackFlywheel(
  generationPipeline: GenerationPipeline,
  config?: Partial<FeedbackFlywheelConfig>
): FeedbackFlywheel {
  if (globalFlywheel) {
    console.warn('[FeedbackFlywheel] Replacing existing flywheel instance');
  }
  
  globalFlywheel = new FeedbackFlywheel(generationPipeline, config);
  return globalFlywheel;
}

export function getFeedbackFlywheel(): FeedbackFlywheel | null {
  return globalFlywheel;
}