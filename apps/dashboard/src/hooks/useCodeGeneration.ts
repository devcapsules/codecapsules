/**
 * Code Generation Hook
 * 
 * React hook for generating and executing code using the CodeCapsule API.
 * Provides state management and error handling for the generation process.
 */

import { useState, useCallback } from 'react'
import { useApiClient } from '../lib/api/client'
import type { 
  GenerationRequest, 
  ExecutionRequest, 
  GenerationResult, 
  ExecutionResult,
  GenerateAndExecuteRequest,
  GenerateAndExecuteResult 
} from '../lib/api/client'

interface UseCodeGenerationState {
  // Generation state
  isGenerating: boolean
  generationResult: GenerationResult | null
  generationError: string | null
  
  // Execution state
  isExecuting: boolean
  executionResult: ExecutionResult | null
  executionError: string | null
  
  // Combined state
  isCombinedProcessing: boolean
  combinedResult: GenerateAndExecuteResult | null
  combinedError: string | null
}

interface UseCodeGenerationActions {
  generateCode: (request: GenerationRequest) => Promise<GenerationResult | null>
  executeCode: (request: ExecutionRequest) => Promise<ExecutionResult | null>
  generateAndExecute: (request: GenerateAndExecuteRequest) => Promise<GenerateAndExecuteResult | null>
  clearResults: () => void
  clearErrors: () => void
}

export type UseCodeGenerationReturn = UseCodeGenerationState & UseCodeGenerationActions

export function useCodeGeneration(): UseCodeGenerationReturn {
  const { client } = useApiClient()

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Execution state  
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)

  // Combined state
  const [isCombinedProcessing, setIsCombinedProcessing] = useState(false)
  const [combinedResult, setCombinedResult] = useState<GenerateAndExecuteResult | null>(null)
  const [combinedError, setCombinedError] = useState<string | null>(null)

  const generateCode = useCallback(async (request: GenerationRequest): Promise<GenerationResult | null> => {
    setIsGenerating(true)
    setGenerationError(null)
    
    try {
      console.log('🤖 Generating code with AI:', request)
      const result = await client.generateCode(request)
      
      if (result.success) {
        setGenerationResult(result)
        console.log('✅ Code generation successful:', result.code.substring(0, 100) + '...')
      } else {
        setGenerationError(result.error || 'Generation failed')
        console.error('❌ Code generation failed:', result.error)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation request failed'
      setGenerationError(errorMessage)
      console.error('❌ Code generation request failed:', error)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [client])

  const executeCode = useCallback(async (request: ExecutionRequest): Promise<ExecutionResult | null> => {
    setIsExecuting(true)
    setExecutionError(null)
    
    try {
      console.log('⚡ Executing code:', request.language, request.source_code.substring(0, 50) + '...')
      const result = await client.executeCode(request)
      
      if (result.success) {
        setExecutionResult(result)
        console.log('✅ Code execution successful. Output:', result.stdout)
      } else {
        setExecutionError(result.error || 'Execution failed')
        console.error('❌ Code execution failed:', result.error)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Execution request failed'
      setExecutionError(errorMessage)
      console.error('❌ Code execution request failed:', error)
      return null
    } finally {
      setIsExecuting(false)
    }
  }, [client])

  const generateAndExecute = useCallback(async (request: GenerateAndExecuteRequest): Promise<GenerateAndExecuteResult | null> => {
    setIsCombinedProcessing(true)
    setCombinedError(null)
    
    // Clear previous results
    setGenerationResult(null)
    setExecutionResult(null)
    setGenerationError(null)
    setExecutionError(null)
    
    try {
      console.log('🔄 Generate + Execute workflow:', request)
      const result = await client.generateAndExecute(request)
      
      if (result.success) {
        setCombinedResult(result)
        // Also set individual results for display
        setGenerationResult(result.generation)
        setExecutionResult(result.execution)
        console.log('✅ Generate + Execute successful:', {
          generated: result.generation.success,
          executed: result.execution.success,
          combined: result.combined_success
        })
      } else {
        setCombinedError(result.error || 'Generate + Execute failed')
        console.error('❌ Generate + Execute failed:', result.error)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generate + Execute request failed'
      setCombinedError(errorMessage)
      console.error('❌ Generate + Execute request failed:', error)
      return null
    } finally {
      setIsCombinedProcessing(false)
    }
  }, [client])

  const clearResults = useCallback(() => {
    setGenerationResult(null)
    setExecutionResult(null)
    setCombinedResult(null)
  }, [])

  const clearErrors = useCallback(() => {
    setGenerationError(null)
    setExecutionError(null)
    setCombinedError(null)
  }, [])

  return {
    // State
    isGenerating,
    generationResult,
    generationError,
    isExecuting,
    executionResult,
    executionError,
    isCombinedProcessing,
    combinedResult,
    combinedError,
    
    // Actions
    generateCode,
    executeCode,
    generateAndExecute,
    clearResults,
    clearErrors,
  }
}

// Convenience hook for quick code generation + execution
export function useQuickCodeGen() {
  const { generateAndExecute, isCombinedProcessing, combinedResult, combinedError } = useCodeGeneration()
  
  const quickGenerate = useCallback(async (
    prompt: string, 
    language: 'python' | 'javascript' | 'java' | 'csharp' | 'go' | 'sql' = 'python',
    input = ''
  ) => {
    return generateAndExecute({
      prompt,
      language,
      difficulty: 'medium',
      input,
    })
  }, [generateAndExecute])

  return {
    quickGenerate,
    isLoading: isCombinedProcessing,
    result: combinedResult,
    error: combinedError,
  }
}