/**
 * API Context Provider
 * 
 * Manages API connection state and provides methods for
 * interacting with the Devcapsules API server.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient, HealthStatus } from '../lib/api/client'

interface APIContextType {
  // Connection state
  isConnected: boolean
  isLoading: boolean
  health: HealthStatus | null
  error: string | null
  
  // API methods
  checkConnection: () => Promise<void>
  refreshHealth: () => Promise<void>
  
  // Configuration
  apiUrl: string
  executionMode: 'local' | 'serverless' | 'unknown'
}

const APIContext = createContext<APIContextType | undefined>(undefined)

interface APIProviderProps {
  children: ReactNode
}

export function APIProvider({ children }: APIProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = apiClient.getApiUrl()

  const checkConnection = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const connected = await apiClient.testConnection()
      setIsConnected(connected)
      
      if (connected) {
        await refreshHealth()
      } else {
        setError('Failed to connect to API server')
      }
    } catch (err) {
      setIsConnected(false)
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshHealth = async () => {
    try {
      const healthStatus = await apiClient.getHealth()
      setHealth(healthStatus)
      setIsConnected(true)
      setError(null)
    } catch (err) {
      setHealth(null)
      setIsConnected(false)
      setError(err instanceof Error ? err.message : 'Health check failed')
    }
  }

  // Check connection on mount and periodically
  useEffect(() => {
    checkConnection()
    
    // Refresh health status every 5 minutes (reduced from 30 seconds to save Redis requests)
    const interval = setInterval(refreshHealth, 300000)
    
    return () => clearInterval(interval)
  }, [])

  const executionMode = health?.execution_mode || 'unknown'

  const contextValue: APIContextType = {
    isConnected,
    isLoading,
    health,
    error,
    checkConnection,
    refreshHealth,
    apiUrl,
    executionMode,
  }

  return (
    <APIContext.Provider value={contextValue}>
      {children}
    </APIContext.Provider>
  )
}

export function useAPI() {
  const context = useContext(APIContext)
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider')
  }
  return context
}

// Connection status component for debugging/monitoring
export function APIConnectionStatus() {
  const { isConnected, isLoading, health, error, apiUrl, executionMode } = useAPI()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        <span>Connecting to API...</span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-500">
        <div className="w-2 h-2 bg-red-400 rounded-full" />
        <span>API Disconnected</span>
        {error && <span>({error})</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-green-500">
      <div className="w-2 h-2 bg-green-400 rounded-full" />
      <span>API Connected</span>
      <div className="flex items-center space-x-1 text-xs text-gray-400">
        <span>•</span>
        <span>{executionMode}</span>
        {health?.supported_languages && (
          <>
            <span>•</span>
            <span>{health.supported_languages.length} languages</span>
          </>
        )}
      </div>
    </div>
  )
}