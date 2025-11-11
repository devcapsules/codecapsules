/**
 * Runtime-Aware Content Structure - Your WASM-First Cost Moat
 * 
 * This system makes your AI generation runtime-aware:
 * - WASM target = Free tier, browser-based, constrained but fast
 * - Docker target = Pro tier, server-based, unlimited but costly
 * 
 * The AI adapts content complexity based on execution target.
 */

import type { CapsuleType, DifficultyLevel } from './capsule';

export type RuntimeTarget = 'wasm' | 'docker' | 'hybrid';

export interface RuntimeConstraints {
  target: RuntimeTarget;
  
  // WASM constraints (free tier)
  wasmLimitations?: {
    noFileSystem: boolean;
    noNetworking: boolean;
    memoryLimit: number; // MB
    executionTimeLimit: number; // milliseconds
    allowedLanguages: string[];
    maxCodeComplexity: number; // 1-10 scale
  };
  
  // Docker capabilities (pro tier)
  dockerCapabilities?: {
    fileSystemAccess: boolean;
    networkAccess: boolean;
    databaseAccess: boolean;
    externalAPIAccess: boolean;
    multiFileProjects: boolean;
    customDependencies: boolean;
    unlimitedExecution: boolean;
  };
  
  // Hybrid mode (graceful degradation)
  fallbackStrategy?: {
    primaryTarget: RuntimeTarget;
    fallbackTarget: RuntimeTarget;
    degradationRules: DegradationRule[];
  };
}

export interface DegradationRule {
  condition: string; // e.g., "no_wasm_support"
  action: 'simplify_problem' | 'remove_feature' | 'fallback_server' | 'show_warning';
  description: string;
}

/**
 * Universal Capsule with Runtime Awareness
 * The AI gets this structure and adapts content accordingly
 */
export interface RuntimeAwareCapsule {
  // Universal metadata
  id: string;
  type: CapsuleType;
  title: string;
  description: string;
  
  // CRITICAL: Runtime-first design
  runtime: RuntimeConfiguration;
  
  // Content adapts based on runtime.target
  content: AdaptiveContent;
  
  // Execution context
  execution: ExecutionContext;
  
  // Learning framework (pedagogical layer)
  learning: LearningFramework;
  
  // Analytics & feedback (your data moats)
  analytics: AnalyticsConfiguration;
  feedback: FeedbackConfiguration;
}

export interface RuntimeConfiguration {
  target: RuntimeTarget;
  constraints: RuntimeConstraints;
  
  // Cost optimization
  tier: 'free' | 'pro' | 'enterprise';
  costModel: CostModel;
  
  // Performance optimization
  optimization: {
    prioritizeCacheability: boolean;
    minimizeServerRequests: boolean;
    enableProgressiveLoading: boolean;
  };
}

export interface CostModel {
  executionCost: number; // per run
  storageCost: number;   // per MB
  bandwidthCost: number; // per MB transferred
  aiGenerationCost: number; // per generation
}

/**
 * Content that adapts to runtime constraints
 */
export interface AdaptiveContent {
  // Core content (always present)
  primary: PrimaryContent;
  
  // Optional/enhanced content (conditional on runtime)
  enhanced?: EnhancedContent;
  
  // Fallback content (when primary isn't supported)
  fallback?: FallbackContent;
}

export interface PrimaryContent {
  problemStatement: string;
  
  // Adapts based on target
  code?: RuntimeAwareCode;
  quiz?: RuntimeAwareQuiz;
  terminal?: RuntimeAwareTerminal;
  database?: RuntimeAwareDatabase;
  systemDesign?: RuntimeAwareSystemDesign;
}

export interface RuntimeAwareCode {
  // WASM-optimized: Simple, single-file, fast execution
  wasmVersion?: {
    starterCode: string;
    solution: string;
    testCases: SimpleTestCase[];
    language: WASMSupportedLanguage;
    complexity: 'low' | 'medium'; // Never 'high' for WASM
  };
  
  // Docker-optimized: Complex, multi-file, unlimited
  dockerVersion?: {
    projectStructure: FileStructure[];
    dependencies: Dependency[];
    buildSteps: BuildStep[];
    testSuites: ComplexTestSuite[];
    complexity: 'low' | 'medium' | 'high'; // Can be complex
  };
}

export interface RuntimeAwareQuiz {
  wasmVersion?: {
    questions: SimpleQuestion[];
    interactiveElements: 'basic'; // Simple UI only
  };
  
