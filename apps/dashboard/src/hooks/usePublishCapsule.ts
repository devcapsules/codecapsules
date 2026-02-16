/**
 * Publish Capsule Hook
 * 
 * Hook for validating and publishing capsules to the database using the correct API endpoints.
 * This replaces the old save functionality with the proper workflow:
 * 1. Validate capsule (test cases)
 * 2. Publish to database
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

  // Validate capsule (test cases)
  const validateCapsule = useCallback(async (capsule: any, testCases?: any[]): Promise<ValidationResult | null> => {
    setIsValidating(true)
    setError(null)
    
    try {
      console.log('🧪 Validating capsule:', capsule.title)
      
      // Extract test cases from capsule if not provided
      const casesToTest = testCases || capsule.content?.primary?.code?.wasmVersion?.testCases || []
      
      const result = await client.validateCapsule(capsule, casesToTest)
      
      if (result.success) {
        setValidationResult(result)
        console.log('✅ Validation successful:', result.validation)
      } else {
        setError(result.error || 'Validation failed')
        console.error('❌ Validation failed:', result.error)
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

  // Publish capsule to database
  const publishCapsule = useCallback(async (capsule: any, options?: { publish?: boolean }): Promise<PublishResult | null> => {
    setIsPublishing(true)
    setError(null)
    
    try {
      console.log('🚀 Publishing capsule:', capsule.title)
      
      const result = await client.publishCapsule(capsule, options)
      
      if (result.success) {
        setPublishResult(result)
        console.log('✅ Publish successful:', result.message)
      } else {
        setError(result.error || 'Publish failed')
        console.error('❌ Publish failed:', result.error)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Publish request failed'
      setError(errorMessage)
      console.error('❌ Publish request failed:', error)
      return null
    } finally {
      setIsPublishing(false)
    }
  }, [client])

  // Combined validate and publish workflow
  const validateAndPublish = useCallback(async (capsule: any, testCases?: any[]): Promise<PublishResult | null> => {
    // Step 1: Validate
    const validation = await validateCapsule(capsule, testCases)
    
    if (!validation?.success || !validation?.readyToPublish) {
      setError('Capsule validation failed. Cannot publish.')
      return null
    }
    
    // Step 2: Publish
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