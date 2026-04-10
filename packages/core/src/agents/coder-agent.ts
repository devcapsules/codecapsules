/**
 * Coder Agent - Implementation Specialist
 * 
 * This agent takes educational ideas from the Pedagogist Agent and implements
 * them as complete, working BaseCapsules. It focuses on technical correctness,
 * proper JSON structure, and type-specific implementation details.
 * 
 * Key Responsibilities:
 * - Convert pedagogical ideas into working code
 * - Generate appropriate test cases and validation
 * - Ensure proper BaseCapsule JSON structure
 * - Create type-specific configurations (CODE, DATABASE, TERMINAL)
 */

import type { 
  BaseCapsule,
  CodeConfig,
  DatabaseConfig,
  TerminalConfig,
  GenerationContext,
  CapsuleLanguage,
  CapsuleType,
  RuntimeTier
} from '../types/base-capsule'

import { 
  getDefaultRuntimeTier,
  createBaseCapsuleTemplate
} from '../types/base-capsule'

import type { CapsuleIdea } from './pedagogist-agent'
import { isDataAnalysisContext, buildDatasetCatalogPrompt } from '../datasets/universal-datasets'

// ===== CODER INTERFACES =====

/**
 * Implementation plan created by the Coder
 */
export interface ImplementationPlan {
  approach: string
  key_components: string[]
  technical_considerations: string[]
  testing_strategy: string
  potential_challenges: string[]
}

/**
 * Code generation result before final capsule assembly
 */
export interface CodeGenerationResult {
  boilerplate_code: string
  reference_solution: string
  test_cases: any[]
  hints: string[]
  implementation_notes: string
}

/**
 * Configuration for coder behavior
 */
export interface CoderConfig {
  code_style: 'beginner_friendly' | 'idiomatic' | 'enterprise'
  comment_level: 'minimal' | 'moderate' | 'extensive'
  include_imports: boolean
  prefer_explicit: boolean  // Explicit over implicit code
  add_error_handling: boolean
}

// ===== CODER AGENT IMPLEMENTATION =====

export class CoderAgent {
  private config: CoderConfig
  private aiService: any // Will be injected

  constructor(config: Partial<CoderConfig> = {}) {
    this.config = {
      code_style: 'idiomatic',
      comment_level: 'moderate',
      include_imports: true,
      prefer_explicit: true,
      add_error_handling: true,
      ...config
    }
  }

