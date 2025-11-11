/**
 * Quality Assurance Pipeline - Your Content Excellence Engine
 * 
 * This is the guardian of your AI generation quality that:
 * - Validates content against pedagogical standards
 * - Integrates creator feedback for continuous improvement
 * - Ensures runtime compatibility and safety
 * - Provides quality scoring and improvement suggestions
 * - Manages the regeneration loop for subpar content
 * 
 * The QA pipeline is what separates professional AI education
 * platforms from simple content generators.
 */

import type { GeneratedContent, ValidationResult } from './type-specific-generators';
import type { UniversalCapsule } from '../types/universal-capsule';
import type { RuntimeTarget, RuntimeConstraints } from '../types/runtime-aware';
import type { AIToHumanEdit, CreatorFeedbackCapture } from '../types/creator-feedback';
import type { CapsuleType, DifficultyLevel } from '../types/capsule';
import {
  CodeContentValidator,
  QuizContentValidator,
  TerminalContentValidator,
  RuntimeCompatibilityValidator,
  ContentLengthRule,
  ClarityRule,
  InclusivityRule,
  AccessibilityRule,
  SafetyRule,
  PedagogicalProgressionRule,
  EngagementRule,
  FeedbackIntegrationRule
} from './quality-validators';

export interface QualityMetrics {
  pedagogicalScore: number;      // 0-100: How well it teaches
  technicalAccuracy: number;     // 0-100: Correctness of content
  engagementFactor: number;      // 0-100: How engaging/interactive
  difficultyAlignment: number;   // 0-100: Matches target difficulty
  runtimeCompatibility: number;  // 0-100: Works in target environment
  overallScore: number;          // 0-100: Weighted average
}

export interface QualityIssue {
  category: 'critical' | 'major' | 'minor' | 'suggestion';
  rule: string;
  message: string;
  suggestion: string;
  autoFixable: boolean;
  impact: string;
}

export interface QualityReport {
  metrics: QualityMetrics;
  issues: QualityIssue[];
  recommendations: string[];
  passesThreshold: boolean;
  regenerationNeeded: boolean;
  improvementAreas: string[];
}

export interface QualityContext {
  content: any;
  capsuleType: CapsuleType;
  difficulty: DifficultyLevel;
  runtimeTarget: RuntimeTarget;
  constraints: RuntimeConstraints;
  userPrompt: string;
  qualityThreshold: number;
  creatorFeedback?: AIToHumanEdit[];
}

/**
 * Core Quality Assurance Engine
 */
export class QualityAssurancePipeline {
  private feedbackAnalyzer: CreatorFeedbackAnalyzer;
  private codeValidator: CodeContentValidator;
  private quizValidator: QuizContentValidator;
  private terminalValidator: TerminalContentValidator;
  private qualityRules: QualityRule[];

  constructor() {
    this.feedbackAnalyzer = new CreatorFeedbackAnalyzer();
    this.codeValidator = new CodeContentValidator();
    this.quizValidator = new QuizContentValidator();
    this.terminalValidator = new TerminalContentValidator();
    this.qualityRules = this.initializeQualityRules();
  }

  /**
   * Main quality assessment method
   */
  async assessQuality(context: QualityContext): Promise<QualityReport> {
    console.log(`🔍 Assessing content quality for ${context.capsuleType} capsule...`);
    
    const startTime = Date.now();
    
    // Step 1: Run type-specific validation
    const typeValidation = await this.runTypeSpecificValidation(context);
    
    // Step 2: Apply universal quality rules
    const universalValidation = await this.runUniversalValidation(context);
    
    // Step 3: Check runtime compatibility
    const runtimeValidation = await this.runRuntimeValidation(context);
    
    // Step 4: Analyze creator feedback patterns
    const feedbackAnalysis = await this.analyzeFeedbackPatterns(context);
    
    // Step 5: Calculate quality metrics
    const metrics = await this.calculateQualityMetrics(context, {
      typeValidation,
      universalValidation,
      runtimeValidation,
      feedbackAnalysis
    });
    
    // Step 6: Generate comprehensive report
    const report = await this.generateQualityReport(context, metrics, {
      typeValidation,
      universalValidation,
      runtimeValidation,
      feedbackAnalysis
    });
    
    const assessmentTime = Date.now() - startTime;
    console.log(`✅ Quality assessment completed in ${assessmentTime}ms`);
    console.log(`📊 Overall Score: ${metrics.overallScore.toFixed(1)}/100`);
    console.log(`🎯 Passes Threshold: ${report.passesThreshold ? '✅' : '❌'}`);
    
    return report;
  }

