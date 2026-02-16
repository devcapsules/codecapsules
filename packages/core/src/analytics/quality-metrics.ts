/**
 * QualityMetrics - Analyzes content performance and identifies improvement opportunities
 * Part of the Feedback Flywheel system for continuous improvement
 */

import { 
  ContentMetrics, 
  ImprovementSuggestion, 
  ImprovementCategory,
  QualityThresholds,
  ErrorPattern 
} from '../types/analytics';
import { AnalyticsCollector } from './analytics-collector';

export interface QualityMetricsConfig {
  analysis_interval_hours: number; // 24
  min_confidence_threshold: number; // 0.7
  min_impact_threshold: number; // 0.3
  max_suggestions_per_capsule: number; // 5
  debug_mode: boolean;
}

export class QualityMetrics {
  private config: QualityMetricsConfig;
  private analyticsCollector: AnalyticsCollector;
  private qualityThresholds: QualityThresholds;

  constructor(
    analyticsCollector: AnalyticsCollector,
    qualityThresholds: QualityThresholds,
    config: Partial<QualityMetricsConfig> = {}
  ) {
    this.analyticsCollector = analyticsCollector;
    this.qualityThresholds = qualityThresholds;
    this.config = {
      analysis_interval_hours: 24,
      min_confidence_threshold: 0.7,
      min_impact_threshold: 0.3,
      max_suggestions_per_capsule: 5,
      debug_mode: false,
      ...config
    };

    if (this.config.debug_mode) {
      console.log('[QualityMetrics] Initialized with thresholds:', qualityThresholds);
    }
  }

  /**
   * Analyze all capsules and generate improvement suggestions
   */
  async generateImprovementSuggestions(): Promise<ImprovementSuggestion[]> {
    const poorPerformingCapsules = await this.analyticsCollector.identifyPoorPerformingCapsules(
      this.qualityThresholds
    );

    const allSuggestions: ImprovementSuggestion[] = [];

    for (const metrics of poorPerformingCapsules) {
      const suggestions = await this.analyzeCapsuleQuality(metrics);
      allSuggestions.push(...suggestions);
    }

    // Filter and prioritize suggestions
    const filteredSuggestions = allSuggestions
      .filter(s => s.confidence_score >= this.config.min_confidence_threshold)
      .filter(s => s.estimated_impact >= this.config.min_impact_threshold)
      .sort((a, b) => this.calculatePriorityScore(b) - this.calculatePriorityScore(a));

    if (this.config.debug_mode) {
      console.log(`[QualityMetrics] Generated ${filteredSuggestions.length} improvement suggestions`);
    }

    return filteredSuggestions;
  }

  /**
   * Get quality score for a specific capsule (0-1 scale)
   */
  async getCapsuleQualityScore(capsuleId: string): Promise<number> {
    const metrics = await this.analyticsCollector.getCapsuleMetrics(capsuleId);
    if (!metrics) return 0;

    return this.calculateQualityScore(metrics);
  }

