/**
 * Creator Feedback Infrastructure - Your IP Engine
 * 
 * This system automatically captures (AI_output, human_fix) pairs without friction.
 * Every save is an implicit "this is better" signal from creators.
 * This is your single most valuable competitive moat.
 */

export interface AIToHumanEdit {
  id: string;
  capsuleId: string;
  creatorId: string;
  timestamp: Date;
  
  // The core diff - this is your training data gold mine
  fieldType: ContentFieldType;
  aiGenerated: any;      // Original AI output
  humanEdited: any;      // What creator changed it to
  editType: EditType;
  
  // Context for ML training
  context: EditContext;
  
  // Quality signals
  signals: QualitySignals;
}

export type ContentFieldType = 
  | 'problem_statement'
  | 'starter_code'
  | 'solution_code'
  | 'test_case'
  | 'hint_text'
  | 'hint_sequence'
  | 'learning_objective'
  | 'difficulty_level'
  | 'time_estimate'
  | 'tag_classification';

export type EditType = 
  | 'content_improvement'    // Better wording, clarity
  | 'accuracy_fix'          // Fixing wrong information
  | 'difficulty_adjustment' // Making easier/harder
  | 'pedagogical_enhancement' // Better learning flow
  | 'technical_correction'   // Bug fixes, syntax errors
  | 'style_preference'      // Personal/brand style
  | 'complete_rewrite';     // Starting over

export interface EditContext {
  // Generation context
  originalPrompt: string;
  generationModel: string;
  generationParams: Record<string, any>;
  
  // User context
  creatorExperience: 'beginner' | 'intermediate' | 'expert';
  creatorSpecialty?: string[];
  timeSpentEditing: number; // milliseconds
  
  // Content context
  capsuleType: string;
  targetDifficulty: string;
  targetAudience: string;
}

export interface QualitySignals {
  // Implicit quality indicators
  editImmediacy: number;    // How quickly they edited (fast = obvious problem)
  editExtensiveness: number; // How much they changed (0-1 ratio)
  subsequentRegenerations: number; // Did they try AI again after this edit?
  
  // Outcome quality indicators
  learnerPerformance?: {
    completionRate: number;
    averageAttempts: number;
    timeToComplete: number;
  };
  
  // Creator satisfaction (optional explicit feedback)
  creatorRating?: number; // 1-5 if they choose to rate
  creatorComment?: string;
}

/**
 * Automatic Diff Capture System
 * 
 * This runs invisibly on every save operation.
 * No friction, no popups, no "rate this AI suggestion" dialogs.
 */
export class CreatorFeedbackCapture {
  
  /**
   * Core method: Capture diff on any content save
   * This is called automatically by the editor's onSave handler
   */
  static async captureDiff(
    capsuleId: string,
    creatorId: string,
    fieldType: ContentFieldType,
    aiVersion: any,
    humanVersion: any,
    context: Partial<EditContext>
  ): Promise<void> {
    
    // Only capture if there's actually a meaningful change
    if (this.areEffectivelyEqual(aiVersion, humanVersion)) {
      return;
    }
    
    const edit: AIToHumanEdit = {
      id: this.generateId(),
      capsuleId,
      creatorId,
      timestamp: new Date(),
      fieldType,
      aiGenerated: aiVersion,
      humanEdited: humanVersion,
      editType: this.classifyEditType(aiVersion, humanVersion, fieldType),
      context: this.enrichContext(context),
      signals: this.analyzeQualitySignals(aiVersion, humanVersion, context)
    };
    
    // Store for ML training pipeline
    await this.storeTrainingData(edit);
    
    // Real-time feedback to improve current session
    await this.updateGenerationModel(edit);
  }
  
  /**
   * Smart edit classification - what kind of improvement was this?
   */
  private static classifyEditType(
    aiVersion: any,
    humanVersion: any,
    fieldType: ContentFieldType
  ): EditType {
    
    const similarity = this.calculateSimilarity(aiVersion, humanVersion);
    
    // Complete rewrite
    if (similarity < 0.3) {
      return 'complete_rewrite';
    }
    
    // Field-specific classification
    switch (fieldType) {
      case 'starter_code':
      case 'solution_code':
        if (this.hasSyntaxFixes(aiVersion, humanVersion)) {
          return 'technical_correction';
        }
        if (this.hasComplexityChanges(aiVersion, humanVersion)) {
          return 'difficulty_adjustment';
        }
        break;
        
      case 'problem_statement':
        if (this.hasClarityImprovements(aiVersion, humanVersion)) {
          return 'content_improvement';
        }
        break;
        
      case 'test_case':
        if (this.hasLogicFixes(aiVersion, humanVersion)) {
          return 'accuracy_fix';
        }
        break;
        
      case 'hint_text':
      case 'hint_sequence':
        if (this.hasPedagogicalChanges(aiVersion, humanVersion)) {
          return 'pedagogical_enhancement';
        }
        break;
    }
    
    // Default fallback
    return similarity > 0.7 ? 'style_preference' : 'content_improvement';
  }
  
  /**
   * Extract quality signals from the edit behavior
   */
  private static analyzeQualitySignals(
    aiVersion: any,
    humanVersion: any,
    context: Partial<EditContext>
  ): QualitySignals {
    
    const editExtensiveness = 1 - this.calculateSimilarity(aiVersion, humanVersion);
    
    return {
      editImmediacy: context.timeSpentEditing || 0,
      editExtensiveness,
      subsequentRegenerations: 0, // Will be updated if they regenerate
      
      // Learner performance will be backfilled when data is available
      learnerPerformance: undefined,
      
      // Optional feedback (usually null)
      creatorRating: undefined,
      creatorComment: undefined
    };
  }
  