  /**
   * Run validation specific to content type
   */
  private async runTypeSpecificValidation(context: QualityContext): Promise<ValidationResult[]> {
    switch (context.capsuleType) {
      case 'code':
        return await this.codeValidator.validate(context.content, context);
      case 'quiz':
        return await this.quizValidator.validate(context.content, context);
      case 'terminal':
        return await this.terminalValidator.validate(context.content, context);
      default:
        throw new Error(`No validator found for capsule type: ${context.capsuleType}`);
    }
  }

  /**
   * Apply rules that work across all content types
   */
  private async runUniversalValidation(context: QualityContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const rule of this.qualityRules) {
      try {
        const result = await rule.evaluate(context);
        results.push(result);
      } catch (error) {
        console.warn(`Quality rule ${rule.name} failed:`, error);
        results.push({
          rule: rule.name,
          passed: false,
          message: `Rule evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'warning'
        });
      }
    }
    
    return results;
  }

  /**
   * Validate runtime compatibility
   */
  private async runRuntimeValidation(context: QualityContext): Promise<ValidationResult[]> {
    const validator = new RuntimeCompatibilityValidator();
    return await validator.validate(context);
  }

  /**
   * Analyze creator feedback to identify improvement patterns
   */
  private async analyzeFeedbackPatterns(context: QualityContext): Promise<FeedbackAnalysis> {
    if (!context.creatorFeedback || context.creatorFeedback.length === 0) {
      return {
        patterns: [],
        commonIssues: [],
        improvementSuggestions: [],
        confidenceScore: 0
      };
    }
    
    return await this.feedbackAnalyzer.analyze(context.creatorFeedback, context);
  }

  /**
   * Calculate comprehensive quality metrics
   */
  private async calculateQualityMetrics(
    context: QualityContext,
    validationResults: {
      typeValidation: ValidationResult[];
      universalValidation: ValidationResult[];
      runtimeValidation: ValidationResult[];
      feedbackAnalysis: FeedbackAnalysis;
    }
  ): Promise<QualityMetrics> {
    
    // Pedagogical Score (30% weight)
    const pedagogicalScore = this.calculatePedagogicalScore(context, validationResults);
    
    // Technical Accuracy (25% weight)
    const technicalAccuracy = this.calculateTechnicalAccuracy(validationResults);
    
    // Engagement Factor (20% weight)
    const engagementFactor = this.calculateEngagementFactor(context);
    
    // Difficulty Alignment (15% weight)
    const difficultyAlignment = this.calculateDifficultyAlignment(context);
    
    // Runtime Compatibility (10% weight)
    const runtimeCompatibility = this.calculateRuntimeCompatibility(validationResults.runtimeValidation);
    
    // Calculate weighted overall score
    const overallScore = 
      (pedagogicalScore * 0.30) +
      (technicalAccuracy * 0.25) +
      (engagementFactor * 0.20) +
      (difficultyAlignment * 0.15) +
      (runtimeCompatibility * 0.10);
    
    return {
      pedagogicalScore,
      technicalAccuracy,
      engagementFactor,
      difficultyAlignment,
      runtimeCompatibility,
      overallScore
    };
  }

  /**
   * Generate comprehensive quality report
   */
  private async generateQualityReport(
    context: QualityContext,
    metrics: QualityMetrics,
    validationResults: any
  ): Promise<QualityReport> {
    
    // Collect all issues
    const allValidation = [
      ...validationResults.typeValidation,
      ...validationResults.universalValidation,
      ...validationResults.runtimeValidation
    ];
    
    const issues = this.categorizeIssues(allValidation);
    const recommendations = this.generateRecommendations(metrics, issues, validationResults.feedbackAnalysis);
    const improvementAreas = this.identifyImprovementAreas(metrics);
    
    const passesThreshold = metrics.overallScore >= context.qualityThreshold;
    const hasCriticalIssues = issues.some(issue => issue.category === 'critical');
    const regenerationNeeded = !passesThreshold || hasCriticalIssues;
    
    return {
      metrics,
      issues,
      recommendations,
      passesThreshold,
      regenerationNeeded,
      improvementAreas
    };
  }

  /**
   * Suggest improvements for failed content
   */
  async suggestImprovements(report: QualityReport, context: QualityContext): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Critical issues first
    const criticalIssues = report.issues.filter(i => i.category === 'critical');
    if (criticalIssues.length > 0) {
      suggestions.push('🚨 CRITICAL ISSUES MUST BE FIXED:');
      criticalIssues.forEach(issue => {
        suggestions.push(`  • ${issue.message} - ${issue.suggestion}`);
      });
    }
    
    // Major improvements
    const majorIssues = report.issues.filter(i => i.category === 'major');
    if (majorIssues.length > 0) {
      suggestions.push('🔧 MAJOR IMPROVEMENTS NEEDED:');
      majorIssues.forEach(issue => {
        suggestions.push(`  • ${issue.suggestion}`);
      });
    }
    
    // Specific metric improvements
    if (report.metrics.pedagogicalScore < 70) {
      suggestions.push('📚 PEDAGOGICAL IMPROVEMENTS:');
      suggestions.push('  • Add clearer explanations and examples');
      suggestions.push('  • Include progressive difficulty steps');
      suggestions.push('  • Provide more contextual hints');
    }
    
    if (report.metrics.engagementFactor < 70) {
      suggestions.push('🎮 ENGAGEMENT IMPROVEMENTS:');
      suggestions.push('  • Make content more interactive');
      suggestions.push('  • Add visual or practical elements');
      suggestions.push('  • Include motivating challenges');
    }
    
    if (report.metrics.technicalAccuracy < 80) {
      suggestions.push('🔧 TECHNICAL IMPROVEMENTS:');
      suggestions.push('  • Verify all code examples work');
      suggestions.push('  • Check for syntax and logic errors');
      suggestions.push('  • Ensure best practices are followed');
    }
    
    return suggestions;
  }

  /**
   * Initialize quality rules that apply to all content
   */
  private initializeQualityRules(): QualityRule[] {
    return [
      new ContentLengthRule(),
      new ClarityRule(),
      new InclusivityRule(),
      new AccessibilityRule(),
      new SafetyRule(),
      new PedagogicalProgressionRule(),
      new EngagementRule(),
      new FeedbackIntegrationRule()
    ];
  }

  // Helper methods for metric calculations
  private calculatePedagogicalScore(context: QualityContext, results: any): number {
    let score = 100;
    
    // Check for clear explanations
    if (!this.hasAdequateExplanations(context.content)) score -= 20;
    
    // Check for progressive complexity
    if (!this.hasProgressiveComplexity(context.content, context.capsuleType)) score -= 15;
    
    // Check for practical examples
    if (!this.hasPracticalExamples(context.content, context.capsuleType)) score -= 15;
    
    // Check feedback integration
    const feedbackPenalty = this.calculateFeedbackPenalty(results.feedbackAnalysis);
    score -= feedbackPenalty;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateTechnicalAccuracy(results: any): number {
    const allValidation = [
      ...results.typeValidation,
      ...results.universalValidation,
      ...results.runtimeValidation
    ];
    
    const errorCount = allValidation.filter(v => !v.passed && v.severity === 'error').length;
    const warningCount = allValidation.filter(v => !v.passed && v.severity === 'warning').length;
    
    let score = 100;
    score -= errorCount * 15;    // Errors are serious
    score -= warningCount * 5;   // Warnings are less serious
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateEngagementFactor(context: QualityContext): number {
    const content = context.content;
    let score = 60; // Base score
    
    // Interactive elements boost engagement
    if (context.capsuleType === 'code' && content.hints && content.hints.length > 0) score += 15;
    if (context.capsuleType === 'quiz' && this.hasVariedQuestionTypes(content)) score += 15;
    if (context.capsuleType === 'terminal' && this.hasProgressiveSteps(content)) score += 15;
    
    // Clear examples and explanations
    if (this.hasEngagingExamples(content)) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateDifficultyAlignment(context: QualityContext): number {
    // This would analyze if content complexity matches target difficulty
    // For now, return a mock score based on basic heuristics
    const content = context.content;
    const targetDifficulty = context.difficulty;
    
    let score = 85; // Assume good alignment by default
    
    // Check if complexity indicators match difficulty
    if (targetDifficulty === 'beginner' && this.hasAdvancedConcepts(content)) score -= 20;
    if (targetDifficulty === 'advanced' && this.hasOnlyBasicConcepts(content)) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateRuntimeCompatibility(runtimeValidation: ValidationResult[]): number {
    const failures = runtimeValidation.filter(v => !v.passed);
    const score = Math.max(0, 100 - (failures.length * 20));
    return score;
  }

  // Content analysis helper methods
  private hasAdequateExplanations(content: any): boolean {
    const text = JSON.stringify(content).toLowerCase();
    const explanationKeywords = ['explanation', 'because', 'why', 'how', 'this works'];
    return explanationKeywords.some(keyword => text.includes(keyword));
  }
  
  private hasProgressiveComplexity(content: any, type: CapsuleType): boolean {
    if (type === 'code') {
      return content.hints && content.hints.length > 1;
    }
    if (type === 'quiz') {
      return content.questions && content.questions.some((q: any) => q.difficulty === 'easy') &&
             content.questions.some((q: any) => q.difficulty === 'hard');
    }
    if (type === 'terminal') {
      return content.steps && content.steps.length > 3;
    }
    return false;
  }
  
  private hasPracticalExamples(content: any, type: CapsuleType): boolean {
    const text = JSON.stringify(content).toLowerCase();
    return text.includes('example') || text.includes('demo') || text.includes('practice');
  }
  
  private calculateFeedbackPenalty(analysis: FeedbackAnalysis): number {
    // Reduce score if previous feedback indicated recurring issues
    return Math.min(25, analysis.commonIssues.length * 5);
  }
  
  private hasVariedQuestionTypes(content: any): boolean {
    if (!content.questions) return false;
    const types = new Set(content.questions.map((q: any) => q.type));
    return types.size > 1;
  }
  
  private hasProgressiveSteps(content: any): boolean {
    return content.steps && content.steps.length > 3;
  }
  
  private hasEngagingExamples(content: any): boolean {
    const text = JSON.stringify(content).toLowerCase();
    const engagementWords = ['interactive', 'hands-on', 'practice', 'try', 'experiment'];
    return engagementWords.some(word => text.includes(word));
  }
  
  private hasAdvancedConcepts(content: any): boolean {
    const text = JSON.stringify(content).toLowerCase();
    const advancedKeywords = ['algorithm', 'optimization', 'complexity', 'architecture', 'design pattern'];
    return advancedKeywords.some(keyword => text.includes(keyword));
  }
  
  private hasOnlyBasicConcepts(content: any): boolean {
    const text = JSON.stringify(content).toLowerCase();
    const basicKeywords = ['variable', 'function', 'loop', 'if', 'basic'];
    const advancedKeywords = ['algorithm', 'optimization', 'complexity', 'architecture'];
    
    const hasBasic = basicKeywords.some(keyword => text.includes(keyword));
    const hasAdvanced = advancedKeywords.some(keyword => text.includes(keyword));
    
    return hasBasic && !hasAdvanced;
  }
  
  private categorizeIssues(validationResults: ValidationResult[]): QualityIssue[] {
    return validationResults
      .filter(result => !result.passed)
      .map(result => ({
        category: this.mapSeverityToCategory(result.severity),
        rule: result.rule,
        message: result.message,
        suggestion: this.generateSuggestionForRule(result.rule),
        autoFixable: this.isRuleAutoFixable(result.rule),
        impact: this.calculateImpact(result.severity)
      }));
  }
  
  private mapSeverityToCategory(severity: string): 'critical' | 'major' | 'minor' | 'suggestion' {
    switch (severity) {
      case 'error': return 'critical';
      case 'warning': return 'major';
      case 'info': return 'minor';
      default: return 'suggestion';
    }
  }
  
  private generateSuggestionForRule(rule: string): string {
    const suggestions: Record<string, string> = {
      'content_length': 'Ensure content is neither too brief nor too verbose for the target audience',
      'clarity': 'Use clear, simple language and provide concrete examples',
      'technical_accuracy': 'Verify all code examples and technical details are correct',
      'pedagogical_progression': 'Structure content from simple to complex concepts',
      'engagement': 'Add interactive elements and practical applications'
    };
    
    return suggestions[rule] || 'Review and improve this aspect of the content';
  }
  
  private isRuleAutoFixable(rule: string): boolean {
    const autoFixableRules = ['content_length', 'formatting', 'simple_syntax_errors'];
    return autoFixableRules.includes(rule);
  }
  
  private calculateImpact(severity: string): string {
    switch (severity) {
      case 'error': return 'High - Blocks content approval';
      case 'warning': return 'Medium - Reduces content quality';
      case 'info': return 'Low - Minor improvement opportunity';
      default: return 'Minimal - Optional enhancement';
    }
  }
  
  private generateRecommendations(metrics: QualityMetrics, issues: QualityIssue[], feedbackAnalysis: FeedbackAnalysis): string[] {
    const recommendations: string[] = [];
    
    // Metric-based recommendations
    if (metrics.pedagogicalScore < 80) {
      recommendations.push('Focus on improving pedagogical structure and explanations');
    }
    
    if (metrics.engagementFactor < 70) {
      recommendations.push('Add more interactive elements and practical applications');
    }
    
    if (metrics.technicalAccuracy < 90) {
      recommendations.push('Review technical content for accuracy and best practices');
    }
    
    // Issue-based recommendations
    const criticalCount = issues.filter(i => i.category === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical issues before approval`);
    }
    
    // Feedback-based recommendations
    if (feedbackAnalysis.commonIssues.length > 0) {
      recommendations.push('Apply insights from creator feedback patterns');
    }
    
    return recommendations;
  }
  
  private identifyImprovementAreas(metrics: QualityMetrics): string[] {
    const areas: string[] = [];
    
    const metricThreshold = 75;
    
    if (metrics.pedagogicalScore < metricThreshold) areas.push('Pedagogical Structure');
    if (metrics.technicalAccuracy < metricThreshold) areas.push('Technical Accuracy');
    if (metrics.engagementFactor < metricThreshold) areas.push('Engagement');
    if (metrics.difficultyAlignment < metricThreshold) areas.push('Difficulty Alignment');
    if (metrics.runtimeCompatibility < metricThreshold) areas.push('Runtime Compatibility');
    
    return areas;
  }
}

/**
 * Creator Feedback Analyzer
 * 
 * Analyzes patterns in creator edits to identify
 * common issues and improvement opportunities.
 */
class CreatorFeedbackAnalyzer {
  
