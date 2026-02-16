/**
 * Base Validator - Core Validation Interface
 * 
 * This defines the contract that all capsule validators must implement.
 * It provides a consistent interface for testing and healing capsules
 * across different types (CODE, DATABASE, TERMINAL).
 */

import type { 
  BaseCapsule,
  ExecutionError,
  ValidationResult
} from '../types/base-capsule'

import type { DebuggerAgent } from '../agents/debugger-agent'

// ===== VALIDATOR INTERFACES =====

/**
 * Test execution result for a specific validation step
 */
export interface ValidationStepResult {
  step_name: string
  passed: boolean
  execution_time_ms: number
  error?: ExecutionError
  output?: string
  details?: any
}

/**
 * Complete validation session with all steps
 */
export interface ValidationSession {
  capsule_id: string
  validator_type: string
  started_at: string
  completed_at?: string
  total_time_ms: number
  
  steps: ValidationStepResult[]
  overall_result: 'passed' | 'failed' | 'healed'
  healing_attempts: number
  final_quality_score: number
  
  // Performance metrics
  test_coverage: number        // 0-1 percentage of tests that passed
  execution_efficiency: number // Performance score
  error_resilience: number     // How well it handles edge cases
}

/**
 * Validation configuration
 */
export interface ValidatorConfig {
  max_healing_attempts: number
  timeout_per_test_ms: number
  enable_performance_tests: boolean
  strict_mode: boolean         // Fail on warnings
  save_debug_output: boolean
  parallel_testing: boolean
}

/**
 * Test environment specification
 */
export interface TestEnvironment {
  runtime_type: string         // 'wasm', 'docker', 'lambda'
  language_version: string     // '3.11', '18.0', etc.
  available_packages: string[] // Installed dependencies
  memory_limit_mb: number
  timeout_ms: number
}

// ===== BASE VALIDATOR ABSTRACT CLASS =====

/**
 * Base class that all validators extend
 */
export abstract class BaseValidator {
  protected config: ValidatorConfig
  protected debuggerAgent: DebuggerAgent
  protected testEnvironment: TestEnvironment

  constructor(
    debuggerAgent: DebuggerAgent,
    config: Partial<ValidatorConfig> = {}
  ) {
    this.debuggerAgent = debuggerAgent
    this.config = {
      max_healing_attempts: 3,
      timeout_per_test_ms: 10000,
      enable_performance_tests: true,
      strict_mode: false,
      save_debug_output: false,
      parallel_testing: false,
      ...config
    }
    
    this.testEnvironment = this.getDefaultTestEnvironment()
  }

