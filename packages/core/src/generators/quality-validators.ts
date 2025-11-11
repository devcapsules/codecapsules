/**
 * Quality Validators and Rules Implementation
 * 
 * Concrete implementations of content validators and quality rules
 * that ensure your generated content meets professional standards.
 */

import type { ValidationResult } from './type-specific-generators';
import type { QualityContext } from './quality-pipeline';

// ===== CONTENT VALIDATORS =====

/**
 * Code Content Validator
 * Validates programming challenges and exercises
 */
export class CodeContentValidator {
  
  async validate(content: any, context: QualityContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Check starter code quality
    if (content.starterCode) {
      results.push(this.validateStarterCode(content.starterCode));
    }
    
    // Check solution code quality
    if (content.solutionCode) {
      results.push(this.validateSolutionCode(content.solutionCode, context));
    }
    
    // Check test cases
    if (content.testCases) {
      results.push(this.validateTestCases(content.testCases));
    }
    
    // Check hints progression
    if (content.hints) {
      results.push(this.validateHints(content.hints));
    }
    
    return results;
  }
  
  private validateStarterCode(starterCode: string): ValidationResult {
    const hasComments = starterCode.includes('//') || starterCode.includes('/*');
    const hasTODO = starterCode.toLowerCase().includes('todo');
    const isIncomplete = starterCode.includes('{}') || starterCode.includes('return;') || hasTODO;
    
    return {
      rule: 'starter_code_quality',
      passed: hasComments && isIncomplete,
      message: hasComments && isIncomplete 
        ? 'Starter code is well-structured and appropriately incomplete'
        : 'Starter code should have helpful comments and be incomplete to provide learning challenge',
      severity: hasComments && isIncomplete ? 'info' : 'warning'
    };
  }
  
  private validateSolutionCode(solutionCode: string, context: QualityContext): ValidationResult {
    // Check for basic syntax issues
    const hasBraces = solutionCode.includes('{') && solutionCode.includes('}');
    const hasReturn = solutionCode.includes('return') || context.difficulty === 'beginner';
    const reasonableLength = solutionCode.length > 20 && solutionCode.length < 2000;
    
    // Check for runtime compatibility
    const isWASMCompatible = context.runtimeTarget === 'wasm' ? 
      !solutionCode.includes('fs.') && !solutionCode.includes('fetch(') : true;
    
    const passed = hasBraces && hasReturn && reasonableLength && isWASMCompatible;
    
    return {
      rule: 'solution_code_quality',
      passed,
      message: passed 
        ? 'Solution code appears well-structured and compatible'
        : 'Solution code has structural or compatibility issues',
      severity: passed ? 'info' : 'error'
    };
  }
  
  private validateTestCases(testCases: any[]): ValidationResult {
    const hasMinimumTests = testCases.length >= 2;
    const hasBasicTest = testCases.some(tc => !tc.hidden);
    const hasEdgeTest = testCases.some(tc => tc.description?.toLowerCase().includes('edge'));
    
    const passed = hasMinimumTests && hasBasicTest;
    
    return {
      rule: 'test_case_coverage',
      passed,
      message: passed 
        ? `Good test coverage with ${testCases.length} test cases`
        : 'Need at least 2 test cases including basic and edge cases',
      severity: passed ? 'info' : 'error'
    };
  }
  
  private validateHints(hints: any[]): ValidationResult {
    const hasMinimumHints = hints.length >= 2;
    const hasProgression = hints.some(h => h.stage === 'getting_started') &&
                          hints.some(h => h.stage === 'implementation');
    
    const passed = hasMinimumHints && hasProgression;
    
    return {
      rule: 'hint_progression',
      passed,
      message: passed 
        ? 'Hints provide good progressive guidance'
        : 'Need at least 2 hints with proper progression (getting_started → implementation)',
      severity: passed ? 'info' : 'warning'
    };
  }
}

/**
 * Quiz Content Validator
 * Validates quiz questions and assessments
 */
export class QuizContentValidator {
  
