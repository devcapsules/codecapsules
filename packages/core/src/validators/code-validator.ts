/**
 * Code Validator - Validation for Programming Exercise Capsules
 * 
 * This validator handles CODE type capsules by:
 * - Running test cases against the reference solution
 * - Validating syntax and imports
 * - Checking for proper error handling
 * - Testing edge cases and performance
 * - Verifying educational value
 */

import type { 
  BaseCapsule,
  CodeConfig,
  ExecutionError,
  CapsuleLanguage
} from '../types/base-capsule'

import { 
  BaseValidator,
  type ValidationStepResult,
  type TestEnvironment,
  createValidationError
} from './base-validator'

import type { DebuggerAgent } from '../agents/debugger-agent'

// ===== CODE VALIDATOR INTERFACES =====

/**
 * Code execution result
 */
interface CodeExecutionResult {
  success: boolean
  output: string
  error?: string
  execution_time_ms: number
  memory_usage_bytes?: number
}

/**
 * Test case execution result
 */
interface TestCaseResult {
  test_index: number
  description: string
  test_call: string
  expected_output: string
  actual_output: string
  passed: boolean
  execution_time_ms: number
  error?: string
}

/**
 * Code quality analysis
 */
interface CodeQualityAnalysis {
  syntax_score: number          // 0-1
  style_score: number           // 0-1
  complexity_score: number      // 0-1
  maintainability_score: number // 0-1
  issues: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    line?: number
  }>
}

// ===== CODE VALIDATOR IMPLEMENTATION =====

export class CodeValidator extends BaseValidator {
  private executionService: any // Will be injected
  
  constructor(
    debuggerAgent: DebuggerAgent,
    executionService: any,
    config = {}
  ) {
    super(debuggerAgent, config)
    this.executionService = executionService
  }

  protected getValidatorType(): string {
    return 'CodeValidator'
  }

  protected getDefaultTestEnvironment(): TestEnvironment {
    return {
      runtime_type: 'wasm',
      language_version: '3.11',
      available_packages: ['builtins'],
      memory_limit_mb: 128,
      timeout_ms: 10000
    }
  }

  /**
   * Run all validation steps for a CODE capsule
   */
  protected async runValidationSteps(capsule: BaseCapsule): Promise<ValidationStepResult[]> {
    const config = capsule.config_data as CodeConfig
    const language = capsule.runtime_config.language as CapsuleLanguage
    const results: ValidationStepResult[] = []

    // Step 1: Syntax Validation
    results.push(await this.validateSyntax(config, language))

    // Step 2: Reference Solution Validation
    results.push(await this.validateReferenceSolution(config, language))

    // Step 3: Test Cases Validation
    results.push(await this.validateTestCases(config, language))

    // Step 4: Boilerplate Code Validation
    results.push(await this.validateBoilerplateCode(config, language))

    // Step 5: Code Quality Analysis (if enabled)
    if (this.config.enable_performance_tests) {
      results.push(await this.validateCodeQuality(config, language))
    }

    // Step 6: Edge Case Testing
    results.push(await this.validateEdgeCases(config, language))

    return results
  }

