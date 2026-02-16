/**
 * useAsyncGeneration Hook
 * 
 * React hook for async capsule generation with progress tracking.
 * Supports the new Cloudflare Workers API with queue-based generation.
 */

import { useState, useCallback, useRef } from 'react'
import { apiClient, GenerationRequest, GenerationJob, GenerateAndExecuteResult } from '../lib/api/client'

export type GenerationStage = 
  | 'idle'
  | 'queued'
  | 'analyzing'
  | 'generating-code'
  | 'adding-pedagogy'
  | 'validating'
  | 'completed'
  | 'failed'

export interface GenerationProgress {
  stage: GenerationStage
  progress: number // 0-100
  message: string
  eta?: number // seconds
}

export interface UseAsyncGenerationOptions {
  onProgress?: (progress: GenerationProgress) => void
  onComplete?: (result: GenerateAndExecuteResult) => void
  onError?: (error: Error) => void
  pollInterval?: number // ms
  timeout?: number // ms
}

const STAGE_MESSAGES: Record<string, string> = {
  pending: 'Waiting in queue...',
  processing: 'Processing your request...',
  analyzing: 'Analyzing requirements...',
  'generating-code': 'Generating code with GPT-4o...',
  'adding-pedagogy': 'Adding pedagogical elements...',
  validating: 'Validating test cases...',
  completed: 'Generation complete!',
  failed: 'Generation failed',
}

const STAGE_PROGRESS: Record<string, number> = {
  pending: 10,
  analyzing: 25,
  'generating-code': 50,
  'adding-pedagogy': 75,
  validating: 90,
  completed: 100,
  failed: 0,
}

export function useAsyncGeneration(options: UseAsyncGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: 'idle',
    progress: 0,
    message: '',
  })
  const [result, setResult] = useState<GenerateAndExecuteResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  // Ref to track if generation was cancelled
  const cancelledRef = useRef(false)
  const jobIdRef = useRef<string | null>(null)

  const mapJobToProgress = useCallback((job: GenerationJob): GenerationProgress => {
    const stage = (job.stage || job.status) as GenerationStage
    return {
      stage,
      progress: job.progress ?? STAGE_PROGRESS[stage] ?? 0,
      message: STAGE_MESSAGES[stage] || `Processing: ${stage}`,
      eta: job.eta,
    }
  }, [])

  const generate = useCallback(async (request: GenerationRequest) => {
    // Reset state
    cancelledRef.current = false
    setIsGenerating(true)
    setError(null)
    setResult(null)
    setProgress({
      stage: 'queued',
      progress: 5,
      message: 'Starting generation...',
    })

    try {
      const generationResult = await apiClient.generateCapsule(request, {
        pollInterval: options.pollInterval || 2000,
        timeout: options.timeout || 300000,
        onProgress: (job) => {
          if (cancelledRef.current) return
          
          const newProgress = mapJobToProgress(job)
          setProgress(newProgress)
          options.onProgress?.(newProgress)
          
          // Store job ID for potential cancellation
          jobIdRef.current = job.jobId || null
        },
      })

      if (cancelledRef.current) return

      if (generationResult.success) {
        setProgress({
          stage: 'completed',
          progress: 100,
          message: 'Generation complete!',
        })
        setResult(generationResult)
        options.onComplete?.(generationResult)
      } else {
        throw new Error(generationResult.error || 'Generation failed')
      }
    } catch (err) {
      if (cancelledRef.current) return
      
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setProgress({
        stage: 'failed',
        progress: 0,
        message: error.message,
      })
      options.onError?.(error)
    } finally {
      if (!cancelledRef.current) {
        setIsGenerating(false)
      }
    }
  }, [options, mapJobToProgress])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    setIsGenerating(false)
    setProgress({
      stage: 'idle',
      progress: 0,
      message: 'Cancelled',
    })
    // Note: We could add a cancel endpoint to the API if needed
  }, [])

  const reset = useCallback(() => {
    cancelledRef.current = false
    setIsGenerating(false)
    setProgress({
      stage: 'idle',
      progress: 0,
      message: '',
    })
    setResult(null)
    setError(null)
    jobIdRef.current = null
  }, [])

  return {
    // State
    isGenerating,
    progress,
    result,
    error,
    
    // Actions
    generate,
    cancel,
    reset,
    
    // Utilities
    jobId: jobIdRef.current,
  }
}

export default useAsyncGeneration
