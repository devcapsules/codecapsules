/**
 * Validators Index - Exports for Self-Healing Validation System
 * 
 * This module provides all validators for the Devcapsules quality pipeline.
 * Each validator is specialized for its capsule type and provides automatic
 * testing, healing, and quality scoring capabilities.
 */

// ===== CORE VALIDATOR EXPORTS =====
 
export { 
  BaseValidator,
  type ValidationStepResult,
  type TestEnvironment,
  type ValidationSession,
  createValidationError
} from './base-validator'

export { 
  CodeValidator,
  createCodeValidator 
} from './code-validator'

export { 
  DatabaseValidator,
  createDatabaseValidator 
} from './database-validator'

export { 
  TerminalValidator,
  createTerminalValidator 
} from './terminal-validator'

// ===== FACTORY FUNCTIONS =====

import type { DebuggerAgent } from '../agents/debugger-agent'
import type { BaseCapsule } from '../types/base-capsule'

import { 
  BaseValidator, 
  type ValidationStepResult 
} from './base-validator'
import { CodeValidator } from './code-validator'
import { DatabaseValidator } from './database-validator'
import { TerminalValidator } from './terminal-validator'

/**
 * Create the appropriate validator for a capsule type
 */
export function createValidatorForCapsule(
  capsule: BaseCapsule,
  debuggerAgent: DebuggerAgent,
  services: {
    executionService?: any
    databaseService?: any
    terminalService?: any
  },
  environment: 'development' | 'production' = 'development'
): BaseValidator {
  switch (capsule.capsule_type) {
    case 'CODE':
      if (!services.executionService) {
        throw new Error('executionService is required for CODE capsules')
      }
      return new CodeValidator(debuggerAgent, services.executionService, {
        max_healing_attempts: environment === 'production' ? 2 : 3,
        timeout_per_test_ms: environment === 'production' ? 5000 : 10000,
        strict_mode: environment === 'production',
        enable_performance_tests: environment === 'production',
        save_debug_output: environment === 'development'
      })

    case 'DATABASE':
      if (!services.databaseService) {
        throw new Error('databaseService is required for DATABASE capsules')
      }
      return new DatabaseValidator(debuggerAgent, services.databaseService, {
        max_healing_attempts: environment === 'production' ? 2 : 3,
        timeout_per_test_ms: environment === 'production' ? 15000 : 30000,
        strict_mode: environment === 'production',
        enable_performance_tests: environment === 'production',
        save_debug_output: environment === 'development'
      })

    case 'TERMINAL':
      if (!services.terminalService) {
        throw new Error('terminalService is required for TERMINAL capsules')
      }
      return new TerminalValidator(debuggerAgent, services.terminalService, {
        max_healing_attempts: environment === 'production' ? 2 : 3,
        timeout_per_test_ms: environment === 'production' ? 30000 : 60000,
        strict_mode: environment === 'production',
        save_debug_output: environment === 'development'
      })

    default:
      throw new Error(`Unknown capsule type: ${(capsule as any).capsule_type}`)
  }
}

/**
 * Validate a capsule with automatic validator selection
 */
export async function validateCapsule(
  capsule: BaseCapsule,
  debuggerAgent: DebuggerAgent,
  services: {
    executionService?: any
    databaseService?: any
    terminalService?: any
  },
  environment: 'development' | 'production' = 'development'
): Promise<{
  isValid: boolean
  healedCapsule?: BaseCapsule
  validationSteps: Array<{
    validator: string
    passed: boolean
    errors?: string[]
    healingAttempts?: number
  }>
  qualityScore: number
  errors: Array<{
    type: string
    message: string
    step?: string
  }>
}> {
  const validator = createValidatorForCapsule(capsule, debuggerAgent, services, environment)
  
  try {
    const result = await validator.validateAndHeal(capsule)
    
    return {
      isValid: result.isValid,
      healedCapsule: result.capsule,
      validationSteps: result.validationSteps,
      qualityScore: result.qualityScore,
      errors: result.validationSteps
        .filter((step: any) => !step.passed)
        .map((step: any) => ({
          type: 'validation_error',
          message: step.errors?.[0] || 'Unknown error',
          step: step.validator
        }))
    }
  } finally {
    // Note: BaseValidator doesn't have cleanup method yet, 
    // but individual validators might override it
  }
}

/**
 * Get validation statistics for a set of results
 */
export function getValidationStatistics(
  results: Array<{
    isValid: boolean
    qualityScore: number
    validationSteps: Array<{
      validator: string
      passed: boolean
      errors?: string[]
      healingAttempts?: number
    }>
  }>
): {
  total_capsules: number
  valid_capsules: number
  invalid_capsules: number
  average_quality_score: number
  success_rate: number
} {
  const total_capsules = results.length
  const valid_capsules = results.filter(r => r.isValid).length
  const invalid_capsules = total_capsules - valid_capsules
  
  const average_quality_score = results.length > 0 
    ? results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length 
    : 0

  const success_rate = total_capsules > 0 ? valid_capsules / total_capsules : 0

  return {
    total_capsules,
    valid_capsules,
    invalid_capsules,
    average_quality_score,
    success_rate
  }
}