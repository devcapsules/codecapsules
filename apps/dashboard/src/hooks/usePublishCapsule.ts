/**
 * Publish Capsule Hook
 * 
 * Hook for validating and publishing capsules to the database.
 * Workflow:
 * 1. Validate — run reference solution against test cases via /execute-tests
 * 2. Save — create capsule via POST /capsules
 * 3. Publish — set is_published via PUT /capsules/:id
 */

import { useState, useCallback } from 'react'
import { useApiClient } from '../lib/api/client'

interface ValidationResult {
  success: boolean
  validation?: {
    allTestsPassed: boolean
    passedCount: number
    totalCount: number
    results?: any[]
  }
  readyToPublish?: boolean
  error?: string
}

interface PublishResult {
  success: boolean
  capsule?: {
    id: string
    title: string
    isPublished: boolean
    createdAt: string
  }
  message?: string
  error?: string
}

interface UsePublishCapsuleState {
  isValidating: boolean
  isPublishing: boolean
  validationResult: ValidationResult | null
  publishResult: PublishResult | null
  error: string | null
}

interface UsePublishCapsuleActions {
  validateCapsule: (capsule: any, testCases?: any[]) => Promise<ValidationResult | null>
  publishCapsule: (capsule: any, options?: { publish?: boolean }) => Promise<PublishResult | null>
  validateAndPublish: (capsule: any, testCases?: any[]) => Promise<PublishResult | null>
  clearResults: () => void
}

export type UsePublishCapsuleReturn = UsePublishCapsuleState & UsePublishCapsuleActions

export function usePublishCapsule(): UsePublishCapsuleReturn {
  const { client } = useApiClient()
  
  // State
  const [isValidating, setIsValidating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Validate capsule — runs reference solution against test cases via execute-tests
  const validateCapsule = useCallback(async (capsule: any, testCases?: any[]): Promise<ValidationResult | null> => {
    setIsValidating(true)
    setError(null)
    
    try {
      console.log('🧪 Validating capsule:', capsule.title)
      
      const result = await client.validateCapsule(capsule, testCases)
      
      setValidationResult(result)
      
      if (result.success && result.readyToPublish) {
        console.log('✅ Validation passed:', result.validation)
      } else if (result.success && !result.readyToPublish) {
        const msg = `Validation failed: ${result.validation?.passedCount}/${result.validation?.totalCount} tests passed`
        setError(msg)
        console.warn('⚠️', msg)
      } else {
        setError(result.error || 'Validation failed')
        console.error('❌ Validation error:', result.error)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation request failed'
      setError(errorMessage)
      console.error('❌ Validation request failed:', error)
      return null
    } finally {
      setIsValidating(false)
    }
  }, [client])

  // Save/Publish capsule — creates in DB and optionally publishes
  const publishCapsule = useCallback(async (capsule: any, options?: { publish?: boolean }): Promise<PublishResult | null> => {
    setIsPublishing(true)
    setError(null)
    
    try {
      console.log('🚀 Saving capsule:', capsule.title)
      
      const result = await client.saveCapsuleAndPublish(capsule, options)
      
      if (result.success) {
        setPublishResult(result)
        console.log('✅ Save successful:', result.message)
      } else {
        setError(result.error || 'Save failed')
        console.error('❌ Save failed:', result.error)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save request failed'
      setError(errorMessage)
      console.error('❌ Save request failed:', error)
      return null
    } finally {
      setIsPublishing(false)
    }
  }, [client])

  // Combined validate → save → publish workflow
  const validateAndPublish = useCallback(async (capsule: any, testCases?: any[]): Promise<PublishResult | null> => {
    // Step 1: Validate
    console.log('🔄 Step 1: Validating capsule...')
    const validation = await validateCapsule(capsule, testCases)
    
    if (!validation?.success || !validation?.readyToPublish) {
      const msg = validation?.error || 
        `Validation failed: ${validation?.validation?.passedCount || 0}/${validation?.validation?.totalCount || 0} tests passed. Fix the solution or test cases and try again.`
      setError(msg)
      return null
    }
    
    // Step 2: Save and Publish
    console.log('🔄 Step 2: Saving and publishing capsule...')
    return await publishCapsule(capsule, { publish: true })
  }, [validateCapsule, publishCapsule])

  // Clear all results
  const clearResults = useCallback(() => {
    setValidationResult(null)
    setPublishResult(null)
    setError(null)
  }, [])

  return {
    // State
    isValidating,
    isPublishing,
    validationResult,
    publishResult,
    error,
    
    // Actions
    validateCapsule,
    publishCapsule,
    validateAndPublish,
    clearResults
  }
}