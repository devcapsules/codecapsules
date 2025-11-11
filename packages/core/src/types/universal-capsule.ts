/**
 * Universal Capsule Interface v2 - Migration Layer
 * 
 * This provides backward compatibility while migrating to the new
 * event-driven, runtime-aware universal interface.
 * 
 * Combines the best of your existing types with your new competitive moats.
 */

import type { 
  CapsuleMetadata, 
  TestCase, 
  Hint, 
  CodeCapsule as LegacyCodeCapsule,
  QuizCapsule as LegacyQuizCapsule,
  TerminalCapsule as LegacyTerminalCapsule,
  Capsule as LegacyCapsule 
} from './capsule';

import type { 
  RuntimeAwareCapsule,
  RuntimeConfiguration,
  AdaptiveContent 
} from './runtime-aware';

import type { 
  LearningEvent,
  EventCollector,
  LearningMetrics 
} from './events';

import type { 
  AIToHumanEdit
} from './creator-feedback';

import { CreatorFeedbackCapture } from './creator-feedback';

/**
 * Universal Capsule - The Complete Interface
 * 
 * This is your new unified interface that supports:
 * - Legacy capsule types (backward compatibility)
 * - Runtime awareness (WASM/Docker moat)
 * - Event-driven analytics (B2B product)
 * - Creator feedback (IP moat)
 * - Pedagogical minimalism (brand moat)
 */
export interface UniversalCapsule extends RuntimeAwareCapsule {
  // ===== LEGACY COMPATIBILITY =====
  legacy?: {
    originalType: 'code' | 'quiz' | 'terminal' | 'database' | 'system-design';
    metadata: CapsuleMetadata;
    migrationDate: Date;
    preservedData: any;
  };
  
  // ===== ENHANCED CAPABILITIES =====
  
  // Event streaming (B2B analytics)
  events: {
    collector: EventCollector;
    sessionMetrics: LearningMetrics;
    realTimeInsights: boolean;
  };
  
  // Creator feedback (IP engine)
  creatorFeedback: {
    capture: typeof CreatorFeedbackCapture;
    trainingData: AIToHumanEdit[];
    qualityScore: number;
  };
  
  // Pedagogical framework
  pedagogy: {
    learningObjectives: string[];
    prerequisites: string[];
    concepts: ConceptMap[];
    difficulty: DifficultyProgression;
    hints: ProgressiveHintSystem;
  };
  
  // Business metrics
  business: {
    tier: 'free' | 'pro' | 'enterprise';
    costOptimization: CostOptimization;
    revenueMetrics: RevenueMetrics;
  };
}

/**
 * Migration Utilities
 * Convert legacy capsules to universal format
 */
export class CapsuleMigrator {
  
  /**
   * Migrate legacy capsule to universal format
   */
  static migrateToUniversal(legacyCapsule: LegacyCapsule): UniversalCapsule {
    const baseUniversal: RuntimeAwareCapsule = {
      id: legacyCapsule.id,
      type: legacyCapsule.type,
      title: legacyCapsule.title,
      description: legacyCapsule.description,
      
      // Runtime configuration (default to WASM for free tier)
      runtime: this.createDefaultRuntimeConfig(),
      
      // Content adaptation
      content: this.adaptLegacyContent(legacyCapsule),
      
      // Execution context
      execution: this.createExecutionContext(),
      
      // Learning framework
      learning: this.createLearningFramework(legacyCapsule),
      
      // Analytics configuration
      analytics: this.createAnalyticsConfig(),
      
      // Feedback configuration
      feedback: this.createFeedbackConfig()
    };
    
    const universal: UniversalCapsule = {
      ...baseUniversal,
      
      // Legacy compatibility
      legacy: {
        originalType: legacyCapsule.type,
        metadata: {
          id: legacyCapsule.id,
          title: legacyCapsule.title,
          description: legacyCapsule.description,
          language: legacyCapsule.language,
          difficulty: legacyCapsule.difficulty,
          tags: legacyCapsule.tags,
          createdAt: legacyCapsule.createdAt,
          updatedAt: legacyCapsule.updatedAt,
          creatorId: legacyCapsule.creatorId
        },
        migrationDate: new Date(),
        preservedData: legacyCapsule
      },
      
      // Enhanced capabilities
      events: {
        collector: {} as EventCollector, // Initialize with actual implementation
        sessionMetrics: {} as LearningMetrics,
        realTimeInsights: true
      },
      
      creatorFeedback: {
        capture: CreatorFeedbackCapture,
        trainingData: [],
        qualityScore: 0.8 // Default quality score
      },
      
      pedagogy: this.createPedagogy(legacyCapsule),
      business: this.createBusinessMetrics()
    };
    
    return universal;
  }
  
