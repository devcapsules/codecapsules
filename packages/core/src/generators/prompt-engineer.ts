/**
 * Runtime-Aware Prompt Engineering System
 * 
 * This is the intelligence layer that adapts AI prompts based on:
 * - Runtime constraints (WASM vs Docker)
 * - Difficulty levels (easy, medium, hard)
 * - Creator feedback patterns
 * - Learning objectives
 * 
 * The system ensures generated content is perfectly tailored
 * for each execution environment and user tier.
 */

import type { RuntimeTarget, RuntimeConstraints } from '../types/runtime-aware';
import type { CapsuleType, DifficultyLevel } from '../types/capsule';
import type { AIToHumanEdit } from '../types/creator-feedback';

export interface PromptContext {
  runtimeTarget: RuntimeTarget;
  constraints: RuntimeConstraints;
  capsuleType: CapsuleType;
  difficulty: DifficultyLevel;
  userPrompt: string;
  creatorFeedback?: AIToHumanEdit[];
  learningObjectives?: string[];
}

export interface GeneratedPrompts {
  systemPrompt: string;
  userPrompt: string;
  qualityChecks: string[];
  adaptationNotes: string[];
}

/**
 * Core Prompt Engineering System
 */
export class PromptEngineer {
  
  /**
   * Generate runtime-aware prompts
   */
  generatePrompts(context: PromptContext): GeneratedPrompts {
    console.log(`🎯 Engineering prompts for ${context.runtimeTarget} runtime...`);
    
    const systemPrompt = this.buildSystemPrompt(context);
    const enhancedUserPrompt = this.enhanceUserPrompt(context);
    const qualityChecks = this.generateQualityChecks(context);
    const adaptationNotes = this.generateAdaptationNotes(context);
    
    return {
      systemPrompt,
      userPrompt: enhancedUserPrompt,
      qualityChecks,
      adaptationNotes
    };
  }
  
  /**
   * Build the core system prompt with runtime awareness
   */
  private buildSystemPrompt(context: PromptContext): string {
    const basePrompt = this.getBaseSystemPrompt();
    const runtimeInstructions = this.getRuntimeInstructions(context);
    const difficultyGuidance = this.getDifficultyGuidance(context.difficulty);
    const typeSpecificGuidance = this.getTypeSpecificGuidance(context.capsuleType);
    const feedbackIntegration = this.integrateFeedback(context.creatorFeedback);
    
    return [
      basePrompt,
      runtimeInstructions,
      difficultyGuidance,
      typeSpecificGuidance,
      feedbackIntegration,
      this.getOutputFormatInstructions()
    ].filter(Boolean).join('\n\n');
  }
  
  /**
   * Base system prompt for educational content
   */
  private getBaseSystemPrompt(): string {
    return `You are an expert educational content creator specializing in interactive learning experiences.

Your mission is to create learning content that:
- Follows pedagogical minimalism (reduce cognitive load)
- Provides hands-on, practical learning
- Includes clear explanations and examples
- Has built-in assessment mechanisms
- Encourages exploration and experimentation

Always prioritize learner understanding over code complexity.`;
  }
  
  /**
   * Runtime-specific instructions
   */
  private getRuntimeInstructions(context: PromptContext): string {
    const { runtimeTarget, constraints } = context;
    
    if (runtimeTarget === 'wasm') {
      return this.getWASMInstructions(constraints);
    } else if (runtimeTarget === 'docker') {
      return this.getDockerInstructions(constraints);
    } else {
      return this.getHybridInstructions(constraints);
    }
  }
  
  /**
   * WASM-specific instructions (Free tier)
   */
  private getWASMInstructions(constraints: RuntimeConstraints): string {
    const wasm = constraints.wasmLimitations;
    if (!wasm) return '';
    
    return `🌐 WASM RUNTIME CONSTRAINTS (Free Tier):

CRITICAL LIMITATIONS:
- NO file system access (no fs module, no file I/O)
- NO networking (no HTTP requests, no external APIs)
- Memory limit: ${wasm.memoryLimit}MB
- Execution time limit: ${wasm.executionTimeLimit}ms
- Languages: ${wasm.allowedLanguages.join(', ')}
- Code complexity: ${wasm.maxCodeComplexity}/10 maximum

CONTENT REQUIREMENTS:
- Focus on pure algorithms and data structures
- Use in-memory data only (arrays, objects, variables)
- Include step-by-step explanations
- Provide immediate visual feedback
- Keep examples simple but educational
- Use console.log for output demonstration

PEDAGOGICAL APPROACH:
- Start with basic concepts
- Build complexity gradually
- Include interactive examples
- Focus on fundamentals over frameworks`;
  }
  
