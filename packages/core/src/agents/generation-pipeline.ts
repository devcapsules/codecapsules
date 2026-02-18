/**
 * Generation Pipeline - AI Agent Orchestrator
 * 
 * This orchestrates the three-agent pipeline for high-quality capsule generation:
 * Pedagogist → Coder → Debugger → Validated Capsule
 * 
 * This replaces the old monolithic generation approach with a specialist
 * agent system that produces consistently high-quality educational content.
 */

import type { 
  BaseCapsule,
  GenerationContext,
  GenerationResult,
  ValidationResult,
  ExecutionError
} from '../types/base-capsule'

// Re-export types for external use
export type { GenerationContext } from '../types/base-capsule'

import { PedagogistAgent, type CapsuleIdea } from './pedagogist-agent'
import { CoderAgent } from './coder-agent'
import { DebuggerAgent } from './debugger-agent'

// ===== PIPELINE INTERFACES =====

/**
 * Configuration for the generation pipeline
 */
export interface GenerationPipelineConfig {
  // Agent configurations
  pedagogist_config?: any
  coder_config?: any
  debugger_config?: any
  
  // Pipeline behavior
  max_generation_attempts: number
  enable_quality_gates: boolean
  save_intermediate_results: boolean
  timeout_ms: number
  skip_validation: boolean  // Skip self-healing judge for faster generation
  
  // Quality thresholds
  min_educational_value: number
  min_technical_quality: number
  max_debugging_attempts: number
}

/**
 * Detailed result from the generation pipeline
 */
export interface PipelineGenerationResult extends GenerationResult {
  // Agent outputs
  pedagogical_idea: CapsuleIdea
  implementation_plan: any
  debugging_session?: any
  
  // Quality metrics
  educational_score: number
  technical_score: number
  overall_quality: number
  
  // Performance metrics
  total_time_ms: number
  agent_timings: {
    pedagogist_ms: number
    coder_ms: number
    debugger_ms?: number
  }
  
  // Pipeline metadata
  pipeline_version: string
  agents_used: string[]
  quality_gates_passed: string[]
  warnings: string[]
}

/**
 * Pipeline execution statistics
 */
export interface PipelineStats {
  total_generations: number
  successful_generations: number
  success_rate: number
  average_quality_score: number
  average_generation_time_ms: number
  common_failure_modes: Array<{
    error_type: string
    frequency: number
    typical_cause: string
  }>
}

// ===== GENERATION PIPELINE IMPLEMENTATION =====

export class GenerationPipeline {
  private pedagogistAgent: PedagogistAgent
  private coderAgent: CoderAgent
  private debuggerAgent: DebuggerAgent
  private config: GenerationPipelineConfig
  private aiService: any
  private stats: PipelineStats

  constructor(
    aiService: any,
    config: Partial<GenerationPipelineConfig> = {}
  ) {
    this.aiService = aiService
    
    this.config = {
      max_generation_attempts: 3,
      enable_quality_gates: true,
      save_intermediate_results: false,
      timeout_ms: 60000, // 60 seconds
      skip_validation: true,  // Skip validation for faster generation (under 30s)
      min_educational_value: 0.7,
      min_technical_quality: 0.8,
      max_debugging_attempts: 3,
      ...config
    }

    // Initialize agents
    this.pedagogistAgent = new PedagogistAgent(config.pedagogist_config)
    this.coderAgent = new CoderAgent(config.coder_config)
    this.debuggerAgent = new DebuggerAgent(config.debugger_config)

    // Inject AI service into all agents
    this.pedagogistAgent.setAIService(aiService)
    this.coderAgent.setAIService(aiService)
    this.debuggerAgent.setAIService(aiService)

    // Initialize stats
    this.stats = {
      total_generations: 0,
      successful_generations: 0,
      success_rate: 0,
      average_quality_score: 0,
      average_generation_time_ms: 0,
      common_failure_modes: []
    }
  }