  /**
   * Convert universal capsule back to legacy format (for backward compatibility)
   */
  static toLegacyFormat(universal: UniversalCapsule): LegacyCapsule {
    if (universal.legacy?.preservedData) {
      return universal.legacy.preservedData;
    }
    
    // Reconstruct legacy format from universal
    const baseCapsule = {
      id: universal.id,
      title: universal.title,
      description: universal.description,
      language: this.extractLanguage(universal),
      difficulty: this.extractDifficulty(universal),
      tags: this.extractTags(universal),
      createdAt: new Date(),
      updatedAt: new Date(),
      creatorId: 'migrated'
    };
    
    switch (universal.type) {
      case 'code':
        return {
          ...baseCapsule,
          type: 'code' as const,
          starterCode: universal.content.primary.code?.wasmVersion?.starterCode || '',
          solutionCode: universal.content.primary.code?.wasmVersion?.solution || '',
          testCases: universal.content.primary.code?.wasmVersion?.testCases?.map(this.convertToLegacyTestCase) || [],
          hints: universal.pedagogy.hints.sequence.map(this.convertToLegacyHint) || [],
          timeLimit: 30,
          memoryLimit: 128
        } as LegacyCodeCapsule;
        
      case 'quiz':
        return {
          ...baseCapsule,
          type: 'quiz' as const,
          questions: [] // Convert from universal format
        } as LegacyQuizCapsule;
        
      case 'terminal':
        return {
          ...baseCapsule,
          type: 'terminal' as const,
          commands: [],
          environment: { image: 'ubuntu', workingDirectory: '/home' }
        } as LegacyTerminalCapsule;
        
      default:
        throw new Error(`Cannot convert capsule type: ${universal.type}`);
    }
  }
  
  // ===== PRIVATE HELPERS =====
  
  private static createDefaultRuntimeConfig(): RuntimeConfiguration {
    return {
      target: 'wasm',
      constraints: {
        target: 'wasm',
        wasmLimitations: {
          noFileSystem: true,
          noNetworking: true,
          memoryLimit: 128,
          executionTimeLimit: 5000,
          allowedLanguages: ['javascript', 'python'],
          maxCodeComplexity: 6
        }
      },
      tier: 'free',
      costModel: {
        executionCost: 0,
        storageCost: 0.001,
        bandwidthCost: 0.001,
        aiGenerationCost: 0.05
      },
      optimization: {
        prioritizeCacheability: true,
        minimizeServerRequests: true,
        enableProgressiveLoading: true
      }
    };
  }
  
  private static adaptLegacyContent(legacy: LegacyCapsule): AdaptiveContent {
    return {
      primary: {
        problemStatement: legacy.description,
        code: legacy.type === 'code' ? {
          wasmVersion: {
            starterCode: (legacy as LegacyCodeCapsule).starterCode,
            solution: (legacy as LegacyCodeCapsule).solutionCode,
            testCases: (legacy as LegacyCodeCapsule).testCases?.map(tc => ({
              input: tc.input,
              expected: tc.expectedOutput,
              description: `Test case ${tc.orderIndex}`
            })) || [],
            language: legacy.language as any,
            complexity: 'medium' as const
          }
        } : undefined
      }
    };
  }
  
  private static createPedagogy(legacy: LegacyCapsule): UniversalCapsule['pedagogy'] {
    return {
      learningObjectives: [`Master ${legacy.title}`],
      prerequisites: [],
      concepts: [],
      difficulty: {
        current: legacy.difficulty === 'beginner' ? 'easy' : 
                 legacy.difficulty === 'intermediate' ? 'medium' : 'hard',
        progression: ['easy', 'medium', 'hard'],
        adaptiveScaling: true
      },
      hints: {
        sequence: legacy.type === 'code' ? 
          (legacy as LegacyCodeCapsule).hints?.map(h => ({
            content: h.hintText,
            trigger: 'on_request',
            effectiveness: 0.8
          })) || [] : [],
        progressive: true,
        contextAware: true
      }
    };
  }
  
  private static createBusinessMetrics(): UniversalCapsule['business'] {
    return {
      tier: 'free',
      costOptimization: {
        wasmFirst: true,
        cacheStrategy: 'aggressive',
        bandwidthMinimization: true
      },
      revenueMetrics: {
        costPerExecution: 0,
        revenuePerSession: 0,
        lifetimeValue: 0
      }
    };
  }
  
