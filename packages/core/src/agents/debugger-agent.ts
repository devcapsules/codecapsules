/**
 * Debugger Agent - Quality Assurance and Bug Fixing Specialist
 * 
 * This agent is responsible for finding and fixing bugs in generated capsules.
 * It works with the validation system to automatically heal capsules that fail
 * their tests, ensuring only high-quality content reaches users.
 * 
 * Key Responsibilities:
 * - Analyze execution errors and test failures
 * - Generate fixes for broken code/queries/commands
 * - Improve capsule quality through iterative debugging
 * - Learn from common error patterns
 */

import type { 
  BaseCapsule,
  CodeConfig,
  DatabaseConfig,
  TerminalConfig,
  ExecutionError,
  ValidationResult,
  CapsuleLanguage,
  CapsuleType
} from '../types/base-capsule'

// ===== DEBUGGER INTERFACES =====

/**
 * Error analysis result from the debugger
 */
export interface ErrorAnalysis {
  error_type: 'syntax' | 'logic' | 'runtime' | 'test_mismatch' | 'configuration'
  root_cause: string
  affected_components: string[]
  fix_strategy: string
  confidence_level: number // 0-1 score for fix confidence
  alternative_approaches: string[]
}

/**
 * Fix attempt result
 */
export interface FixAttempt {
  attempt_number: number
  fix_description: string
  changes_made: Array<{
    component: string
    old_value: string
    new_value: string
    reason: string
  }>
  success: boolean
  remaining_errors: ExecutionError[]
  confidence: number
}

/**
 * Debugging session tracking multiple fix attempts
 */
export interface DebuggingSession {
  capsule_id: string
  original_error: ExecutionError
  analysis: ErrorAnalysis
  fix_attempts: FixAttempt[]
  final_result: 'fixed' | 'unfixable' | 'max_attempts_reached'
  total_time_ms: number
  lessons_learned: string[]
}

/**
 * Configuration for debugger behavior
 */
export interface DebuggerConfig {
  max_fix_attempts: number
  conservative_fixes: boolean      // Make minimal changes
  learn_from_patterns: boolean     // Remember common errors
  detailed_logging: boolean        // Log all debugging steps
  timeout_ms: number              // Max time per debugging session
}

// ===== DEBUGGER AGENT IMPLEMENTATION =====

export class DebuggerAgent {
  private config: DebuggerConfig
  private aiService: any // Will be injected
  private errorPatterns: Map<string, string[]> = new Map() // Common error -> fixes mapping

  constructor(config: Partial<DebuggerConfig> = {}) {
    this.config = {
      max_fix_attempts: 3,
      conservative_fixes: true,
      learn_from_patterns: true,
      detailed_logging: true,
      timeout_ms: 30000, // 30 seconds
      ...config
    }

    this.initializeErrorPatterns()
  }

  /**
   * Main entry point: fix a capsule that has execution errors
   * ONLY called when Serverless Judge finds bugs - NOT for educational enhancement
   */
  async fixCapsule(
    capsule: BaseCapsule,
    error: ExecutionError
  ): Promise<BaseCapsule> {
    const startTime = Date.now()
    
    if (!error) {
      throw new Error('DebuggerAgent.fixCapsule() should only be called when there are actual bugs to fix')
    }
    
    const session: DebuggingSession = {
      capsule_id: capsule.id,
      original_error: error,
      analysis: await this.analyzeError(capsule, error),
      fix_attempts: [],
      final_result: 'unfixable',
      total_time_ms: 0,
      lessons_learned: []
    }

    try {
      if (this.config.detailed_logging) {
        console.log(`🐛 Starting debugging session for capsule ${capsule.id}`)
        console.log(`Error: ${error.message}`)
      }

      let currentCapsule = capsule
      let currentError = error

      // Attempt fixes up to max_attempts
      for (let attempt = 1; attempt <= this.config.max_fix_attempts; attempt++) {
        if (Date.now() - startTime > this.config.timeout_ms) {
          session.final_result = 'max_attempts_reached'
          break
        }

        const fixAttempt = await this.attemptFix(
          currentCapsule,
          currentError,
          session.analysis,
          attempt
        )

        session.fix_attempts.push(fixAttempt)

        if (fixAttempt.success) {
          // Apply the fixes to get updated capsule
          currentCapsule = this.applyFixes(currentCapsule, fixAttempt)
          session.final_result = 'fixed'
          break
        } else if (fixAttempt.remaining_errors.length > 0) {
          // Use the first remaining error for next attempt
          currentError = fixAttempt.remaining_errors[0]
          currentCapsule = this.applyFixes(currentCapsule, fixAttempt) // Apply partial fixes
        }
      }

      session.total_time_ms = Date.now() - startTime

      // Learn from this debugging session
      if (this.config.learn_from_patterns) {
        this.learnFromSession(session)
      }

      if (session.final_result === 'fixed') {
        if (this.config.detailed_logging) {
          console.log(`✅ Successfully fixed capsule after ${session.fix_attempts.length} attempts`)
        }
        return currentCapsule
      } else {
        throw new Error(`Failed to fix capsule after ${this.config.max_fix_attempts} attempts`)
      }

    } catch (debugError) {
      console.error('Debugger Agent failed:', debugError)
      throw new Error(`Debugging failed: ${debugError instanceof Error ? debugError.message : String(debugError)}`)
    }
  }