  async validate(content: any, context: QualityContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Check question count and distribution
    if (content.questions) {
      results.push(this.validateQuestionCount(content.questions, context.difficulty));
      results.push(this.validateQuestionTypes(content.questions));
      results.push(this.validateDifficultyDistribution(content.questions));
    }
    
    // Check explanations quality
    if (content.questions) {
      results.push(this.validateExplanations(content.questions));
    }
    
    // Check quiz timing
    if (content.timeLimit) {
      results.push(this.validateTiming(content.timeLimit, content.questions));
    }
    
    return results;
  }
  
  private validateQuestionCount(questions: any[], difficulty: string): ValidationResult {
    const minQuestions = difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 7;
    const maxQuestions = 15;
    
    const count = questions.length;
    const passed = count >= minQuestions && count <= maxQuestions;
    
    return {
      rule: 'question_count',
      passed,
      message: passed 
        ? `Good question count: ${count} questions`
        : `Need ${minQuestions}-${maxQuestions} questions for ${difficulty} level, got ${count}`,
      severity: passed ? 'info' : 'error'
    };
  }
  
  private validateQuestionTypes(questions: any[]): ValidationResult {
    const types = new Set(questions.map(q => q.type));
    const hasVariety = types.size > 1;
    
    return {
      rule: 'question_variety',
      passed: hasVariety,
      message: hasVariety 
        ? `Good variety with ${types.size} question types: ${Array.from(types).join(', ')}`
        : 'Quiz should include multiple question types for better assessment',
      severity: hasVariety ? 'info' : 'warning'
    };
  }
  
  private validateDifficultyDistribution(questions: any[]): ValidationResult {
    const difficulties = questions.map(q => q.difficulty).filter(Boolean);
    const hasEasy = difficulties.includes('easy');
    const hasHard = difficulties.includes('hard');
    const isBalanced = difficulties.length > 0;
    
    return {
      rule: 'difficulty_distribution',
      passed: isBalanced,
      message: isBalanced 
        ? 'Questions have appropriate difficulty distribution'
        : 'Questions should have varied difficulty levels',
      severity: isBalanced ? 'info' : 'warning'
    };
  }
  
  private validateExplanations(questions: any[]): ValidationResult {
    const withExplanations = questions.filter(q => q.explanation && q.explanation.length > 10);
    const explanationRate = withExplanations.length / questions.length;
    const passed = explanationRate >= 0.8;
    
    return {
      rule: 'explanation_quality',
      passed,
      message: passed 
        ? `${Math.round(explanationRate * 100)}% of questions have detailed explanations`
        : `Only ${Math.round(explanationRate * 100)}% have explanations, need at least 80%`,
      severity: passed ? 'info' : 'error'
    };
  }
  
  private validateTiming(timeLimit: string, questions: any[]): ValidationResult {
    const timeInMinutes = parseInt(timeLimit) || 0;
    const expectedTime = questions.length * 2; // 2 minutes per question
    const isReasonable = timeInMinutes >= expectedTime * 0.8 && timeInMinutes <= expectedTime * 2;
    
    return {
      rule: 'quiz_timing',
      passed: isReasonable,
      message: isReasonable 
        ? `Time limit of ${timeLimit} is appropriate for ${questions.length} questions`
        : `Time limit should be ${expectedTime}-${expectedTime * 2} minutes for ${questions.length} questions`,
      severity: isReasonable ? 'info' : 'warning'
    };
  }
}

/**
 * Terminal Content Validator
 * Validates command-line exercises and tutorials
 */
export class TerminalContentValidator {
  
  async validate(content: any, context: QualityContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Check command safety
    if (content.steps) {
      results.push(this.validateCommandSafety(content.steps));
      results.push(this.validateProgressiveComplexity(content.steps));
      results.push(this.validateExplanations(content.steps));
    }
    
    // Check environment setup
    if (content.environment) {
      results.push(this.validateEnvironment(content.environment));
    }
    
    return results;
  }
  