  dockerVersion?: {
    questions: ComplexQuestion[];
    interactiveElements: 'advanced'; // Rich media, simulations
  };
}

export interface RuntimeAwareTerminal {
  wasmVersion?: {
    simulatedCommands: string[];
    staticOutputs: string[];
    noRealFileSystem: true;
  };
  
  dockerVersion?: {
    realContainer: string; // Docker image
    actualFileSystem: true;
    networkAccess: boolean;
  };
}

export interface RuntimeAwareDatabase {
  wasmVersion?: {
    inMemoryDatabase: true;
    sqliteCompatible: boolean;
    maxRows: number;
    simpleQueries: string[];
  };
  
  dockerVersion?: {
    realDatabase: DatabaseConfig;
    complexQueries: string[];
    multiTableJoins: boolean;
    proceduresAndFunctions: boolean;
  };
}

export interface RuntimeAwareSystemDesign {
  wasmVersion?: {
    staticDiagrams: true;
    basicComponents: ComponentType[];
    readOnlyInteraction: true;
  };
  
  dockerVersion?: {
    interactiveDiagrams: true;
    advancedComponents: ComponentType[];
    simulationCapability: boolean;
  };
}

/**
 * Runtime-Aware AI Generation System
 */
export class RuntimeAwareGenerator {
  
  /**
   * Generate content optimized for specific runtime target
   */
  static async generateForTarget(
    prompt: string,
    capsuleType: CapsuleType,
    target: RuntimeTarget,
    difficulty: DifficultyLevel
  ): Promise<RuntimeAwareCapsule> {
    
    const constraints = this.getConstraintsForTarget(target);
    const optimizedPrompt = this.adaptPromptForRuntime(prompt, target, constraints);
    
    // Generate with runtime awareness
    const content = await this.generateRuntimeOptimizedContent(
      optimizedPrompt,
      capsuleType,
      target,
      difficulty,
      constraints
    );
    
    return {
      id: this.generateId(),
      type: capsuleType,
      title: this.generateTitle(prompt, target),
      description: this.generateDescription(prompt, target),
      runtime: this.buildRuntimeConfig(target, constraints),
      content,
      execution: this.buildExecutionContext(target),
      learning: this.buildLearningFramework(difficulty, target),
      analytics: this.buildAnalyticsConfig(),
      feedback: this.buildFeedbackConfig()
    };
  }
  
  /**
   * Smart prompt adaptation based on runtime target
   */
  private static adaptPromptForRuntime(
    prompt: string,
    target: RuntimeTarget,
    constraints: RuntimeConstraints
  ): string {
    
    let adaptedPrompt = prompt;
    
    if (target === 'wasm') {
      adaptedPrompt += `\n\nIMPORTANT CONSTRAINTS:
- Generate ONLY single-file solutions
- NO file system operations
- NO network requests  
- Simple, fast-executing test cases
- Browser-compatible code only
- Maximum execution time: ${constraints.wasmLimitations?.executionTimeLimit}ms
- Keep complexity low for optimal performance`;
    }
    
    if (target === 'docker') {
      adaptedPrompt += `\n\nENHANCED CAPABILITIES:
- Multi-file projects are allowed
- File system operations permitted
- Network requests and APIs available
- Complex test suites with setup/teardown
- External dependencies allowed
- No execution time limits`;
    }
    
    return adaptedPrompt;
  }
  
  /**
   * Get runtime constraints for target
   */
  private static getConstraintsForTarget(target: RuntimeTarget): RuntimeConstraints {
    if (target === 'wasm') {
      return {
        target: 'wasm',
        wasmLimitations: {
          noFileSystem: true,
          noNetworking: true,
          memoryLimit: 128, // 128MB
          executionTimeLimit: 5000, // 5 seconds
          allowedLanguages: ['javascript', 'python', 'rust', 'c++'],
          maxCodeComplexity: 6 // Out of 10
        }
      };
    }
    
    if (target === 'docker') {
      return {
        target: 'docker',
        dockerCapabilities: {
          fileSystemAccess: true,
          networkAccess: true,
          databaseAccess: true,
          externalAPIAccess: true,
          multiFileProjects: true,
          customDependencies: true,
          unlimitedExecution: true
        }
      };
    }
    
    // Hybrid fallback
    return {
      target: 'hybrid',
      fallbackStrategy: {
        primaryTarget: 'wasm',
        fallbackTarget: 'docker',
        degradationRules: [
          {
            condition: 'wasm_not_supported',
            action: 'fallback_server',
            description: 'Fall back to server execution if WASM unavailable'
          }
        ]
      }
    };
  }
  