  /**
   * Analyze an error to understand its root cause
   */
  private async analyzeError(
    capsule: BaseCapsule,
    error: ExecutionError
  ): Promise<ErrorAnalysis> {
    const analysisPrompt = this.buildErrorAnalysisPrompt(capsule, error)

    try {
      const messages = [{ role: 'user' as const, content: analysisPrompt }]
      const analysis = await this.aiService.generateJSON(messages, {
        temperature: 0.2, // Low temperature for analytical thinking
        max_tokens: 800
      }) as ErrorAnalysis

      // Enhance with pattern matching
      const knownFixes = this.findKnownErrorPatterns(error.message)
      if (knownFixes.length > 0) {
        analysis.alternative_approaches = [...analysis.alternative_approaches, ...knownFixes]
        analysis.confidence_level = Math.min(analysis.confidence_level + 0.2, 1.0)
      }

      return analysis

    } catch (analysisError) {
      // Fallback analysis
      return {
        error_type: this.classifyErrorType(error),
        root_cause: error.message,
        affected_components: ['unknown'],
        fix_strategy: 'Generic debugging approach',
        confidence_level: 0.3,
        alternative_approaches: []
      }
    }
  }

  /**
   * Build error analysis prompt
   */
  private buildErrorAnalysisPrompt(capsule: BaseCapsule, error: ExecutionError): string {
    const configJson = JSON.stringify(capsule.config_data, null, 2)
    
    return `
You are an expert debugger analyzing a failed ${capsule.capsule_type} capsule.

CAPSULE DETAILS:
- Type: ${capsule.capsule_type}
- Language: ${capsule.runtime_config.language}
- Runtime: ${capsule.runtime_config.runtime_tier}

CONFIGURATION:
${configJson}

ERROR DETAILS:
- Type: ${error.type}
- Message: ${error.message}
- Details: ${JSON.stringify(error.details, null, 2)}

Analyze this error and provide a detailed debugging plan:

1. Classify the error type (syntax, logic, runtime, test_mismatch, configuration)
2. Identify the root cause
3. Determine which components are affected
4. Suggest a fix strategy
5. Rate your confidence in the analysis (0-1)
6. Provide alternative approaches

Return JSON with this structure:
{
  "error_type": "syntax|logic|runtime|test_mismatch|configuration",
  "root_cause": "Detailed explanation of what went wrong",
  "affected_components": ["component1", "component2"],
  "fix_strategy": "Step-by-step approach to fix the issue",
  "confidence_level": 0.8,
  "alternative_approaches": ["Alternative 1", "Alternative 2"]
}

Focus on:
- Technical accuracy in diagnosis
- Practical fix strategies
- Consideration of educational value
- Minimal disruption to learning objectives
`
  }

  /**
   * Attempt to fix the capsule based on error analysis
   */
  private async attemptFix(
    capsule: BaseCapsule,
    error: ExecutionError,
    analysis: ErrorAnalysis,
    attemptNumber: number
  ): Promise<FixAttempt> {
    const fixPrompt = this.buildFixPrompt(capsule, error, analysis, attemptNumber)

    try {
      const messages = [{ role: 'user' as const, content: fixPrompt }]
      const fixResponse = await this.aiService.generateJSON(messages, {
        temperature: 0.3,
        max_tokens: 1500
      }) as any

      // Convert response to FixAttempt format
      const fixAttempt: FixAttempt = {
        attempt_number: attemptNumber,
        fix_description: fixResponse.fix_description || 'Fix attempt',
        changes_made: fixResponse.changes_made || [],
        success: fixResponse.success || false,
        remaining_errors: [],
        confidence: fixResponse.confidence || 0.5
      }

      return fixAttempt

    } catch (fixError) {
      // Fallback fix attempt
      return {
        attempt_number: attemptNumber,
        fix_description: `Fallback fix attempt ${attemptNumber}`,
        changes_made: [],
        success: false,
        remaining_errors: [error],
        confidence: 0.1
      }
    }
  }