  /**
   * Get overall platform quality metrics
   */
  async getPlatformQualityOverview(): Promise<{
    averageQualityScore: number;
    totalCapsules: number;
    needingImprovement: number;
    criticalIssues: number;
    topIssueCategories: { category: ImprovementCategory; count: number }[];
  }> {
    const allMetrics = await this.analyticsCollector.getAllCapsuleMetrics();
    const suggestions = await this.generateImprovementSuggestions();

    const qualityScores = await Promise.all(
      allMetrics.map(m => this.calculateQualityScore(m))
    );

    const averageQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;

    const needingImprovement = qualityScores.filter(score => score < 0.7).length;
    const criticalIssues = suggestions.filter(s => s.priority === 'critical').length;

    // Count issue categories
    const categoryCount = new Map<ImprovementCategory, number>();
    suggestions.forEach(s => {
      categoryCount.set(s.category, (categoryCount.get(s.category) || 0) + 1);
    });

    const topIssueCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      averageQualityScore,
      totalCapsules: allMetrics.length,
      needingImprovement,
      criticalIssues,
      topIssueCategories
    };
  }

  private async analyzeCapsuleQuality(metrics: ContentMetrics): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    const errorPatterns = await this.analyticsCollector.identifyErrorPatterns(metrics.capsule_id);

    // Analyze completion rate issues
    if (metrics.completion_rate < this.qualityThresholds.min_completion_rate) {
      suggestions.push(await this.createCompletionRateSuggestion(metrics, errorPatterns));
    }

    // Analyze abandonment rate issues
    if (metrics.abandonment_rate > this.qualityThresholds.max_abandonment_rate) {
      suggestions.push(await this.createAbandonmentSuggestion(metrics, errorPatterns));
    }

    // Analyze success rate issues
    if (metrics.success_rate < this.qualityThresholds.min_success_rate) {
      suggestions.push(await this.createSuccessRateSuggestion(metrics, errorPatterns));
    }

    // Analyze time-related issues
    if (metrics.average_time_seconds > (this.qualityThresholds.max_average_time_minutes * 60)) {
      suggestions.push(await this.createTimeSpentSuggestion(metrics, errorPatterns));
    }

    // Analyze error frequency issues
    if (metrics.error_frequency > this.qualityThresholds.max_error_frequency) {
      suggestions.push(await this.createErrorFrequencySuggestion(metrics, errorPatterns));
    }

    // Analyze satisfaction issues
    if (metrics.satisfaction_score < this.qualityThresholds.min_satisfaction_score) {
      suggestions.push(await this.createSatisfactionSuggestion(metrics, errorPatterns));
    }

    return suggestions
      .filter(s => s !== null)
      .slice(0, this.config.max_suggestions_per_capsule);
  }

  private async createCompletionRateSuggestion(
    metrics: ContentMetrics, 
    errorPatterns: ErrorPattern[]
  ): Promise<ImprovementSuggestion> {
    const completionRate = metrics.completion_rate;
    const priority = completionRate < 0.3 ? 'critical' : completionRate < 0.5 ? 'high' : 'medium';

    return {
      id: this.generateSuggestionId(),
      capsule_id: metrics.capsule_id,
      created_at: new Date(),
      priority,
      category: 'content_difficulty',
      issue_description: `Low completion rate of ${(completionRate * 100).toFixed(1)}% suggests content may be too difficult or unclear`,
      suggested_action: this.getCompletionRateAction(completionRate, errorPatterns),
      confidence_score: 0.9,
      estimated_impact: Math.min(0.9, (1 - completionRate) * 1.5),
      metrics_snapshot: metrics,
      user_feedback: [], // TODO: Collect actual user feedback
      error_patterns: errorPatterns
    };
  }

  private async createAbandonmentSuggestion(
    metrics: ContentMetrics, 
    errorPatterns: ErrorPattern[]
  ): Promise<ImprovementSuggestion> {
    const abandonmentRate = metrics.abandonment_rate;
    const priority = abandonmentRate > 0.7 ? 'critical' : abandonmentRate > 0.5 ? 'high' : 'medium';

    return {
      id: this.generateSuggestionId(),
      capsule_id: metrics.capsule_id,
      created_at: new Date(),
      priority,
      category: 'user_experience',
      issue_description: `High abandonment rate of ${(abandonmentRate * 100).toFixed(1)}% indicates engagement problems`,
      suggested_action: this.getAbandonmentAction(abandonmentRate, errorPatterns),
      confidence_score: 0.85,
      estimated_impact: Math.min(0.8, abandonmentRate * 1.2),
      metrics_snapshot: metrics,
      user_feedback: [],
      error_patterns: errorPatterns
    };
  }

  private async createSuccessRateSuggestion(
    metrics: ContentMetrics, 
    errorPatterns: ErrorPattern[]
  ): Promise<ImprovementSuggestion> {
    const successRate = metrics.success_rate;
    const priority = successRate < 0.4 ? 'critical' : successRate < 0.6 ? 'high' : 'medium';

    return {
      id: this.generateSuggestionId(),
      capsule_id: metrics.capsule_id,
      created_at: new Date(),
      priority,
      category: 'code_examples',
      issue_description: `Low success rate of ${(successRate * 100).toFixed(1)}% suggests code examples or tests need improvement`,
      suggested_action: this.getSuccessRateAction(successRate, errorPatterns),
      confidence_score: 0.8,
      estimated_impact: Math.min(0.9, (1 - successRate) * 1.3),
      metrics_snapshot: metrics,
      user_feedback: [],
      error_patterns: errorPatterns
    };
  }

  private async createTimeSpentSuggestion(
    metrics: ContentMetrics, 
    errorPatterns: ErrorPattern[]
  ): Promise<ImprovementSuggestion> {
    const averageMinutes = metrics.average_time_seconds / 60;
    const expectedMinutes = this.qualityThresholds.max_average_time_minutes;
    const priority = averageMinutes > expectedMinutes * 2 ? 'high' : 'medium';

    return {
      id: this.generateSuggestionId(),
      capsule_id: metrics.capsule_id,
      created_at: new Date(),
      priority,
      category: 'explanation_clarity',
      issue_description: `Average completion time of ${averageMinutes.toFixed(1)} minutes exceeds target of ${expectedMinutes} minutes`,
      suggested_action: `Break down complex concepts into smaller steps, add intermediate checkpoints, or provide clearer initial examples`,
      confidence_score: 0.75,
      estimated_impact: 0.6,
      metrics_snapshot: metrics,
      user_feedback: [],
      error_patterns: errorPatterns
    };
  }

  private async createErrorFrequencySuggestion(
    metrics: ContentMetrics, 
    errorPatterns: ErrorPattern[]
  ): Promise<ImprovementSuggestion> {
    const priority = metrics.error_frequency > this.qualityThresholds.max_error_frequency * 2 ? 'high' : 'medium';

    return {
      id: this.generateSuggestionId(),
      capsule_id: metrics.capsule_id,
      created_at: new Date(),
      priority,
      category: 'technical_issues',
      issue_description: `High error frequency of ${metrics.error_frequency.toFixed(2)} errors per completion`,
      suggested_action: this.getErrorFrequencyAction(errorPatterns),
      confidence_score: 0.9,
      estimated_impact: 0.7,
      metrics_snapshot: metrics,
      user_feedback: [],
      error_patterns: errorPatterns
    };
  }

  private async createSatisfactionSuggestion(
    metrics: ContentMetrics, 
    errorPatterns: ErrorPattern[]
  ): Promise<ImprovementSuggestion> {
    const priority = metrics.satisfaction_score < 2.5 ? 'high' : 'medium';

    return {
      id: this.generateSuggestionId(),
      capsule_id: metrics.capsule_id,
      created_at: new Date(),
      priority,
      category: 'learning_objectives',
      issue_description: `Low satisfaction score of ${metrics.satisfaction_score.toFixed(1)}/5 indicates content quality issues`,
      suggested_action: `Review learning objectives clarity, improve explanations, and add more engaging examples or interactive elements`,
      confidence_score: 0.7,
      estimated_impact: 0.8,
      metrics_snapshot: metrics,
      user_feedback: [],
      error_patterns: errorPatterns
    };
  }

  private getCompletionRateAction(completionRate: number, errorPatterns: ErrorPattern[]): string {
    const actions = [];
    
    if (completionRate < 0.3) {
      actions.push("Significantly simplify content and break into smaller chunks");
    } else if (completionRate < 0.5) {
      actions.push("Add more guided examples and reduce cognitive load");
    } else {
      actions.push("Provide additional hints and clearer instructions");
    }

    if (errorPatterns.length > 0) {
      const topError = errorPatterns[0];
      actions.push(`Address common ${topError.error_type} issues that affect ${topError.frequency} learners`);
    }

    return actions.join(". ");
  }

  private getAbandonmentAction(abandonmentRate: number, errorPatterns: ErrorPattern[]): string {
    const actions = [];
    
    actions.push("Improve initial engagement with more compelling introduction");
    actions.push("Add progress indicators and achievement milestones");
    
    if (errorPatterns.some(p => p.time_of_occurrence === 'early')) {
      actions.push("Fix early-stage errors that cause immediate frustration");
    }
    
    return actions.join(". ");
  }

  private getSuccessRateAction(successRate: number, errorPatterns: ErrorPattern[]): string {
    const actions = [];
    
    if (errorPatterns.some(p => p.error_type === 'syntax_error')) {
      actions.push("Provide better syntax guidance and auto-completion hints");
    }
    
    if (errorPatterns.some(p => p.error_type === 'type_error')) {
      actions.push("Add clearer type annotations and error explanations");
    }
    
    actions.push("Review test cases for clarity and add intermediate validation steps");
    
    return actions.join(". ");
  }

  private getErrorFrequencyAction(errorPatterns: ErrorPattern[]): string {
    if (errorPatterns.length === 0) {
      return "Improve error handling and validation in the exercise environment";
    }

    const topPattern = errorPatterns[0];
    const actions = [`Address the most common ${topPattern.error_type} (${topPattern.frequency} occurrences)`];
    
    if (topPattern.common_messages.length > 0) {
      actions.push(`Provide better error messages for: ${topPattern.common_messages[0]}`);
    }
    
    return actions.join(". ");
  }

  private calculateQualityScore(metrics: ContentMetrics): number {
    const weights = {
      completion_rate: 0.25,
      success_rate: 0.25,
      satisfaction_score: 0.20, // normalized from 1-5 to 0-1
      abandonment_rate: -0.15, // negative weight
      error_frequency: -0.10, // negative weight
      time_efficiency: 0.05 // bonus for reasonable time
    };

    let score = 0;
    
    // Positive contributions
    score += metrics.completion_rate * weights.completion_rate;
    score += metrics.success_rate * weights.success_rate;
    score += (metrics.satisfaction_score / 5) * weights.satisfaction_score;
    
    // Negative contributions
    score += Math.max(-0.3, -metrics.abandonment_rate * Math.abs(weights.abandonment_rate));
    score += Math.max(-0.2, -Math.min(5, metrics.error_frequency) / 5 * Math.abs(weights.error_frequency));
    
    // Time efficiency bonus (if completion time is reasonable)
    const reasonableTime = this.qualityThresholds.max_average_time_minutes * 60;
    if (metrics.average_time_seconds <= reasonableTime) {
      score += weights.time_efficiency;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculatePriorityScore(suggestion: ImprovementSuggestion): number {
    const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityScore = priorityWeights[suggestion.priority];
    
    return priorityScore * suggestion.confidence_score * suggestion.estimated_impact;
  }

  private generateSuggestionId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}