/**
 * FeedbackProcessor - Automatically processes improvement suggestions and triggers content regeneration
 * Part of the Feedback Flywheel system for continuous improvement
 */

import { 
  ImprovementSuggestion, 
  FeedbackFlywheelConfig,
  ContentMetrics 
} from '../types/analytics';
import { QualityMetrics } from './quality-metrics';
import { GenerationPipeline } from '../agents/generation-pipeline';
import { BaseCapsule } from '../types/base-capsule';

export interface FeedbackProcessorConfig {
  auto_process_enabled: boolean; // true
  batch_processing_enabled: boolean; // true
  max_concurrent_regenerations: number; // 3
  regeneration_cooldown_hours: number; // 24
  notification_webhook_url?: string;
  debug_mode: boolean;
}

export interface RegenerationRequest {
  id: string;
  capsule_id: string;
  original_capsule: BaseCapsule;
  improvement_suggestions: ImprovementSuggestion[];
  created_at: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  attempts: number;
  error_message?: string;
}

export interface RegenerationResult {
  request_id: string;
  success: boolean;
  new_capsule?: BaseCapsule;
  validation_score?: number;
  improvement_metrics?: {
    estimated_completion_rate_improvement: number;
    estimated_success_rate_improvement: number;
    estimated_satisfaction_improvement: number;
  };
  error_message?: string;
}

export class FeedbackProcessor {
  private config: FeedbackProcessorConfig;
  private flywheelConfig: FeedbackFlywheelConfig;
  private qualityMetrics: QualityMetrics;
  private generationPipeline: GenerationPipeline;
  
  private activeRegenerations = new Map<string, RegenerationRequest>();
  private regenerationHistory = new Map<string, Date>(); // capsule_id -> last_regeneration
  private processingQueue: ImprovementSuggestion[] = [];

  constructor(
    flywheelConfig: FeedbackFlywheelConfig,
    qualityMetrics: QualityMetrics,
    generationPipeline: GenerationPipeline,
    config: Partial<FeedbackProcessorConfig> = {}
  ) {
    this.flywheelConfig = flywheelConfig;
    this.qualityMetrics = qualityMetrics;
    this.generationPipeline = generationPipeline;
    this.config = {
      auto_process_enabled: true,
      batch_processing_enabled: true,
      max_concurrent_regenerations: 3,
      regeneration_cooldown_hours: 24,
      debug_mode: false,
      ...config
    };

    if (this.config.debug_mode) {
      console.log('[FeedbackProcessor] Initialized with config:', this.config);
    }

    // Start background processing if enabled
    if (this.config.auto_process_enabled) {
      this.startBackgroundProcessing();
    }
  }

  /**
   * Process improvement suggestions and trigger regenerations
   */
  async processSuggestions(suggestions: ImprovementSuggestion[]): Promise<void> {
    if (!this.config.auto_process_enabled) {
      if (this.config.debug_mode) {
        console.log('[FeedbackProcessor] Auto-processing disabled, skipping suggestions');
      }
      return;
    }

    // Filter suggestions that meet regeneration criteria
    const actionableSuggestions = await this.filterActionableSuggestions(suggestions);
    
    if (actionableSuggestions.length === 0) {
      if (this.config.debug_mode) {
        console.log('[FeedbackProcessor] No actionable suggestions found');
      }
      return;
    }

    // Add to processing queue
    this.processingQueue.push(...actionableSuggestions);

    if (this.config.debug_mode) {
      console.log(`[FeedbackProcessor] Added ${actionableSuggestions.length} suggestions to queue`);
    }

    // Process immediately if not batch processing
    if (!this.config.batch_processing_enabled) {
      await this.processQueue();
    }
  }

  /**
   * Manually trigger regeneration for a specific capsule
   */
  async regenerateCapsule(
    capsuleId: string, 
    suggestions?: ImprovementSuggestion[]
  ): Promise<RegenerationResult> {
    const originalCapsule = await this.getCapsule(capsuleId);
    if (!originalCapsule) {
      return {
        request_id: '',
        success: false,
        error_message: `Capsule ${capsuleId} not found`
      };
    }

    // Get suggestions if not provided
    const improvementSuggestions = suggestions || await this.getSuggestionsForCapsule(capsuleId);

    const request: RegenerationRequest = {
      id: this.generateRequestId(),
      capsule_id: capsuleId,
      original_capsule: originalCapsule,
      improvement_suggestions: improvementSuggestions,
      created_at: new Date(),
      status: 'pending',
      attempts: 0
    };

    return await this.executeRegeneration(request);
  }

  /**
   * Get status of all active regenerations
   */
  getActiveRegenerations(): RegenerationRequest[] {
    return Array.from(this.activeRegenerations.values());
  }