  private validateCommandSafety(steps: any[]): ValidationResult {
    const dangerousPatterns = ['rm -rf', 'sudo rm', 'format', 'del /s', '> /dev/null', 'dd if='];
    const hasDangerous = steps.some(step => 
      dangerousPatterns.some(pattern => step.command?.toLowerCase().includes(pattern.toLowerCase()))
    );
    
    return {
      rule: 'command_safety',
      passed: !hasDangerous,
      message: hasDangerous 
        ? 'Contains potentially dangerous commands that could harm the system'
        : 'All commands are safe for learning environment',
      severity: hasDangerous ? 'error' : 'info'
    };
  }
  
  private validateProgressiveComplexity(steps: any[]): ValidationResult {
    if (steps.length < 3) {
      return {
        rule: 'progressive_complexity',
        passed: false,
        message: 'Need at least 3 steps for meaningful progression',
        severity: 'warning'
      };
    }
    
    // Simple heuristic: later commands should be more complex
    const firstCommand = steps[0].command || '';
    const lastCommand = steps[steps.length - 1].command || '';
    
    const firstComplexity = this.calculateCommandComplexity(firstCommand);
    const lastComplexity = this.calculateCommandComplexity(lastCommand);
    
    const hasProgression = lastComplexity >= firstComplexity;
    
    return {
      rule: 'progressive_complexity',
      passed: hasProgression,
      message: hasProgression 
        ? 'Commands show good progressive complexity'
        : 'Commands should increase in complexity throughout the exercise',
      severity: hasProgression ? 'info' : 'warning'
    };
  }
  
  private calculateCommandComplexity(command: string): number {
    let complexity = 1;
    complexity += (command.match(/\|/g) || []).length; // pipes
    complexity += (command.match(/&&|\|\|/g) || []).length; // logical operators
    complexity += (command.match(/[<>]/g) || []).length; // redirects
    complexity += (command.match(/\$/g) || []).length; // variables
    return complexity;
  }
  
  private validateExplanations(steps: any[]): ValidationResult {
    const withExplanations = steps.filter(step => 
      step.explanation && step.explanation.length > 20
    );
    const explanationRate = withExplanations.length / steps.length;
    const passed = explanationRate >= 0.8;
    
    return {
      rule: 'step_explanations',
      passed,
      message: passed 
        ? `${Math.round(explanationRate * 100)}% of steps have detailed explanations`
        : `Only ${Math.round(explanationRate * 100)}% have explanations, need at least 80%`,
      severity: passed ? 'info' : 'warning'
    };
  }
  
  private validateEnvironment(environment: any): ValidationResult {
    const hasOS = environment.os && environment.os.length > 0;
    const hasWorkingDir = environment.workingDirectory && environment.workingDirectory.length > 0;
    const hasTools = environment.preInstalledTools && environment.preInstalledTools.length > 0;
    
    const passed = hasOS && hasWorkingDir;
    
    return {
      rule: 'environment_setup',
      passed,
      message: passed 
        ? 'Environment is properly configured'
        : 'Environment needs OS and working directory specification',
      severity: passed ? 'info' : 'error'
    };
  }
}

/**
 * Runtime Compatibility Validator
 * Ensures content works in specified runtime environment
 */
export class RuntimeCompatibilityValidator {
  
  async validate(context: QualityContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    if (context.runtimeTarget === 'wasm') {
      results.push(this.validateWASMCompatibility(context));
    } else if (context.runtimeTarget === 'docker') {
      results.push(this.validateDockerCompatibility(context));
    } else if (context.runtimeTarget === 'hybrid') {
      results.push(this.validateHybridCompatibility(context));
    }
    
    return results;
  }
  
  private validateWASMCompatibility(context: QualityContext): ValidationResult {
    const content = JSON.stringify(context.content).toLowerCase();
    
    // Check for WASM-incompatible features
    const incompatibleFeatures = [
      'fs.', 'filesystem', 'file system',
      'fetch(', 'http', 'axios',
      'process.', 'child_process',
      'require(', 'import('
    ];
    
    const hasIncompatible = incompatibleFeatures.some(feature => content.includes(feature));
    
    return {
      rule: 'wasm_compatibility',
      passed: !hasIncompatible,
      message: hasIncompatible 
        ? 'Content uses features not available in WASM environment'
        : 'Content is compatible with WASM runtime constraints',
      severity: hasIncompatible ? 'error' : 'info'
    };
  }
  