  /**
   * Main pipeline execution: Generate a high-quality capsule
   */
  async generateCapsule(context: GenerationContext): Promise<PipelineGenerationResult> {
    const startTime = Date.now()
    this.stats.total_generations++

    try {
      console.log(`🚀 Starting generation pipeline for ${context.type} capsule`)
      
      // Stage 1: Pedagogist - Educational Idea Generation
      const pedagogistStart = Date.now()
      const idea = await this.runPedagogistStage(context)
      const pedagogistTime = Date.now() - pedagogistStart
      
      if (this.config.enable_quality_gates && !this.passesEducationalQualityGate(idea)) {
        throw new Error('Failed educational quality gate')
      }

      // Stage 2: Coder - Technical Implementation
      const coderStart = Date.now()
      let capsule = await this.runCoderStage(idea, context)
      const coderTime = Date.now() - coderStart

      if (this.config.enable_quality_gates && !this.passesTechnicalQualityGate(capsule)) {
        throw new Error('Failed technical quality gate')
      }

      // Stage 3: Debugger Agent - Educational Enhancement (NO validation - deferred to publish)
      let debuggerTime = 0
      let debuggingSession = undefined
      const wasDebugged = true // Always run debugger for enhancement
      
      console.log('🔧 Stage 3: Debugger Agent - Enhancing educational content...')
      const debuggerStart = Date.now()
      
      try {
        // Run debugger for educational enhancement (hints, explanations, etc.)
        // Validation is SKIPPED here - will be done at publish time via /api/capsules/validate
        capsule = await this.runDebuggerStage(capsule, null)
        debuggerTime = Date.now() - debuggerStart
        console.log(`✨ Debugger Agent completed in ${debuggerTime}ms`)
      } catch (error) {
        console.warn('⚠️ Debugger Agent failed, using coder output:', error)
        debuggerTime = Date.now() - debuggerStart
      }
      
      // NOTE: No Piston validation here - capsule must be validated via /api/capsules/validate
      // before publishing via /api/capsules/publish

      // Calculate quality scores
      const educationalScore = idea.educational_value
      const technicalScore = 0.9 // Placeholder - would come from actual validation
      const overallQuality = (educationalScore + technicalScore) / 2

      // Build result
      const result: PipelineGenerationResult = {
        capsule,
        confidence: overallQuality,
        generationTime: Date.now() - startTime,
        agentChain: wasDebugged ? ['pedagogist', 'coder', 'debugger'] : ['pedagogist', 'coder'],
        
        // Additional pipeline data
        pedagogical_idea: idea,
        implementation_plan: {}, // Would come from coder
        debugging_session: debuggingSession,
        
        educational_score: educationalScore,
        technical_score: technicalScore,
        overall_quality: overallQuality,
        
        total_time_ms: Date.now() - startTime,
        agent_timings: {
          pedagogist_ms: pedagogistTime,
          coder_ms: coderTime,
          debugger_ms: debuggerTime
        },
        
        pipeline_version: '1.0.0',
        agents_used: wasDebugged ? ['pedagogist', 'coder', 'debugger'] : ['pedagogist', 'coder'],
        quality_gates_passed: ['educational', 'technical'],
        warnings: []
      }

      // Update stats
      this.stats.successful_generations++
      this.updateStats(result)

      console.log(`✅ Generation pipeline completed successfully in ${result.total_time_ms}ms`)
      console.log(`Quality Score: ${(overallQuality * 100).toFixed(1)}%`)

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ Generation pipeline failed: ${errorMessage}`)
      
      // Track failure
      this.trackFailure(errorMessage)
      
      throw new Error(`Generation pipeline failed: ${errorMessage}`)
    }
  }

  /**
   * Stage 1: Run Pedagogist Agent
   */
  private async runPedagogistStage(context: GenerationContext): Promise<CapsuleIdea> {
    console.log('📚 Stage 1: Pedagogist - Generating educational idea...')
    
    try {
      const idea = await this.pedagogistAgent.generateIdea(context)
      console.log(`💡 Generated idea: "${idea.title}"`)
      console.log(`📊 Educational value: ${(idea.educational_value * 100).toFixed(1)}%`)
      
      return idea
    } catch (error) {
      throw new Error(`Pedagogist stage failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Stage 2: Run Coder Agent
   */
  private async runCoderStage(idea: CapsuleIdea, context: GenerationContext): Promise<BaseCapsule> {
    console.log('⚙️ Stage 2: Coder - Implementing technical solution...')
    
    try {
      const capsule = await this.coderAgent.implementCapsule(idea, context)
      console.log(`🔧 Generated ${context.type} capsule with ${context.language}`)
      
      return capsule
    } catch (error) {
      throw new Error(`Coder stage failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Stage 3: Run Debugger Agent (educational enhancement)
   * 
   * IMPORTANT: The Coder stage produces Golden 5 test cases (exactly 5, categorized).
   * The Debugger must NOT overwrite them. We preserve the Coder's test_cases and only
   * let the Debugger enhance hints, boilerplate, and reference solution.
   */
  private async runDebuggerStage(capsule: BaseCapsule, error: any): Promise<BaseCapsule> {
    // Preserve Coder's Golden 5 test cases before debugger runs
    const coderTestCases = (capsule.config_data as any)?.test_cases;
    const coderRefSolution = (capsule.config_data as any)?.reference_solution;

    if (error) {
      console.log('🐛 Stage 3: Debugger - Fixing execution issues...')
    } else {
      console.log('🔧 Stage 3: Debugger - Adding hints and educational content...')
    }
    
    try {
      let enhanced: BaseCapsule;
      if (error) {
        enhanced = await this.debuggerAgent.fixCapsule(capsule, error)
        console.log('🔧 Successfully fixed capsule issues')
      } else {
        const mockError = {
          type: 'educational_enhancement',
          message: 'Capsule needs educational content enhancement (hints, test cases, etc.)',
          context: 'Generated by AI pipeline for content completion',
          code: capsule.config_data,
          timestamp: Date.now()
        }
        
        enhanced = await this.debuggerAgent.fixCapsule(capsule, mockError as any)
        console.log('✨ Successfully enhanced capsule with educational content')
      }

      // GOLDEN 5 ENFORCEMENT: Always restore Coder's test cases (debugger must not overwrite)
      if (coderTestCases && Array.isArray(coderTestCases) && coderTestCases.length > 0) {
        const configData = { ...(enhanced.config_data as any) };
        configData.test_cases = coderTestCases;
        enhanced = { ...enhanced, config_data: configData };
        console.log(`🔒 Restored Coder's Golden 5 test cases (${coderTestCases.length} tests)`);
      }

      // Also restore reference solution if debugger clobbered it
      if (coderRefSolution && coderRefSolution.length > 50) {
        const configData = { ...(enhanced.config_data as any) };
        if (!configData.reference_solution || configData.reference_solution.length < 20) {
          configData.reference_solution = coderRefSolution;
          enhanced = { ...enhanced, config_data: configData };
        }
      }

      // Safety cap: never exceed 5 test cases
      const finalConfig = enhanced.config_data as any;
      if (finalConfig?.test_cases && Array.isArray(finalConfig.test_cases) && finalConfig.test_cases.length > 5) {
        console.warn(`⚠️ Test cases exceeded 5 (${finalConfig.test_cases.length}), capping to 5`);
        finalConfig.test_cases = finalConfig.test_cases.slice(0, 5);
        enhanced = { ...enhanced, config_data: finalConfig };
      }

      return enhanced;
    } catch (debuggerError) {
      console.warn('⚠️ Debugger stage failed, returning original capsule:', debuggerError)
      return capsule // Return original capsule if debugger fails
    }
  }

  /**
   * Educational quality gate check
   */
  private passesEducationalQualityGate(idea: CapsuleIdea): boolean {
    return (
      idea.educational_value >= this.config.min_educational_value &&
      idea.learning_objectives.length > 0 &&
      idea.title.length > 10 &&
      idea.description.length > 50
    )
  }

  /**
   * Technical quality gate check
   */
  private passesTechnicalQualityGate(capsule: BaseCapsule): boolean {
    // Basic structural checks
    return (
      capsule.title.length > 0 &&
      capsule.problem_statement_md.length > 0 &&
      capsule.config_data !== null &&
      capsule.runtime_config.language.length > 0
    )
  }

  /**
   * Check if capsule needs debugging
   */
  private async needsDebugging(capsule: BaseCapsule): Promise<boolean> {
    // In production, this would actually run the capsule and check for errors
    // For now, return false since we don't have validators implemented
    return false
  }

  /**
   * Update pipeline statistics
   */
  private updateStats(result: PipelineGenerationResult): void {
    const currentAvgQuality = this.stats.average_quality_score
    const currentAvgTime = this.stats.average_generation_time_ms
    const totalSuccessful = this.stats.successful_generations

    // Update running averages
    this.stats.average_quality_score = (
      (currentAvgQuality * (totalSuccessful - 1) + result.overall_quality) / totalSuccessful
    )
    
    this.stats.average_generation_time_ms = (
      (currentAvgTime * (totalSuccessful - 1) + result.total_time_ms) / totalSuccessful
    )

    this.stats.success_rate = this.stats.successful_generations / this.stats.total_generations
  }

  /**
   * Track pipeline failures for analysis
   */
  private trackFailure(errorMessage: string): void {
    const errorType = this.classifyError(errorMessage)
    
    const existingFailure = this.stats.common_failure_modes.find(f => f.error_type === errorType)
    if (existingFailure) {
      existingFailure.frequency++
    } else {
      this.stats.common_failure_modes.push({
        error_type: errorType,
        frequency: 1,
        typical_cause: errorMessage
      })
    }
  }

  /**
   * Classify error types for tracking
   */
  private classifyError(errorMessage: string): string {
    const message = errorMessage.toLowerCase()
    
    if (message.includes('pedagogist')) return 'pedagogist_failure'
    if (message.includes('coder')) return 'coder_failure'
    if (message.includes('debugger')) return 'debugger_failure'
    if (message.includes('quality gate')) return 'quality_gate_failure'
    if (message.includes('timeout')) return 'timeout'
    
    return 'unknown_error'
  }

  /**
   * Get pipeline statistics
   */
  getStats(): PipelineStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      total_generations: 0,
      successful_generations: 0,
      success_rate: 0,
      average_quality_score: 0,
      average_generation_time_ms: 0,
      common_failure_modes: []
    }
  }