  async analyze(feedback: AIToHumanEdit[], context: QualityContext): Promise<FeedbackAnalysis> {
    console.log(`🧠 Analyzing ${feedback.length} creator feedback instances...`);
    
    const patterns = this.identifyPatterns(feedback);
    const commonIssues = this.identifyCommonIssues(feedback);
    const improvementSuggestions = this.generateImprovementSuggestions(patterns, commonIssues);
    const confidenceScore = this.calculateConfidenceScore(feedback);
    
    return {
      patterns,
      commonIssues,
      improvementSuggestions,
      confidenceScore
    };
  }
  
  private identifyPatterns(feedback: AIToHumanEdit[]): FeedbackPattern[] {
    const patterns: FeedbackPattern[] = [];
    
    // Group by edit type
    const editTypeGroups = feedback.reduce((groups, fb) => {
      const type = fb.editType;
      if (!groups[type]) groups[type] = [];
      groups[type].push(fb);
      return groups;
    }, {} as Record<string, AIToHumanEdit[]>);
    
    // Analyze each group
    Object.entries(editTypeGroups).forEach(([editType, feedbacks]) => {
      if (feedbacks.length > 1) { // Pattern emerges with multiple instances
        patterns.push({
          type: 'edit_type_frequency',
          description: `Frequent ${editType} edits`,
          frequency: feedbacks.length,
          confidence: feedbacks.length / feedback.length,
          suggestion: this.getSuggestionForEditType(editType)
        });
      }
    });
    
    return patterns;
  }
  