  private validateDockerCompatibility(context: QualityContext): ValidationResult {
    // Docker is more permissive, mainly check for security
    const content = JSON.stringify(context.content).toLowerCase();
    
    const securityConcerns = [
      'sudo rm -rf',
      'chmod 777',
      '/etc/passwd',
      'eval(',
      'exec('
    ];
    
    const hasSecurityIssues = securityConcerns.some(concern => content.includes(concern));
    
    return {
      rule: 'docker_security',
      passed: !hasSecurityIssues,
      message: hasSecurityIssues 
        ? 'Content has potential security issues for Docker environment'
        : 'Content is secure for Docker runtime',
      severity: hasSecurityIssues ? 'warning' : 'info'
    };
  }
  
  private validateHybridCompatibility(context: QualityContext): ValidationResult {
    // Hybrid should work in both environments
    const wasmResult = this.validateWASMCompatibility(context);
    const dockerResult = this.validateDockerCompatibility(context);
    
    const passed = wasmResult.passed && dockerResult.passed;
    
    return {
      rule: 'hybrid_compatibility',
      passed,
      message: passed 
        ? 'Content is compatible with both WASM and Docker environments'
        : 'Content has compatibility issues for hybrid runtime',
      severity: passed ? 'info' : 'warning'
    };
  }
}

// ===== QUALITY RULES =====

/**
 * Content Length Rule
 * Ensures content is appropriately sized
 */
export class ContentLengthRule {
  name = 'content_length';
  
  async evaluate(context: QualityContext): Promise<ValidationResult> {
    const contentStr = JSON.stringify(context.content);
    const length = contentStr.length;
    
    // Adjust thresholds based on difficulty
    const minLength = context.difficulty === 'beginner' ? 200 : 
                     context.difficulty === 'intermediate' ? 400 : 600;
    const maxLength = context.difficulty === 'beginner' ? 2000 : 
                     context.difficulty === 'intermediate' ? 4000 : 6000;
    
    const passed = length >= minLength && length <= maxLength;
    
    return {
      rule: this.name,
      passed,
      message: passed 
        ? `Content length (${length} chars) is appropriate for ${context.difficulty} level`
        : `Content length (${length} chars) should be ${minLength}-${maxLength} for ${context.difficulty}`,
      severity: passed ? 'info' : 'warning'
    };
  }
}

/**
 * Clarity Rule
 * Checks for clear explanations and instructions
 */
export class ClarityRule {
  name = 'clarity';
  
  async evaluate(context: QualityContext): Promise<ValidationResult> {
    const contentStr = JSON.stringify(context.content).toLowerCase();
    
    // Look for clarity indicators
    const clarityKeywords = [
      'explain', 'because', 'why', 'how', 'this means',
      'for example', 'in other words', 'step by step'
    ];
    
    const clarityCount = clarityKeywords.filter(keyword => 
      contentStr.includes(keyword)
    ).length;
    
    const passed = clarityCount >= 2;
    
    return {
      rule: this.name,
      passed,
      message: passed 
        ? `Content has good clarity with ${clarityCount} explanation indicators`
        : 'Content needs clearer explanations and examples',
      severity: passed ? 'info' : 'warning'
    };
  }
}

/**
 * Inclusivity Rule
 * Ensures content is inclusive and accessible
 */
export class InclusivityRule {
  name = 'inclusivity';
  