  /**
   * Build fix generation prompt
   */
  private buildFixPrompt(
    capsule: BaseCapsule,
    error: ExecutionError,
    analysis: ErrorAnalysis,
    attemptNumber: number
  ): string {
    const typeSpecificGuidance = this.getFixGuidanceForType(capsule.capsule_type)
    const configJson = JSON.stringify(capsule.config_data, null, 2)
    
    return `
You are an expert debugger fixing a ${capsule.capsule_type} capsule (attempt ${attemptNumber}).

ERROR ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CURRENT CAPSULE CONFIG:
${configJson}

ERROR TO FIX:
- Type: ${error.type}
- Message: ${error.message}
- Details: ${JSON.stringify(error.details, null, 2)}

TYPE-SPECIFIC GUIDANCE:
${typeSpecificGuidance}

Generate specific fixes for this error:

1. Describe what you're going to fix
2. List specific changes to make
3. Explain why each change will help
4. Estimate success probability

CRITICAL JSON RULES:
- test_cases MUST always be an array, never a single object
- Use arrays [] for lists, NEVER use set notation like {"a", "b"}
- Python sets must be represented as JSON arrays: ["a", "e", "i"] not {"a", "e", "i"}
- All values must be valid JSON (no Python-specific syntax)

Rules:
- Make minimal changes to preserve educational value
- Fix the root cause, not just symptoms  
- Maintain code quality and best practices
- Don't break other functionality
- Keep learning objectives intact

Return VALID JSON with this structure:
{
  "fix_description": "Clear description of what will be fixed",
  "changes_made": [
    {
      "component": "boilerplate_code|reference_solution|test_cases|hints",
      "old_value": "current value or excerpt",
      "new_value": "fixed value",
      "reason": "why this change fixes the issue"
    }
  ],
  "success": true,
  "confidence": 0.85
}

Focus on creating fixes that are:
- Technically correct
- Educationally sound
- Minimally invasive
- Well-reasoned
`
  }

  /**
   * Get type-specific fix guidance
   */
  private getFixGuidanceForType(type: CapsuleType): string {
    switch (type) {
      case 'CODE':
        return `
CODE FIXING GUIDANCE:
- Check for syntax errors in boilerplate and solution
- Verify test cases match expected behavior
- Ensure imports and dependencies are correct
- Fix logic errors while maintaining educational value
- Update test expected outputs if needed
- Check for edge cases in test coverage`

      case 'DATABASE':
        return `
DATABASE FIXING GUIDANCE:
- Verify SQL syntax is correct
- Check table and column names match schema
- Ensure JOIN conditions are proper
- Fix WHERE clause logic
- Verify data types and constraints
- Update schema_info if needed`

      case 'TERMINAL':
        return `
TERMINAL FIXING GUIDANCE:
- Check command syntax and arguments
- Verify file paths and permissions
- Fix validation scripts logic
- Ensure commands work in target environment
- Check for environment-specific issues
- Update task descriptions if needed`

      default:
        return 'Apply general debugging principles'
    }
  }

  /**
   * Apply fixes to create updated capsule
   */
  private applyFixes(capsule: BaseCapsule, fixAttempt: FixAttempt): BaseCapsule {
    const updatedCapsule = { ...capsule }
    const configData = { ...capsule.config_data } as any

    // Apply each change
    for (const change of fixAttempt.changes_made) {
      if (change.component in configData) {
        configData[change.component] = change.new_value
      }
    }

    // CRITICAL: Ensure test_cases is always an array
    if (configData.test_cases && !Array.isArray(configData.test_cases)) {
      console.warn('⚠️ Debugger returned test_cases as non-array, fixing...')
      configData.test_cases = [configData.test_cases]
    }

    updatedCapsule.config_data = configData
    return updatedCapsule
  }