  private identifyCommonIssues(feedback: AIToHumanEdit[]): CommonIssue[] {
    const issues: CommonIssue[] = [];
    
    // Analyze edit immediacy (quick edits indicate obvious problems)
    const quickEdits = feedback.filter(fb => fb.signals.editImmediacy < 2000);
    if (quickEdits.length > feedback.length * 0.3) {
      issues.push({
        type: 'obvious_errors',
        description: 'Content has obvious errors that creators fix immediately',
        severity: 'high',
        frequency: quickEdits.length / feedback.length
      });
    }
    
    // Analyze extensive edits (major changes indicate fundamental issues)
    const extensiveEdits = feedback.filter(fb => fb.signals.editExtensiveness > 0.5);
    if (extensiveEdits.length > 0) {
      issues.push({
        type: 'fundamental_issues',
        description: 'Content requires major restructuring',
        severity: 'high',
        frequency: extensiveEdits.length / feedback.length
      });
    }
    
    return issues;
  }
  
  private generateImprovementSuggestions(patterns: FeedbackPattern[], issues: CommonIssue[]): string[] {
    const suggestions: string[] = [];
    
    patterns.forEach(pattern => {
      suggestions.push(pattern.suggestion);
    });
    
    issues.forEach(issue => {
      if (issue.type === 'obvious_errors') {
        suggestions.push('Improve initial AI generation quality to reduce obvious errors');
      } else if (issue.type === 'fundamental_issues') {
        suggestions.push('Enhance prompt engineering to better capture requirements');
      }
    });
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
  
  private calculateConfidenceScore(feedback: AIToHumanEdit[]): number {
    if (feedback.length === 0) return 0;
    
    // More feedback = higher confidence in analysis
    // Recent feedback = higher confidence
    // Consistent patterns = higher confidence
    
    const countScore = Math.min(feedback.length / 10, 1) * 40;
    const recencyScore = this.calculateRecencyScore(feedback) * 30;
    const consistencyScore = this.calculateConsistencyScore(feedback) * 30;
    
    return countScore + recencyScore + consistencyScore;
  }
  
  private calculateRecencyScore(feedback: AIToHumanEdit[]): number {
    const now = Date.now();
    const recentThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const recentCount = feedback.filter(fb => 
      now - fb.timestamp.getTime() < recentThreshold
    ).length;
    
    return recentCount / feedback.length;
  }
  
  private calculateConsistencyScore(feedback: AIToHumanEdit[]): number {
    // Measure how consistent the edit types are
    const editTypes = feedback.map(fb => fb.editType);
    const uniqueTypes = new Set(editTypes);
    
    // More consistency in edit types = higher score
    return uniqueTypes.size <= 3 ? 1 : Math.max(0, 1 - (uniqueTypes.size - 3) * 0.2);
  }
  
  private getSuggestionForEditType(editType: string): string {
    const suggestions: Record<string, string> = {
      'content_improvement': 'Focus on clearer, more engaging content writing',
      'accuracy_fix': 'Improve fact-checking and technical validation',
      'difficulty_adjustment': 'Better align content complexity with target difficulty',
      'pedagogical_enhancement': 'Strengthen educational structure and flow',
      'technical_correction': 'Enhance code validation and testing',
      'style_preference': 'Learn and apply consistent style guidelines'
    };
    
    return suggestions[editType] || 'Analyze this edit pattern for improvement opportunities';
  }
}

// Supporting interfaces
interface FeedbackAnalysis {
  patterns: FeedbackPattern[];
  commonIssues: CommonIssue[];
  improvementSuggestions: string[];
  confidenceScore: number;
}

interface FeedbackPattern {
  type: string;
  description: string;
  frequency: number;
  confidence: number;
  suggestion: string;
}

interface CommonIssue {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  frequency: number;
}

// Abstract base classes for validators and rules
abstract class ContentValidator {
  abstract validate(content: any, context: QualityContext): Promise<ValidationResult[]>;
}

abstract class QualityRule {
  abstract name: string;
  abstract evaluate(context: QualityContext): Promise<ValidationResult>;
}