  async evaluate(context: QualityContext): Promise<ValidationResult> {
    const contentStr = JSON.stringify(context.content).toLowerCase();
    
    // Check for potentially exclusive language
    const exclusiveTerms = [
      'guys', 'blacklist', 'whitelist', 'master/slave',
      'obviously', 'simply', 'just', 'easy'
    ];
    
    const hasExclusiveLanguage = exclusiveTerms.some(term => 
      contentStr.includes(term)
    );
    
    return {
      rule: this.name,
      passed: !hasExclusiveLanguage,
      message: hasExclusiveLanguage 
        ? 'Content contains potentially exclusive language'
        : 'Content uses inclusive language',
      severity: hasExclusiveLanguage ? 'warning' : 'info'
    };
  }
}

/**
 * Accessibility Rule
 * Checks for accessibility considerations
 */
export class AccessibilityRule {
  name = 'accessibility';
  
  async evaluate(context: QualityContext): Promise<ValidationResult> {
    const content = context.content;
    
    // Check for accessibility features
    let accessibilityScore = 0;
    
    // Alt text for images (if any)
    if (content.images) {
      const hasAltText = content.images.every((img: any) => img.alt);
      if (hasAltText) accessibilityScore += 25;
    } else {
      accessibilityScore += 25; // No images = no alt text issues
    }
    
    // Clear headings and structure
    const contentStr = JSON.stringify(content);
    if (contentStr.includes('title') && contentStr.includes('description')) {
      accessibilityScore += 25;
    }
    
    // Step-by-step instructions
    if (content.steps || content.hints || content.explanation) {
      accessibilityScore += 25;
    }
    
    // Color-independent information
    if (!contentStr.toLowerCase().includes('red') && !contentStr.toLowerCase().includes('green')) {
      accessibilityScore += 25;
    }
    
    const passed = accessibilityScore >= 75;
    
    return {
      rule: this.name,
      passed,
      message: passed 
        ? `Good accessibility score: ${accessibilityScore}/100`
        : `Accessibility needs improvement: ${accessibilityScore}/100`,
      severity: passed ? 'info' : 'warning'
    };
  }
}

/**
 * Safety Rule
 * Ensures content is safe for learners
 */
export class SafetyRule {
  name = 'safety';
  
  async evaluate(context: QualityContext): Promise<ValidationResult> {
    const contentStr = JSON.stringify(context.content).toLowerCase();
    
    // Check for unsafe practices
    const unsafePatterns = [
      'rm -rf', 'format c:', 'del /s',
      'eval(', 'exec(', 'system(',
      'password', 'private key', 'secret'
    ];
    
    const hasUnsafe = unsafePatterns.some(pattern => 
      contentStr.includes(pattern)
    );
    
    return {
      rule: this.name,
      passed: !hasUnsafe,
      message: hasUnsafe 
        ? 'Content contains potentially unsafe elements'
        : 'Content is safe for learning environment',
      severity: hasUnsafe ? 'error' : 'info'
    };
  }
}

/**
 * Pedagogical Progression Rule
 * Ensures content follows good learning progression
 */
export class PedagogicalProgressionRule {
  name = 'pedagogical_progression';
  
  async evaluate(context: QualityContext): Promise<ValidationResult> {
    const content = context.content;
    
    // Check for learning progression elements
    let progressionScore = 0;
    
    // Introduction to conclusion flow
    if (content.introduction && content.conclusion) progressionScore += 30;
    
    // Progressive difficulty (hints, steps, questions)
    if (content.hints && content.hints.length > 1) progressionScore += 25;
    if (content.steps && content.steps.length > 2) progressionScore += 25;
    if (content.questions && this.hasProgressiveDifficulty(content.questions)) progressionScore += 25;
    
    // Examples before exercises
    if (content.example && (content.exercise || content.steps)) progressionScore += 20;
    
    const passed = progressionScore >= 50;
    
    return {
      rule: this.name,
      passed,
      message: passed 
        ? `Good pedagogical progression: ${progressionScore}/100`
        : `Pedagogical progression needs improvement: ${progressionScore}/100`,
      severity: passed ? 'info' : 'warning'
    };
  }
  
  private hasProgressiveDifficulty(questions: any[]): boolean {
    if (questions.length < 3) return false;
    
    const difficulties = questions.map(q => q.difficulty).filter(Boolean);
    const hasEasy = difficulties.includes('easy');
    const hasHard = difficulties.includes('hard');
    
    return hasEasy && hasHard;
  }
}