  /**
   * Check if content is suitable for WASM execution
   */
  static validateWASMCompatibility(content: AdaptiveContent): RuntimeValidationResult {
    const issues: string[] = [];
    
    if (content.primary.code?.wasmVersion) {
      const code = content.primary.code.wasmVersion;
      
      // Check for file system operations
      if (this.containsFileSystemOps(code.starterCode) || 
          this.containsFileSystemOps(code.solution)) {
        issues.push('Contains file system operations');
      }
      
      // Check for network operations
      if (this.containsNetworkOps(code.starterCode) || 
          this.containsNetworkOps(code.solution)) {
        issues.push('Contains network operations');
      }
      
      // WASM version should never have high complexity
      // This is ensured by the type system, but double-check
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendation: issues.length > 0 ? 'Use Docker target instead' : 'WASM compatible'
    };
  }
  
  // Utility methods
  private static containsFileSystemOps(code: string): boolean {
    const fsPatterns = [/fs\./g, /readFile/g, /writeFile/g, /open\(/g];
    return fsPatterns.some(pattern => pattern.test(code));
  }
  
  private static containsNetworkOps(code: string): boolean {
    const networkPatterns = [/fetch\(/g, /axios/g, /http\./g, /request\(/g];
    return networkPatterns.some(pattern => pattern.test(code));
  }
  
  private static generateId(): string {
    return `capsule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Placeholder implementations
  private static generateTitle(prompt: string, target: RuntimeTarget): string {
    return `${prompt} (${target} optimized)`;
  }
  
  private static generateDescription(prompt: string, target: RuntimeTarget): string {
    return `Generated for ${target} execution environment`;
  }
  
  private static async generateRuntimeOptimizedContent(
    prompt: string,
    type: CapsuleType,
    target: RuntimeTarget,
    difficulty: DifficultyLevel,
    constraints: RuntimeConstraints
  ): Promise<AdaptiveContent> {
    // This would call your AI generation service with runtime awareness
    return {} as AdaptiveContent;
  }
  
  private static buildRuntimeConfig(target: RuntimeTarget, constraints: RuntimeConstraints): RuntimeConfiguration {
    return {
      target,
      constraints,
      tier: target === 'wasm' ? 'free' : 'pro',
      costModel: {
        executionCost: target === 'wasm' ? 0 : 0.01,
        storageCost: 0.001,
        bandwidthCost: 0.001,
        aiGenerationCost: 0.05
      },
      optimization: {
        prioritizeCacheability: target === 'wasm',
        minimizeServerRequests: target === 'wasm',
        enableProgressiveLoading: true
      }
    };
  }
  
  private static buildExecutionContext(target: RuntimeTarget): ExecutionContext {
    return {} as ExecutionContext;
  }
  
  private static buildLearningFramework(difficulty: DifficultyLevel, target: RuntimeTarget): LearningFramework {
    return {} as LearningFramework;
  }
  
  private static buildAnalyticsConfig(): AnalyticsConfiguration {
    return {} as AnalyticsConfiguration;
  }
  
  private static buildFeedbackConfig(): FeedbackConfiguration {
    return {} as FeedbackConfiguration;
  }
}

// ===== TYPE DEFINITIONS =====

export type WASMSupportedLanguage = 'javascript' | 'python' | 'rust' | 'c++';

export interface RuntimeValidationResult {
  isValid: boolean;
  issues: string[];
  recommendation: string;
}

export interface SimpleTestCase {
  input: string;
  expected: string;
  description: string;
}

export interface FileStructure {
  path: string;
  content: string;
  type: 'file' | 'directory';
}

export interface Dependency {
  name: string;
  version: string;
  type: 'npm' | 'pip' | 'maven' | 'cargo';
}

export interface BuildStep {
  command: string;
  description: string;
  required: boolean;
}

export interface ComplexTestSuite {
  name: string;
  setup: string[];
  tests: SimpleTestCase[];
  teardown: string[];
}

export interface SimpleQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correct: number;
}

export interface ComplexQuestion extends SimpleQuestion {
  explanation: string;
  codeExample?: string;
  interactiveDemo?: string;
}

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb';
  version: string;
  initScript: string;
}

export type ComponentType = string; // Define specific component types

// Placeholder interfaces (implement as needed)
export interface ExecutionContext {}
export interface LearningFramework {}
export interface AnalyticsConfiguration {}
export interface FeedbackConfiguration {}
export interface EnhancedContent {}
export interface FallbackContent {}