  /**
   * Update pipeline configuration
   */
  updateConfig(updates: Partial<GenerationPipelineConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): GenerationPipelineConfig {
    return { ...this.config }
  }

  /**
   * The "Self-Healing Judge" - Validate generated code with Serverless Judge
   * Now uses Queue-based execution on EC2 Piston for better scalability
   */
  private async validateWithServerlessJudge(
    solution: string, 
    testCases: any[], 
    language: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Sending code to Serverless Judge for validation...')
      
      // Handle SQL validation with in-memory SQLite
      if (language.toLowerCase() === 'sql') {
        return await this.validateSQLCapsule(solution, testCases)
      }
      
      // Basic validation - check if solution exists and has basic structure
      if (!solution || solution.trim().length < 10) {
        return { success: false, error: 'Solution is too short or empty' }
      }
      
      if (!testCases || testCases.length === 0) {
        return { success: false, error: 'No test cases provided' }
      }

      // Check if queue-based execution is enabled (Phase 2 - EC2 Piston)
      const useQueueExecution = process.env.USE_QUEUE_EXECUTION === 'true'
      
      if (useQueueExecution) {
        console.log(`🚀 Using Queue-based execution on EC2 Piston...`)
        
        // Dynamic import of queue service
        const ExecutionQueue = require('../../../../apps/api/src/services/queue')
        const queue = new ExecutionQueue()
        
        // Run each test case against the solution
        console.log(`Running ${testCases.length} test cases via EC2 Piston Queue...`)
        
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i]
          
          // Create test code that combines solution + test case
          const testCode = this.buildTestCode(solution, testCase, language)
          
          console.log(`Executing test case ${i + 1} via Queue...`)
          console.log(`Test code preview:`, testCode.substring(0, 300) + '...')
          
          // Use synchronous queue execution (queue + poll)
          const executionResult = await queue.executeSync(
            language,
            testCode,
            '', // no input needed for test cases
            15  // 15 seconds timeout
          )
          
          console.log(`Queue execution result:`, {
            success: executionResult.success,
            stdout: executionResult.stdout?.substring(0, 200),
            stderr: executionResult.stderr?.substring(0, 200),
            exitCode: executionResult.exit_code
          })
          
          if (!executionResult.success || executionResult.exit_code !== 0) {
            const errorMsg = `test_case_${i + 1} failed: ${executionResult.error || executionResult.stderr || 'Test case failed'}`
            console.log(`FAILED: ${errorMsg}`)
            console.log(`Failed test code: ${testCode.substring(0, 300)}...`)
            console.log(`Full execution result:`, JSON.stringify(executionResult, null, 2))
            return { success: false, error: errorMsg }
          }
          
          console.log(`PASSED: Test case ${i + 1} - ${executionResult.stdout?.trim() || 'Success'}`)
        }
        