  /**
   * Docker-specific instructions (Pro tier)
   */
  private getDockerInstructions(constraints: RuntimeConstraints): string {
    const docker = constraints.dockerCapabilities;
    if (!docker) return '';
    
    return `🐳 DOCKER RUNTIME CAPABILITIES (Pro Tier):

AVAILABLE RESOURCES:
- Full file system access: ${docker.fileSystemAccess}
- Network access: ${docker.networkAccess}
- Database access: ${docker.databaseAccess}
- External API access: ${docker.externalAPIAccess}
- Multi-file projects: ${docker.multiFileProjects}
- Custom dependencies: ${docker.customDependencies}
- Unlimited execution: ${docker.unlimitedExecution}

CONTENT OPPORTUNITIES:
- Build full-stack applications
- Include database integration
- Use external APIs and services
- Create multi-file project structures
- Install and use npm packages
- Implement real-world scenarios

PEDAGOGICAL APPROACH:
- Show production-ready patterns
- Include best practices and architecture
- Demonstrate real-world workflows
- Focus on scalable solutions
- Include testing and deployment concepts`;
  }
  
  /**
   * Hybrid instructions (Graceful degradation)
   */
  private getHybridInstructions(constraints: RuntimeConstraints): string {
    return `🔄 HYBRID RUNTIME (Adaptive):

DESIGN STRATEGY:
- Create content that works in both WASM and Docker
- Provide fallback mechanisms for limited environments
- Include progressive enhancement suggestions
- Focus on portable algorithms and concepts

IMPLEMENTATION APPROACH:
- Start with WASM-compatible core
- Add Docker enhancements as optional extensions
- Clearly mark environment-specific features
- Provide alternative implementations for different runtimes`;
  }
  
  /**
   * Difficulty-specific guidance
   */
  private getDifficultyGuidance(difficulty: DifficultyLevel): string {
    const difficultyMap = {
      beginner: `📚 BEGINNER LEVEL:
- Use simple, clear language
- Explain every step in detail
- Include lots of examples
- Avoid complex abstractions
- Focus on building confidence
- Provide encouraging feedback`,
      
      intermediate: `🎯 INTERMEDIATE LEVEL:
- Introduce moderate complexity
- Connect to previously learned concepts
- Include challenging but achievable tasks
- Show alternative approaches
- Encourage problem-solving thinking
- Balance guidance with exploration`,
      
      advanced: `🚀 ADVANCED LEVEL:
- Present complex, real-world scenarios
- Expect prior knowledge and experience
- Focus on optimization and best practices
- Include edge cases and error handling
- Encourage architectural thinking
- Challenge with open-ended problems`
    };
    
    return difficultyMap[difficulty];
  }
  
  /**
   * Type-specific generation guidance
   */
  private getTypeSpecificGuidance(type: CapsuleType): string {
    const typeMap = {
      code: `💻 CODE CAPSULE REQUIREMENTS:
- Include starter code and solution
- Provide comprehensive test cases
- Add step-by-step hints
- Include common mistake explanations
- Show multiple solution approaches
- Focus on readable, maintainable code`,
      
      quiz: `❓ QUIZ CAPSULE REQUIREMENTS:
- Create multiple choice questions
- Include detailed explanations for each answer
- Provide immediate feedback
- Use scenarios and practical examples
- Vary question difficulty progressively
- Include "why this matters" context`,
      
      terminal: `⚡ TERMINAL CAPSULE REQUIREMENTS:
- Provide clear command sequences
- Explain each command's purpose
- Include expected output examples
- Show common troubleshooting steps
- Focus on practical skills
- Include safety and best practices`,

      database: `🗄️ DATABASE CAPSULE REQUIREMENTS:
- Design realistic database schemas
- Include SQL queries and data manipulation
- Provide sample data for testing
- Cover performance optimization
- Include real-world scenarios
- Focus on database design principles`,

      'system-design': `🏗️ SYSTEM DESIGN CAPSULE REQUIREMENTS:
- Create architectural design challenges
- Focus on scalability and reliability
- Include trade-off discussions
- Cover distributed systems concepts
- Provide implementation guidance
- Include capacity planning exercises`
    };
    
    return typeMap[type] || typeMap.code;
  }
  
