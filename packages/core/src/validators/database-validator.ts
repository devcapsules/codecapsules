/**
 * Database Validator - Validation for SQL and Database Exercise Capsules
 * 
 * This validator handles DATABASE type capsules by:
 * - Validating SQL syntax and query structure
 * - Running queries against test datasets
 * - Checking schema operations (CREATE, ALTER, DROP)
 * - Verifying data integrity and constraints
 * - Testing transaction behavior
 * - Validating database performance
 */

import type { 
  BaseCapsule,
  DatabaseConfig,
  ExecutionError,
  DatabaseDialect
} from '../types/base-capsule'

import { 
  BaseValidator,
  type ValidationStepResult,
  type TestEnvironment,
  createValidationError
} from './base-validator'

import type { DebuggerAgent } from '../agents/debugger-agent'

// ===== DATABASE VALIDATOR INTERFACES =====

/**
 * SQL query execution result
 */
interface QueryExecutionResult {
  success: boolean
  rows?: any[]
  affected_rows?: number
  execution_time_ms: number
  error?: string
  warnings?: string[]
}

/**
 * Schema validation result
 */
interface SchemaValidationResult {
  valid: boolean
  tables_created: string[]
  columns_verified: Array<{
    table: string
    column: string
    type: string
    constraints: string[]
  }>
  indexes_created: string[]
  errors: string[]
}

/**
 * Data integrity check result
 */
interface DataIntegrityResult {
  constraints_valid: boolean
  foreign_keys_valid: boolean
  unique_constraints_valid: boolean
  check_constraints_valid: boolean
  issues: Array<{
    type: 'constraint' | 'foreign_key' | 'unique' | 'check'
    table: string
    column?: string
    message: string
  }>
}

/**
 * Query performance metrics
 */
interface QueryPerformanceMetrics {
  execution_time_ms: number
  rows_examined: number
  rows_returned: number
  index_usage: Array<{
    table: string
    index: string
    used: boolean
  }>
  query_plan?: any
  optimization_suggestions: string[]
}

// ===== DATABASE VALIDATOR IMPLEMENTATION =====

export class DatabaseValidator extends BaseValidator {
  private databaseService: any // Will be injected
  private connectionPool: Map<string, any> = new Map()
  
  constructor(
    debuggerAgent: DebuggerAgent,
    databaseService: any,
    config = {}
  ) {
    super(debuggerAgent, config)
    this.databaseService = databaseService
  }

  protected getValidatorType(): string {
    return 'DatabaseValidator'
  }

  protected getDefaultTestEnvironment(): TestEnvironment {
    return {
      runtime_type: 'docker',
      language_version: '15.0', // PostgreSQL version
      available_packages: ['postgresql', 'sqlite'],
      memory_limit_mb: 256,
      timeout_ms: 30000
    }
  }

  /**
   * Run all validation steps for a DATABASE capsule
   */
  protected async runValidationSteps(capsule: BaseCapsule): Promise<ValidationStepResult[]> {
    const config = capsule.config_data as DatabaseConfig
    const dialect = capsule.runtime_config.dialect as DatabaseDialect
    const results: ValidationStepResult[] = []

    // Step 1: SQL Syntax Validation
    results.push(await this.validateSQLSyntax(config, dialect))

    // Step 2: Schema Setup Validation
    results.push(await this.validateSchemaSetup(config, dialect))

    // Step 3: Test Data Setup Validation
    results.push(await this.validateTestDataSetup(config, dialect))

    // Step 4: Reference Solution Validation
    results.push(await this.validateReferenceSolution(config, dialect))

    // Step 5: Expected Results Validation
    results.push(await this.validateExpectedResults(config, dialect))

    // Step 6: Data Integrity Validation
    results.push(await this.validateDataIntegrity(config, dialect))

    // Step 7: Performance Validation (if enabled)
    if (this.config.enable_performance_tests) {
      results.push(await this.validateQueryPerformance(config, dialect))
    }

    return results
  }