  /**
   * Real-time model improvement
   * Use immediate feedback to adjust current generation session
   */
  private static async updateGenerationModel(edit: AIToHumanEdit): Promise<void> {
    // If this was a technical correction, adjust code generation params
    if (edit.editType === 'technical_correction') {
      await this.adjustTechnicalAccuracy(edit);
    }
    
    // If this was a difficulty adjustment, update difficulty calibration
    if (edit.editType === 'difficulty_adjustment') {
      await this.adjustDifficultyCalibration(edit);
    }
    
    // If this was a content improvement, enhance clarity prompts
    if (edit.editType === 'content_improvement') {
      await this.enhanceClarityPrompts(edit);
    }
  }
  
  /**
   * Batch Analysis for ML Pipeline
   * Process captured diffs to improve AI generation quality
   */
  static async analyzeFeedbackPatterns(
    edits: AIToHumanEdit[],
    timeRange: { start: Date; end: Date }
  ): Promise<FeedbackInsights> {
    
    return {
      totalEdits: edits.length,
      editTypeDistribution: this.analyzeEditTypes(edits),
      commonImprovements: this.identifyCommonPatterns(edits),
      qualityTrends: this.analyzeQualityTrends(edits),
      modelPerformance: this.evaluateModelPerformance(edits),
      recommendations: this.generateModelRecommendations(edits)
    };
  }
  
  // ===== UTILITY METHODS =====
  
  private static areEffectivelyEqual(a: any, b: any): boolean {
    // Smart comparison that ignores trivial whitespace changes
    const normalize = (str: string) => str.trim().replace(/\s+/g, ' ').toLowerCase();
    
    if (typeof a === 'string' && typeof b === 'string') {
      return normalize(a) === normalize(b);
    }
    
    return JSON.stringify(a) === JSON.stringify(b);
  }
  
  private static calculateSimilarity(a: any, b: any): number {
    // Implement text similarity algorithm (e.g., Levenshtein distance)
    // Return value between 0 (completely different) and 1 (identical)
    
    if (typeof a === 'string' && typeof b === 'string') {
      return this.textSimilarity(a, b);
    }
    
    // For objects, compare JSON representations
    const aStr = JSON.stringify(a);
    const bStr = JSON.stringify(b);
    return this.textSimilarity(aStr, bStr);
  }
  
  private static textSimilarity(a: string, b: string): number {
    // Simple implementation - in production use more sophisticated algorithm
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  private static levenshteinDistance(a: string, b: string): number {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  private static generateId(): string {
    return `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private static enrichContext(partial: Partial<EditContext>): EditContext {
    return {
      originalPrompt: partial.originalPrompt || '',
      generationModel: partial.generationModel || 'gpt-4',
      generationParams: partial.generationParams || {},
      creatorExperience: partial.creatorExperience || 'intermediate',
      creatorSpecialty: partial.creatorSpecialty || [],
      timeSpentEditing: partial.timeSpentEditing || 0,
      capsuleType: partial.capsuleType || 'code',
      targetDifficulty: partial.targetDifficulty || 'medium',
      targetAudience: partial.targetAudience || 'general'
    };
  }
  
  // Placeholder methods for edit analysis (implement based on specific field types)
  private static hasSyntaxFixes(ai: any, human: any): boolean { return false; }
  private static hasComplexityChanges(ai: any, human: any): boolean { return false; }
  private static hasClarityImprovements(ai: any, human: any): boolean { return false; }
  private static hasLogicFixes(ai: any, human: any): boolean { return false; }
  private static hasPedagogicalChanges(ai: any, human: any): boolean { return false; }
  
  // Placeholder methods for model updates (implement with actual ML pipeline)
  private static async adjustTechnicalAccuracy(edit: AIToHumanEdit): Promise<void> {}
  private static async adjustDifficultyCalibration(edit: AIToHumanEdit): Promise<void> {}
  private static async enhanceClarityPrompts(edit: AIToHumanEdit): Promise<void> {}
  private static async storeTrainingData(edit: AIToHumanEdit): Promise<void> {}
  
  // Placeholder methods for batch analysis (implement with analytics pipeline)
  private static analyzeEditTypes(edits: AIToHumanEdit[]): Record<EditType, number> { return {} as any; }
  private static identifyCommonPatterns(edits: AIToHumanEdit[]): string[] { return []; }
  private static analyzeQualityTrends(edits: AIToHumanEdit[]): any { return {}; }
  private static evaluateModelPerformance(edits: AIToHumanEdit[]): any { return {}; }
  private static generateModelRecommendations(edits: AIToHumanEdit[]): string[] { return []; }
}

// ===== INTEGRATION INTERFACES =====

export interface FeedbackInsights {
  totalEdits: number;
  editTypeDistribution: Record<EditType, number>;
  commonImprovements: string[];
  qualityTrends: any;
  modelPerformance: any;
  recommendations: string[];
}

/**
 * Editor Integration Hook
 * This is how you integrate the feedback capture into any content editor
 */
export const useFeedbackCapture = () => {
  const captureOnSave = async (
    fieldType: ContentFieldType,
    originalAIContent: any,
    editedContent: any,
    context: Partial<EditContext> = {}
  ) => {
    // Get these from your app context
    const capsuleId = getCurrentCapsuleId();
    const creatorId = getCurrentCreatorId();
    
    await CreatorFeedbackCapture.captureDiff(
      capsuleId,
      creatorId,
      fieldType,
      originalAIContent,
      editedContent,
      context
    );
  };
  
  return { captureOnSave };
};

// Placeholder functions (implement in your app)
declare function getCurrentCapsuleId(): string;
declare function getCurrentCreatorId(): string;