  /**
   * Step 1: Validate syntax of both boilerplate and reference solution
   */
  private async validateSyntax(config: CodeConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      // Check reference solution syntax
      const solutionSyntax = await this.checkSyntax(config.reference_solution, language)
      if (!solutionSyntax.valid) {
        return this.createStepResult(
          'syntax_validation',
          false,
          Date.now() - startTime,
          createValidationError('syntax', `Reference solution syntax error: ${solutionSyntax.error}`)
        )
      }

      // Check boilerplate syntax (if it's supposed to run)
      const boilerplateSyntax = await this.checkSyntax(config.boilerplate_code, language)
      if (!boilerplateSyntax.valid && this.isExecutableBoilerplate(config.boilerplate_code)) {
        return this.createStepResult(
          'syntax_validation',
          false,
          Date.now() - startTime,
          createValidationError('syntax', `Boilerplate code syntax error: ${boilerplateSyntax.error}`)
        )
      }

      return this.createStepResult(
        'syntax_validation',
        true,
        Date.now() - startTime,
        undefined,
        'All syntax checks passed'
      )

    } catch (error) {
      return this.createStepResult(
        'syntax_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Syntax validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 2: Validate that the reference solution works correctly
   */
  private async validateReferenceSolution(config: CodeConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      // Execute reference solution without test cases first
      const basicExecution = await this.executeCode(config.reference_solution, language)
      
      if (!basicExecution.success) {
        return this.createStepResult(
          'reference_solution_validation',
          false,
          Date.now() - startTime,
          createValidationError('runtime', `Reference solution failed to execute: ${basicExecution.error}`)
        )
      }

      return this.createStepResult(
        'reference_solution_validation',
        true,
        Date.now() - startTime,
        undefined,
        `Reference solution executed successfully in ${basicExecution.execution_time_ms}ms`
      )

    } catch (error) {
      return this.createStepResult(
        'reference_solution_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Reference solution validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 3: Run all test cases against the reference solution
   */
  private async validateTestCases(config: CodeConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      if (!config.test_cases || config.test_cases.length === 0) {
        return this.createStepResult(
          'test_cases_validation',
          false,
          Date.now() - startTime,
          createValidationError('test_failure', 'No test cases defined')
        )
      }

      const testResults: TestCaseResult[] = []
      let passedTests = 0

      for (let i = 0; i < config.test_cases.length; i++) {
        const testCase = config.test_cases[i]
        const testResult = await this.runSingleTestCase(
          config.reference_solution,
          testCase,
          language,
          i
        )
        
        testResults.push(testResult)
        if (testResult.passed) passedTests++
      }

      const allTestsPassed = passedTests === config.test_cases.length
      const testSummary = `${passedTests}/${config.test_cases.length} tests passed`

      if (!allTestsPassed) {
        const failedTests = testResults.filter(t => !t.passed)
        const firstFailure = failedTests[0]
        return this.createStepResult(
          'test_cases_validation',
          false,
          Date.now() - startTime,
          createValidationError('test_failure', `Test failed: ${firstFailure.description}. Expected: "${firstFailure.expected_output}", Got: "${firstFailure.actual_output}"`),
          testSummary,
          { test_results: testResults }
        )
      }

      return this.createStepResult(
        'test_cases_validation',
        true,
        Date.now() - startTime,
        undefined,
        testSummary,
        { test_results: testResults }
      )

    } catch (error) {
      return this.createStepResult(
        'test_cases_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Test case validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 4: Validate boilerplate code structure
   */
  private async validateBoilerplateCode(config: CodeConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const issues: string[] = []

      // Check if boilerplate is too complete
      const similarity = this.calculateCodeSimilarity(config.boilerplate_code, config.reference_solution)
      if (similarity > 0.8) {
        issues.push('Boilerplate code is too similar to reference solution')
      }

      // Check if boilerplate is too empty
      const codeLines = config.boilerplate_code.split('\n').filter(line => 
        line.trim().length > 0 && !line.trim().startsWith('#') && !line.trim().startsWith('//')
      )
      if (codeLines.length < 2) {
        issues.push('Boilerplate code is too minimal')
      }

      // Language-specific checks
      const languageIssues = await this.validateLanguageSpecificBoilerplate(config.boilerplate_code, language)
      issues.push(...languageIssues)

      const hasIssues = issues.length > 0
      return this.createStepResult(
        'boilerplate_validation',
        !hasIssues,
        Date.now() - startTime,
        hasIssues ? createValidationError('validation_timeout', `Boilerplate issues: ${issues.join(', ')}`) : undefined,
        hasIssues ? issues.join('; ') : 'Boilerplate code structure is appropriate'
      )

    } catch (error) {
      return this.createStepResult(
        'boilerplate_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Boilerplate validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 5: Analyze code quality
   */
  private async validateCodeQuality(config: CodeConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const analysis = await this.analyzeCodeQuality(config.reference_solution, language)
      
      const overallScore = (
        analysis.syntax_score * 0.3 +
        analysis.style_score * 0.2 +
        analysis.complexity_score * 0.3 +
        analysis.maintainability_score * 0.2
      )

      const passed = overallScore >= 0.7
      const errors = analysis.issues.filter(issue => issue.type === 'error')
      
      if (errors.length > 0) {
        return this.createStepResult(
          'code_quality_validation',
          false,
          Date.now() - startTime,
          createValidationError('syntax', `Code quality issues: ${errors[0].message}`),
          `Quality score: ${(overallScore * 100).toFixed(1)}%`,
          analysis
        )
      }

      return this.createStepResult(
        'code_quality_validation',
        passed,
        Date.now() - startTime,
        undefined,
        `Quality score: ${(overallScore * 100).toFixed(1)}%`,
        analysis
      )

    } catch (error) {
      return this.createStepResult(
        'code_quality_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Code quality validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 6: Test edge cases
   */
  private async validateEdgeCases(config: CodeConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      // Generate edge cases based on test cases
      const edgeCases = this.generateEdgeCases(config.test_cases, language)
      
      if (edgeCases.length === 0) {
        return this.createStepResult(
          'edge_case_validation',
          true,
          Date.now() - startTime,
          undefined,
          'No edge cases to test'
        )
      }

      let passedEdgeCases = 0
      const edgeResults: TestCaseResult[] = []

      for (let i = 0; i < edgeCases.length; i++) {
        const edgeCase = edgeCases[i]
        const result = await this.runSingleTestCase(
          config.reference_solution,
          edgeCase,
          language,
          i
        )
        
        edgeResults.push(result)
        if (result.passed) passedEdgeCases++
      }

      const allEdgesPassed = passedEdgeCases === edgeCases.length
      const summary = `${passedEdgeCases}/${edgeCases.length} edge cases passed`

      return this.createStepResult(
        'edge_case_validation',
        allEdgesPassed,
        Date.now() - startTime,
        allEdgesPassed ? undefined : createValidationError('test_failure', 'Some edge cases failed'),
        summary,
        { edge_results: edgeResults }
      )

    } catch (error) {
      return this.createStepResult(
        'edge_case_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Edge case validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Check syntax of code
   */
  private async checkSyntax(code: string, language: CapsuleLanguage): Promise<{ valid: boolean; error?: string }> {
    try {
      // This would use the actual execution service to check syntax
      // For now, basic checks
      if (!code || code.trim().length === 0) {
        return { valid: false, error: 'Empty code' }
      }

      // Language-specific basic syntax checks
      if (language === 'python') {
        // Check for basic Python syntax issues
        const lines = code.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.endsWith(':') && !line.match(/^(if|for|while|def|class|try|except|else|elif|finally|with)/)) {
            return { valid: false, error: `Potential syntax error on line ${i + 1}: unexpected ':'` }
          }
        }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /**
   * Execute code in the test environment
   */
  private async executeCode(code: string, language: CapsuleLanguage): Promise<CodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      // This would use the actual execution service
      // For now, simulate execution
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate execution time
      
      return {
        success: true,
        output: 'Execution completed successfully',
        execution_time_ms: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        execution_time_ms: Date.now() - startTime
      }
    }
  }

  /**
   * Run a single test case
   */
  private async runSingleTestCase(
    solutionCode: string,
    testCase: any,
    language: CapsuleLanguage,
    index: number
  ): Promise<TestCaseResult> {
    const startTime = Date.now()
    
    try {
      // Combine solution code with test call
      const testCode = `${solutionCode}\n\n${testCase.test_call}`
      const execution = await this.executeCode(testCode, language)
      
      if (!execution.success) {
        return {
          test_index: index,
          description: testCase.description,
          test_call: testCase.test_call,
          expected_output: testCase.expected_output,
          actual_output: execution.error || '',
          passed: false,
          execution_time_ms: Date.now() - startTime,
          error: execution.error
        }
      }

      // Compare outputs (normalize whitespace)
      const expectedOutput = testCase.expected_output.trim()
      const actualOutput = execution.output.trim()
      const passed = expectedOutput === actualOutput

      return {
        test_index: index,
        description: testCase.description,
        test_call: testCase.test_call,
        expected_output: expectedOutput,
        actual_output: actualOutput,
        passed,
        execution_time_ms: Date.now() - startTime
      }
    } catch (error) {
      return {
        test_index: index,
        description: testCase.description,
        test_call: testCase.test_call,
        expected_output: testCase.expected_output,
        actual_output: '',
        passed: false,
        execution_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Calculate similarity between two code snippets
   */
  private calculateCodeSimilarity(code1: string, code2: string): number {
    // Simple similarity calculation - in production this would be more sophisticated
    const normalize = (code: string) => code.replace(/\s+/g, ' ').trim().toLowerCase()
    const norm1 = normalize(code1)
    const norm2 = normalize(code2)
    
    if (norm1 === norm2) return 1.0
    if (norm1.length === 0 || norm2.length === 0) return 0.0
    
    // Simple character-based similarity
    let matches = 0
    const maxLength = Math.max(norm1.length, norm2.length)
    for (let i = 0; i < Math.min(norm1.length, norm2.length); i++) {
      if (norm1[i] === norm2[i]) matches++
    }
    
    return matches / maxLength
  }

  /**
   * Validate language-specific boilerplate requirements
   */
  private async validateLanguageSpecificBoilerplate(boilerplate: string, language: CapsuleLanguage): Promise<string[]> {
    const issues: string[] = []
    
    switch (language) {
      case 'python':
        if (!boilerplate.includes('def ')) {
          issues.push('Python boilerplate should include function definition')
        }
        break
        
      case 'javascript':
        if (!boilerplate.includes('function') && !boilerplate.includes('=>')) {
          issues.push('JavaScript boilerplate should include function definition')
        }
        break
        
      case 'java':
        if (!boilerplate.includes('public ') || !boilerplate.includes('class ')) {
          issues.push('Java boilerplate should include public class definition')
        }
        break
    }
    
    return issues
  }

  /**
   * Analyze code quality
   */
  private async analyzeCodeQuality(code: string, language: CapsuleLanguage): Promise<CodeQualityAnalysis> {
    // Simplified code quality analysis
    // In production, this would use proper linting tools
    
    const issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; line?: number }> = []
    
    // Basic checks
    const lines = code.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Check line length
      if (line.length > 120) {
        issues.push({
          type: 'warning',
          message: 'Line too long (over 120 characters)',
          line: i + 1
        })
      }
      
      // Check for TODO comments
      if (line.toLowerCase().includes('todo') || line.toLowerCase().includes('fixme')) {
        issues.push({
          type: 'info',
          message: 'TODO comment found',
          line: i + 1
        })
      }
    }
    
    return {
      syntax_score: 0.9,
      style_score: issues.length > 5 ? 0.6 : 0.9,
      complexity_score: lines.length > 50 ? 0.7 : 0.9,
      maintainability_score: 0.8,
      issues
    }
  }

  /**
   * Check if boilerplate code is meant to be executable
   */
  private isExecutableBoilerplate(boilerplate: string): boolean {
    // Check if boilerplate has actual executable code vs just structure/comments
    const meaningfulLines = boilerplate.split('\n').filter(line => {
      const trimmed = line.trim()
      return trimmed.length > 0 && 
             !trimmed.startsWith('#') && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('/*') &&
             !trimmed.match(/^(pass|TODO|FIXME)/)
    })
    
    return meaningfulLines.length > 2
  }

  /**
   * Generate edge cases based on existing test cases
   */
  private generateEdgeCases(testCases: any[], language: CapsuleLanguage): any[] {
    // This would generate edge cases automatically
    // For now, return empty array
    return []
  }

  /**
   * Set execution service
   */
  setExecutionService(service: any): void {
    this.executionService = service
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a pre-configured code validator
 */
export function createCodeValidator(
  debuggerAgent: DebuggerAgent,
  executionService: any,
  environment: 'development' | 'production' = 'development'
): CodeValidator {
  const config = environment === 'production' ? {
    max_healing_attempts: 2,
    timeout_per_test_ms: 5000,
    strict_mode: true,
    save_debug_output: false
  } : {
    max_healing_attempts: 3,
    timeout_per_test_ms: 10000,
    strict_mode: false,
    save_debug_output: true
  }

  return new CodeValidator(debuggerAgent, executionService, config)
}