  // Placeholder implementations
  private static createExecutionContext(): any { return {}; }
  private static createLearningFramework(legacy: LegacyCapsule): any { return {}; }
  private static createAnalyticsConfig(): any { return {}; }
  private static createFeedbackConfig(): any { return {}; }
  private static extractLanguage(universal: UniversalCapsule): any { return 'javascript'; }
  private static extractDifficulty(universal: UniversalCapsule): any { return 'intermediate'; }
  private static extractTags(universal: UniversalCapsule): string[] { return []; }
  private static convertToLegacyTestCase(test: any): TestCase {
    return {
      id: '1',
      input: test.input,
      expectedOutput: test.expected,
      hidden: false,
      orderIndex: 0
    };
  }
  private static convertToLegacyHint(hint: any): Hint {
    return {
      id: '1',
      hintText: hint.content,
      orderIndex: 0
    };
  }
}

/**
 * Validation & Quality Assurance
 */
export class UniversalCapsuleValidator {
  
  static validate(capsule: UniversalCapsule): UniversalValidationResult {
    const issues: string[] = [];
    
    // Runtime validation
    if (capsule.runtime.target === 'wasm') {
      const wasmIssues = this.validateWASMConstraints(capsule);
      issues.push(...wasmIssues);
    }
    
    // Content validation
    const contentIssues = this.validateContent(capsule);
    issues.push(...contentIssues);
    
    // Pedagogical validation
    const pedagogyIssues = this.validatePedagogy(capsule);
    issues.push(...pedagogyIssues);
    
    return {
      isValid: issues.length === 0,
      issues,
      score: this.calculateQualityScore(capsule, issues),
      recommendations: this.generateRecommendations(issues)
    };
  }
  
  private static validateWASMConstraints(capsule: UniversalCapsule): string[] {
    const issues: string[] = [];
    
    if (capsule.content.primary.code?.wasmVersion) {
      const code = capsule.content.primary.code.wasmVersion;
      
      // Check file system usage
      if (code.starterCode.includes('fs.') || code.solution.includes('fs.')) {
        issues.push('WASM capsule contains file system operations');
      }
      
      // Check network usage
      if (code.starterCode.includes('fetch(') || code.solution.includes('fetch(')) {
        issues.push('WASM capsule contains network operations');
      }
    }
    
    return issues;
  }
  
  private static validateContent(capsule: UniversalCapsule): string[] {
    const issues: string[] = [];
    
    if (!capsule.title || capsule.title.length < 5) {
      issues.push('Title too short');
    }
    
    if (!capsule.description || capsule.description.length < 20) {
      issues.push('Description too short');
    }
    
    return issues;
  }
  
  private static validatePedagogy(capsule: UniversalCapsule): string[] {
    const issues: string[] = [];
    
    if (capsule.pedagogy.learningObjectives.length === 0) {
      issues.push('No learning objectives defined');
    }
    
    if (capsule.pedagogy.hints.sequence.length === 0) {
      issues.push('No hints provided');
    }
    
    return issues;
  }
  
  private static calculateQualityScore(capsule: UniversalCapsule, issues: string[]): number {
    const baseScore = 1.0;
    const penalty = issues.length * 0.1;
    return Math.max(0, baseScore - penalty);
  }
  
  private static generateRecommendations(issues: string[]): string[] {
    return issues.map(issue => {
      if (issue.includes('file system')) {
        return 'Consider using in-memory data structures instead of file operations';
      }
      if (issue.includes('network')) {
        return 'Use mock data or local APIs for WASM compatibility';
      }
      if (issue.includes('Title')) {
        return 'Add a more descriptive title (5+ characters)';
      }
      return 'Address this issue to improve capsule quality';
    });
  }
}

// ===== TYPE DEFINITIONS =====

export interface ConceptMap {
  concept: string;
  dependencies: string[];
  difficulty: number;
}

export interface DifficultyProgression {
  current: 'easy' | 'medium' | 'hard';
  progression: string[];
  adaptiveScaling: boolean;
}

export interface ProgressiveHintSystem {
  sequence: HintItem[];
  progressive: boolean;
  contextAware: boolean;
}

export interface HintItem {
  content: string;
  trigger: 'on_request' | 'on_failure' | 'time_based';
  effectiveness: number;
}

export interface CostOptimization {
  wasmFirst: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  bandwidthMinimization: boolean;
}

export interface RevenueMetrics {
  costPerExecution: number;
  revenuePerSession: number;
  lifetimeValue: number;
}

export interface UniversalValidationResult {
  isValid: boolean;
  issues: string[];
  score: number;
  recommendations: string[];
}

// Export the universal interface as the default
export type { UniversalCapsule as Capsule };