/**
 * Engagement Rule
 * Measures how engaging the content is
 */
export class EngagementRule {
  name = 'engagement';
  
  async evaluate(context: QualityContext): Promise<ValidationResult> {
    const contentStr = JSON.stringify(context.content).toLowerCase();
    
    // Check for engagement elements
    let engagementScore = 0;
    
    // Interactive elements
    const interactiveKeywords = [
      'try', 'practice', 'experiment', 'modify', 'change',
      'what happens', 'can you', 'challenge'
    ];
    
    const interactiveCount = interactiveKeywords.filter(keyword => 
      contentStr.includes(keyword)
    ).length;
    
    engagementScore += Math.min(interactiveCount * 10, 40);
    
    // Practical examples
    if (contentStr.includes('example')) engagementScore += 20;
    
    // Hands-on activities
    if (contentStr.includes('hands-on') || contentStr.includes('build')) engagementScore += 20;
    
    // Questions to learner
    if (contentStr.includes('?')) engagementScore += 10;
    
    // Real-world connections
    if (contentStr.includes('real world') || contentStr.includes('practical')) engagementScore += 10;
    
    const passed = engagementScore >= 50;
    
    return {
      rule: this.name,
      passed,
      message: passed 
        ? `Good engagement level: ${engagementScore}/100`
        : `Content needs more engaging elements: ${engagementScore}/100`,
      severity: passed ? 'info' : 'warning'
    };
  }
}

/**
 * Feedback Integration Rule
 * Checks if creator feedback patterns have been addressed
 */
export class FeedbackIntegrationRule {
  name = 'feedback_integration';
  
  async evaluate(context: QualityContext): Promise<ValidationResult> {
    if (!context.creatorFeedback || context.creatorFeedback.length === 0) {
      return {
        rule: this.name,
        passed: true,
        message: 'No creator feedback to integrate',
        severity: 'info'
      };
    }
    
    // Analyze if common feedback patterns have been addressed
    const feedback = context.creatorFeedback;
    const contentStr = JSON.stringify(context.content).toLowerCase();
    
    let integrationScore = 0;
    
    // Check if content addresses common edit types
    const clarityEdits = feedback.filter(f => f.editType === 'content_improvement');
    if (clarityEdits.length > 0 && this.hasImprovedClarity(contentStr)) {
      integrationScore += 30;
    }
    
    const accuracyEdits = feedback.filter(f => f.editType === 'accuracy_fix');
    if (accuracyEdits.length > 0 && this.hasImprovedAccuracy(contentStr)) {
      integrationScore += 30;
    }
    
    const pedagogicalEdits = feedback.filter(f => f.editType === 'pedagogical_enhancement');
    if (pedagogicalEdits.length > 0 && this.hasImprovedPedagogy(contentStr)) {
      integrationScore += 40;
    }
    
    const passed = integrationScore >= 60;
    
    return {
      rule: this.name,
      passed,
      message: passed 
        ? `Good integration of creator feedback patterns: ${integrationScore}/100`
        : `Creator feedback patterns not well integrated: ${integrationScore}/100`,
      severity: passed ? 'info' : 'warning'
    };
  }
  
  private hasImprovedClarity(content: string): boolean {
    const clarityIndicators = ['explain', 'because', 'example', 'step by step'];
    return clarityIndicators.some(indicator => content.includes(indicator));
  }
  
  private hasImprovedAccuracy(content: string): boolean {
    // Check for technical accuracy indicators
    const accuracyIndicators = ['correct', 'accurate', 'valid', 'proper'];
    return accuracyIndicators.some(indicator => content.includes(indicator));
  }
  
  private hasImprovedPedagogy(content: string): boolean {
    const pedagogyIndicators = ['learn', 'understand', 'practice', 'skill', 'concept'];
    return pedagogyIndicators.some(indicator => content.includes(indicator));
  }
}