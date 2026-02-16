/**
 * PlaylistWidget - Embeddable B2B Course Player
 * 
 * This is the main widget that gets embedded in customer websites via iframe.
 * It displays an entire course sequence as a unified learning experience.
 * 
 * Key Features:
 * - Self-contained React component (works in any iframe)
 * - Progressive disclosure (one capsule at a time)
 * - Automatic navigation between capsules
 * - Progress tracking and persistence
 * - Responsive design for various container sizes
 * - No external dependencies (self-sufficient)
 */

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, CheckCircle, Clock, BookOpen } from 'lucide-react'
import clsx from 'clsx'

import type { 
  PlaylistWithCapsules as CorePlaylistWithCapsules, 
  PlaylistProgress as CorePlaylistProgress,
  PlaylistWidgetProps as CorePlaylistWidgetProps,
  BaseCapsule 
} from '@codecapsule/core'

// ===== EXTENDED WIDGET INTERFACES =====

// Extended PlaylistWidgetProps with UI-specific features
interface PlaylistWidgetProps extends CorePlaylistWidgetProps {
  embedToken: string
  height?: string
  width?: string
  autoAdvance?: boolean
  showNavigation?: boolean
  onComplete?: (progress: UIPlaylistProgress) => void
  onProgress?: (progress: UIPlaylistProgress) => void
  onError?: (error: string) => void
  customStyles?: React.CSSProperties
  apiBaseUrl?: string
}

// UI-friendly playlist structure
interface PlaylistWithCapsules extends CorePlaylistWithCapsules {
  capsules: BaseCapsule[] // Derived from items
}

// UI-friendly progress structure
interface UIPlaylistProgress {
  total_capsules: number
  completed_capsules: number
  current_capsule_id: string | null
  completion_percentage: number
  time_spent_seconds: number
}

interface PlaylistWidgetInternalState {
  isLoading: boolean
  error: string | null
  playlist: PlaylistWithCapsules | null
  currentCapsule: BaseCapsule | null
  completedCapsules: Set<string>
  currentCapsuleIndex: number
  progress: UIPlaylistProgress
  startTime: number | null
  timeSpent: number // seconds
}

// ===== TYPE TRANSFORMATION UTILITIES =====

function transformPlaylistForUI(corePlaylist: CorePlaylistWithCapsules): PlaylistWithCapsules {
  return {
    ...corePlaylist,
    capsules: corePlaylist.items.map(item => item.capsule)
  }
}

// ===== MAIN WIDGET COMPONENT =====

