import React, { useState, useEffect } from 'react'
import CodeCapsuleEmbed from './codecapsuleEmbed'
import SQLCapsuleEmbed from './SQLCapsuleEmbed'
import TerminalCapsuleEmbed from './TerminalCapsuleEmbed'

interface CapsuleEmbedProps {
  widgetId: string
}

interface BaseCapsule {
  id: string
  title: string
  description: string
  type: 'CODE' | 'SQL' | 'TERMINAL' | 'DATABASE'
  language?: string
  difficulty: string
  isPublished: boolean
  createdAt: string
}

export default function AdaptiveCapsuleEmbed({ widgetId }: CapsuleEmbedProps) {
  const [capsule, setCapsule] = useState<BaseCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        
        // Phase 2: Try R2/CDN first, fallback to API
        let response
        let dataSource = 'api'
        
        try {
          // Try CDN first (much faster, no DB connection)
          const cdnUrl = `https://cdn.devcapsules.com/capsules/${widgetId}.json`
          const cdnResponse = await fetch(cdnUrl, {
            headers: { 'Accept': 'application/json' }
          })
          
          if (cdnResponse.ok) {
            response = cdnResponse
            dataSource = 'cdn'
            console.log('🚀 AdaptiveCapsuleEmbed: Loaded from CDN (fast path)')
          } else {
            throw new Error(`CDN response: ${cdnResponse.status}`)
          }
        } catch (cdnError) {
          // Fallback to API (slower, hits database)
          console.log('⚠️ CDN failed, falling back to API:', cdnError.message)
          response = await fetch(`${apiUrl}/api/capsules/${widgetId}`)
          dataSource = 'api'
        }
        
        if (!response.ok) {
          throw new Error(`Failed to load capsule (${dataSource})`)
        }
        
        const data = await response.json()
        
        // Handle different response formats
        let capsuleData
        if (dataSource === 'cdn') {
          // CDN returns direct capsule JSON
          capsuleData = data
        } else {
          // API returns { success: true, capsule: {...} }
          if (!data.success || !data.capsule) {
            throw new Error(data.error || 'Failed to load capsule')
          }
          capsuleData = data.capsule
        }
        
        console.log(`🔍 AdaptiveCapsuleEmbed loaded from ${dataSource.toUpperCase()}:`, {
          id: capsuleData.id,
          type: capsuleData.type,
          title: capsuleData.title,
          source: dataSource
        })
        
        setCapsule(capsuleData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCapsule()
  }, [widgetId])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading capsule: {error}</p>
      </div>
    )
  }

  if (!capsule) {
    return (
      <div className="error-container">
        <p>Capsule not found</p>
      </div>
    )
  }

  // Adaptive rendering based on capsule type (case-insensitive)
  const capsuleType = (capsule.type || 'code').toUpperCase()
  const capsuleLanguage = (capsule.language || '').toLowerCase()
  
  // Auto-detect SQL capsules by language if type is CODE
  if (capsuleType === 'CODE' && capsuleLanguage === 'sql') {
    return <SQLCapsuleEmbed widgetId={widgetId} />
  }
  
  switch (capsuleType) {
    case 'CODE':
      return <CodeCapsuleEmbed widgetId={widgetId} />
    
    case 'DATABASE':
    case 'SQL':
      return <SQLCapsuleEmbed widgetId={widgetId} />
    
    case 'TERMINAL':
      return <TerminalCapsuleEmbed widgetId={widgetId} />
    
    default:
      // Fallback to code embed for unknown types
      return <CodeCapsuleEmbed widgetId={widgetId} />
  }
}