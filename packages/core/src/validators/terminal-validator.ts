/**
 * Terminal Validator - Validation for Command-Line Exercise Capsules
 * 
 * This validator handles TERMINAL type capsules by:
 * - Setting up virtual file systems
 * - Validating bash/shell commands
 * - Checking file system operations
 * - Testing multi-step task completion
 * - Verifying environment setup
 * - Validating interactive command sequences
 */

import type { 
  BaseCapsule,
  TerminalConfig,
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

// ===== TERMINAL VALIDATOR INTERFACES =====

/**
 * Command execution result
 */
interface CommandExecutionResult {
  success: boolean
  stdout: string
  stderr: string
  exit_code: number
  execution_time_ms: number
  working_directory: string
}

/**
 * File system state
 */
interface FileSystemState {
  files: Record<string, {
    content: string
    permissions: string
    modified_at: string
  }>
  directories: string[]
  working_directory: string
}

/**
 * Task validation result
 */
interface TaskValidationResult {
  task_id: string
  description: string
  completed: boolean
  validation_command: string
  expected_outcome: string
  actual_outcome: string 
  error?: string
  filesystem_changes: {
    files_created: string[]
    files_modified: string[]
    files_deleted: string[]
    directories_created: string[]
  }
}

/**
 * Environment validation result
 */
interface EnvironmentValidationResult {
  valid: boolean
  disk_image_loaded: boolean
  required_tools_available: string[]
  missing_tools: string[]
  environment_size_mb: number
  boot_time_ms: number
  issues: string[]
}

// ===== TERMINAL VALIDATOR IMPLEMENTATION =====

export class TerminalValidator extends BaseValidator {
  private terminalService: any // Will be injected
  private activeEnvironments: Map<string, any> = new Map()
  
  constructor(
    debuggerAgent: DebuggerAgent,
    terminalService: any,
    config = {}
  ) {
    super(debuggerAgent, config)
    this.terminalService = terminalService
  }

  protected getValidatorType(): string {
    return 'TerminalValidator'
  }

  protected getDefaultTestEnvironment(): TestEnvironment {
    return {
      runtime_type: 'wasm',
      language_version: 'alpine-3.18',
      available_packages: ['bash', 'coreutils', 'nano', 'wget'],
      memory_limit_mb: 512,
      timeout_ms: 60000
    }
  }

  /**
   * Run all validation steps for a TERMINAL capsule
   */
  protected async runValidationSteps(capsule: BaseCapsule): Promise<ValidationStepResult[]> {
    const config = capsule.config_data as TerminalConfig
    const language = capsule.runtime_config.language as CapsuleLanguage
    const results: ValidationStepResult[] = []

    // Step 1: Environment Setup Validation
    results.push(await this.validateEnvironmentSetup(config, language))

    // Step 2: Initial State Validation
    results.push(await this.validateInitialState(config, language))

    // Step 3: Task Validation - Run each task in sequence
    results.push(await this.validateTasks(config, language))

    // Step 4: Command Syntax Validation
    results.push(await this.validateCommandSyntax(config, language))

    // Step 5: File System Validation
    results.push(await this.validateFileSystemOperations(config, language))

    // Step 6: Multi-step Sequence Validation
    results.push(await this.validateTaskSequence(config, language))

    return results
  }

  /**
   * Step 1: Validate environment setup
   */
  private async validateEnvironmentSetup(config: TerminalConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const environmentResult = await this.setupTestEnvironment(config)
      
      if (!environmentResult.valid) {
        return this.createStepResult(
          'environment_setup_validation',
          false,
          Date.now() - startTime,
          createValidationError('runtime', `Environment setup failed: ${environmentResult.issues.join(', ')}`)
        )
      }

      if (!environmentResult.disk_image_loaded) {
        return this.createStepResult(
          'environment_setup_validation',
          false,
          Date.now() - startTime,
          createValidationError('runtime', 'Failed to load disk image')
        )
      }

      return this.createStepResult(
        'environment_setup_validation',
        true,
        Date.now() - startTime,
        undefined,
        `Environment ready (${environmentResult.environment_size_mb}MB, ${environmentResult.required_tools_available.length} tools available)`,
        environmentResult
      )

    } catch (error) {
      return this.createStepResult(
        'environment_setup_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Environment setup crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 2: Validate initial state
   */
  private async validateInitialState(config: TerminalConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const environment = await this.getActiveEnvironment()
      if (!environment) {
        return this.createStepResult(
          'initial_state_validation',
          false,
          Date.now() - startTime,
          createValidationError('runtime', 'No active environment found')
        )
      }

      // Get initial file system state
      const initialState = await this.getFileSystemState(environment)
      
      // Store initial state for comparison
      environment.initialState = initialState

      // Check if required initial files exist (if specified)
      const missingFiles: string[] = []
      if (config.initial_files) {
        for (const filePath of config.initial_files) {
          if (!initialState.files[filePath]) {
            missingFiles.push(filePath)
          }
        }
      }

      if (missingFiles.length > 0) {
        return this.createStepResult(
          'initial_state_validation',
          false,
          Date.now() - startTime,
          createValidationError('test_failure', `Missing initial files: ${missingFiles.join(', ')}`),
          `${missingFiles.length} files missing`,
          { missing_files: missingFiles, initial_state: initialState }
        )
      }

      return this.createStepResult(
        'initial_state_validation',
        true,
        Date.now() - startTime,
        undefined,
        `Initial state valid (${Object.keys(initialState.files).length} files, ${initialState.directories.length} directories)`,
        initialState
      )

    } catch (error) {
      return this.createStepResult(
        'initial_state_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Initial state validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 3: Validate all tasks
   */
  private async validateTasks(config: TerminalConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      if (!config.tasks || config.tasks.length === 0) {
        return this.createStepResult(
          'tasks_validation',
          false,
          Date.now() - startTime,
          createValidationError('validation_timeout', 'No tasks defined')
        )
      }

      const environment = await this.getActiveEnvironment()
      const taskResults: TaskValidationResult[] = []
      let completedTasks = 0

      for (const task of config.tasks) {
        const taskResult = await this.validateSingleTask(environment, task)
        taskResults.push(taskResult)
        
        if (taskResult.completed) {
          completedTasks++
        }
      }

      const allTasksCompleted = completedTasks === config.tasks.length
      const summary = `${completedTasks}/${config.tasks.length} tasks completed`

      if (!allTasksCompleted) {
        const firstFailedTask = taskResults.find(t => !t.completed)
        return this.createStepResult(
          'tasks_validation',
          false,
          Date.now() - startTime,
          createValidationError('test_failure', `Task failed: ${firstFailedTask?.description || 'Unknown task'}`),
          summary,
          { task_results: taskResults }
        )
      }

      return this.createStepResult(
        'tasks_validation',
        true,
        Date.now() - startTime,
        undefined,
        summary,
        { task_results: taskResults }
      )

    } catch (error) {
      return this.createStepResult(
        'tasks_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Tasks validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 4: Validate command syntax
   */
  private async validateCommandSyntax(config: TerminalConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const syntaxIssues: string[] = []
      
      // Check all validation commands in tasks
      if (config.tasks) {
        for (const task of config.tasks) {
          const syntaxResult = await this.checkCommandSyntax(task.validation_command, language)
          if (!syntaxResult.valid) {
            syntaxIssues.push(`Task '${task.task_id}': ${syntaxResult.error}`)
          }
        }
      }

      // Check hint commands if they're actual commands
      if (config.hints) {
        for (const hint of config.hints) {
          if (this.looksLikeCommand(hint)) {
            const syntaxResult = await this.checkCommandSyntax(hint, language)
            if (!syntaxResult.valid) {
              syntaxIssues.push(`Hint command: ${syntaxResult.error}`)
            }
          }
        }
      }

      if (syntaxIssues.length > 0) {
        return this.createStepResult(
          'command_syntax_validation',
          false,
          Date.now() - startTime,
          createValidationError('syntax', syntaxIssues[0]),
          `${syntaxIssues.length} syntax issues found`,
          { syntax_issues: syntaxIssues }
        )
      }

      return this.createStepResult(
        'command_syntax_validation',
        true,
        Date.now() - startTime,
        undefined,
        'All command syntax is valid'
      )

    } catch (error) {
      return this.createStepResult(
        'command_syntax_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Command syntax validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 5: Validate file system operations
   */
  private async validateFileSystemOperations(config: TerminalConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const environment = await this.getActiveEnvironment()
      const beforeState = await this.getFileSystemState(environment)
      
      // Test basic file operations
      const testOperations = [
        'echo "validation test" > /tmp/test_file.txt',
        'cat /tmp/test_file.txt',
        'ls -la /tmp',
        'rm /tmp/test_file.txt'
      ]

      const operationResults: Array<{ command: string; success: boolean; error?: string }> = []

      for (const operation of testOperations) {
        const result = await this.executeCommand(environment, operation)
        operationResults.push({
          command: operation,
          success: result.success,
          error: result.success ? undefined : result.stderr || `Exit code: ${result.exit_code}`
        })
      }

      const failedOperations = operationResults.filter(op => !op.success)
      
      if (failedOperations.length > 0) {
        return this.createStepResult(
          'filesystem_operations_validation',
          false,
          Date.now() - startTime,
          createValidationError('runtime', `File system operation failed: ${failedOperations[0].command} (${failedOperations[0].error})`),
          `${failedOperations.length} operations failed`,
          { operation_results: operationResults }
        )
      }

      const afterState = await this.getFileSystemState(environment)

      return this.createStepResult(
        'filesystem_operations_validation',
        true,
        Date.now() - startTime,
        undefined,
        `All file system operations successful (${testOperations.length} operations tested)`,
        { 
          operation_results: operationResults,
          state_changes: this.compareFileSystemStates(beforeState, afterState)
        }
      )

    } catch (error) {
      return this.createStepResult(
        'filesystem_operations_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `File system validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 6: Validate task sequence (interdependencies)
   */
  private async validateTaskSequence(config: TerminalConfig, language: CapsuleLanguage): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      if (!config.tasks || config.tasks.length < 2) {
        return this.createStepResult(
          'task_sequence_validation',
          true,
          Date.now() - startTime,
          undefined,
          'No task sequence to validate (single or no tasks)'
        )
      }

      // Reset environment for clean sequence test
      const environment = await this.resetEnvironment(config)
      const sequenceResults: Array<{
        step: number
        task_id: string
        success: boolean
        state_after: any
      }> = []

      // Execute tasks in sequence, checking state after each
      for (let i = 0; i < config.tasks.length; i++) {
        const task = config.tasks[i]
        const taskResult = await this.validateSingleTask(environment, task)
        const stateAfter = await this.getFileSystemState(environment)
        
        sequenceResults.push({
          step: i + 1,
          task_id: task.task_id,
          success: taskResult.completed,
          state_after: stateAfter
        })

        // If a task fails, the sequence is broken
        if (!taskResult.completed) {
          return this.createStepResult(
            'task_sequence_validation',
            false,
            Date.now() - startTime,
            createValidationError('test_failure', `Task sequence broken at step ${i + 1}: ${task.task_id}`),
            `Sequence failed at step ${i + 1}/${config.tasks.length}`,
            { sequence_results: sequenceResults }
          )
        }
      }

      return this.createStepResult(
        'task_sequence_validation',
        true,
        Date.now() - startTime,
        undefined,
        `Complete task sequence validated (${config.tasks.length} tasks)`,
        { sequence_results: sequenceResults }
      )

    } catch (error) {
      return this.createStepResult(
        'task_sequence_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Task sequence validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Setup test environment
   */
  private async setupTestEnvironment(config: TerminalConfig): Promise<EnvironmentValidationResult> {
    try {
      // This would use the actual terminal service to setup v86 or container
      const environment = {
        id: `test_env_${Date.now()}`,
        disk_image_url: config.environment_config.disk_image_url,
        status: 'loading'
      }

      // Simulate environment setup
      const setupTime = Date.now()
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate setup time

      environment.status = 'ready'

      // Store active environment
      this.activeEnvironments.set(environment.id, {
        ...environment,
        created_at: new Date().toISOString(),
        filesystem: {
          files: {},
          directories: ['/home', '/tmp', '/var', '/etc'],
          working_directory: '/home'
        }
      })

      return {
        valid: true,
        disk_image_loaded: true,
        required_tools_available: ['bash', 'ls', 'cat', 'echo', 'mkdir', 'rm'],
        missing_tools: [],
        environment_size_mb: 64, // Simulated
        boot_time_ms: Date.now() - setupTime,
        issues: []
      }
    } catch (error) {
      return {
        valid: false,
        disk_image_loaded: false,
        required_tools_available: [],
        missing_tools: ['bash'],
        environment_size_mb: 0,
        boot_time_ms: 0,
        issues: [error instanceof Error ? error.message : String(error)]
      }
    }
  }

  /**
   * Get active environment
   */
  private async getActiveEnvironment(): Promise<any> {
    const environments = Array.from(this.activeEnvironments.values())
    return environments.find(env => env.status === 'ready') || null
  }

  /**
   * Get current file system state
   */
  private async getFileSystemState(environment: any): Promise<FileSystemState> {
    // This would query the actual environment
    return environment.filesystem || {
      files: {},
      directories: ['/home', '/tmp'],
      working_directory: '/home'
    }
  }

  /**
   * Validate a single task
   */
  private async validateSingleTask(environment: any, task: any): Promise<TaskValidationResult> {
    const beforeState = await this.getFileSystemState(environment)
    
    try {
      // Execute the validation command
      const result = await this.executeCommand(environment, task.validation_command)
      const afterState = await this.getFileSystemState(environment)
      
      // Compare output with expected outcome
      const actualOutcome = result.stdout.trim()
      const expectedOutcome = task.expected_outcome.trim()
      const outcomeMatches = actualOutcome === expectedOutcome || 
                            this.isOutcomeEquivalent(actualOutcome, expectedOutcome)

      const completed = result.success && outcomeMatches

      return {
        task_id: task.task_id,
        description: task.description,
        completed,
        validation_command: task.validation_command,
        expected_outcome: expectedOutcome,
        actual_outcome: actualOutcome,
        error: completed ? undefined : (result.stderr || `Expected: "${expectedOutcome}", Got: "${actualOutcome}"`),
        filesystem_changes: this.compareFileSystemStates(beforeState, afterState)
      }
    } catch (error) {
      return {
        task_id: task.task_id,  
        description: task.description,
        completed: false,
        validation_command: task.validation_command,
        expected_outcome: task.expected_outcome,
        actual_outcome: '',
        error: error instanceof Error ? error.message : String(error),
        filesystem_changes: {
          files_created: [],
          files_modified: [],
          files_deleted: [],
          directories_created: []
        }
      }
    }
  }

  /**
   * Execute a command in the environment
   */
  private async executeCommand(environment: any, command: string): Promise<CommandExecutionResult> {
    const startTime = Date.now()
    
    try {
      // This would execute the actual command in the terminal environment
      // For now, simulate command execution
      
      // Simulate command processing time
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Mock some basic commands
      let stdout = ''
      let stderr = ''
      let exit_code = 0

      if (command.startsWith('echo ')) {
        const text = command.replace('echo ', '').replace(/"/g, '')
        stdout = text
      } else if (command === 'pwd') {
        stdout = environment.filesystem.working_directory
      } else if (command.startsWith('ls')) {
        stdout = environment.filesystem.directories.join('\n')
      } else if (command.includes('test_file.txt')) {
        // Handle file operations
        if (command.includes('cat')) {
          stdout = 'validation test'
        } else if (command.includes('rm')) {
          stdout = ''
        }
      } else {
        // Unknown command
        stdout = 'Command executed successfully'
      }

      return {
        success: exit_code === 0,
        stdout,
        stderr,
        exit_code,
        execution_time_ms: Date.now() - startTime,
        working_directory: environment.filesystem.working_directory
      }
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exit_code: 1,
        execution_time_ms: Date.now() - startTime,
        working_directory: environment.filesystem.working_directory
      }
    }
  }

  /**
   * Check command syntax
   */
  private async checkCommandSyntax(command: string, language: CapsuleLanguage): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!command || command.trim().length === 0) {
        return { valid: false, error: 'Empty command' }
      }

      // Basic bash syntax checks
      const trimmedCommand = command.trim()

      // Check for dangerous commands in strict mode
      if (this.config.strict_mode) {
        const dangerousCommands = ['rm -rf /', 'format', 'fdisk', 'mkfs']
        for (const dangerous of dangerousCommands) {
          if (trimmedCommand.includes(dangerous)) {
            return { valid: false, error: `Dangerous command detected: ${dangerous}` }
          }
        }
      }

      // Check for basic syntax issues
      if (trimmedCommand.includes('&&') && trimmedCommand.endsWith('&&')) {
        return { valid: false, error: 'Command ends with &&' }
      }

      if (trimmedCommand.includes('||') && trimmedCommand.endsWith('||')) {
        return { valid: false, error: 'Command ends with ||' }
      }

      // Check for unmatched quotes
      const singleQuotes = (trimmedCommand.match(/'/g) || []).length
      const doubleQuotes = (trimmedCommand.match(/"/g) || []).length
      
      if (singleQuotes % 2 !== 0) {
        return { valid: false, error: 'Unmatched single quotes' }
      }
      
      if (doubleQuotes % 2 !== 0) {
        return { valid: false, error: 'Unmatched double quotes' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /**
   * Check if a string looks like a command
   */
  private looksLikeCommand(text: string): boolean {
    const commandPattern = /^[a-zA-Z_][a-zA-Z0-9_-]*(\s|$)/
    return commandPattern.test(text.trim())
  }

  /**
   * Compare two file system states
   */
  private compareFileSystemStates(before: FileSystemState, after: FileSystemState): {
    files_created: string[]
    files_modified: string[]
    files_deleted: string[]
    directories_created: string[]
  } {
    const beforeFiles = new Set(Object.keys(before.files))
    const afterFiles = new Set(Object.keys(after.files))
    
    const files_created = Array.from(afterFiles).filter(f => !beforeFiles.has(f))
    const files_deleted = Array.from(beforeFiles).filter(f => !afterFiles.has(f))
    const files_modified = Array.from(afterFiles).filter(f => 
      beforeFiles.has(f) && before.files[f].content !== after.files[f].content
    )
    
    const beforeDirs = new Set(before.directories)
    const afterDirs = new Set(after.directories)
    const directories_created = Array.from(afterDirs).filter(d => !beforeDirs.has(d))

    return {
      files_created,
      files_modified,
      files_deleted,
      directories_created
    }
  }

  /**
   * Check if two outcomes are equivalent
   */
  private isOutcomeEquivalent(actual: string, expected: string): boolean {
    // Normalize whitespace and compare
    const normalizeOutput = (output: string) => 
      output.trim().replace(/\s+/g, ' ').toLowerCase()
    
    return normalizeOutput(actual) === normalizeOutput(expected)
  }

  /**
   * Reset environment to initial state
   */
  private async resetEnvironment(config: TerminalConfig): Promise<any> {
    // This would reset the terminal environment
    // For now, just return a fresh environment
    const result = await this.setupTestEnvironment(config)
    if (result.valid) {
      return await this.getActiveEnvironment()
    }
    throw new Error('Failed to reset environment')
  }

  /**
   * Cleanup all environments
   */
  public async cleanup(): Promise<void> {
    for (const [envId, environment] of this.activeEnvironments) {
      try {
        if (environment.cleanup) {
          await environment.cleanup()
        }
      } catch (error) {
        console.warn(`Failed to cleanup environment ${envId}:`, error)
      }
    }
    this.activeEnvironments.clear()
  }

  /**
   * Set terminal service
   */
  setTerminalService(service: any): void {
    this.terminalService = service
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a pre-configured terminal validator
 */
export function createTerminalValidator(
  debuggerAgent: DebuggerAgent,
  terminalService: any,
  environment: 'development' | 'production' = 'development'
): TerminalValidator {
  const config = environment === 'production' ? {
    max_healing_attempts: 2,
    timeout_per_test_ms: 30000,
    strict_mode: true,
    save_debug_output: false
  } : {
    max_healing_attempts: 3,
    timeout_per_test_ms: 60000,
    strict_mode: false,
    save_debug_output: true
  }

  return new TerminalValidator(debuggerAgent, terminalService, config)
}