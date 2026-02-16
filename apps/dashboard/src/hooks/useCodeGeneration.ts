/**
 * Code Generation Hook
 * 
 * React hook for generating and executing code using the Devcapsules API.
 * Provides state management and error handling for the generation process.
 */

import { useState, useCallback, useRef } from 'react'
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

export type UseCodeGenerationReturn = UseCodeGenerationState & UseCodeGenerationActions & {
  progress: number
  currentStep: string
  steps: string[]
}

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

  // Progress tracking for polling
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [steps, setSteps] = useState<string[]>([])
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Client-side simulated progress steps to fill gaps during long backend waits
  const SIMULATED_STEPS = [
    { time: 0,  message: 'Starting generation...', progress: 2 },
    { time: 4,  message: 'Waiting in queue...', progress: 5 },
    { time: 8,  message: 'Warming up AI agents...', progress: 12 },
    { time: 13, message: 'AI agents analyzing your prompt...', progress: 22 },
    { time: 19, message: 'Crafting your exercise...', progress: 35 },
    { time: 26, message: 'Writing code solution...', progress: 48 },
    { time: 34, message: 'Adding test cases...', progress: 60 },
    { time: 42, message: 'Quality checking...', progress: 72 },
    { time: 50, message: 'Almost there...', progress: 83 },
    { time: 58, message: 'Finalizing your capsule...', progress: 90 },
  ]

  const startProgressSimulation = useCallback(() => {
    const startTime = Date.now()
    let lastStepIndex = -1

    // Clear any existing timer
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
    }

    simulationTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000

      // Find the latest simulated step we should show
      let stepIndex = -1
      for (let i = SIMULATED_STEPS.length - 1; i >= 0; i--) {
        if (elapsed >= SIMULATED_STEPS[i].time) {
          stepIndex = i
          break
        }
      }

      if (stepIndex > lastStepIndex && stepIndex < SIMULATED_STEPS.length) {
        lastStepIndex = stepIndex
        const step = SIMULATED_STEPS[stepIndex]
        setCurrentStep(step.message)
        setProgress(step.progress)
      }
    }, 1000) // Check every second for smooth transitions
  }, [])

  const stopProgressSimulation = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
  }, [])
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
    setProgress(0)
    setCurrentStep('Starting generation...')
    setSteps([])
    
    // Clear previous results
    setGenerationResult(null)
    setExecutionResult(null)
    setGenerationError(null)
    setExecutionError(null)
    
    // Start client-side progress simulation for smooth UX
    startProgressSimulation()
    
    try {
      console.log('🔄 Generate + Execute workflow:', request)
      const result = await client.generateCapsule(request, {
        onProgress: (job) => {
          // Only override simulation when backend reports high progress (real milestones)
          const backendProgress = job.progress || 0
          if (backendProgress >= 90) {
            stopProgressSimulation()
            setProgress(backendProgress)
            setCurrentStep(job.currentStep || 'Finalizing...')
          }
          if (job.steps) setSteps(job.steps)
        },
        pollInterval: 3000,
      })
      
      // Stop simulation on completion
      stopProgressSimulation()
      
      if (result.success) {
        setProgress(100)
        setCurrentStep('Done!')
        setCombinedResult(result)
        console.log('✅ Generate + Execute successful:', {
          generated: result.success,
          capsule: !!result.capsule,
          quality: result.qualityScore
        })
      } else {
        setCombinedError(result.error || 'Generate + Execute failed')
        console.error('❌ Generate + Execute failed:', result.error)
      }
      
      return result
    } catch (error) {
      stopProgressSimulation()
      const errorMessage = error instanceof Error ? error.message : 'Generate + Execute request failed'
      setCombinedError(errorMessage)
      console.error('❌ Generate + Execute request failed:', error)
      return null
    } finally {
      stopProgressSimulation()
      setIsCombinedProcessing(false)
    }
  }, [client, startProgressSimulation, stopProgressSimulation])

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
    progress,
    currentStep,
    steps,
    
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