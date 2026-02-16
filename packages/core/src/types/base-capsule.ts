/**
 * BaseCapsule - AI-Native Unified Capsule Architecture
 * 
 * This is the production-ready, simplified interface that replaces
 * the complex nested structures with AI-optimized design.
 * 
 * Key Design Principles:
 * - AI-native: Easy for LLMs to generate consistently
 * - Type-specific config_data: Eliminates parsing complexity
 * - Validation-friendly: Clear structure for automated testing
 * - Performance-optimized: Minimal nesting for fast queries
 */

// ===== TYPE DEFINITIONS =====

export type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'

// ===== CORE BASE INTERFACE =====

export interface BaseCapsule {
  // Core identifiers
  id: string
  title: string
  capsule_type: "CODE" | "DATABASE" | "TERMINAL"
  
  // Educational content
  problem_statement_md: string  // Markdown-formatted problem description
  
  // Runtime configuration
  runtime_config: {
    language: string           // 'python', 'sql', 'bash'
    runtime_tier: string       // 'wasm-python', 'server-sql', 'wasm-linux'
    dialect?: string           // For DATABASE capsules: 'postgresql', 'mysql', etc.
  }
  
  // Type-specific configuration (the key innovation)
  config_data: CodeConfig | DatabaseConfig | TerminalConfig
  
  // Metadata
  creator_id: string
  created_at: string
  updated_at?: string
}

// ===== TYPE-SPECIFIC CONFIGURATIONS =====

/**
 * CODE Capsules - Optimized for Automated Grading
 * 
 * Design Goals:
 * - Clear separation of boilerplate vs solution
 * - Testable with automated validation
 * - Hint system for progressive learning
 */
export interface CodeConfig {
  boilerplate_code: string      // Starting code for learner
  reference_solution: string    // Complete working solution
  hints: string[]               // Array of progressive hints
  
  test_cases: Array<{
    description: string         // "Test with empty list"
    input_args: any[]          // Arguments as JSON array: [1, 2] or [[1,2,3]] or ["hello"]
    expected_output: any       // Expected return value (not string, raw JSON value)
    is_hidden: boolean         // Hide from learner initially
  }>
}

/**
 * DATABASE Capsules - Optimized for Data Explorer
 * 
 * Design Goals:
 * - Schema visualization in UI
 * - Seedable test databases
 * - Query validation against real data
 */
export interface DatabaseConfig {
  boilerplate_code: string      // Starting SQL query
  reference_solution: string    // Complete working query
  hints: string[]               // SQL-specific hints
  
  schema_info: Array<{          // For UI display
    table_name: string
    columns: string[]           // ["id (INT PRIMARY KEY)", "name (VARCHAR(100))"]
  }>
  
  seed_sql_url: string          // URL to SQL file for database setup
  
  // Validation-specific properties
  schema_setup: string[]        // SQL statements to create schema
  test_data_setup: string[]     // SQL statements to insert test data  
  expected_result: any[]        // Expected query result for validation
}

/**
 * TERMINAL Capsules - Optimized for Interactive Quests
 * 
 * Design Goals:
 * - v86-compatible environments
 * - Multi-step task validation
 * - File system based challenges
 */
export interface TerminalConfig {
  environment_config: {
    disk_image_url: string      // "https://r2.devleep.com/images/alpine-v1.img"
  }
  
  hints: string[]               // Command hints
  
  tasks: Array<{
    task_id: string             // "create_hello_file"
    description: string         // "Create a file called hello.txt in your home directory"
    validation_command: string  // "test -f ~/hello.txt && echo 'File exists' || echo 'File missing'"
    expected_outcome: string    // "File exists"
  }>
  
  // Optional initial file setup
  initial_files?: string[]      // Files that should exist before tasks start
}

// ===== GENERATION CONTEXT =====

/**
 * Context provided to AI agents during generation
 */
export interface GenerationContext {
  type: "CODE" | "DATABASE" | "TERMINAL"
  language: string
  difficulty: "easy" | "medium" | "hard"
  userPrompt: string
  
  // Optional context for better generation
  targetAudience?: "beginner" | "intermediate" | "advanced"
  estimatedTime?: number        // minutes
  prerequisites?: string[]
}

/**
 * Result from AI generation before validation
 */
export interface GenerationResult {
  capsule: BaseCapsule
  confidence: number            // 0-1 score from AI
  generationTime: number        // milliseconds
  agentChain: string[]          // ["pedagogist", "coder", "debugger"]
}

// ===== VALIDATION INTERFACES =====

/**
 * Result from validation pipeline
 */
export interface ValidationResult {
  isValid: boolean
  capsule: BaseCapsule          // Potentially healed version
  validationSteps: Array<{
    validator: string           // "CodeValidator"
    passed: boolean
    errors?: string[]
    healingAttempts?: number
  }>
  qualityScore: number          // 0-1 overall quality
}

/**
 * Error during capsule execution/validation
 */
export interface ExecutionError {
  type: 'syntax' | 'runtime' | 'test_failure' | 'validation_timeout'
  message: string
  details?: {
    line?: number
    column?: number
    testCase?: string
    stackTrace?: string
  }
}

// ===== HELPER TYPES =====

export type CapsuleLanguage = 
  | 'python' 
  | 'javascript' 
  | 'java' 
  | 'sql'
  | 'bash'
  | 'go'
  | 'csharp'

export type CapsuleDifficulty = 'easy' | 'medium' | 'hard'

export type CapsuleType = 'CODE' | 'DATABASE' | 'TERMINAL'

export type RuntimeTier = 
  | 'wasm-python'     // WASM Python for CODE capsules
  | 'wasm-javascript' // WASM JS for CODE capsules  
  | 'server-sql'      // Server-side SQL for DATABASE capsules
  | 'wasm-linux'      // WASM Linux for TERMINAL capsules
  | 'server-java'     // Server-side Java for CODE capsules
  | 'server-go'       // Server-side Go for CODE capsules
  | 'server-csharp'   // Server-side C# for CODE capsules

// ===== TYPE GUARDS =====

export function isCodeConfig(config: CodeConfig | DatabaseConfig | TerminalConfig): config is CodeConfig {
  return 'boilerplate_code' in config && 'test_cases' in config
}

export function isDatabaseConfig(config: CodeConfig | DatabaseConfig | TerminalConfig): config is DatabaseConfig {
  return 'schema_info' in config && 'seed_sql_url' in config
}

export function isTerminalConfig(config: CodeConfig | DatabaseConfig | TerminalConfig): config is TerminalConfig {
  return 'environment_config' in config && 'tasks' in config
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get the appropriate runtime tier for a language/type combination
 */
export function getDefaultRuntimeTier(language: CapsuleLanguage, type: CapsuleType): RuntimeTier {
  if (type === 'DATABASE') return 'server-sql'
  if (type === 'TERMINAL') return 'wasm-linux'
  
  // CODE type mapping
  switch (language) {
    case 'python': return 'wasm-python'
    case 'javascript': return 'wasm-javascript'
    case 'java': return 'server-java'
    case 'go': return 'server-go'
    case 'csharp': return 'server-csharp'
    default: return 'wasm-python' // fallback
  }
}

/**
 * Create a basic BaseCapsule structure with required fields
 */
export function createBaseCapsuleTemplate(
  type: CapsuleType, 
  language: CapsuleLanguage
): Partial<BaseCapsule> {
  return {
    capsule_type: type,
    runtime_config: {
      language,
      runtime_tier: getDefaultRuntimeTier(language, type)
    },
    created_at: new Date().toISOString()
  }
}