  /**
   * Classify error type based on error message
   */
  private classifyErrorType(error: ExecutionError): ErrorAnalysis['error_type'] {
    const message = error.message.toLowerCase()
    
    if (error.type === 'syntax') return 'syntax'
    if (error.type === 'test_failure') return 'test_mismatch'
    if (error.type === 'runtime') return 'runtime'
    if (error.type === 'validation_timeout') return 'configuration'
    
    // Pattern matching for classification
    if (message.includes('syntax') || message.includes('parse')) return 'syntax'
    if (message.includes('assertion') || message.includes('expected')) return 'test_mismatch'
    if (message.includes('runtime') || message.includes('execution')) return 'runtime'
    
    return 'logic'
  }

  /**
   * Initialize common error patterns and their fixes
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns.set('indentation', [
      'Check Python indentation - use consistent spaces or tabs',
      'Fix block structure and alignment'
    ])
    
    this.errorPatterns.set('undefined', [
      'Check for undefined variables or functions',
      'Verify all variables are declared before use'
    ])
    
    this.errorPatterns.set('syntax error', [
      'Check for missing colons, parentheses, or brackets',
      'Verify proper quote matching'
    ])
    
    this.errorPatterns.set('assertion', [
      'Check test expected values match actual output',
      'Verify function return values are correct'
    ])
  }

  /**
   * Find known fixes for error patterns
   */
  private findKnownErrorPatterns(errorMessage: string): string[] {
    const message = errorMessage.toLowerCase()
    const matches: string[] = []
    
    for (const [pattern, fixes] of this.errorPatterns) {
      if (message.includes(pattern)) {
        matches.push(...fixes)
      }
    }
    
    return matches
  }

  /**
   * Learn from debugging session to improve future fixes
   */
  private learnFromSession(session: DebuggingSession): void {
    if (session.final_result === 'fixed') {
      const errorPattern = this.extractErrorPattern(session.original_error.message)
      const successfulFixes = session.fix_attempts
        .filter(attempt => attempt.success)
        .map(attempt => attempt.fix_description)
      
      if (errorPattern && successfulFixes.length > 0) {
        const existing = this.errorPatterns.get(errorPattern) || []
        this.errorPatterns.set(errorPattern, [...existing, ...successfulFixes])
      }
    }
  }

  /**
   * Extract a general pattern from specific error message
   */
  private extractErrorPattern(errorMessage: string): string | null {
    const message = errorMessage.toLowerCase()
    
    // Extract common patterns
    if (message.includes('indentation')) return 'indentation'
    if (message.includes('undefined')) return 'undefined'
    if (message.includes('syntax')) return 'syntax error'
    if (message.includes('assertion')) return 'assertion'
    if (message.includes('import')) return 'import error'
    if (message.includes('type')) return 'type error'
    
    return null
  }

  /**
   * Set the AI service (injected dependency)
   */
  setAIService(aiService: any): void {
    this.aiService = aiService
  }

  /**
   * Get configuration
   */
  getConfig(): DebuggerConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<DebuggerConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get debugging statistics
   */
  getStats(): {
    totalPatterns: number
    mostCommonErrors: Array<{ pattern: string; fixCount: number }>
  } {
    const patternStats = Array.from(this.errorPatterns.entries())
      .map(([pattern, fixes]) => ({ pattern, fixCount: fixes.length }))
      .sort((a, b) => b.fixCount - a.fixCount)
    
    return {
      totalPatterns: this.errorPatterns.size,
      mostCommonErrors: patternStats.slice(0, 10)
    }
  }

  /**
   * Enhance educational content for a capsule (hints, test cases, etc.)
   */
  private async enhanceEducationalContent(capsule: BaseCapsule): Promise<BaseCapsule> {
    if (this.config.detailed_logging) {
      console.log('🎓 Enhancing educational content for capsule')
    }

    try {
      // Create enhancement prompt based on capsule type
      const enhancementPrompt = this.buildEducationalEnhancementPrompt(capsule)
      
      // Call AI to generate educational enhancements
      const response = await this.aiService.generateJSON(enhancementPrompt, {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 2000
      })

      // Parse and apply enhancements
      const enhancements = this.parseEducationalEnhancements(response)
      const enhancedCapsule = this.applyEducationalEnhancements(capsule, enhancements)

      if (this.config.detailed_logging) {
        console.log('✨ Successfully enhanced educational content')
      }

      return enhancedCapsule
    } catch (error) {
      console.warn('⚠️ Failed to enhance educational content, returning original:', error)
      return capsule
    }
  }

