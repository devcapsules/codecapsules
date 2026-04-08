/**
 * Devcapsules API Client v2
 * 
 * Connects the frontend to the Cloudflare Workers API.
 * Supports async generation with polling, authentication, and versioned endpoints.
 * 
 * @version 2.0.0
 * @author Devcapsules Team
 */

// ============================================================================
// Types
// ============================================================================

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'c' | 'sql'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ExecutionRuntime = 'edge' | 'lambda'

export type CapsuleMode = 'standard' | 'supervision' | 'debug' | 'security' | 'data-analysis'

export interface GenerationRequest {
  prompt: string
  language: SupportedLanguage
  difficulty?: Difficulty
  capsuleMode?: CapsuleMode
  concepts?: string[]
  includeTestCases?: boolean
  includeHints?: boolean
  skipCache?: boolean
}

export interface ExecutionRequest {
  code: string
  language: SupportedLanguage
  input?: string
  timeout?: number
}

export interface GenerationResult {
  success: boolean
  code: string
  explanation?: string
  concepts?: string[]
  difficulty_score?: number
  quality_score?: number
  error?: string
  timestamp: number
}

export interface ExecutionResult {
  success: boolean
  stdout?: string
  stderr?: string
  exit_code?: number
  execution_time?: number
  memory_used?: number
  compile_output?: string
  error?: string
  timestamp: number
  runtime?: ExecutionRuntime
}

// Async generation job types
export interface GenerationJob {
  jobId: string
  status: JobStatus
  progress: number
  stage: string
  currentStep?: string
  steps?: string[]
  eta?: number
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
}

export interface GenerateAndExecuteRequest extends GenerationRequest {
  input?: string
}

export interface GenerateAndExecuteResult {
  success: boolean
  capsule: any
  metadata?: any
  qualityScore?: number
  suggestions?: string[]
  error?: string
}

export interface HealthStatus {
  success: boolean
  version: string
  timestamp: string
  services: {
    d1: boolean
    kv: boolean
    ai: boolean
    queues: boolean
  }
  edge: {
    region: string
    colo: string
  }
}

// Capsule types
export interface Capsule {
  id: string
  title: string
  description: string
  language: SupportedLanguage
  difficulty: Difficulty
  starterCode: string
  solutionCode: string
  testCases: TestCase[]
  hints?: string[]
  concepts?: string[]
  metadata?: Record<string, any>
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface TestCase {
  input: string
  expectedOutput: string
  isHidden?: boolean
}

// Auth types
export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

export interface User {
  id: string
  email: string
  name?: string
  plan: 'free' | 'creator' | 'b2b' | 'enterprise'
}

// ============================================================================
// API Client Class
// ============================================================================

class DevcapsulesAPIClient {
  private baseUrl: string
  private apiVersion = 'v1'
  private authToken: string | null = null
  private apiKey: string | null = null

  constructor() {
    this.baseUrl = this.detectApiUrl()
    this.loadStoredAuth()
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  private detectApiUrl(): string {
    if (typeof window !== 'undefined') {
      // Client-side: check for build-time env vars
      // Priority: Cloudflare Workers > Lambda > Local
      return process.env.NEXT_PUBLIC_WORKERS_API_URL 
        || process.env.NEXT_PUBLIC_API_URL 
        || 'http://localhost:8787'
    } else {
      // Server-side
      return process.env.WORKERS_API_URL 
        || process.env.API_URL 
        || process.env.NEXT_PUBLIC_API_URL 
        || 'http://localhost:8787'
    }
  }

  private loadStoredAuth(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('devcapsules_auth')
      if (stored) {
        const auth = JSON.parse(stored)
        if (auth.expiresAt > Date.now()) {
          this.authToken = auth.accessToken
        } else {
          localStorage.removeItem('devcapsules_auth')
        }
      }
      
      // Also check for API key
      this.apiKey = localStorage.getItem('devcapsules_api_key')
    } catch {
      // Ignore storage errors
    }
  }

  setAuthToken(tokens: AuthTokens): void {
    this.authToken = tokens.accessToken
    if (typeof window !== 'undefined') {
      localStorage.setItem('devcapsules_auth', JSON.stringify(tokens))
    }
  }

  setApiKey(key: string): void {
    this.apiKey = key
    if (typeof window !== 'undefined') {
      localStorage.setItem('devcapsules_api_key', key)
    }
  }

  clearAuth(): void {
    this.authToken = null
    this.apiKey = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('devcapsules_auth')
      localStorage.removeItem('devcapsules_api_key')
    }
  }