  /**
   * Integrate creator feedback patterns
   */
  private integrateFeedback(feedback?: AIToHumanEdit[]): string {
    if (!feedback || feedback.length === 0) {
      return '';
    }
    
    const patterns = this.analyzeFeedbackPatterns(feedback);
    
    return `🧠 CREATOR FEEDBACK INTEGRATION:

Based on previous creator feedback, please:
${patterns.map(pattern => `- ${pattern}`).join('\n')}

This feedback comes from experienced educators who have improved similar content.
Apply these insights to enhance the learning experience.`;
  }
  
  /**
   * Analyze feedback patterns to extract insights
   */
  private analyzeFeedbackPatterns(feedback: AIToHumanEdit[]): string[] {
    const patterns: string[] = [];
    
    // Common feedback analysis
    const hasExplanationFeedback = feedback.some(f => 
      f.context.originalPrompt.toLowerCase().includes('explanation') || 
      f.editType.includes('clarity')
    );
    
    const hasComplexityFeedback = feedback.some(f => 
      f.context.originalPrompt.toLowerCase().includes('complex') || 
      f.context.targetDifficulty.includes('simple')
    );
    
    const hasExampleFeedback = feedback.some(f => 
      f.context.originalPrompt.toLowerCase().includes('example') || 
      f.fieldType.includes('demo')
    );
    
    if (hasExplanationFeedback) {
      patterns.push('Provide more detailed explanations for complex concepts');
    }
    
    if (hasComplexityFeedback) {
      patterns.push('Adjust complexity level to match learner capabilities');
    }
    
    if (hasExampleFeedback) {
      patterns.push('Include more practical examples and demonstrations');
    }
    
    // Add specific feedback insights
    feedback.slice(0, 3).forEach(f => {
      if (f.context.originalPrompt.length > 10) {
        patterns.push(`Consider: ${f.editType} based on previous feedback`);
      }
    });
    
    return patterns;
  }
  
  /**
   * Enhanced user prompt with context
   */
  private enhanceUserPrompt(context: PromptContext): string {
    const { userPrompt, learningObjectives, runtimeTarget } = context;
    
    let enhanced = userPrompt;
    
    // Add learning objectives if provided
    if (learningObjectives && learningObjectives.length > 0) {
      enhanced += `\n\nLearning Objectives:\n${learningObjectives.map(obj => `- ${obj}`).join('\n')}`;
    }
    
    // Add runtime context
    enhanced += `\n\nTarget Runtime: ${runtimeTarget.toUpperCase()}`;
    
    return enhanced;
  }
  
  /**
   * Generate quality check criteria
   */
  private generateQualityChecks(context: PromptContext): string[] {
    const checks = [
      'Content matches the specified difficulty level',
      'All code examples are tested and functional',
      'Explanations are clear and pedagogically sound',
      'Learning objectives are met',
      'Content is engaging and interactive'
    ];
    
    // Add runtime-specific checks
    if (context.runtimeTarget === 'wasm') {
      checks.push('No file system or network dependencies');
      checks.push('Memory usage within limits');
      checks.push('Execution time under constraints');
    } else if (context.runtimeTarget === 'docker') {
      checks.push('Uses production-ready patterns');
      checks.push('Includes proper error handling');
      checks.push('Demonstrates real-world scenarios');
    }
    
    // Add type-specific checks
    if (context.capsuleType === 'code') {
      checks.push('Includes comprehensive test cases');
      checks.push('Code follows best practices');
    } else if (context.capsuleType === 'quiz') {
      checks.push('Questions test understanding, not memorization');
      checks.push('Feedback is constructive and educational');
    }
    
    return checks;
  }
  