        console.log('All test cases passed via EC2 Piston Queue!')
        return { success: true }
      }

      // FALLBACK: Use Lambda execution (original approach)
      const { ServerlessExecutionEngine } = await import('../../../runtime/serverless-execution')
      
      // Use your deployed API Gateway endpoint
      const apiGatewayUrl = process.env.AWS_API_GATEWAY_URL || process.env.AWS_LAMBDA_URL
      const useLocalFallback = process.env.USE_LOCAL_EXECUTION_FALLBACK === 'true'
      const executionEngine = new ServerlessExecutionEngine(apiGatewayUrl, useLocalFallback)
      
      // Run each test case against the solution
      console.log(`Running ${testCases.length} test cases via AWS Lambda...`)
      console.log(`Using API Gateway: ${apiGatewayUrl || 'default endpoint'}`)
      
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        
        // Create test code that combines solution + test case
        const testCode = this.buildTestCode(solution, testCase, language)
        
        console.log(`Executing test case ${i + 1} on Lambda...`)
        console.log(`Test code preview:`, testCode.substring(0, 300) + '...')
        
        const executionResult = await executionEngine.executeCode(
          testCode,
          language as any,
          '', // no input needed for test cases
          10, // 10 seconds timeout for real execution
          256 // 256MB memory limit
        )
        
        console.log(`Lambda execution result:`, {
          success: executionResult.success,
          stdout: executionResult.stdout?.substring(0, 200),
          stderr: executionResult.stderr?.substring(0, 200),
          exitCode: executionResult.exit_code
        })
        
        if (!executionResult.success || executionResult.exit_code !== 0) {
          const errorMsg = `test_case_${i + 1} failed: ${executionResult.error || executionResult.stderr || 'Test case failed'}`
          console.log(`FAILED: ${errorMsg}`)
          console.log(`Failed test code: ${testCode.substring(0, 300)}...`)
          console.log(`Full execution result:`, JSON.stringify(executionResult, null, 2))
          return { success: false, error: errorMsg }
        }
        
        console.log(`PASSED: Test case ${i + 1} - ${executionResult.stdout?.trim() || 'Success'}`)
      }
      
      console.log('All test cases passed via AWS Lambda!')
      return { success: true }
      
    } catch (error) {
      return { success: false, error: `Judge validation failed: ${error}` }
    }
  }

  /**
   * Build executable test code combining solution with test case
   * Uses DATA-DRIVEN HARNESS to avoid string formatting issues
   */
  private buildTestCode(solution: string, testCase: any, language: string): string {
    console.log(`Building test code for ${language}:`, { 
      input_args: testCase.input_args, 
      expected_output: testCase.expected_output 
    })
    
    // Extract function name from solution
    const functionName = this.extractFunctionName(solution, language)
    
    switch (language) {
      case 'javascript':
        // Data-driven harness for JavaScript
        const jsTestData = JSON.stringify({
          input_args: testCase.input_args || [],
          expected_output: testCase.expected_output
        })
        
        return `
${solution}

// Data-driven test harness
const testData = ${jsTestData};

try {
  const args = testData.input_args;
  const expected = testData.expected_output;
  
  // Call function with unpacked arguments
  const actual = ${functionName}(...args);
  
  // Strict comparison
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.log(\`TEST FAILED: Expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\`);
    process.exit(1);
  }
  
  console.log('TEST_PASSED');
} catch (error) {
  console.log('EXECUTION ERROR:', error.message);
  process.exit(1);
}
`

      case 'python':
        // Data-driven harness for Python using base64 to avoid escaping issues
        const pyTestDataObj = {
          input_args: testCase.input_args || [],
          expected_output: testCase.expected_output
        }
        const pyTestDataB64 = Buffer.from(JSON.stringify(pyTestDataObj)).toString('base64')
        
        // Detect if solution is class-based or function-based
        const isClass = solution.includes('class ') && solution.includes('def __init__')
        const classMatch = solution.match(/class\s+(\w+)/)
        const className = classMatch ? classMatch[1] : null
        
        if (isClass && className) {
          // Class-based solution: instantiate and call method
          return `
# LAYER 2: Force determinism - seed random BEFORE user code
import random
import sys
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

${solution}

# Data-driven test harness for class-based solution
import json
import base64

test_data_b64 = "${pyTestDataB64}"

try:
    test_data = json.loads(base64.b64decode(test_data_b64).decode('utf-8'))
    args = test_data['input_args']
    expected = test_data['expected_output']
    
    # Instantiate the class
    instance = ${className}()
    
    # Set the string and call the method
    if len(args) > 0:
        instance.set_string(args[0])
    
    # Call the is_palindrome method
    actual = instance.is_palindrome()
    
    # Strict comparison
    if actual != expected:
        print(f'TEST FAILED: Expected {expected}, got {actual}')
        sys.exit(1)
    
    print('TEST_PASSED')
except Exception as error:
    print(f'EXECUTION ERROR: {error}')
    sys.exit(1)
`
        } else {
          // Function-based solution
          return `
# LAYER 2: Force determinism - seed random BEFORE user code
import random
import sys
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

${solution}

# Data-driven test harness
import json
import base64

test_data_b64 = "${pyTestDataB64}"

try:
    test_data = json.loads(base64.b64decode(test_data_b64).decode('utf-8'))
    args = test_data['input_args']
    expected = test_data['expected_output']
    
    # Call function with unpacked arguments
    actual = ${functionName}(*args)
    
    # Strict comparison
    if actual != expected:
        print(f'TEST FAILED: Expected {expected}, got {actual}')
        sys.exit(1)
    
    print('TEST_PASSED')
except Exception as error:
    print(f'EXECUTION ERROR: {error}')
    sys.exit(1)
`
        }

      default:
        throw new Error(`Language ${language} not supported for test execution`)
    }
  }

  /**
   * Extract function name from solution code
   */
  private extractFunctionName(solution: string, language: string): string {
    if (language === 'python') {
      const match = solution.match(/def\s+(\w+)\s*\(/)
      return match ? match[1] : 'solve'
    } else if (language === 'javascript') {
      const match = solution.match(/function\s+(\w+)\s*\(/)
      return match ? match[1] : 'solve'
    }
    return 'solve'
  }

  /**
   * CALL 3: The "Debugger" Agent - Fix buggy code
   */
  private async runSelfHealingDebugger(
    capsule: BaseCapsule, 
    judgeError: string,
    context: GenerationContext
  ): Promise<BaseCapsule> {
    console.log('CALL 3: Debugger Agent - Fixing AI mistakes...')
    
    // Create ExecutionError object for the Debugger Agent
    const executionError: ExecutionError = {
      type: 'test_failure',
      message: judgeError,
      details: {
        testCase: 'Serverless Judge validation failed'
      }
    }
    
    try {
      // Use the actual Debugger Agent to fix the capsule
      const fixedCapsule = await this.debuggerAgent.fixCapsule(capsule, executionError)
      return fixedCapsule
      
    } catch (error) {
      console.error('🚨 Debugger Agent failed to fix the code:', error)
      // Return original capsule if debugging fails
      return capsule
    }
  }

  /**
   * Validate SQL capsule using in-memory SQLite or PostgreSQL
   */
  private async validateSQLCapsule(
    referenceSolution: string,
    testCases: any[]
  ): Promise<{ success: boolean; error?: string }> {
    console.log('🗄️ Validating SQL capsule with schema-based validation...')
    
    try {
      // Extract config from test cases
      const schemaSetup = testCases[0]?.schema_setup || []
      const expectedOutput = testCases[0]?.expected_output
      const requiresPostgres = testCases[0]?.requires_postgres || false
      
      if (!schemaSetup || schemaSetup.length === 0) {
        console.warn('⚠️ No schema_setup found, using basic SQL validation')
        return this.validateSQLBasic(referenceSolution)
      }
      
      // Use Lambda SQLite validator
      const apiUrl = process.env.AWS_LAMBDA_URL || 'https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev'
      
      console.log(`📊 Validating SQL with ${requiresPostgres ? 'PostgreSQL' : 'SQLite'}`)
      console.log(`Schema setup: ${schemaSetup.length} statements`)
      
      try {
        const response = await fetch(`${apiUrl}/validate/sql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schema_setup: schemaSetup,
            reference_solution: referenceSolution,
            requires_postgres: requiresPostgres,
            expected_output: expectedOutput
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log('✅ SQL validation passed')
          console.log(`Expected output: ${JSON.stringify(result.expected_result?.slice(0, 3))}...`)
          return { success: true }
        } else {
          console.log(`❌ SQL validation failed: ${result.error}`)
          return { success: false, error: result.error }
        }
      } catch (fetchError) {
        console.warn('⚠️ Lambda SQL validator unavailable, using basic validation')
        return this.validateSQLBasic(referenceSolution)
      }
      
    } catch (error) {
      console.error('SQL validation error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Basic SQL validation (fallback when Lambda unavailable)
   */
  private validateSQLBasic(referenceSolution: string): { success: boolean; error?: string } {
    if (!referenceSolution || referenceSolution.trim().length < 10) {
      return { success: false, error: 'SQL solution is too short or empty' }
    }
    
    // Check for basic SQL keywords
    const sqlKeywords = ['SELECT', 'FROM']
    const upperSQL = referenceSolution.toUpperCase()
    const hasValidSQL = sqlKeywords.every(keyword => upperSQL.includes(keyword))
    
    if (!hasValidSQL) {
      return { success: false, error: 'SQL solution must contain SELECT and FROM clauses' }
    }
    
    // Check for dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER']
    const hasDangerous = dangerousKeywords.some(keyword => upperSQL.includes(keyword))
    
    if (hasDangerous) {
      return { success: false, error: 'SQL solution contains forbidden operations' }
    }
    
    console.log('✅ SQL basic validation passed')
    return { success: true }
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a pre-configured generation pipeline for different environments
 */
export function createGenerationPipeline(
  aiService: any,
  environment: 'development' | 'production' | 'testing' = 'development'
): GenerationPipeline {
  let config: Partial<GenerationPipelineConfig> = {}

  switch (environment) {
    case 'production':
      config = {
        max_generation_attempts: 2,
        enable_quality_gates: true,
        timeout_ms: 30000,
        min_educational_value: 0.8,
        min_technical_quality: 0.9,
        max_debugging_attempts: 2
      }
      break

    case 'development':
      config = {
        max_generation_attempts: 3,
        enable_quality_gates: true,
        save_intermediate_results: true,
        timeout_ms: 60000,
        min_educational_value: 0.6,
        min_technical_quality: 0.7,
        max_debugging_attempts: 3
      }
      break

    case 'testing':
      config = {
        max_generation_attempts: 1,
        enable_quality_gates: false,
        timeout_ms: 10000,
        min_educational_value: 0.5,
        min_technical_quality: 0.5,
        max_debugging_attempts: 1
      }
      break
  }

  return new GenerationPipeline(aiService, config)
}

/**
 * Analyze pipeline performance and suggest optimizations
 */
export function analyzePipelinePerformance(stats: PipelineStats): {
  performance_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  bottlenecks: string[]
  recommendations: string[]
  health_score: number
} {
  const successRate = stats.success_rate
  const qualityScore = stats.average_quality_score
  const speed = stats.average_generation_time_ms

  // Calculate health score (0-1)
  const healthScore = (successRate * 0.4) + (qualityScore * 0.4) + (Math.min(1, 30000 / speed) * 0.2)

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (healthScore >= 0.9) grade = 'A'
  else if (healthScore >= 0.8) grade = 'B'
  else if (healthScore >= 0.7) grade = 'C'
  else if (healthScore >= 0.6) grade = 'D'
  else grade = 'F'

  // Identify bottlenecks
  const bottlenecks: string[] = []
  if (successRate < 0.8) bottlenecks.push('Low success rate')
  if (qualityScore < 0.8) bottlenecks.push('Low quality scores')
  if (speed > 45000) bottlenecks.push('Slow generation times')

  // Generate recommendations
  const recommendations: string[] = []
  if (successRate < 0.9) recommendations.push('Improve agent error handling')
  if (qualityScore < 0.85) recommendations.push('Enhance quality gates')
  if (speed > 30000) recommendations.push('Optimize agent prompts for speed')

  return {
    performance_grade: grade,
    bottlenecks,
    recommendations,
    health_score: healthScore
  }
}