  /**
   * Get regeneration history for analytics
   */
  async getRegenerationHistory(days: number = 7): Promise<{
    total_regenerations: number;
    successful_regenerations: number;
    failed_regenerations: number;
    avg_improvement_score: number;
    top_improvement_categories: string[];
  }> {
    // TODO: Implement database query for regeneration history
    return {
      total_regenerations: 0,
      successful_regenerations: 0,
      failed_regenerations: 0,
      avg_improvement_score: 0,
      top_improvement_categories: []
    };
  }

  private async filterActionableSuggestions(suggestions: ImprovementSuggestion[]): Promise<ImprovementSuggestion[]> {
    const filtered: ImprovementSuggestion[] = [];

    for (const suggestion of suggestions) {
      // Check confidence threshold
      if (suggestion.confidence_score < this.flywheelConfig.confidence_threshold_for_action) {
        continue;
      }

      // Check if capsule is already being regenerated
      if (this.activeRegenerations.has(suggestion.capsule_id)) {
        continue;
      }

      // Check cooldown period
      const lastRegeneration = this.regenerationHistory.get(suggestion.capsule_id);
      if (lastRegeneration) {
        const hoursSinceRegeneration = (Date.now() - lastRegeneration.getTime()) / (1000 * 60 * 60);
        if (hoursSinceRegeneration < this.config.regeneration_cooldown_hours) {
          continue;
        }
      }

      // Check if regeneration is enabled for this threshold
      const qualityScore = await this.qualityMetrics.getCapsuleQualityScore(suggestion.capsule_id);
      if (qualityScore > this.flywheelConfig.regeneration_threshold_score) {
        continue;
      }

      filtered.push(suggestion);
    }

    return filtered;
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0) return;

    // Group suggestions by capsule
    const suggestionsByCapule = new Map<string, ImprovementSuggestion[]>();
    for (const suggestion of this.processingQueue) {
      if (!suggestionsByCapule.has(suggestion.capsule_id)) {
        suggestionsByCapule.set(suggestion.capsule_id, []);
      }
      suggestionsByCapule.get(suggestion.capsule_id)!.push(suggestion);
    }

    // Process up to max concurrent regenerations
    const capsulesToProcess = Array.from(suggestionsByCapule.keys())
      .slice(0, this.config.max_concurrent_regenerations);

