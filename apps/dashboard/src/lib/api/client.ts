/**
 * CodeCapsule API Client
 * 
 * Connects the frontend to the API server for AI generation and code execution.
 * Supports both development and production environments with automatic detection.
 */

export interface GenerationRequest {
  prompt: string
  language: 'python' | 'javascript' | 'java' | 'csharp' | 'go' | 'sql'
  difficulty?: 'easy' | 'medium' | 'hard'
  concepts?: string[]
}

export interface ExecutionRequest {
  source_code: string
  language: 'python' | 'javascript' | 'java' | 'csharp' | 'go' | 'sql'
  input?: string
  time_limit?: number
  memory_limit?: number
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
}

export interface GenerateAndExecuteRequest extends GenerationRequest {
  input?: string
}

export interface GenerateAndExecuteResult {
  success: boolean
  generation: GenerationResult
  execution: ExecutionResult
  combined_success: boolean
  error?: string
}

export interface HealthStatus {
  status: string
  timestamp: string
  ai_service: 'connected' | 'mock'
  execution_mode: 'local' | 'serverless'
  aws_gateway: string
  supported_languages: Array<{
    language: string
    runtime: 'native' | 'container'
    maxMemory: number
    maxTimeout: number
  }>
}

class CodeCapsuleAPIClient {
  private baseUrl: string
  
  constructor() {
    // Environment-based API URL detection
    this.baseUrl = this.detectApiUrl()
  }

  private detectApiUrl(): string {
    // Check for explicit API URL in environment
    if (typeof window !== 'undefined') {
      // Client-side: check for build-time env vars
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    } else {
      // Server-side: check for server env vars
      return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ API Response: ${endpoint}`, data)
      
      return data
    } catch (error) {
      console.error(`❌ API Request Failed: ${endpoint}`, error)
      throw error
    }
  }

  /**
   * Check API server health and configuration
   */
  async getHealth(): Promise<HealthStatus> {
    return this.makeRequest<HealthStatus>('/health')
  }

  /**
   * Generate code using AI
   */
  async generateCode(request: GenerationRequest): Promise<GenerationResult> {
    return this.makeRequest<GenerationResult>('/api/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Execute code using serverless runtime
   */
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    return this.makeRequest<ExecutionResult>('/api/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Generate and execute code in one request (optimal for UX)
   */
  async generateAndExecute(request: GenerateAndExecuteRequest): Promise<GenerateAndExecuteResult> {
    return this.makeRequest<GenerateAndExecuteResult>('/api/generate-and-execute', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Get current API configuration
   */
  getApiUrl(): string {
    return this.baseUrl
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.getHealth()
      return health.status === 'ok'
    } catch {
      return false
    }
  }
}

// Create singleton instance
export const apiClient = new CodeCapsuleAPIClient()

// Convenience hooks for React components
export const useApiClient = () => {
  return {
    client: apiClient,
    baseUrl: apiClient.getApiUrl(),
    generateCode: apiClient.generateCode.bind(apiClient),
    executeCode: apiClient.executeCode.bind(apiClient),
    generateAndExecute: apiClient.generateAndExecute.bind(apiClient),
    getHealth: apiClient.getHealth.bind(apiClient),
    testConnection: apiClient.testConnection.bind(apiClient),
  }
}

export default apiClient