  /**
   * CALL 2: The "Coder" Agent - Generate complete, clean JSON
   * Job: Take the exact idea and create full BaseCapsule JSON with all components
   */
  async implementCapsule(
    idea: CapsuleIdea,
    context: GenerationContext
  ): Promise<BaseCapsule> {
    const difficultySpec = this.getImplementationDifficultySpec(context.difficulty)
    const testSpec = this.getTestDistributionSpec(context.difficulty)

    // Inject universal dataset catalog for data analysis capsules
    const datasetBlock = isDataAnalysisContext(context.language, context.userPrompt, context.capsuleMode)
      ? `\n${buildDatasetCatalogPrompt()}\n`
      : ''

    const prompt = `You are a senior software engineer. Take this exact problem idea:

IDEA: "${idea.title}"
DESCRIPTION: "${idea.description}"
LANGUAGE: ${context.language}
TYPE: ${context.type}
DIFFICULTY: ${context.difficulty}

=== DIFFICULTY ENFORCEMENT ===
${difficultySpec}
=== END DIFFICULTY ENFORCEMENT ===

=== CAPSULE MODE: ${(context.capsuleMode || 'standard').toUpperCase()} ===
${this.getModeCodeSpec(context.capsuleMode || 'standard')}
=== END CAPSULE MODE ===

=== TEST CASE DISTRIBUTION (MANDATORY) ===
${testSpec}
=== END TEST CASE DISTRIBUTION ===${datasetBlock}

Generate the complete BaseCapsule JSON for it. Include:
- problem_statement (markdown format)
- boilerplate_code (${(context.capsuleMode || 'standard') === 'standard' ? 'starter code for students — follow boilerplate depth above' : context.capsuleMode === 'testing' ? 'COMPLETE working function + empty test function skeleton' : 'the FULL flawed/buggy/vulnerable code the learner must fix'})
- reference_solution (${(context.capsuleMode || 'standard') === 'standard' ? 'complete working solution' : context.capsuleMode === 'testing' ? 'same working function + comprehensive test assertions' : 'the CORRECTLY FIXED version of the boilerplate code'})
- test_cases (follow the EXACT test distribution above — count and visibility MUST match)
- hints (2 helpful hints)

=== LAYER 3: MANDATORY CODE STRUCTURE (LeetCode Pattern) ===
Your code MUST follow this pattern for testability:

1. NEVER use input() or raw_input() - code must be testable without user interaction
2. NEVER use random without seeding - use deterministic values or accept seed as parameter
3. ALWAYS create a pure function that accepts arguments and returns a value
4. DO NOT use print() for logic - only for optional output wrapper

REQUIRED STRUCTURE FOR PYTHON:
def solution(arg1, arg2, ...):
    # All logic here
    return result

# Optional: wrapper for learner testing
if __name__ == "__main__":
    print(solution(...))

REQUIRED STRUCTURE FOR JAVASCRIPT:
function solution(arg1, arg2) {
    // All logic here
    return result;
}

If the problem naturally involves randomness (games, simulations):
- Accept a 'seed' parameter OR use fixed values for deterministic behavior
- Example: def game(target_number) instead of using random.randint()
${datasetBlock ? `
REQUIRED STRUCTURE FOR PANDAS / DATA ANALYSIS:
import pandas as pd
def solution(filepath='apple_global_sales_dataset.csv'):
    df = pd.read_csv(filepath)
    # All logic here — use real column names from the dataset catalog above
    return result

- The function MUST accept the CSV filepath as a parameter (default to the dataset filename)
- The function MUST return a deterministic result (DataFrame, Series, scalar, dict, or list)
- Do NOT hardcode row indices — use filtering/aggregation logic

CRITICAL — TEST CASES FOR DATA ANALYSIS CAPSULES:
- ONLY the following real CSV files exist in the execution environment:
    • apple_global_sales_dataset.csv
    • spotify-tracks-dataset.csv
- ALL test cases MUST use one of these two real filenames as the filepath argument
- NEVER invent fictional test files (e.g., test_data/small.csv, mock_data.csv, empty.csv)
- NEVER create test cases that expect non-existent files — there are NO other CSVs available
- Every test case input_args MUST be either:
    • [] (empty — uses the default filepath parameter)
    • ["apple_global_sales_dataset.csv"]
    • ["spotify-tracks-dataset.csv"]
- Test expected_output values must be based on REAL properties of these datasets
  (e.g., the Apple dataset has 11500 rows, the Spotify dataset has 114000 rows)
- Vary test cases by testing DIFFERENT ASPECTS of the same real dataset, NOT different files
  Example: Test 1 checks row count, Test 2 checks column names, Test 3 checks a filtered result
` : ''}=== END MANDATORY STRUCTURE ===

=== LANGUAGE KEYWORD CORRECTNESS ===
CRITICAL: Use the CORRECT keywords for the target language. NEVER mix JavaScript and Python keywords.
- Python: None (NOT null), True (NOT true), False (NOT false), and/or/not, elif, is None
- JavaScript: null (NOT None), true (NOT True), false (NOT False), &&/||/!, else if, === null
If the target language is Python, you MUST use None/True/False. Using JS keywords like null/true/false will cause NameError at runtime.
=== END LANGUAGE KEYWORD CORRECTNESS ===

CRITICAL TEST CASE RULES FOR CODE (Python/JavaScript):
1. "input_args" MUST be a JSON Array, even if there is only one argument
2. Do NOT stringify lists or numbers inside the array - keep them as raw JSON types
3. "expected_output" must be the raw value (number, string, list, etc), NOT a string representation
4. Example for add(1, 2): {"input_args": [1, 2], "expected_output": 3}
5. Example for sum_list([1,2]): {"input_args": [[1, 2]], "expected_output": 3}
6. Example for reverse("hi"): {"input_args": ["hi"], "expected_output": "ih"}
7. NEVER use -Infinity, Infinity, or NaN - use null instead (these are not valid JSON)
8. INPUTS ARE ALWAYS JSON TYPES: input_args are deserialized from JSON, so arguments will be
   plain Python lists, dicts, strings, numbers, booleans, or None — NEVER pandas Series,
   DataFrames, or numpy arrays. Your solution function MUST handle conversion internally.
   - WRONG: def solution(dates): return dates.apply(pd.to_datetime)  # FAILS — list has no .apply()
   - RIGHT: def solution(dates): s = pd.Series(dates); return s.apply(pd.to_datetime).tolist()
   If the solution uses pandas internally, wrap inputs with pd.Series() or pd.DataFrame() INSIDE
   the function body, and return plain Python types (list, dict, scalar) — not pandas objects.
9. "expected_output" must also be a JSON-serializable type (list, dict, string, number, null)
   — NEVER a pandas Series or DataFrame. Convert with .tolist(), .to_dict(), or .item().
10. KEEP TEST DATA COMPACT — all test cases are bundled into a single sandbox execution.
    Oversized payloads crash the sandbox. Follow these guidelines:
    - Use short strings (1-3 words max) for string arguments and dictionary values
    - Keep lists/arrays to 3-5 elements per test case, never more
    - Keep dictionaries to 2-4 keys each
    - Prefer simple primitives (numbers, short strings, booleans) over nested structures
    - If the problem involves lists of objects, use 2-3 small objects per test — NOT 5+
    - Total JSON size of ALL test cases combined should stay well under 2KB
    - GOOD: {"input_args": [[{"name": "A"}, {"name": "B"}]], "expected_output": {"A": 1, "B": 1}}
    - BAD:  {"input_args": [[{"assignee":"Alice","task":"Task 1"},{"assignee":"Bob","task":"Task 2"},{"assignee":"Alice","task":"Task 3"}]], ...}
    - Instead of long realistic strings, use short placeholders: "T1", "T2", "Alice" → "A", "Bob" → "B"

CRITICAL TEST CASE RULES FOR SQL:
1. Include "schema_setup" array with CREATE TABLE and INSERT statements
2. Use SQLite-compatible syntax unless "requires_postgres" is true
3. Include "expected_output" as array of row objects
4. Set "requires_postgres" to false (or true if PostgreSQL-specific features needed)
5. Example:
   {
     "description": "Basic query test",
     "schema_setup": [
       "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);",
       "INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');"
     ],
     "expected_output": [{"name": "Alice"}, {"name": "Bob"}],
     "requires_postgres": false,
     "is_hidden": false
   }

IMPORTANT: Return ONLY valid JSON, no explanations, no markdown blocks, no additional text.

Return JSON with this exact structure:
{
  "title": "${idea.title}",
  "capsule_type": "${context.type}",
  "problem_statement_md": "# ${idea.title}\\n\\n${idea.description}",
  "runtime_config": {
    "language": "${context.language}",
    "runtime_tier": "basic"
  },
  "config_data": {
    "boilerplate_code": "// Your starter code here (for SQL: starter query template or comment)",
    "reference_solution": "// Complete working solution (for SQL: the correct query)",
    "hints": ["Hint 1", "Hint 2"],
    ${context.language === 'sql' ? `"schema_setup": [
      "CREATE TABLE tablename (id INTEGER PRIMARY KEY, name TEXT);",
      "INSERT INTO tablename VALUES (1, 'value1'), (2, 'value2');"
    ],` : ''}
    "test_cases": ${this.getTestCaseTemplate(context.difficulty, context.language)}
  },
  "creator_id": "ai-system",
  "created_at": "${new Date().toISOString()}"
}`

    try {
      const messages = [{ role: 'user' as const, content: prompt }]
      const response = await this.aiService.generateJSON(messages, {
        temperature: 0.2, // Low temperature for precise code generation
        max_tokens: 1800  // Slightly reduced but enough for code + tests
      }) as BaseCapsule

      // Basic validation
      if (!response.config_data || !response.problem_statement_md) {
        throw new Error('Generated capsule is incomplete')
      }

      // Set dynamic fields
      response.id = '' // Will be set by database
      response.title = idea.title
      response.capsule_type = context.type
      
      return response

    } catch (error) {
      console.error('Coder Agent failed:', error)
      throw new Error(`Failed to implement capsule: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Create an implementation plan for the idea
   */
  private async createImplementationPlan(
    idea: CapsuleIdea,
    context: GenerationContext
  ): Promise<ImplementationPlan> {
    const planPrompt = `
You are a senior software engineer creating an implementation plan.

EDUCATIONAL IDEA:
${JSON.stringify(idea, null, 2)}

CONTEXT:
- Type: ${context.type}
- Language: ${context.language}
- Difficulty: ${context.difficulty}

Create a technical implementation plan that:
1. Breaks down the problem into implementable components
2. Identifies key technical considerations
3. Plans appropriate testing strategy
4. Anticipates common challenges

Return JSON with this structure:
{
  "approach": "High-level implementation approach",
  "key_components": ["Component 1", "Component 2"],
  "technical_considerations": ["Consideration 1", "Consideration 2"],
  "testing_strategy": "How to validate the solution",
  "potential_challenges": ["Challenge 1", "Challenge 2"]
}
`

    try {
      const messages = [{ role: 'user' as const, content: planPrompt }]
      return await this.aiService.generateJSON(messages, {
        temperature: 0.3 // Lower temperature for technical planning
      }) as ImplementationPlan
    } catch (error) {
      // Fallback plan
      return {
        approach: 'Standard implementation approach',
        key_components: ['Main function', 'Helper functions', 'Test cases'],
        technical_considerations: ['Input validation', 'Edge cases'],
        testing_strategy: 'Unit tests with multiple test cases',
        potential_challenges: ['Edge case handling']
      }
    }
  }

  /**
   * Implement a CODE capsule
   */
  private async implementCodeCapsule(
    idea: CapsuleIdea,
    context: GenerationContext,
    plan: ImplementationPlan
  ): Promise<CodeConfig> {
    const codePrompt = this.buildCodeImplementationPrompt(idea, context, plan)
    
    const messages = [{ role: 'user' as const, content: codePrompt }]
    const result = await this.aiService.generateJSON(messages, {
      temperature: 0.4,
      max_tokens: 2000
    }) as CodeGenerationResult

    // Debug log the raw AI result
    console.log('🔍 Coder Agent raw result - test_cases type:', typeof result.test_cases)
    console.log('🔍 Coder Agent raw result - test_cases isArray:', Array.isArray(result.test_cases))
    console.log('🔍 Coder Agent raw result - test_cases content:', JSON.stringify(result.test_cases, null, 2))

    // Convert to CodeConfig format
    return {
      boilerplate_code: result.boilerplate_code,
      reference_solution: result.reference_solution,
      hints: result.hints || [],
      test_cases: this.formatTestCases(result.test_cases)
    }
  }

  /**
   * Build the code implementation prompt
   */
  private buildCodeImplementationPrompt(
    idea: CapsuleIdea,
    context: GenerationContext,
    plan: ImplementationPlan
  ): string {
    const languageGuidance = this.getLanguageSpecificGuidance(context.language as CapsuleLanguage)
    const difficultyGuidance = this.getDifficultyCodeGuidance(context.difficulty)
    const styleGuidance = this.getCodeStyleGuidance()

    return `
You are an expert ${context.language} developer implementing an educational coding exercise.

EDUCATIONAL IDEA:
${JSON.stringify(idea, null, 2)}

IMPLEMENTATION PLAN:
${JSON.stringify(plan, null, 2)}

LANGUAGE GUIDANCE:
${languageGuidance}

DIFFICULTY GUIDANCE:
${difficultyGuidance}

STYLE GUIDANCE:
${styleGuidance}

Generate a complete coding exercise with:

1. BOILERPLATE CODE: Starting code for the learner
   - Include function signature/structure
   - Add helpful comments
   - Provide necessary imports
   - Leave the main logic for the learner to implement

2. REFERENCE SOLUTION: Complete, working solution
   - Follow best practices for ${context.language}
   - Include proper error handling
   - Add explanatory comments
   - Demonstrate good coding style

3. TEST CASES: Generate EXACTLY 5 test cases using the "Golden 5" strategy:
   - Test 1 (SMOKE, visible):  The basic example from the problem description. Verifies the code runs.
   - Test 2 (BASIC, visible):  A simple variation of the smoke test. Helps debug basic logic.
   - Test 3 (COMPLEX, hidden): A larger or more complex input. Prevents hardcoding answers.
   - Test 4 (EDGE, hidden):    Boundary values: zero, negative, empty string, null, max int, single element.
   - Test 5 (SCALE, hidden):   A large input (within reasonable limits). Tests efficiency.
   Include "type" field: "smoke", "basic", "complex", "edge", or "scale".
   Include "visible" field: true for tests 1-2, false for tests 3-5.
   IMPORTANT: Keep scale test inputs small enough to run in under 3 seconds.

4. HINTS: Progressive hints for learners
   - Start with conceptual hints
   - Progress to implementation hints
   - End with specific technical hints

CRITICAL: Test cases must use "input_args" as a JSON array:
- For single arg: {"input_args": [5], "expected_output": 25}
- For multiple args: {"input_args": [10, 20], "expected_output": 30}
- For list arg: {"input_args": [[1,2,3]], "expected_output": 6}
- For string arg: {"input_args": ["hello"], "expected_output": "olleh"}

Return JSON with this exact structure:
{
  "boilerplate_code": "Starting code with TODO comments",
  "reference_solution": "Complete working solution",
  "test_cases": [
    {
      "description": "Smoke test - basic example",
      "type": "smoke",
      "input_args": [arg1],
      "expected_output": result_value,
      "is_hidden": false,
      "visible": true
    },
    {
      "description": "Basic logic - simple variation",
      "type": "basic",
      "input_args": [arg1],
      "expected_output": result_value,
      "is_hidden": false,
      "visible": true
    },
    {
      "description": "Complex case - prevents hardcoding",
      "type": "complex",
      "input_args": [complex_args],
      "expected_output": complex_value,
      "is_hidden": true,
      "visible": false
    },
    {
      "description": "Edge case - boundary inputs",
      "type": "edge",
      "input_args": [edge_arg],
      "expected_output": edge_value,
      "is_hidden": true,
      "visible": false
    },
    {
      "description": "Scale test - larger input",
      "type": "scale",
      "input_args": [large_arg],
      "expected_output": large_value,
      "is_hidden": true,
      "visible": false
    }
  ],
  "hints": [
    "Conceptual hint about the approach",
    "Implementation hint about key steps",
    "Technical hint about specific details"
  ],
  "implementation_notes": "Technical notes about the solution"
}

Focus on creating code that is:
- Educationally valuable and teaches concepts
- Technically correct and follows best practices
- Appropriate for the difficulty level
- Well-tested and robust
`
  }

  /**
   * Implement a DATABASE capsule
   */
  private async implementDatabaseCapsule(
    idea: CapsuleIdea,
    context: GenerationContext,
    plan: ImplementationPlan
  ): Promise<DatabaseConfig> {
    const dbPrompt = this.buildDatabaseImplementationPrompt(idea, context, plan)
    
    const messages = [{ role: 'user' as const, content: dbPrompt }]
    const result = await this.aiService.generateJSON(messages, {
      temperature: 0.3,
      max_tokens: 1500
    }) as any

    return {
      boilerplate_code: result.boilerplate_code,
      reference_solution: result.reference_solution,
      hints: result.hints || [],
      schema_info: result.schema_info || [],
      seed_sql_url: result.seed_sql_url || '',
      // Required for validation
      schema_setup: result.schema_setup || [],
      test_data_setup: result.test_data_setup || [],
      expected_result: result.expected_result || []
    }
  }

  /**
   * Build the database implementation prompt
   */
  private buildDatabaseImplementationPrompt(
    idea: CapsuleIdea,
    context: GenerationContext,
    plan: ImplementationPlan
  ): string {
    return `
You are a database expert creating an educational SQL exercise.

EDUCATIONAL IDEA:
${JSON.stringify(idea, null, 2)}

IMPLEMENTATION PLAN:
${JSON.stringify(plan, null, 2)}

Generate a complete database exercise with:

1. SCHEMA SETUP: Array of SQL statements to build the test environment
   - CREATE TABLE statements (2-4 tables max, keep it simple)
   - INSERT statements (5-10 rows of realistic sample data)
   - Use SQLite-compatible syntax (unless requires_postgres is true)
   - Include edge cases in the data (nulls, empty strings, boundary values)
   
   Example:
   "schema_setup": [
     "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER);",
     "INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 90000);",
     "INSERT INTO employees VALUES (2, 'Bob', 'Sales', 60000);"
   ]

2. BOILERPLATE QUERY: Starting SQL for the learner
   - Include SELECT statement structure
   - Add helpful comments about what to do
   - Leave key parts for learner implementation

3. REFERENCE SOLUTION: Complete, optimized SQL query
   - Follow SQL best practices
   - Include proper joins and filters
   - Ensure query produces correct results against schema_setup data
   - Test mentally before including

4. EXPECTED OUTPUT: What the reference solution should return
   - JSON array of objects representing rows
   - Must match actual output from reference_solution against schema_setup

5. HINTS: Progressive SQL hints
   - Start with conceptual hints about data relationships
   - Progress to specific SQL syntax hints
   - End with optimization hints

6. REQUIRES_POSTGRES: Boolean flag
   - Set to false for standard SQL (will use SQLite for validation)
   - Set to true only if absolutely requires PostgreSQL features (JSONB, window functions, etc.)

CRITICAL: You MUST include schema_setup array with actual SQL statements. Do NOT put schema information only in comments.

Return JSON with this EXACT structure:
{
  "boilerplate_code": "-- Write your SQL query below\\n-- Hint: Use JOIN to combine tables\\nSELECT -- Add your query here",
  "reference_solution": "SELECT * FROM table WHERE condition;",
  "schema_setup": [
    "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);",
    "INSERT INTO users (id, name, age) VALUES (1, 'Alice', 30);",
    "INSERT INTO users (id, name, age) VALUES (2, 'Bob', 25);"
  ],
  "expected_output": [
    {"id": 1, "name": "Alice", "age": 30}
  ],
  "requires_postgres": false,
  "hints": [
    "Think about which tables need to be joined",
    "Use appropriate JOIN types for the relationships"
  ]
}

VALIDATION RULES:
- schema_setup MUST be a non-empty array of SQL strings
- Each string in schema_setup must be a complete SQL statement
- expected_output MUST match what reference_solution returns when run against schema_setup
- boilerplate_code should have comments but NOT the complete solution
`
  }

  /**
   * Implement a TERMINAL capsule
   */
  private async implementTerminalCapsule(
    idea: CapsuleIdea,
    context: GenerationContext,
    plan: ImplementationPlan
  ): Promise<TerminalConfig> {
    const terminalPrompt = this.buildTerminalImplementationPrompt(idea, context, plan)
    
    const messages = [{ role: 'user' as const, content: terminalPrompt }]
    const result = await this.aiService.generateJSON(messages, {
      temperature: 0.3,
      max_tokens: 1200
    }) as any

    return {
      environment_config: {
        disk_image_url: result.environment_config?.disk_image_url || 'https://r2.devleep.com/images/alpine-v1.img'
      },
      hints: result.hints || [],
      tasks: result.tasks || []
    }
  }

  /**
   * Build the terminal implementation prompt
   */
  private buildTerminalImplementationPrompt(
    idea: CapsuleIdea,
    context: GenerationContext,
    plan: ImplementationPlan
  ): string {
    return `
You are a Linux system administrator creating educational terminal exercises.

EDUCATIONAL IDEA:
${JSON.stringify(idea, null, 2)}

IMPLEMENTATION PLAN:
${JSON.stringify(plan, null, 2)}

Generate a complete terminal exercise with:

1. ENVIRONMENT: Linux environment specification
   - Use appropriate disk image
   - Consider what tools are needed

2. TASKS: Sequential tasks for the learner
   - Break down into clear, testable steps
   - Include validation scripts
   - Progress from simple to complex

3. HINTS: Command-line hints
   - Start with conceptual hints
   - Progress to specific command hints
   - Include man page references

Return JSON with this structure:
{
  "environment_config": {
    "disk_image_url": "https://r2.devleep.com/images/alpine-v1.img"
  },
  "hints": [
    "Use 'ls' to see what files are available",
    "Try 'man command' to see command documentation",
    "Use pipes (|) to chain commands together"
  ],
  "tasks": [
    {
      "task_id": "create_file",
      "description": "Create a file called 'hello.txt' in your home directory",
      "validation_script": "if [ -f ~/hello.txt ]; then echo 'pass'; else echo 'fail'; fi"
    }
  ]
}
`
  }

  /**
   * Get language-specific guidance
   */
  private getLanguageSpecificGuidance(language: CapsuleLanguage): string {
    const guidance = {
      python: `
PYTHON GUIDANCE:
- Use clear, readable Python code
- Follow PEP 8 style guidelines
- Include docstrings for functions
- Use type hints when appropriate
- Prefer list comprehensions when clear
- Handle exceptions appropriately
- Use snake_case for variables and functions
- CRITICAL: Use Python keywords, NOT JavaScript keywords:
  * Use None (NOT null)
  * Use True (NOT true)
  * Use False (NOT false)
  * Use and/or/not (NOT &&/||/!)
  * Use is None (NOT === null or == null)
  * Use elif (NOT else if)`,

      javascript: `
JAVASCRIPT GUIDANCE:
- Use modern ES6+ syntax
- Prefer const/let over var
- Use arrow functions when appropriate
- Include JSDoc comments
- Handle async operations correctly
- Use meaningful variable names
- Follow functional programming principles when suitable`,

      java: `
JAVA GUIDANCE:
- Follow Java naming conventions
- Include proper access modifiers
- Use generics appropriately
- Add JavaDoc comments
- Handle exceptions with try-catch
- Use appropriate data structures
- Follow object-oriented principles`,

      sql: `
SQL GUIDANCE:
- Use uppercase for SQL keywords
- Format queries for readability
- Use meaningful table/column aliases
- Include appropriate indexes
- Consider query performance
- Use proper data types
- Follow database naming conventions`,

      bash: `
BASH GUIDANCE:
- Include shebang line (#!/bin/bash)
- Use meaningful variable names
- Quote variables to prevent word splitting
- Include error checking
- Use functions for reusable code
- Add helpful comments
- Follow shell scripting best practices`,

      go: `
GO GUIDANCE:
- Follow Go naming conventions
- Use gofmt formatting
- Include error handling
- Use appropriate data types
- Write clear, simple code
- Include package documentation
- Follow Go idioms and patterns`,

      csharp: `
C# GUIDANCE:
- Follow C# naming conventions
- Use appropriate access modifiers
- Include XML documentation
- Handle exceptions appropriately
- Use LINQ when suitable
- Follow object-oriented principles
- Use meaningful variable names`
    }

    return guidance[language] || 'Follow language best practices'
  }

  /**
   * Get difficulty-specific code guidance (used by dead-code path)
   */
  private getDifficultyCodeGuidance(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return `
EASY DIFFICULTY:
- Provide more complete boilerplate code
- Include step-by-step comments
- Use simple, straightforward algorithms
- Avoid complex data structures
- Include more visible test cases
- Provide detailed hints`

      case 'medium':
        return `
MEDIUM DIFFICULTY:
- Provide moderate boilerplate structure
- Require some algorithm design
- Use common data structures
- Include mix of visible/hidden tests
- Balance guidance with discovery
- Require understanding of concepts`

      case 'hard':
        return `
HARD DIFFICULTY:
- Provide minimal boilerplate structure
- Require complex problem solving
- Use advanced data structures/algorithms
- Include more hidden test cases
- Minimal hints - encourage discovery
- Focus on optimization and edge cases`

      default:
        return 'Adjust code complexity appropriately'
    }
  }

  /**
   * 5-Axis difficulty spec for the active implementCapsule() prompt.
   * This is the single source of truth for implementation difficulty enforcement.
   */
  private getImplementationDifficultySpec(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return `BOILERPLATE DEPTH: FULL — provide complete function signature with descriptive parameter names, return type hints, step-by-step TODO comments, and example usage in comments.
EDGE CASES: NONE — only normal, happy-path inputs. No null, no empty, no negative, no extreme values.
PERFORMANCE: No optimization required. Input sizes are small (< 100 elements).
CONCEPTS: ONE core concept. Do NOT combine concepts.
HINTS: 2 detailed hints that clearly guide toward the solution approach.`

      case 'medium':
        return `BOILERPLATE DEPTH: PARTIAL — provide function signature with parameter names but minimal comments. Include imports but no step-by-step guidance.
EDGE CASES: BASIC — include empty input, negative numbers, and one null/boundary case.
PERFORMANCE: Moderate input sizes. Inefficient O(n²) solutions should still pass but are suboptimal.
CONCEPTS: 2 related concepts that must be combined (e.g., filtering + aggregation, recursion + memoization).
HINTS: 2 hints — first conceptual, second more specific but not revealing.`

      case 'hard':
        return `BOILERPLATE DEPTH: MINIMAL — only a bare function stub with parameter names. No comments, no guidance, no examples.
EDGE CASES: ADVANCED — null values, empty inputs, extreme numbers, duplicate logic traps, tie-breaking scenarios.
PERFORMANCE: Large input sizes. O(n²) solutions MUST be too slow. Performance test has 10,000+ elements.
CONCEPTS: 3+ concepts. Student must design the approach and algorithm themselves.
HINTS: 2 minimal hints — vague conceptual nudges only. Do NOT reveal the approach.`

      default:
        return 'Use medium difficulty specification.'
    }
  }

  /**
   * Get test distribution spec based on difficulty.
   * Enforces the 5-axis framework test count and visibility rules.
   */
  private getTestDistributionSpec(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return `Generate EXACTLY 3 test cases:
- Test 1 (SMOKE, visible=true):  Basic example directly from the problem statement.
- Test 2 (BASIC, visible=true):  Simple variation — different input, same concept.
- Test 3 (COMPLEX, hidden=true): Slightly larger input to prevent hardcoding answers.
DO NOT include edge cases or scale tests for easy difficulty.
Total: 2 visible + 1 hidden = 3 tests.`

      case 'medium':
        return `Generate EXACTLY 4 test cases:
- Test 1 (SMOKE, visible=true):  Basic example directly from the problem statement.
- Test 2 (BASIC, visible=true):  Simple variation with different inputs.
- Test 3 (EDGE, hidden=true):    Boundary values: empty input, zero, negative, null.
- Test 4 (COMPLEX, hidden=true): Larger input combining both concepts. Prevents hardcoding.
Total: 2 visible + 2 hidden = 4 tests.`

      case 'hard':
        return `Generate EXACTLY 5 test cases:
- Test 1 (SMOKE, visible=true):  One basic example so students can verify their approach works.
- Test 2 (EDGE, hidden=true):    Boundary: empty, null, zero, single-element, max int.
- Test 3 (EDGE, hidden=true):    Tricky: duplicates, tie-breaking, precision issues.
- Test 4 (COMPLEX, hidden=true): Large complex input combining 3+ concepts.
- Test 5 (SCALE, hidden=true):   Performance test with 10,000+ elements. O(n²) MUST fail.
Total: 1 visible + 4 hidden = 5 tests.`

      default:
        return 'Generate EXACTLY 4 test cases with 2 visible and 2 hidden.'
    }
  }

  /**
   * Get test case JSON template for the mega-prompt based on difficulty.
   */
  private getTestCaseTemplate(difficulty: string, language: string): string {
    if (language === 'sql') {
      return `[
        {
          "description": "Test SQL query",
          "type": "smoke",
          "expected_output": [{"column": "value"}],
          "requires_postgres": false,
          "visible": true
        }
      ]`
    }

    switch (difficulty) {
      case 'easy':
        return `[
        {
          "description": "Smoke test - basic example from the problem",
          "type": "smoke",
          "input_args": [example_arg],
          "expected_output": example_result,
          "is_hidden": false,
          "visible": true
        },
        {
          "description": "Basic logic - simple variation",
          "type": "basic",
          "input_args": [basic_arg],
          "expected_output": basic_result,
          "is_hidden": false,
          "visible": true
        },
        {
          "description": "Complex - prevents hardcoding",
          "type": "complex",
          "input_args": [complex_args],
          "expected_output": complex_result,
          "is_hidden": true,
          "visible": false
        }
      ]`

      case 'medium':
        return `[
        {
          "description": "Smoke test - basic example from the problem",
          "type": "smoke",
          "input_args": [example_arg],
          "expected_output": example_result,
          "is_hidden": false,
          "visible": true
        },
        {
          "description": "Basic logic - simple variation",
          "type": "basic",
          "input_args": [basic_arg],
          "expected_output": basic_result,
          "is_hidden": false,
          "visible": true
        },
        {
          "description": "Edge case - boundary/empty/zero/null inputs",
          "type": "edge",
          "input_args": [edge_arg],
          "expected_output": edge_result,
          "is_hidden": true,
          "visible": false
        },
        {
          "description": "Complex logic - combines both concepts",
          "type": "complex",
          "input_args": [complex_args],
          "expected_output": complex_result,
          "is_hidden": true,
          "visible": false
        }
      ]`

      case 'hard':
      default:
        return `[
        {
          "description": "Smoke test - basic example from the problem",
          "type": "smoke",
          "input_args": [example_arg],
          "expected_output": example_result,
          "is_hidden": false,
          "visible": true
        },
        {
          "description": "Edge case - boundary values",
          "type": "edge",
          "input_args": [edge_arg1],
          "expected_output": edge_result1,
          "is_hidden": true,
          "visible": false
        },
        {
          "description": "Edge case - tricky inputs (duplicates, tie-breaking)",
          "type": "edge",
          "input_args": [edge_arg2],
          "expected_output": edge_result2,
          "is_hidden": true,
          "visible": false
        },
        {
          "description": "Complex - combines multiple concepts",
          "type": "complex",
          "input_args": [complex_args],
          "expected_output": complex_result,
          "is_hidden": true,
          "visible": false
        },
        {
          "description": "Scale test - performance with large input (10000+ elements)",
          "type": "scale",
          "input_args": [large_arg],
          "expected_output": large_result,
          "is_hidden": true,
          "visible": false
        }
      ]`
    }
  }

  /**
   * Get mode-specific code generation rules for the Coder Agent.
   * Controls what boilerplate_code and reference_solution mean.
   */
  private getModeCodeSpec(mode: string): string {
    switch (mode) {
      case 'supervision':
        return `This is a SUPERVISION capsule. The learner reviews and refactors AI-generated code.

BOILERPLATE_CODE MUST BE:
- A COMPLETE, FULLY WORKING implementation (NOT a stub, NOT empty, NOT "pass")
- Written with DELIBERATELY BAD code quality: meaningless variable names (x1, tmp, data2),
  zero comments, magic numbers, code duplication, or mixed concerns
- The code MUST produce CORRECT output for all test cases — the flaw is readability/style, NOT logic

REFERENCE_SOLUTION MUST BE:
- The SAME logic rewritten with clean variable names, docstrings, comments, extracted constants
- It must produce IDENTICAL output to the boilerplate for all test cases

TEST CASES:
- Tests must PASS on BOTH the flawed boilerplate AND the clean reference solution
- Tests validate that the learner didn't accidentally break logic while refactoring

HINTS should guide the learner on WHAT to look for (e.g., "Look for variables with meaningless names"),
not on how to write code from scratch.`

      case 'debug':
        return `This is a DEBUG capsule. The learner finds and fixes bugs in AI-generated code.

BOILERPLATE_CODE MUST BE:
- A COMPLETE implementation that LOOKS correct but has 1-2 SUBTLE LOGIC BUGS injected
- Bugs should be realistic: off-by-one, wrong boundary, mutation during iteration,
  wrong operator, incorrect variable reuse, cumulative rounding errors
- The code must be readable and well-structured — the challenge is finding the bug, not reading the code

REFERENCE_SOLUTION MUST BE:
- The FIXED version with the bugs corrected
- Minimal changes from the boilerplate — only the bug fix, nothing else

TEST CASES:
- Tests must FAIL on the buggy boilerplate code
- Tests must PASS on the reference solution (fixed code)
- Include at least one test that specifically targets the bug (edge/boundary case)

HINTS should narrow down WHERE the bug might be (e.g., "Check the loop termination condition"),
not reveal the exact fix.`

      case 'security':
        return `This is a SECURITY capsule. The learner finds and fixes vulnerabilities.

BOILERPLATE_CODE MUST BE:
- A COMPLETE, WORKING implementation with 1-2 SECURITY VULNERABILITIES
- Vulnerabilities should be realistic: SQL injection via f-string/concat, eval() on user input,
  no input sanitization, missing bounds checking, accepting dangerous input types
- The code must work correctly for normal inputs — it only fails under attack inputs

REFERENCE_SOLUTION MUST BE:
- The HARDENED version with vulnerabilities fixed (parameterized queries, input validation,
  safe parsing instead of eval, sanitization, bounds checks)
- Must still produce correct output for all normal inputs

TEST CASES:
- Include NORMAL tests that pass on both versions
- Include ATTACK tests with malicious inputs that:
  - Produce wrong/dangerous results on the vulnerable boilerplate
  - Are safely handled by the reference solution (return error dict or sanitized output)
- Example attack inputs: SQL injection strings, eval payloads, XSS-like strings, negative values

HINTS should describe the vulnerability category (e.g., "Check how user input is used in queries"),
not reveal the exact fix.`

      case 'testing':
        return `This is a TESTING capsule. The learner writes test assertions for a pre-built function.

BOILERPLATE_CODE MUST BE:
- Contains a COMPLETE, FULLY WORKING function implementation at the top (NOT a stub, NOT "pass")
- Below it, an EMPTY test function with a descriptive name like test_<function_name>()
- The test function body should contain only a "pass" statement and TODO comments listing what to test
- Example structure:
  def calculate_cart_total(items):
      return sum(item['price'] * item['quantity'] for item in items)
  
  def test_cart_total():
      # TODO: Write at least 5 assert statements
      # Test: empty cart, single item, multiple items, zero price, decimal prices
      pass

REFERENCE_SOLUTION MUST BE:
- The SAME working function implementation at the top (identical to boilerplate)
- The test function with COMPREHENSIVE assert statements covering all specified edge cases
- Each assert should test a different scenario with a comment explaining what it tests

TEST CASES (MUTATION FORMAT):
- Each test case represents a BROKEN VERSION of the function that the student's assertions should catch
- input_args[0] is a STRING containing a mutated (broken) version of the function body
- input_args[1] is a STRING containing the test function name (e.g., "test_cart_total")
- expected_output is true (the student's test should catch this mutation — i.e., at least one assert should fail)
- description explains what mutation was introduced (e.g., "Returns 0 for all inputs instead of calculating total")
- Example test cases for a cart total function:
  Test 1: Mutation "return 0" — always returns zero (catches empty cart test)
  Test 2: Mutation "return items[0]['price']" — only uses first item (catches multi-item test)
  Test 3: Mutation "return sum(item['price'] for item in items)" — ignores quantity
  Test 4: Mutation "return int(sum(...))" — truncates decimals (catches float precision test)

HINTS must be MUTATION-AWARE and SPECIFIC:
- Each hint should reference a concrete mutation the learner's assertions need to catch.
- Good hint: "Test the exact boundary — if the minimum length is 6, write one assert for a 5-character input (should fail) and one for a 6-character input (should pass). This catches mutations that change the threshold."
- Good hint: "Test each validation rule independently with a separate assert. If one assert covers two rules, a mutation that removes either rule might not break your test."
- Bad hint (too vague): "Think about what happens with an empty list"
- Bad hint (too vague): "Consider edge cases like special characters"
Hints should NOT reveal the implementation or tell the learner how to fix anything — only WHAT to test and WHY precision matters.`

      case 'standard':
      default:
        return `This is a STANDARD capsule. The learner writes the solution from scratch.
BOILERPLATE_CODE: A function stub or skeleton with signature and TODO comments.
REFERENCE_SOLUTION: The complete working implementation.
Tests validate the learner's solution against expected outputs.`
    }
  }

  /** Get code style guidance based on config. */
  private getCodeStyleGuidance(): string {
    const style = this.config.code_style
    const comments = this.config.comment_level

    return `
CODE STYLE (${style}):
${style === 'beginner_friendly' ? '- Use verbose, clear variable names\n- Include extensive comments\n- Avoid complex one-liners' : ''}
${style === 'idiomatic' ? '- Follow language idioms and conventions\n- Use appropriate abstractions\n- Balance clarity with conciseness' : ''}
${style === 'enterprise' ? '- Include proper error handling\n- Use design patterns when appropriate\n- Focus on maintainability' : ''}

COMMENT LEVEL (${comments}):
${comments === 'minimal' ? '- Only essential comments' : ''}
${comments === 'moderate' ? '- Key explanations and complex logic' : ''}
${comments === 'extensive' ? '- Detailed explanations for learning' : ''}

ADDITIONAL PREFERENCES:
- Include imports: ${this.config.include_imports}
- Prefer explicit code: ${this.config.prefer_explicit}
- Add error handling: ${this.config.add_error_handling}
`
  }

  /**
   * Format test cases to ensure proper structure.
   * Enforces difficulty-based test count and visibility rules:
   *   Easy:   2 visible + 1 hidden = 3 total
   *   Medium: 2 visible + 2 hidden = 4 total
   *   Hard:   1 visible + 4 hidden = 5 total
   */
  private formatTestCases(testCases: any, difficulty: string = 'medium'): Array<{
    description: string
    type: 'smoke' | 'basic' | 'complex' | 'edge' | 'scale'
    input_args: any[]
    expected_output: any
    is_hidden: boolean
    visible: boolean
  }> {
    const DIFFICULTY_SPEC: Record<string, { total: number; visibleCount: number; types: Array<{ type: 'smoke' | 'basic' | 'complex' | 'edge' | 'scale'; visible: boolean; is_hidden: boolean }> }> = {
      easy: {
        total: 3,
        visibleCount: 2,
        types: [
          { type: 'smoke',   visible: true,  is_hidden: false },
          { type: 'basic',   visible: true,  is_hidden: false },
          { type: 'complex', visible: false, is_hidden: true },
        ]
      },
      medium: {
        total: 4,
        visibleCount: 2,
        types: [
          { type: 'smoke',   visible: true,  is_hidden: false },
          { type: 'basic',   visible: true,  is_hidden: false },
          { type: 'edge',    visible: false, is_hidden: true },
          { type: 'complex', visible: false, is_hidden: true },
        ]
      },
      hard: {
        total: 5,
        visibleCount: 1,
        types: [
          { type: 'smoke',   visible: true,  is_hidden: false },
          { type: 'edge',    visible: false, is_hidden: true },
          { type: 'edge',    visible: false, is_hidden: true },
          { type: 'complex', visible: false, is_hidden: true },
          { type: 'scale',   visible: false, is_hidden: true },
        ]
      },
    }

    const spec = DIFFICULTY_SPEC[difficulty] || DIFFICULTY_SPEC['medium']

    // Handle different input formats
    if (!testCases) return []
    
    // If it's already an array, normalize to difficulty-specific format
    if (Array.isArray(testCases)) {
      const capped = testCases.slice(0, spec.total)
      
      return capped.map((testCase, index) => {
        const golden = spec.types[index] || spec.types[spec.types.length - 1]
        return {
          description: testCase.description || `Test case ${index + 1}`,
          type: testCase.type || golden.type,
          input_args: testCase.input_args || [],
          expected_output: testCase.expected_output,
          is_hidden: golden.is_hidden,   // ENFORCE from spec, don't trust AI
          visible: golden.visible,       // ENFORCE from spec, don't trust AI
        }
      })
    }
    
    // Fallback for unexpected formats
    console.warn('Unexpected test_cases format:', typeof testCases, testCases)
    return [{
      description: 'Default test case',
      type: 'smoke' as const,
      input_args: [],
      expected_output: null,
      is_hidden: false,
      visible: true,
    }]
  }

  /**
   * Format the problem statement with proper markdown
   */
  private formatProblemStatement(idea: CapsuleIdea): string {
    return `# ${idea.title}

${idea.description}

## Key Concepts
${idea.key_concepts.map(concept => `- ${concept}`).join('\n')}

**Estimated Time:** ${idea.estimated_time_minutes} minutes
**Target Audience:** ${idea.target_audience}`
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
  getConfig(): CoderConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CoderConfig>): void {
    this.config = { ...this.config, ...updates }
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a preconfigured coder for different contexts
 */
export function createCoderAgent(context: {
  experience_level?: 'beginner' | 'intermediate' | 'expert'
  code_style?: 'beginner_friendly' | 'idiomatic' | 'enterprise'
}): CoderAgent {
  let config: Partial<CoderConfig> = {}

  if (context.experience_level === 'beginner') {
    config = {
      code_style: 'beginner_friendly',
      comment_level: 'extensive',
      prefer_explicit: true,
      add_error_handling: false
    }
  } else if (context.experience_level === 'expert') {
    config = {
      code_style: 'enterprise',
      comment_level: 'minimal',
      prefer_explicit: false,
      add_error_handling: true
    }
  }

  if (context.code_style) {
    config.code_style = context.code_style
  }

  return new CoderAgent(config)
}

/**
 * Validate that a generated capsule meets technical standards
 */
export function validateTechnicalImplementation(capsule: BaseCapsule): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  // Check required fields
  if (!capsule.title) {
    issues.push('Missing title')
  }
  if (!capsule.problem_statement_md) {
    issues.push('Missing problem statement')
  }
  if (!capsule.config_data) {
    issues.push('Missing config data')
  }

  // Type-specific validation
  if (capsule.capsule_type === 'CODE') {
    const config = capsule.config_data as CodeConfig
    if (!config.boilerplate_code) {
      issues.push('Missing boilerplate code')
    }
    if (!config.reference_solution) {
      issues.push('Missing reference solution')
    }
    if (!config.test_cases || config.test_cases.length === 0) {
      issues.push('Missing test cases')
      suggestions.push('Add at least 3 test cases covering normal and edge cases')
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  }
}