  /**
   * Build prompt for educational content enhancement
   */
  private buildEducationalEnhancementPrompt(capsule: BaseCapsule): string {
    return `You are an educational content enhancer for a ${capsule.capsule_type} programming capsule.

CAPSULE DETAILS:
Title: ${capsule.title}
Type: ${capsule.capsule_type}
Language: ${capsule.runtime_config.language}
Problem: ${capsule.problem_statement_md}

CURRENT CONFIG: ${JSON.stringify(capsule.config_data, null, 2)}

TASK: Enhance this capsule with educational content. Return a JSON object with:

{
  "hints": [
    "Progressive hint 1 (gentle nudge)",
    "Progressive hint 2 (more specific)",
    "Progressive hint 3 (very specific)"
  ],
  "test_cases": [
    {
      "description": "Test case description",
      "input_args": [arg1, arg2],
      "expected_output": result_value,
      "is_hidden": false
    }
  ],
  "boilerplate_code": "// Starting code template for learners",
  "reference_solution": "// Complete working solution"
}

Make hints progressive (easy to hard). Create diverse test cases including edge cases. Ensure boilerplate gives a good starting point without giving away the solution.`
  }

  /**
   * Parse educational enhancements from AI response
   */
  private parseEducationalEnhancements(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      console.warn('Failed to parse educational enhancements, using defaults')
      return {
        hints: ['Try breaking down the problem into smaller steps'],
        test_cases: [],
        boilerplate_code: '// Add your solution here',
        reference_solution: '// Solution not available'
      }
    }
  }

  /**
   * Apply educational enhancements to capsule
   */
  private applyEducationalEnhancements(capsule: BaseCapsule, enhancements: any): BaseCapsule {
    // Create enhanced config_data based on capsule type
    let enhancedConfigData: any

    if (capsule.capsule_type === 'CODE') {
      enhancedConfigData = {
        boilerplate_code: enhancements.boilerplate_code || '// Add your solution here',
        reference_solution: enhancements.reference_solution || '// Solution not available',
        hints: enhancements.hints || ['Try breaking down the problem step by step'],
        test_cases: enhancements.test_cases || []
      }
    } else if (capsule.capsule_type === 'DATABASE') {
      enhancedConfigData = {
        boilerplate_code: enhancements.boilerplate_code || 'SELECT -- Add your query here',
        reference_solution: enhancements.reference_solution || '-- Solution not available',
        hints: enhancements.hints || ['Think about which tables and columns you need'],
        schema_definition: (capsule.config_data as any)?.schema_definition || '',
        seed_data: (capsule.config_data as any)?.seed_data || []
      }
    } else { // TERMINAL
      enhancedConfigData = {
        boilerplate_commands: enhancements.boilerplate_commands || ['# Add your commands here'],
        expected_outputs: enhancements.expected_outputs || [],
        hints: enhancements.hints || ['Think about what command you need to run']
      }
    }

    return {
      ...capsule,
      config_data: enhancedConfigData
    }
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a preconfigured debugger for different contexts
 */
export function createDebuggerAgent(context: {
  environment?: 'development' | 'production'
  speed_vs_accuracy?: 'speed' | 'balanced' | 'accuracy'
}): DebuggerAgent {
  let config: Partial<DebuggerConfig> = {}

  if (context.environment === 'production') {
    config = {
      max_fix_attempts: 2,
      conservative_fixes: true,
      detailed_logging: false,
      timeout_ms: 15000 // Faster for production
    }
  } else {
    config = {
      max_fix_attempts: 3,
      detailed_logging: true,
      timeout_ms: 30000
    }
  }

  if (context.speed_vs_accuracy === 'speed') {
    config.max_fix_attempts = 1
    config.timeout_ms = 10000
  } else if (context.speed_vs_accuracy === 'accuracy') {
    config.max_fix_attempts = 5
    config.timeout_ms = 60000
  }

  return new DebuggerAgent(config)
}

/**
 * Analyze debugging session for insights
 */
export function analyzeDebuggingSession(session: DebuggingSession): {
  efficiency: number // 0-1 score
  success_rate: number
  common_issues: string[]
  improvement_suggestions: string[]
} {
  const efficiency = session.final_result === 'fixed' 
    ? 1 / session.fix_attempts.length 
    : 0

  const successRate = session.fix_attempts.filter(a => a.success).length / session.fix_attempts.length

  return {
    efficiency,
    success_rate: successRate,
    common_issues: [session.analysis.error_type],
    improvement_suggestions: session.analysis.alternative_approaches
  }
}