  // ---------------------------------------------------------------------------
  // HTTP Client
  // ---------------------------------------------------------------------------

  private getEndpoint(path: string): string {
    // Add version prefix if not present
    if (path.startsWith('/api/')) {
      return `${this.baseUrl}/api/${this.apiVersion}${path.slice(4)}`
    }
    return `${this.baseUrl}${path}`
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey
    } else if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    
    return headers
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    requireAuth = true
  ): Promise<T> {
    const url = this.getEndpoint(endpoint)
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(requireAuth ? this.getAuthHeaders() : {}),
      },
    }

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    }

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, mergedOptions)
      
      // Handle specific error codes
      if (response.status === 401) {
        this.clearAuth()
        throw new Error('Authentication required. Please log in.')
      }
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new Error(`Rate limited. Please try again in ${retryAfter || 60} seconds.`)
      }
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || `API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ API Response: ${endpoint}`, data)
      
      return data
    } catch (error) {
      console.error(`❌ API Request Failed: ${endpoint}`, error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // Health & Status
  // ---------------------------------------------------------------------------

  /**
   * Check API server health and configuration
   */
  async getHealth(): Promise<HealthStatus> {
    return this.makeRequest<HealthStatus>('/health', {}, false)
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.getHealth()
      return health.success === true
    } catch {
      return false
    }
  }

  /**
   * Get current API configuration
   */
  getApiUrl(): string {
    return this.baseUrl
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.makeRequest<{ 
      success: boolean
      user: User
      accessToken: string
      expiresIn: number 
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false)

    const tokens: AuthTokens = {
      accessToken: response.accessToken,
      expiresAt: Date.now() + (response.expiresIn * 1000),
    }
    
    this.setAuthToken(tokens)
    return { user: response.user, tokens }
  }

  /**
   * Register a new account
   */
  async register(email: string, password: string, name?: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.makeRequest<{
      success: boolean
      user: User
      accessToken: string
      expiresIn: number
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }, false)

    const tokens: AuthTokens = {
      accessToken: response.accessToken,
      expiresAt: Date.now() + (response.expiresIn * 1000),
    }
    
    this.setAuthToken(tokens)
    return { user: response.user, tokens }
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    this.clearAuth()
  }

  /**
   * Create a new API key
   */
  async createApiKey(name: string): Promise<{ key: string; keyId: string }> {
    return this.makeRequest('/api/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  // ---------------------------------------------------------------------------
  // Capsule CRUD
  // ---------------------------------------------------------------------------

  /**
   * List user's capsules
   */
  async listCapsules(options?: { 
    status?: 'draft' | 'published'
    limit?: number
    offset?: number 
  }): Promise<{ capsules: Capsule[]; total: number }> {
    const params = new URLSearchParams()
    if (options?.status) params.set('status', options.status)
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.makeRequest(`/api/capsules${query}`)
  }

  /**
   * Get a single capsule by ID
   */
  async getCapsule(id: string): Promise<Capsule> {
    const response = await this.makeRequest<{ success: boolean; capsule: Capsule }>(
      `/api/capsules/${id}`
    )
    return response.capsule
  }

  /**
   * Create a new capsule
   */
  async createCapsule(capsule: Partial<Capsule>): Promise<Capsule> {
    const response = await this.makeRequest<{ success: boolean; capsule: Capsule }>(
      '/api/capsules',
      {
        method: 'POST',
        body: JSON.stringify(capsule),
      }
    )
    return response.capsule
  }

  /**
   * Update an existing capsule
   */
  async updateCapsule(id: string, updates: Partial<Capsule>): Promise<Capsule> {
    const response = await this.makeRequest<{ success: boolean; capsule: Capsule }>(
      `/api/capsules/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    )
    return response.capsule
  }

  /**
   * Delete a capsule
   */
  async deleteCapsule(id: string): Promise<void> {
    await this.makeRequest(`/api/capsules/${id}`, { method: 'DELETE' })
  }

  /**
   * Publish a capsule (make it public) by updating is_published flag
   */
  async publishCapsule(id: string): Promise<Capsule> {
    const response = await this.makeRequest<{ success: boolean; data: { id: string } }>(
      `/api/capsules/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ isPublished: true }),
      }
    )
    return { id: response.data.id } as Capsule
  }

  /**
   * Validate capsule by running reference solution against test cases
   * Uses the execute-tests endpoint to verify all test cases pass
   */
  async validateCapsule(
    capsule: any,
    testCases?: any[]
  ): Promise<{
    success: boolean
    validation?: {
      allTestsPassed: boolean
      passedCount: number
      totalCount: number
      results?: any[]
    }
    readyToPublish?: boolean
    error?: string
  }> {
    try {
      const language = (capsule.language || 'python').toLowerCase()
      const isSQL = language === 'sql'

      // Get the reference solution
      const referenceSolution = isSQL
        ? capsule.content?.primary?.database?.solution
        : capsule.content?.primary?.code?.wasmVersion?.solution

      if (!referenceSolution) {
        return { success: false, error: 'No reference solution found to validate', readyToPublish: false }
      }

      // ── SQL Capsules: validate via /execute/tests with schema_setup ──
      if (isSQL) {
        console.log('🧪 SQL validation: running solution via /execute/tests')
        const db = capsule.content?.primary?.database || {}
        
        // Collect schema_setup statements
        const schemaSetup: string[] = []
        if (db.schema_setup?.length) {
          schemaSetup.push(...db.schema_setup)
        } else if (db.schema) {
          schemaSetup.push(db.schema)
        }
        // Add test data setup (INSERT statements)
        if (db.test_data_setup?.length) {
          schemaSetup.push(...db.test_data_setup)
        } else if (db.seedData?.length) {
          schemaSetup.push(...db.seedData)
        }

        // Get test cases
        const cases = testCases?.length ? testCases 
          : db.testCases?.length ? db.testCases
          : db.test_cases?.length ? db.test_cases
          : [{ description: 'SQL execution test', expected_output: db.expected_result }]

        if (!referenceSolution.trim()) {
          console.log('⚠️ No SQL solution to validate, allowing publish')
          return {
            success: true,
            validation: { allTestsPassed: true, passedCount: 0, totalCount: 0 },
            readyToPublish: true,
          }
        }
        
        try {
          const execResult = await this.makeRequest<{
            success: boolean
            summary?: { allPassed: boolean; passedTests: number; totalTests: number }
            results?: any[]
            error?: string
          }>('/api/execute/tests', {
            method: 'POST',
            body: JSON.stringify({
              userCode: referenceSolution,
              testCases: cases,
              language: 'sql',
              schema_setup: schemaSetup,
              referenceSolution: referenceSolution,
            }),
          })
          
          const totalTests = execResult.summary?.totalTests || cases.length
          const passedTests = execResult.summary?.passedTests || 0
          
          if (execResult.success && execResult.summary?.allPassed) {
            console.log('✅ SQL solution validated — all tests passed')
            return {
              success: true,
              validation: {
                allTestsPassed: true,
                passedCount: passedTests,
                totalCount: totalTests,
                results: execResult.results,
              },
              readyToPublish: true,
            }
          } else {
            const errMsg = execResult.error || 
              `SQL validation: ${passedTests}/${totalTests} tests passed`
            console.error('❌ SQL validation failed:', errMsg)
            return {
              success: true,
              validation: {
                allTestsPassed: false,
                passedCount: passedTests,
                totalCount: totalTests,
                results: execResult.results,
              },
              readyToPublish: false,
              error: errMsg,
            }
          }
        } catch (sqlError) {
          console.warn('⚠️ SQL validation request failed:', sqlError)
          return {
            success: false,
            error: sqlError instanceof Error ? sqlError.message : 'SQL validation failed',
            readyToPublish: false,
          }
        }
      }

      // ── Code Capsules: validate via execute-tests ──
      // Get test cases
      let cases = testCases?.length
        ? testCases
        : capsule.content?.primary?.code?.wasmVersion?.testCases

      if (!cases || cases.length === 0) {
        // No test cases — skip validation and allow publish
        console.log('⚠️ No test cases found, skipping validation')
        return {
          success: true,
          validation: { allTestsPassed: true, passedCount: 0, totalCount: 0 },
          readyToPublish: true,
        }
      }

      // Transform editor display format → backend format if needed
      // Editor format: { id, name, input: "nums = [2,7], target = 9", expected: "[0,1]" }
      // Backend format: { input_args: [[2,7], 9], expected_output: [0,1], description: "..." }
      cases = cases.map((tc: any) => {
        // Already in backend format
        if (tc.input_args !== undefined) return tc

        // Try to parse editor display format into backend format
        try {
          const inputStr = tc.input || ''
          const args: unknown[] = []
          
          // Strategy 1: Try parsing as a JSON array first
          // Handles inputs like '[1,"Buy groceries",false]' from universal format
          let parsedAsJson = false
          try {
            const parsed = JSON.parse(inputStr)
            if (Array.isArray(parsed)) {
              args.push(...parsed)
              parsedAsJson = true
            }
          } catch {
            // Not valid JSON — fall through to assignment parsing
          }
          
          // Strategy 2: Try splitting by comma-separated assignments
          // Handles inputs like 'nums = [2,7], target = 9'
          if (!parsedAsJson) {
            const assignments = inputStr.split(/,\s*(?=[a-zA-Z_])/)
            for (const assignment of assignments) {
              const match = assignment.match(/\w+\s*=\s*(.+)/)
              if (match) {
                try {
                  args.push(JSON.parse(match[1].trim()))
                } catch {
                  args.push(match[1].trim())
                }
              }
            }
          }

          // Parse expected output
          let expected: unknown = tc.expected || tc.expected_output
          if (typeof expected === 'string') {
            try {
              expected = JSON.parse(expected)
            } catch {
              // Keep as string
            }
          }

          return {
            input_args: args.length > 0 ? args : [inputStr],
            expected_output: expected,
            description: tc.name || tc.description || `Test ${tc.id || ''}`,
          }
        } catch {
          // Fallback: pass raw values
          return {
            input_args: [tc.input],
            expected_output: tc.expected,
            description: tc.name || tc.description || 'Test',
          }
        }
      })

      // Extract function name from reference solution
      // For Python: find the last top-level (unindented) def to skip class methods like __init__
      let functionName = 'solution'
      if (language === 'python' || language === 'python3') {
        const topLevelDefs = [...referenceSolution.matchAll(/^def\s+(\w+)\s*\(/gm)]
        if (topLevelDefs.length > 0) {
          functionName = topLevelDefs[topLevelDefs.length - 1][1]
        } else {
          const pyMatch = referenceSolution.match(/def\s+(\w+)\s*\(/)
          if (pyMatch) functionName = pyMatch[1]
        }
      } else {
        const jsMatch = referenceSolution.match(/function\s+(\w+)\s*\(/) ||
                         referenceSolution.match(/const\s+(\w+)\s*=\s*(?:\(|function)/)
        if (jsMatch) functionName = jsMatch[1]
      }

      console.log('🧪 Validating with execute-tests:', { 
        language, 
        functionName, 
        testCount: cases.length,
        solutionPreview: referenceSolution.substring(0, 120),
        sampleTestCase: cases[0],
      })

      // Call execute/tests endpoint
      const submitResult = await this.makeRequest<{
        success: boolean
        jobId?: string
        status?: string
        statusUrl?: string
        summary?: {
          totalTests: number
          passedTests: number
          failedTests: number
          successRate: number
          allPassed: boolean
        }
        results?: any[]
      }>('/api/execute/tests', {
        method: 'POST',
        body: JSON.stringify({
          userCode: referenceSolution,
          testCases: cases,
          language,
          functionName,
        }),
      })

      // ── Handle async (queued) vs sync (SQL) responses ──
      let result: { summary: { allPassed: boolean; passedTests: number; failedTests: number; totalTests: number }; results: any[] }

      if (submitResult.jobId && submitResult.status === 'queued') {
        // Async path — poll for completion with exponential backoff
        console.log(`⏳ Test job queued: ${submitResult.jobId}, polling...`)
        let pollInterval = 2000   // start at 2s
        const maxInterval = 6000  // cap at 6s
        const timeout = 60000
        const startTime = Date.now()

        while (true) {
          if (Date.now() - startTime > timeout) {
            throw new Error('Test execution timed out after 60 seconds')
          }
          await this.sleep(pollInterval)
          pollInterval = Math.min(pollInterval * 1.5, maxInterval)

          const jobResult = await this.makeRequest<{
            jobId: string
            status: string
            testResult?: {
              success: boolean
              summary: { totalTests: number; passedTests: number; failedTests: number; successRate: number; allPassed: boolean }
              results: any[]
            }
            error?: string
          }>(`/api/execute/runs/${submitResult.jobId}`, {}, false)

          console.log(`🔄 Poll ${submitResult.jobId}: status=${jobResult.status}`)

          if (jobResult.status === 'completed' && jobResult.testResult) {
            result = jobResult.testResult
            break
          }
          if (jobResult.status === 'failed') {
            throw new Error(jobResult.error || 'Test execution failed')
          }
        }
      } else if (submitResult.summary) {
        // Sync path (SQL) — summary already in response
        result = { summary: submitResult.summary, results: submitResult.results || [] }
      } else {
        throw new Error('Unexpected response from execute/tests endpoint')
      }

      // Log detailed results for debugging
      console.log('📊 Validation results summary:', {
        allPassed: result.summary.allPassed,
        passed: result.summary.passedTests,
        failed: result.summary.failedTests,
        total: result.summary.totalTests,
      })

      if (!result.summary.allPassed) {
        console.log('📋 Detailed test results:')
        result.results.forEach((r: any, i: number) => {
          console.log(`  Test ${i + 1}: ${r.passed ? '✅' : '❌'} | output: ${JSON.stringify(r.output)?.substring(0, 200)} | error: ${r.error || 'none'}`)
        })
      }

      return {
        success: true,
        validation: {
          allTestsPassed: result.summary.allPassed,
          passedCount: result.summary.passedTests,
          totalCount: result.summary.totalTests,
          results: result.results,
        },
        readyToPublish: result.summary.allPassed,
      }
    } catch (error) {
      console.error('❌ Validation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation request failed',
        readyToPublish: false,
      }
    }
  }

  /**
   * Save capsule (create in DB) and optionally publish it
   * This is the combined flow: POST /capsules then optionally PUT with isPublished
   */
  async saveCapsuleAndPublish(
    capsule: any,
    options?: { publish?: boolean }
  ): Promise<{
    success: boolean
    capsule?: { id: string; title: string; isPublished: boolean; createdAt: string }
    message?: string
    error?: string
  }> {
    try {
      // Step 1: Create the capsule
      const createResult = await this.makeRequest<{
        success: boolean
        data: { id: string; title: string }
      }>('/api/capsules', {
        method: 'POST',
        body: JSON.stringify(capsule),
      })

      const capsuleId = createResult.data.id
      console.log('✅ Capsule created:', capsuleId)

      // Step 2: If publish requested, update the is_published flag
      if (options?.publish) {
        await this.makeRequest(`/api/capsules/${capsuleId}`, {
          method: 'PUT',
          body: JSON.stringify({ isPublished: true }),
        })
        console.log('✅ Capsule published:', capsuleId)
      }

      return {
        success: true,
        capsule: {
          id: capsuleId,
          title: createResult.data.title,
          isPublished: !!options?.publish,
          createdAt: new Date().toISOString(),
        },
        message: options?.publish ? 'Capsule saved and published!' : 'Capsule saved as draft!',
      }
    } catch (error) {
      console.error('❌ Save failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save capsule',
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Async Generation (with polling)
  // ---------------------------------------------------------------------------

  /**
   * Start async capsule generation
   * Returns a job ID for polling
   */
  async startGeneration(request: GenerationRequest): Promise<{ jobId: string }> {
    return this.makeRequest('/api/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Poll generation job status
   */
  async getJobStatus(jobId: string): Promise<GenerationJob> {
    return this.makeRequest(`/api/generate/${jobId}/status`)
  }

  /**
   * Generate capsule with automatic polling
   * Calls onProgress callback during generation
   */
  async generateCapsule(
    request: GenerationRequest,
    options?: {
      onProgress?: (job: GenerationJob) => void
      pollInterval?: number
      timeout?: number
    }
  ): Promise<GenerateAndExecuteResult> {
    const pollInterval = options?.pollInterval || 3000 // 3 seconds (avoid rate limits)
    const timeout = options?.timeout || 300000 // 5 minutes max
    
    // Start the job
    const { jobId } = await this.startGeneration(request)
    
    const startTime = Date.now()
    
    // Poll until complete
    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Generation timed out after 5 minutes')
      }

      await this.sleep(pollInterval)
      
      const job = await this.getJobStatus(jobId)
      
      // Call progress callback
      options?.onProgress?.(job)
      
      if (job.status === 'completed') {
        // job.result = { capsule, qualityScore, costBreakdown, pipeline }
        // Frontend expects capsule at top level, not nested under .capsule
        const capsuleData = job.result?.capsule || job.result
        return {
          success: true,
          capsule: capsuleData,
          qualityScore: job.result?.qualityScore,
          metadata: job.result?.metadata,
          suggestions: job.result?.suggestions || [],
        }
      }
      
      if (job.status === 'failed') {
        return {
          success: false,
          capsule: null,
          error: job.error || 'Generation failed',
        }
      }
    }
  }

  /**
   * Legacy synchronous generation (for backwards compatibility)
   * @deprecated Use generateCapsule() with polling instead
   */
  async generateCode(request: GenerationRequest): Promise<GenerationResult> {
    console.warn('generateCode() is deprecated. Use generateCapsule() for async generation.')
    
    const result = await this.generateCapsule(request)
    
    return {
      success: result.success,
      code: result.capsule?.solutionCode || '',
      explanation: result.capsule?.explanation,
      concepts: result.capsule?.concepts,
      quality_score: result.qualityScore,
      error: result.error,
      timestamp: Date.now(),
    }
  }

  /**
   * Legacy generate and execute (for backwards compatibility)
   * @deprecated Use generateCapsule() instead
   */
  async generateAndExecute(request: GenerateAndExecuteRequest): Promise<GenerateAndExecuteResult> {
    return this.generateCapsule(request)
  }

  // ---------------------------------------------------------------------------
  // Code Execution
  // ---------------------------------------------------------------------------

  /**
   * Execute code
   * Automatically routes to edge (Python/JS) or Lambda (Java/C++)
   */
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const response = await this.makeRequest<{
      success: boolean
      output?: string
      stdout?: string
      stderr?: string
      exitCode?: number
      executionTime?: number
      runtime?: ExecutionRuntime
      error?: string
    }>('/api/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    return {
      success: response.success,
      stdout: response.stdout || response.output,
      stderr: response.stderr,
      exit_code: response.exitCode,
      execution_time: response.executionTime,
      error: response.error,
      timestamp: Date.now(),
      runtime: response.runtime,
    }
  }

  /**
   * Execute tests for a capsule
   */
  async executeTests(
    code: string,
    language: SupportedLanguage,
    testCases: TestCase[]
  ): Promise<{
    success: boolean
    results: Array<{
      passed: boolean
      input: string
      expected: string
      actual: string
      executionTime?: number
    }>
    summary: {
      total: number
      passed: number
      failed: number
    }
  }> {
    return this.makeRequest('/api/execute/tests', {
      method: 'POST',
      body: JSON.stringify({ code, language, testCases }),
    })
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  /**
   * Get capsule analytics
   */
  async getCapsuleAnalytics(capsuleId: string): Promise<{
    views: number
    completions: number
    avgTime: number
    passRate: number
  }> {
    return this.makeRequest(`/api/analytics/capsule/${capsuleId}`)
  }

  /**
   * Get creator dashboard stats
   */
  async getCreatorStats(): Promise<{
    totalCapsules: number
    totalViews: number
    totalCompletions: number
    avgRating: number
  }> {
    return this.makeRequest('/api/analytics/creator')
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// Exports
// ============================================================================

// Create singleton instance
export const apiClient = new DevcapsulesAPIClient()

// React hook for API client
export const useApiClient = () => {
  return {
    client: apiClient,
    baseUrl: apiClient.getApiUrl(),
    
    // Auth
    login: apiClient.login.bind(apiClient),
    register: apiClient.register.bind(apiClient),
    logout: apiClient.logout.bind(apiClient),
    createApiKey: apiClient.createApiKey.bind(apiClient),
    
    // Capsules
    listCapsules: apiClient.listCapsules.bind(apiClient),
    getCapsule: apiClient.getCapsule.bind(apiClient),
    createCapsule: apiClient.createCapsule.bind(apiClient),
    updateCapsule: apiClient.updateCapsule.bind(apiClient),
    deleteCapsule: apiClient.deleteCapsule.bind(apiClient),
    publishCapsule: apiClient.publishCapsule.bind(apiClient),
    validateCapsule: apiClient.validateCapsule.bind(apiClient),
    saveCapsuleAndPublish: apiClient.saveCapsuleAndPublish.bind(apiClient),
    
    // Generation
    generateCapsule: apiClient.generateCapsule.bind(apiClient),
    startGeneration: apiClient.startGeneration.bind(apiClient),
    getJobStatus: apiClient.getJobStatus.bind(apiClient),
    
    // Execution
    executeCode: apiClient.executeCode.bind(apiClient),
    executeTests: apiClient.executeTests.bind(apiClient),
    
    // Analytics
    getCapsuleAnalytics: apiClient.getCapsuleAnalytics.bind(apiClient),
    getCreatorStats: apiClient.getCreatorStats.bind(apiClient),
    
    // Legacy (deprecated)
    generateCode: apiClient.generateCode.bind(apiClient),
    generateAndExecute: apiClient.generateAndExecute.bind(apiClient),
    
    // Health
    getHealth: apiClient.getHealth.bind(apiClient),
    testConnection: apiClient.testConnection.bind(apiClient),
  }
}

export default apiClient