  /**
   * Main validation entry point with healing
   */
  async validateAndHeal(capsule: BaseCapsule): Promise<ValidationResult> {
    const session: ValidationSession = {
      capsule_id: capsule.id,
      validator_type: this.getValidatorType(),
      started_at: new Date().toISOString(),
      total_time_ms: 0,
      steps: [],
      overall_result: 'failed',
      healing_attempts: 0,
      final_quality_score: 0,
      test_coverage: 0,
      execution_efficiency: 0,
      error_resilience: 0
    }

    const startTime = Date.now()

    try {
      console.log(`🧪 Starting validation for ${capsule.capsule_type} capsule: ${capsule.title}`)
      
      let currentCapsule = capsule
      let validationPassed = false
      
      // Attempt validation with healing
      for (let attempt = 0; attempt <= this.config.max_healing_attempts; attempt++) {
        const isHealingAttempt = attempt > 0
        
        if (isHealingAttempt) {
          session.healing_attempts++
          console.log(`🔧 Healing attempt ${attempt}/${this.config.max_healing_attempts}`)
        }

        // Run type-specific validation
        const stepResults = await this.runValidationSteps(currentCapsule)
        session.steps.push(...stepResults)

        // Check if validation passed
        const failedSteps = stepResults.filter(step => !step.passed)
        validationPassed = failedSteps.length === 0

        if (validationPassed) {
          session.overall_result = isHealingAttempt ? 'healed' : 'passed'
          break
        }

        // If not the last attempt, try to heal
        if (attempt < this.config.max_healing_attempts) {
          const firstError = failedSteps[0].error
          if (firstError) {
            try {
              currentCapsule = await this.debuggerAgent.fixCapsule(currentCapsule, firstError)
              console.log(`🔄 Applied fixes, retrying validation...`)
            } catch (healingError) {
              console.log(`❌ Healing failed: ${healingError instanceof Error ? healingError.message : String(healingError)}`)
              break
            }
          }
        }
      }

      // Calculate final metrics
      session.completed_at = new Date().toISOString()
      session.total_time_ms = Date.now() - startTime
      session.final_quality_score = this.calculateQualityScore(session)
      session.test_coverage = this.calculateTestCoverage(session)
      session.execution_efficiency = this.calculateExecutionEfficiency(session)
      session.error_resilience = this.calculateErrorResilience(session)

      // Build validation result
      const result: ValidationResult = {
        isValid: validationPassed,
        capsule: currentCapsule,
        validationSteps: session.steps.map(step => ({
          validator: this.getValidatorType(),
          passed: step.passed,
          errors: step.error ? [step.error.message] : undefined,
          healingAttempts: session.healing_attempts
        })),
        qualityScore: session.final_quality_score
      }

      if (validationPassed) {
        console.log(`✅ Validation ${session.overall_result} - Quality: ${(session.final_quality_score * 100).toFixed(1)}%`)
      } else {
        console.log(`❌ Validation failed after ${session.healing_attempts} healing attempts`)
      }

      return result

    } catch (error) {
      session.completed_at = new Date().toISOString()
      session.total_time_ms = Date.now() - startTime
      
      console.error(`💥 Validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      
      return {
        isValid: false,
        capsule,
        validationSteps: [{
          validator: this.getValidatorType(),
          passed: false,
          errors: [`Validation crashed: ${error instanceof Error ? error.message : String(error)}`],
          healingAttempts: session.healing_attempts
        }],
        qualityScore: 0
      }
    }
  }

  // ===== ABSTRACT METHODS (must be implemented by subclasses) =====

  /**
   * Get the validator type identifier
   */
  protected abstract getValidatorType(): string

  /**
   * Run all validation steps for this capsule type
   */
  protected abstract runValidationSteps(capsule: BaseCapsule): Promise<ValidationStepResult[]>

  /**
   * Get default test environment for this validator
   */
  protected abstract getDefaultTestEnvironment(): TestEnvironment

  // ===== UTILITY METHODS =====

  /**
   * Calculate overall quality score from validation session
   */
  protected calculateQualityScore(session: ValidationSession): number {
    const passedSteps = session.steps.filter(step => step.passed).length
    const totalSteps = session.steps.length
    
    if (totalSteps === 0) return 0
    
    const baseScore = passedSteps / totalSteps
    
    // Penalize for healing attempts (but not too harshly)
    const healingPenalty = session.healing_attempts * 0.1
    const adjustedScore = Math.max(0, baseScore - healingPenalty)
    
    // Bonus for efficiency
    const avgExecutionTime = session.steps.reduce((sum, step) => sum + step.execution_time_ms, 0) / totalSteps
    const efficiencyBonus = avgExecutionTime < 1000 ? 0.05 : 0
    
    return Math.min(1, adjustedScore + efficiencyBonus)
  }

  /**
   * Calculate test coverage percentage
   */
  protected calculateTestCoverage(session: ValidationSession): number {
    const passedSteps = session.steps.filter(step => step.passed).length
    const totalSteps = session.steps.length
    return totalSteps > 0 ? passedSteps / totalSteps : 0
  }

  /**
   * Calculate execution efficiency score
   */
  protected calculateExecutionEfficiency(session: ValidationSession): number {
    const avgTime = session.steps.reduce((sum, step) => sum + step.execution_time_ms, 0) / session.steps.length
    // Good performance is under 2 seconds per test
    return Math.max(0, Math.min(1, (5000 - avgTime) / 5000))
  }

  /**
   * Calculate error resilience score
   */
  protected calculateErrorResilience(session: ValidationSession): number {
    if (session.overall_result === 'passed') return 1.0
    if (session.overall_result === 'healed') return 0.8
    return 0.2 // Failed validation
  }

  /**
   * Create a validation step result
   */
  protected createStepResult(
    stepName: string,
    passed: boolean,
    executionTimeMs: number,
    error?: ExecutionError,
    output?: string,
    details?: any
  ): ValidationStepResult {
    return {
      step_name: stepName,
      passed,
      execution_time_ms: executionTimeMs,
      error,
      output,
      details
    }
  }

  /**
   * Update validator configuration
   */
  updateConfig(updates: Partial<ValidatorConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): ValidatorConfig {
    return { ...this.config }
  }

  /**
   * Set test environment
   */
  setTestEnvironment(environment: Partial<TestEnvironment>): void {
    this.testEnvironment = { ...this.testEnvironment, ...environment }
  }

  /**
   * Get current test environment
   */
  getTestEnvironment(): TestEnvironment {
    return { ...this.testEnvironment }
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create execution error from validation failure
 */
export function createValidationError(
  type: ExecutionError['type'],
  message: string,
  details?: any
): ExecutionError {
  return {
    type,
    message,
    details
  }
}

/**
 * Analyze validation session for insights
 */
export function analyzeValidationSession(session: ValidationSession): {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  performance_grade: 'A' | 'B' | 'C' | 'D' | 'F'
} {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const recommendations: string[] = []

  // Analyze strengths
  if (session.test_coverage >= 0.9) strengths.push('Excellent test coverage')
  if (session.execution_efficiency >= 0.8) strengths.push('Fast execution times')
  if (session.healing_attempts === 0) strengths.push('Passed validation without healing')
  if (session.error_resilience >= 0.8) strengths.push('Good error handling')

  // Analyze weaknesses
  if (session.test_coverage < 0.7) weaknesses.push('Low test coverage')
  if (session.execution_efficiency < 0.5) weaknesses.push('Slow execution times')
  if (session.healing_attempts > 2) weaknesses.push('Required multiple healing attempts')
  if (session.overall_result === 'failed') weaknesses.push('Failed final validation')

  // Generate recommendations
  if (session.test_coverage < 0.8) recommendations.push('Add more comprehensive test cases')
  if (session.execution_efficiency < 0.6) recommendations.push('Optimize code for better performance')
  if (session.healing_attempts > 1) recommendations.push('Improve initial code generation quality')

  // Calculate grade
  const score = session.final_quality_score
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (score >= 0.9) grade = 'A'
  else if (score >= 0.8) grade = 'B'
  else if (score >= 0.7) grade = 'C'
  else if (score >= 0.6) grade = 'D'
  else grade = 'F'

  return {
    strengths,
    weaknesses,
    recommendations,
    performance_grade: grade
  }
}