  /**
   * Generate adaptation notes for debugging
   */
  private generateAdaptationNotes(context: PromptContext): string[] {
    const notes = [];
    
    notes.push(`Runtime: ${context.runtimeTarget}`);
    notes.push(`Type: ${context.capsuleType}`);
    notes.push(`Difficulty: ${context.difficulty}`);
    
    if (context.creatorFeedback && context.creatorFeedback.length > 0) {
      notes.push(`Feedback patterns: ${context.creatorFeedback.length} instances analyzed`);
    }
    
    if (context.constraints.wasmLimitations) {
      notes.push(`WASM constraints: ${context.constraints.wasmLimitations.allowedLanguages.length} languages`);
    }
    
    if (context.constraints.dockerCapabilities) {
      notes.push('Docker capabilities: Full environment available');
    }
    
    return notes;
  }
  
  /**
   * Output format instructions
   */
  private getOutputFormatInstructions(): string {
    return `📋 OUTPUT FORMAT:

Return your response as a JSON object with this exact structure:
{
  "title": "Clear, descriptive title",
  "description": "Brief description of what learners will accomplish",
  "content": {
    "introduction": "Hook the learner with why this matters",
    "explanation": "Core concept explanation",
    "example": "Worked example with step-by-step breakdown",
    "exercise": "Hands-on practice for the learner",
    "solution": "Complete solution with explanations",
    "conclusion": "Key takeaways and next steps"
  },
  "metadata": {
    "estimatedTime": "X minutes",
    "prerequisites": ["concept1", "concept2"],
    "learningOutcomes": ["outcome1", "outcome2"]
  }
}

Ensure all JSON is valid and properly escaped.`;
  }
}

/**
 * Prompt engineering utilities
 */
export class PromptUtils {
  
  /**
   * Validate prompt quality
   */
  static validatePrompts(prompts: GeneratedPrompts): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check prompt length
    if (prompts.systemPrompt.length < 100) {
      issues.push('System prompt too short - may lack necessary context');
    }
    
    if (prompts.systemPrompt.length > 8000) {
      issues.push('System prompt too long - may hit token limits');
    }
    
    // Check for required elements
    if (!prompts.systemPrompt.includes('JSON')) {
      issues.push('Missing JSON format instructions');
    }
    
    if (!prompts.systemPrompt.includes('educational')) {
      issues.push('Missing educational context');
    }
    
    // Suggestions
    if (prompts.qualityChecks.length < 3) {
      suggestions.push('Consider adding more quality checks');
    }
    
    if (prompts.adaptationNotes.length === 0) {
      suggestions.push('Add adaptation notes for debugging');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
  
  /**
   * Estimate token usage
   */
  static estimateTokens(prompts: GeneratedPrompts): {
    systemTokens: number;
    userTokens: number;
    total: number;
  } {
    // Rough estimation: ~4 characters per token
    const systemTokens = Math.ceil(prompts.systemPrompt.length / 4);
    const userTokens = Math.ceil(prompts.userPrompt.length / 4);
    
    return {
      systemTokens,
      userTokens,
      total: systemTokens + userTokens
    };
  }
  
  /**
   * Generate debug summary
   */
  static generateDebugSummary(context: PromptContext, prompts: GeneratedPrompts): string {
    const validation = this.validatePrompts(prompts);
    const tokens = this.estimateTokens(prompts);
    
    return `🔍 Prompt Engineering Debug Summary:

Context:
- Runtime: ${context.runtimeTarget}
- Type: ${context.capsuleType}
- Difficulty: ${context.difficulty}
- Feedback: ${context.creatorFeedback?.length || 0} instances

Generated Prompts:
- System prompt: ${prompts.systemPrompt.length} chars
- User prompt: ${prompts.userPrompt.length} chars
- Quality checks: ${prompts.qualityChecks.length}
- Adaptation notes: ${prompts.adaptationNotes.length}

Token Estimation:
- System: ~${tokens.systemTokens} tokens
- User: ~${tokens.userTokens} tokens
- Total: ~${tokens.total} tokens

Validation:
- Valid: ${validation.isValid ? '✅' : '❌'}
- Issues: ${validation.issues.length}
- Suggestions: ${validation.suggestions.length}

${validation.issues.length > 0 ? `\nIssues:\n${validation.issues.map(i => `- ${i}`).join('\n')}` : ''}
${validation.suggestions.length > 0 ? `\nSuggestions:\n${validation.suggestions.map(s => `- ${s}`).join('\n')}` : ''}`;
  }
}