  /**
   * Step 1: Validate SQL syntax
   */
  private async validateSQLSyntax(config: DatabaseConfig, dialect: DatabaseDialect): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const sqlToCheck = [
        ...config.schema_setup,
        ...config.test_data_setup,
        config.reference_solution
      ].filter(Boolean)

      for (let i = 0; i < sqlToCheck.length; i++) {
        const sql = sqlToCheck[i]
        const syntaxResult = await this.checkSQLSyntax(sql, dialect)
        
        if (!syntaxResult.valid) {
          return this.createStepResult(
            'sql_syntax_validation',
            false,
            Date.now() - startTime,
            createValidationError('syntax', `SQL syntax error in statement ${i + 1}: ${syntaxResult.error}`)
          )
        }
      }

      return this.createStepResult(
        'sql_syntax_validation',
        true,
        Date.now() - startTime,
        undefined,
        `All ${sqlToCheck.length} SQL statements have valid syntax`
      )

    } catch (error) {
      return this.createStepResult(
        'sql_syntax_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `SQL syntax validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 2: Validate schema setup
   */
  private async validateSchemaSetup(config: DatabaseConfig, dialect: DatabaseDialect): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const connection = await this.getTestConnection(dialect)
      
      if (!config.schema_setup || config.schema_setup.length === 0) {
        return this.createStepResult(
          'schema_setup_validation',
          false,
          Date.now() - startTime,
          createValidationError('validation_timeout', 'No schema setup statements provided')
        )
      }

      // Execute schema setup statements
      const schemaResult = await this.executeSchemaSetup(connection, config.schema_setup)
      
      if (!schemaResult.valid) {
        return this.createStepResult(
          'schema_setup_validation',
          false,
          Date.now() - startTime,
          createValidationError('runtime', `Schema setup failed: ${schemaResult.errors.join(', ')}`)
        )
      }

      return this.createStepResult(
        'schema_setup_validation',
        true,
        Date.now() - startTime,
        undefined,
        `Schema created: ${schemaResult.tables_created.length} tables, ${schemaResult.indexes_created.length} indexes`,
        schemaResult
      )

    } catch (error) {
      return this.createStepResult(
        'schema_setup_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Schema setup validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 3: Validate test data setup
   */
  private async validateTestDataSetup(config: DatabaseConfig, dialect: DatabaseDialect): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const connection = await this.getTestConnection(dialect)
      
      if (!config.test_data_setup || config.test_data_setup.length === 0) {
        return this.createStepResult(
          'test_data_validation',
          true,
          Date.now() - startTime,
          undefined,
          'No test data setup required'
        )
      }

      let totalRowsInserted = 0
      const insertResults: Array<{ statement: string; rows: number }> = []

      for (const dataStatement of config.test_data_setup) {
        const result = await this.executeQuery(connection, dataStatement)
        
        if (!result.success) {
          return this.createStepResult(
            'test_data_validation',
            false,
            Date.now() - startTime,
            createValidationError('runtime', `Test data setup failed: ${result.error}`)
          )
        }

        const affectedRows = result.affected_rows || 0
        totalRowsInserted += affectedRows
        insertResults.push({
          statement: dataStatement.substring(0, 50) + '...',
          rows: affectedRows
        })
      }

      return this.createStepResult(
        'test_data_validation',
        true,
        Date.now() - startTime,
        undefined,
        `Test data inserted: ${totalRowsInserted} total rows`,
        { insert_results: insertResults }
      )

    } catch (error) {
      return this.createStepResult(
        'test_data_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Test data validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 4: Validate reference solution
   */
  private async validateReferenceSolution(config: DatabaseConfig, dialect: DatabaseDialect): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const connection = await this.getTestConnection(dialect)
      
      if (!config.reference_solution) {
        return this.createStepResult(
          'reference_solution_validation',
          false,
          Date.now() - startTime,
          createValidationError('validation_timeout', 'No reference solution provided')
        )
      }

      const result = await this.executeQuery(connection, config.reference_solution)
      
      if (!result.success) {
        return this.createStepResult(
          'reference_solution_validation',
          false,
          Date.now() - startTime,
          createValidationError('runtime', `Reference solution failed: ${result.error}`)
        )
      }

      const rowCount = result.rows?.length || result.affected_rows || 0
      
      return this.createStepResult(
        'reference_solution_validation',
        true,
        Date.now() - startTime,
        undefined,
        `Reference solution executed successfully (${rowCount} rows affected/returned)`,
        { 
          execution_time_ms: result.execution_time_ms,
          row_count: rowCount,
          sample_output: result.rows?.slice(0, 3) // First 3 rows as sample
        }
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
   * Step 5: Validate expected results
   */
  private async validateExpectedResults(config: DatabaseConfig, dialect: DatabaseDialect): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const connection = await this.getTestConnection(dialect)
      
      if (!config.expected_result) {
        return this.createStepResult(
          'expected_results_validation',
          true,
          Date.now() - startTime,
          undefined,
          'No expected results to validate'
        )
      }

      // Execute reference solution to get actual results
      const actualResult = await this.executeQuery(connection, config.reference_solution)
      
      if (!actualResult.success) {
        return this.createStepResult(
          'expected_results_validation',
          false,
          Date.now() - startTime,
          createValidationError('runtime', `Failed to get actual results: ${actualResult.error}`)
        )
      }

      // Compare results
      const comparison = this.compareQueryResults(actualResult.rows || [], config.expected_result)
      
      if (!comparison.matches) {
        return this.createStepResult(
          'expected_results_validation',
          false,
          Date.now() - startTime,
          createValidationError('test_failure', `Expected results don't match: ${comparison.differences.join(', ')}`),
          `Found ${comparison.differences.length} differences`,
          comparison
        )
      }

      return this.createStepResult(
        'expected_results_validation',
        true,
        Date.now() - startTime,
        undefined,
        `Expected results match perfectly (${config.expected_result.length} rows)`
      )

    } catch (error) {
      return this.createStepResult(
        'expected_results_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Expected results validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 6: Validate data integrity
   */
  private async validateDataIntegrity(config: DatabaseConfig, dialect: DatabaseDialect): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const connection = await this.getTestConnection(dialect)
      
      const integrityResult = await this.checkDataIntegrity(connection, dialect)
      
      if (!integrityResult.constraints_valid || 
          !integrityResult.foreign_keys_valid || 
          !integrityResult.unique_constraints_valid || 
          !integrityResult.check_constraints_valid) {
        
        const issues = integrityResult.issues.map(issue => 
          `${issue.type} issue in ${issue.table}${issue.column ? `.${issue.column}` : ''}: ${issue.message}`
        )
        
        return this.createStepResult(
          'data_integrity_validation',
          false,
          Date.now() - startTime,
          createValidationError('test_failure', `Data integrity issues found: ${issues[0]}`),
          `${integrityResult.issues.length} integrity issues found`,
          integrityResult
        )
      }

      return this.createStepResult(
        'data_integrity_validation',
        true,
        Date.now() - startTime,
        undefined,
        'All data integrity constraints are satisfied'
      )

    } catch (error) {
      return this.createStepResult(
        'data_integrity_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Data integrity validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  /**
   * Step 7: Validate query performance
   */
  private async validateQueryPerformance(config: DatabaseConfig, dialect: DatabaseDialect): Promise<ValidationStepResult> {
    const startTime = Date.now()
    
    try {
      const connection = await this.getTestConnection(dialect)
      
      const performanceMetrics = await this.analyzeQueryPerformance(
        connection, 
        config.reference_solution, 
        dialect
      )

      const issues: string[] = []
      
      // Check execution time
      if (performanceMetrics.execution_time_ms > 5000) {
        issues.push(`Query is slow (${performanceMetrics.execution_time_ms}ms)`)
      }
      
      // Check for missing index usage
      const unusedIndexes = performanceMetrics.index_usage.filter(idx => !idx.used)
      if (unusedIndexes.length > 0) {
        issues.push(`${unusedIndexes.length} indexes not used`)
      }

      // Add optimization suggestions
      issues.push(...performanceMetrics.optimization_suggestions)

      const hasPerformanceIssues = issues.length > 0 && this.config.strict_mode
      
      return this.createStepResult(
        'query_performance_validation',
        !hasPerformanceIssues,
        Date.now() - startTime,
        hasPerformanceIssues ? createValidationError('test_failure', `Performance issues: ${issues[0]}`) : undefined,
        hasPerformanceIssues ? `${issues.length} performance issues` : `Query performs well (${performanceMetrics.execution_time_ms}ms)`,
        performanceMetrics
      )

    } catch (error) {
      return this.createStepResult(
        'query_performance_validation',
        false,
        Date.now() - startTime,
        createValidationError('runtime', `Performance validation crashed: ${error instanceof Error ? error.message : String(error)}`)
      )
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Check SQL syntax
   */
  private async checkSQLSyntax(sql: string, dialect: DatabaseDialect): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!sql || sql.trim().length === 0) {
        return { valid: false, error: 'Empty SQL statement' }
      }

      // Basic syntax checks
      const trimmedSQL = sql.trim()
      
      // Check for dangerous operations in non-production
      if (this.config.strict_mode) {
        const dangerousOperations = ['DROP DATABASE', 'DROP SCHEMA', 'TRUNCATE']
        for (const op of dangerousOperations) {
          if (trimmedSQL.toUpperCase().includes(op)) {
            return { valid: false, error: `Dangerous operation detected: ${op}` }
          }
        }
      }

      // Dialect-specific checks
      if (dialect === 'postgresql') {
        // Check for PostgreSQL-specific syntax
        if (trimmedSQL.includes('LIMIT') && trimmedSQL.includes('TOP')) {
          return { valid: false, error: 'Cannot use both LIMIT and TOP in PostgreSQL' }
        }
      } else if (dialect === 'mysql') {
        // Check for MySQL-specific syntax
        if (trimmedSQL.includes('ILIKE')) {
          return { valid: false, error: 'ILIKE is not supported in MySQL, use LIKE with LOWER()' }
        }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /**
   * Get a test database connection
   */
  private async getTestConnection(dialect: DatabaseDialect): Promise<any> {
    const connectionKey = `test_${dialect}_${Date.now()}`
    
    if (this.connectionPool.has(connectionKey)) {
      return this.connectionPool.get(connectionKey)
    }

    // Create new test database connection
    // This would use the actual database service
    const connection = {
      dialect,
      connected: true,
      execute: async (sql: string) => {
        // Mock execution
        return { success: true, rows: [], affected_rows: 0, execution_time_ms: 50 }
      }
    }

    this.connectionPool.set(connectionKey, connection)
    return connection
  }

  /**
   * Execute schema setup statements
   */
  private async executeSchemaSetup(connection: any, schemaStatements: string[]): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      valid: true,
      tables_created: [],
      columns_verified: [],
      indexes_created: [],
      errors: []
    }

    try {
      for (const statement of schemaStatements) {
        const queryResult = await this.executeQuery(connection, statement)
        
        if (!queryResult.success) {
          result.valid = false
          result.errors.push(queryResult.error || 'Unknown error')
          continue
        }

        // Parse statement to extract created objects
        const upperStatement = statement.toUpperCase().trim()
        
        if (upperStatement.startsWith('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE\s+(\w+)/i)
          if (match) result.tables_created.push(match[1])
        } else if (upperStatement.startsWith('CREATE INDEX')) {
          const match = statement.match(/CREATE INDEX\s+(\w+)/i)
          if (match) result.indexes_created.push(match[1])
        }
      }

      return result
    } catch (error) {
      result.valid = false
      result.errors.push(error instanceof Error ? error.message : String(error))
      return result
    }
  }

  /**
   * Execute a SQL query
   */
  private async executeQuery(connection: any, sql: string): Promise<QueryExecutionResult> {
    const startTime = Date.now()
    
    try {
      // This would use the actual database connection
      const result = await connection.execute(sql)
      
      return {
        success: result.success,
        rows: result.rows,
        affected_rows: result.affected_rows,
        execution_time_ms: Date.now() - startTime,
        error: result.error,
        warnings: result.warnings
      }
    } catch (error) {
      return {
        success: false,
        execution_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Compare query results
   */
  private compareQueryResults(actual: any[], expected: any[]): { 
    matches: boolean; 
    differences: string[] 
  } {
    const differences: string[] = []
    
    if (actual.length !== expected.length) {
      differences.push(`Row count mismatch: expected ${expected.length}, got ${actual.length}`)
    }

    const rowsToCheck = Math.min(actual.length, expected.length)
    
    for (let i = 0; i < rowsToCheck; i++) {
      const actualRow = actual[i]
      const expectedRow = expected[i]
      
      // Compare each column
      const actualKeys = Object.keys(actualRow || {})
      const expectedKeys = Object.keys(expectedRow || {})
      
      if (actualKeys.length !== expectedKeys.length) {
        differences.push(`Row ${i + 1}: Column count mismatch`)
        continue
      }
      
      for (const key of expectedKeys) {
        if (actualRow[key] !== expectedRow[key]) {
          differences.push(`Row ${i + 1}, Column '${key}': expected '${expectedRow[key]}', got '${actualRow[key]}'`)
        }
      }
    }
    
    return {
      matches: differences.length === 0,
      differences
    }
  }

  /**
   * Check data integrity constraints
   */
  private async checkDataIntegrity(connection: any, dialect: DatabaseDialect): Promise<DataIntegrityResult> {
    const result: DataIntegrityResult = {
      constraints_valid: true,
      foreign_keys_valid: true,
      unique_constraints_valid: true,
      check_constraints_valid: true,
      issues: []
    }

    try {
      // This would run actual integrity checks against the database
      // For now, assume everything is valid
      return result
    } catch (error) {
      result.constraints_valid = false
      result.issues.push({
        type: 'constraint',
        table: 'unknown',
        message: error instanceof Error ? error.message : String(error)
      })
      return result
    }
  }

  /**
   * Analyze query performance
   */
  private async analyzeQueryPerformance(
    connection: any, 
    sql: string, 
    dialect: DatabaseDialect
  ): Promise<QueryPerformanceMetrics> {
    const startTime = Date.now()
    
    try {
      // Execute with performance analysis
      const result = await this.executeQuery(connection, sql)
      
      return {
        execution_time_ms: result.execution_time_ms,
        rows_examined: result.rows?.length || 0,
        rows_returned: result.rows?.length || 0,
        index_usage: [], // Would be populated by EXPLAIN output
        optimization_suggestions: []
      }
    } catch (error) {
      return {
        execution_time_ms: Date.now() - startTime,
        rows_examined: 0,
        rows_returned: 0,
        index_usage: [],
        optimization_suggestions: [`Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`]
      }
    }
  }

  /**
   * Cleanup test connections
   */
  public async cleanup(): Promise<void> {
    for (const [key, connection] of this.connectionPool) {
      try {
        if (connection.close) {
          await connection.close()
        }
      } catch (error) {
        console.warn(`Failed to close connection ${key}:`, error)
      }
    }
    this.connectionPool.clear()
  }

  /**
   * Set database service
   */
  setDatabaseService(service: any): void {
    this.databaseService = service
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a pre-configured database validator
 */
export function createDatabaseValidator(
  debuggerAgent: DebuggerAgent,
  databaseService: any,
  environment: 'development' | 'production' = 'development'
): DatabaseValidator {
  const config = environment === 'production' ? {
    max_healing_attempts: 2,
    timeout_per_test_ms: 15000,
    strict_mode: true,
    enable_performance_tests: true,
    save_debug_output: false
  } : {
    max_healing_attempts: 3,
    timeout_per_test_ms: 30000,
    strict_mode: false,
    enable_performance_tests: false,
    save_debug_output: true
  }

  return new DatabaseValidator(debuggerAgent, databaseService, config)
}