    const regenerationPromises = capsulesToProcess.map(async (capsuleId) => {
      const suggestions = suggestionsByCapule.get(capsuleId)!;
      try {
        const result = await this.regenerateCapsule(capsuleId, suggestions);
        
        if (result.success) {
          await this.notifyRegenerationSuccess(capsuleId, result);
        } else {
          await this.notifyRegenerationFailure(capsuleId, result);
        }

        return result;
      } catch (error) {
        console.error(`[FeedbackProcessor] Error processing capsule ${capsuleId}:`, error);
        return {
          request_id: '',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Wait for all regenerations to complete
    await Promise.all(regenerationPromises);

    // Remove processed suggestions from queue
    this.processingQueue = this.processingQueue.filter(
      s => !capsulesToProcess.includes(s.capsule_id)
    );

    if (this.config.debug_mode) {
      console.log(`[FeedbackProcessor] Processed ${capsulesToProcess.length} regenerations`);
    }
  }

  private async executeRegeneration(request: RegenerationRequest): Promise<RegenerationResult> {
    this.activeRegenerations.set(request.capsule_id, request);
    request.status = 'in_progress';
    request.attempts++;

    try {
      // Build improvement prompt from suggestions
      const improvementPrompt = this.buildImprovementPrompt(request.improvement_suggestions);

      // Regenerate using the pipeline
      const result = await this.generationPipeline.generateCapsule({
        type: request.original_capsule.capsule_type,
        language: request.original_capsule.runtime_config.language,
        difficulty: 'medium', // Default difficulty
        userPrompt: `${improvementPrompt}\n\nOriginal problem: ${request.original_capsule.problem_statement_md}`
      });

      if (result.capsule) {
        request.status = 'completed';
        this.regenerationHistory.set(request.capsule_id, new Date());

        // Calculate estimated improvements
        const improvementMetrics = await this.estimateImprovements(
          request.original_capsule,
          result.capsule,
          request.improvement_suggestions
        );

        const regenerationResult: RegenerationResult = {
          request_id: request.id,
          success: true,
          new_capsule: result.capsule,
          validation_score: result.confidence,
          improvement_metrics: improvementMetrics
        };

        // Save the new capsule
        await this.saveCapsule(result.capsule);

        return regenerationResult;
      } else {
        throw new Error('Generation failed - no capsule returned');
      }
    } catch (error) {
      request.status = 'failed';
      request.error_message = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic
      if (request.attempts < this.flywheelConfig.max_regeneration_attempts) {
        request.status = 'pending';
        // Schedule retry (simplified - in real implementation would use proper queuing)
        setTimeout(() => {
          this.executeRegeneration(request);
        }, 60000); // 1 minute delay
      }

      return {
        request_id: request.id,
        success: false,
        error_message: request.error_message
      };
    } finally {
      if (request.status === 'completed' || request.status === 'failed') {
        this.activeRegenerations.delete(request.capsule_id);
      }
    }
  }

  private buildImprovementPrompt(suggestions: ImprovementSuggestion[]): string {
    const prompt = ['Based on user analytics, please improve this capsule by addressing:'];
    
    const criticalIssues = suggestions.filter(s => s.priority === 'critical');
    const highIssues = suggestions.filter(s => s.priority === 'high');
    const mediumIssues = suggestions.filter(s => s.priority === 'medium');

    if (criticalIssues.length > 0) {
      prompt.push('\nCRITICAL ISSUES:');
      criticalIssues.forEach(s => {
        prompt.push(`- ${s.issue_description}`);
        prompt.push(`  Action: ${s.suggested_action}`);
      });
    }

    if (highIssues.length > 0) {
      prompt.push('\nHIGH PRIORITY:');
      highIssues.forEach(s => {
        prompt.push(`- ${s.issue_description}`);
        prompt.push(`  Action: ${s.suggested_action}`);
      });
    }

    if (mediumIssues.length > 0) {
      prompt.push('\nMEDIUM PRIORITY:');
      mediumIssues.forEach(s => {
        prompt.push(`- ${s.issue_description}`);
        prompt.push(`  Action: ${s.suggested_action}`);
      });
    }

    prompt.push('\nFocus on maintaining the learning objectives while addressing these issues.');
    
    return prompt.join('\n');
  }

  private async estimateImprovements(
    original: BaseCapsule,
    improved: BaseCapsule,
    suggestions: ImprovementSuggestion[]
  ): Promise<{
    estimated_completion_rate_improvement: number;
    estimated_success_rate_improvement: number;
    estimated_satisfaction_improvement: number;
  }> {
    // Simple heuristic-based estimation
    // In practice, this would be more sophisticated ML-based prediction
    
    let completionImprovement = 0;
    let successImprovement = 0;
    let satisfactionImprovement = 0;

    for (const suggestion of suggestions) {
      const impact = suggestion.estimated_impact * suggestion.confidence_score;
      
      switch (suggestion.category) {
        case 'content_difficulty':
        case 'explanation_clarity':
          completionImprovement += impact * 0.3;
          satisfactionImprovement += impact * 0.2;
          break;
        case 'code_examples':
        case 'technical_issues':
          successImprovement += impact * 0.4;
          break;
        case 'user_experience':
          completionImprovement += impact * 0.2;
          satisfactionImprovement += impact * 0.3;
          break;
        case 'learning_objectives':
          satisfactionImprovement += impact * 0.4;
          break;
      }
    }

    return {
      estimated_completion_rate_improvement: Math.min(0.5, completionImprovement),
      estimated_success_rate_improvement: Math.min(0.4, successImprovement),
      estimated_satisfaction_improvement: Math.min(0.3, satisfactionImprovement)
    };
  }

  private startBackgroundProcessing(): void {
    const interval = this.flywheelConfig.improvement_analysis_interval_hours * 60 * 60 * 1000;
    
    setInterval(async () => {
      if (this.config.batch_processing_enabled && this.processingQueue.length > 0) {
        await this.processQueue();
      }
    }, Math.min(interval, 60000)); // Check at least every minute
  }

  private async notifyRegenerationSuccess(capsuleId: string, result: RegenerationResult): Promise<void> {
    if (this.config.notification_webhook_url) {
      // TODO: Send webhook notification
    }

    if (this.config.debug_mode) {
      console.log(`[FeedbackProcessor] Successfully regenerated capsule ${capsuleId}`, result);
    }
  }

  private async notifyRegenerationFailure(capsuleId: string, result: RegenerationResult): Promise<void> {
    if (this.config.notification_webhook_url) {
      // TODO: Send webhook notification
    }

    console.error(`[FeedbackProcessor] Failed to regenerate capsule ${capsuleId}:`, result.error_message);
  }

  private generateRequestId(): string {
    return `regen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Placeholder methods for database operations
  private async getCapsule(capsuleId: string): Promise<BaseCapsule | null> {
    // TODO: Implement database query
    return null;
  }

  private async getSuggestionsForCapsule(capsuleId: string): Promise<ImprovementSuggestion[]> {
    // TODO: Implement database query
    return [];
  }

  private async saveCapsule(capsule: BaseCapsule): Promise<void> {
    // TODO: Implement database save
    if (this.config.debug_mode) {
      console.log('[FeedbackProcessor] Saving improved capsule:', capsule.id);
    }
  }
}