export function PlaylistWidget({
  playlistId,
  embedToken,
  theme = 'light',
  height = '600px',
  width = '100%',
  autoAdvance = true,
  showProgress = true,
  showNavigation = true,
  onComplete,
  onProgress,
  onError,
  customStyles = {},
  apiBaseUrl = 'https://api.devcapsules.com'
}: PlaylistWidgetProps): JSX.Element {
  
  // ===== STATE MANAGEMENT =====
  
  const [state, setState] = useState<PlaylistWidgetInternalState>({
    isLoading: true,
    error: null,
    playlist: null,
    currentCapsule: null,
    completedCapsules: new Set(),
    currentCapsuleIndex: 0,
    progress: {
      total_capsules: 0,
      completed_capsules: 0,
      current_capsule_id: null,
      completion_percentage: 0,
      time_spent_seconds: 0
    },
    startTime: null,
    timeSpent: 0
  })

  // ===== DATA FETCHING =====
  
  const fetchPlaylist = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch(`${apiBaseUrl}/api/playlists/${playlistId}/embed`, {
        headers: {
          'Authorization': `Bearer ${embedToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load playlist: ${response.statusText}`)
      }
      
      const corePlaylist: CorePlaylistWithCapsules = await response.json()
      const playlist = transformPlaylistForUI(corePlaylist)
      
      if (!playlist.capsules || playlist.capsules.length === 0) {
        throw new Error('Playlist contains no capsules')
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        playlist,
        currentCapsule: playlist.capsules[0],
        currentCapsuleIndex: 0,
        progress: {
          total_capsules: playlist.capsules.length,
          completed_capsules: 0,
          current_capsule_id: playlist.capsules[0].id,
          completion_percentage: 0,
          time_spent_seconds: 0
        },
        startTime: Date.now()
      }))
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }))
      onError?.(errorMessage)
    }
  }, [playlistId, embedToken, apiBaseUrl, onError])

  // Load playlist on mount
  useEffect(() => {
    fetchPlaylist()
  }, [fetchPlaylist])

  // ===== TIME TRACKING =====
  
  useEffect(() => {
    if (!state.startTime) return

    const interval = setInterval(() => {
      setState(prev => {
        const newTimeSpent = Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000)
        const updatedProgress = {
          ...prev.progress,
          time_spent_seconds: newTimeSpent
        }
        
        // Report progress periodically
        onProgress?.(updatedProgress)
        
        return {
          ...prev,
          timeSpent: newTimeSpent,
          progress: updatedProgress
        }
      })
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [state.startTime, onProgress])

  // ===== NAVIGATION HANDLERS =====
  
  const handleCapsuleComplete = useCallback((capsuleId: string) => {
    setState(prev => {
      const newCompletedCapsules = new Set(prev.completedCapsules)
      newCompletedCapsules.add(capsuleId)
      
      const completedCount = newCompletedCapsules.size
      const totalCapsules = prev.playlist?.capsules.length || 0
      const completionPercentage = totalCapsules > 0 ? (completedCount / totalCapsules) * 100 : 0
      
      const updatedProgress: UIPlaylistProgress = {
        total_capsules: totalCapsules,
        completed_capsules: completedCount,
        current_capsule_id: capsuleId,
        completion_percentage: completionPercentage,
        time_spent_seconds: prev.timeSpent
      }

      // Check if playlist is complete
      if (completedCount === totalCapsules) {
        onComplete?.(updatedProgress)
      }

      // Auto-advance to next capsule if enabled
      if (autoAdvance && prev.currentCapsuleIndex < totalCapsules - 1) {
        const nextIndex = prev.currentCapsuleIndex + 1
        const nextCapsule = prev.playlist?.capsules[nextIndex]
        
        return {
          ...prev,
          completedCapsules: newCompletedCapsules,
          currentCapsuleIndex: nextIndex,
          currentCapsule: nextCapsule || null,
          progress: {
            ...updatedProgress,
            current_capsule_id: nextCapsule?.id || null
          }
        }
      }

      return {
        ...prev,
        completedCapsules: newCompletedCapsules,
        progress: updatedProgress
      }
    })
  }, [autoAdvance, onComplete])

  const navigateToCapsule = useCallback((index: number) => {
    if (!state.playlist || index < 0 || index >= state.playlist.capsules.length) return
    
    const capsule = state.playlist.capsules[index]
    setState(prev => ({
      ...prev,
      currentCapsuleIndex: index,
      currentCapsule: capsule,
      progress: {
        ...prev.progress,
        current_capsule_id: capsule.id
      }
    }))
  }, [state.playlist])

  const handlePrevious = () => {
    if (state.currentCapsuleIndex > 0) {
      navigateToCapsule(state.currentCapsuleIndex - 1)
    }
  }

  const handleNext = () => {
    if (state.playlist && state.currentCapsuleIndex < state.playlist.capsules.length - 1) {
      navigateToCapsule(state.currentCapsuleIndex + 1)
    }
  }

  // ===== RENDER HELPERS =====
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCapsuleIcon = (capsule: BaseCapsule, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-500" />
    if (isCurrent) return <Play className="w-5 h-5 text-blue-500" />
    return <BookOpen className="w-5 h-5 text-gray-400" />
  }

  // ===== ERROR/LOADING STATES =====
  
  if (state.isLoading) {
    return (
      <div 
        className={clsx(
          'flex items-center justify-center bg-gray-50',
          theme === 'dark' && 'bg-gray-900'
        )}
        style={{ height, width, ...customStyles }}
      >
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={clsx('text-sm', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
            Loading course...
          </p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div 
        className={clsx(
          'flex items-center justify-center bg-red-50 border border-red-200',
          theme === 'dark' && 'bg-red-900/20 border-red-800'
        )}
        style={{ height, width, ...customStyles }}
      >
        <div className="text-center space-y-2 p-6">
          <div className="text-red-500 text-xl">⚠️</div>
          <p className={clsx('text-sm font-medium', theme === 'dark' ? 'text-red-300' : 'text-red-700')}>
            Failed to load course
          </p>
          <p className={clsx('text-xs', theme === 'dark' ? 'text-red-400' : 'text-red-600')}>
            {state.error}
          </p>
          <button
            onClick={fetchPlaylist}
            className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!state.playlist || !state.currentCapsule) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50"
        style={{ height, width, ...customStyles }}
      >
        <p className="text-gray-500 text-sm">No course content available</p>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  
  return (
    <div 
      className={clsx(
        'flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden',
        theme === 'dark' && 'bg-gray-900 border-gray-700'
      )}
      style={{ height, width, ...customStyles }}
    >
      
      {/* Header with Title and Progress */}
      <div className={clsx(
        'px-4 py-3 border-b flex items-center justify-between',
        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      )}>
        <div className="flex-1 min-w-0">
          <h2 className={clsx(
            'text-lg font-semibold truncate',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {state.playlist.title}
          </h2>
          <p className={clsx(
            'text-sm truncate',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          )}>
            {state.currentCapsule.title}
          </p>
        </div>
        
        {showProgress && (
          <div className="ml-4 flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {formatTime(state.timeSpent)}
            </span>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {state.progress.completed_capsules}/{state.progress.total_capsules}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className={clsx(
          'h-1 bg-gray-200',
          theme === 'dark' && 'bg-gray-700'
        )}>
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${state.progress.completion_percentage}%` }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex">
        
        {/* Sidebar with Capsule List */}
        {showNavigation && state.playlist.capsules.length > 1 && (
          <div className={clsx(
            'w-64 border-r flex-shrink-0 overflow-y-auto',
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          )}>
            <div className="p-3">
              <h3 className={clsx(
                'text-sm font-medium mb-3',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              )}>
                Course Content
              </h3>
              <div className="space-y-1">
                {state.playlist.capsules.map((capsule, index) => {
                  const isCompleted = state.completedCapsules.has(capsule.id)
                  const isCurrent = index === state.currentCapsuleIndex
                  
                  return (
                    <button
                      key={capsule.id}
                      onClick={() => navigateToCapsule(index)}
                      className={clsx(
                        'w-full text-left p-2 rounded text-sm transition-colors flex items-center space-x-2',
                        isCurrent 
                          ? theme === 'dark' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-100 text-blue-900'
                          : isCompleted
                            ? theme === 'dark'
                              ? 'bg-green-600/20 text-green-300 hover:bg-green-600/30'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-600 hover:bg-white'
                      )}
                    >
                      {getCapsuleIcon(capsule, isCompleted, isCurrent)}
                      <span className="flex-1 truncate">
                        {index + 1}. {capsule.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Capsule Content Area */}
        <div className="flex-1 flex flex-col">
          
          {/* Capsule Title */}
          <div className={clsx(
            'px-4 py-3 border-b',
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          )}>
            <h3 className={clsx(
              'text-lg font-medium',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {state.currentCapsule.title}
            </h3>
          </div>

          {/* Capsule Runtime - This will be replaced with actual capsule execution */}
          <div className="flex-1 p-4">
            <div className={clsx(
              'h-full rounded-lg border-2 border-dashed flex items-center justify-center',
              theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
            )}>
              <div className="text-center space-y-2">
                <div className="text-4xl">
                  {state.currentCapsule.capsule_type === 'CODE' ? '💻' : 
                   state.currentCapsule.capsule_type === 'DATABASE' ? '🗄️' : '⌨️'}
                </div>
                <p className={clsx(
                  'text-sm font-medium',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                )}>
                  {state.currentCapsule.capsule_type} Exercise
                </p>
                <p className={clsx(
                  'text-xs',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  Runtime component will be embedded here
                </p>
                
                {/* Temporary Complete Button for Testing */}
                {!state.completedCapsules.has(state.currentCapsule.id) && (
                  <button
                    onClick={() => handleCapsuleComplete(state.currentCapsule!.id)}
                    className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          {showNavigation && (
            <div className={clsx(
              'px-4 py-3 border-t flex items-center justify-between',
              theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            )}>
              <button
                onClick={handlePrevious}
                disabled={state.currentCapsuleIndex === 0}
                className={clsx(
                  'flex items-center space-x-1 px-3 py-1 text-sm rounded transition-colors',
                  state.currentCapsuleIndex === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-white'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className={clsx(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                {state.currentCapsuleIndex + 1} of {state.playlist.capsules.length}
              </span>

              <button
                onClick={handleNext}
                disabled={state.currentCapsuleIndex === state.playlist.capsules.length - 1}
                className={clsx(
                  'flex items-center space-x-1 px-3 py-1 text-sm rounded transition-colors',
                  state.currentCapsuleIndex === state.playlist.capsules.length - 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-white'
                )}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== USAGE EXAMPLES =====

/**
 * Basic Embed Example:
 * 
 * <PlaylistWidget 
 *   playlistId="playlist_123"
 *   embedToken="embed_token_456"
 *   height="600px"
 *   onComplete={(progress) => console.log('Course completed!', progress)}
 * />
 */

/**
 * Advanced Configuration:
 * 
 * <PlaylistWidget 
 *   playlistId="playlist_123"
 *   embedToken="embed_token_456"
 *   theme="dark"
 *   height="800px"
 *   width="100%"
 *   autoAdvance={false}
 *   showProgress={true}
 *   showNavigation={true}
 *   onComplete={(progress) => analytics.track('course_completed', progress)}
 *   onProgress={(progress) => analytics.track('course_progress', progress)}
 *   onError={(error) => console.error('Widget error:', error)}
 *   customStyles={{ borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
 * />
 */

export default PlaylistWidget