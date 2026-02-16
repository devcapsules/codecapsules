/**
 * CourseCreatorDashboard - B2B Course Creation Interface
 * 
 * This is the main dashboard where B2B customers create, edit, and manage
 * their playlists. It provides a full-featured course authoring experience.
 * 
 * Key Features:
 * - Drag-and-drop course builder
 * - AI-powered capsule generation via Generation Pipeline
 * - Real-time preview of courses
 * - Analytics and student progress tracking
 * - Embed code generation for customer websites
 * - Bulk operations and course templates
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Search, Filter, MoreVertical, Play, Edit, Copy, Trash2, 
  Users, TrendingUp, Clock, BookOpen, Code, Database, Terminal,
  Eye, ExternalLink, Settings, Download, Upload
} from 'lucide-react'
import clsx from 'clsx'

import type { 
  PlaylistWithCapsules as CorePlaylistWithCapsules,
  PlaylistAnalytics as CorePlaylistAnalytics,
  BaseCapsule
} from '@codecapsule/core'

type CapsuleType = 'CODE' | 'DATABASE' | 'TERMINAL'

// Extended interfaces for dashboard needs
interface PlaylistWithCapsules extends CorePlaylistWithCapsules {
  id: string // Map from playlist_id
  capsules: BaseCapsule[] // Map from items
  published_at?: string
  archived_at?: string
}

interface PlaylistAnalytics extends CorePlaylistAnalytics {
  total_enrollments: number // Map from unique_learners
  completion_rate: number // Map from average_completion_rate
  average_time_minutes: number // Calculated from step data
}

// ===== TYPE TRANSFORMATION UTILITIES =====

function transformPlaylist(corePlaylist: CorePlaylistWithCapsules): PlaylistWithCapsules {
  return {
    ...corePlaylist,
    id: corePlaylist.playlist_id,
    capsules: corePlaylist.items.map(item => item.capsule),
    published_at: undefined, // Would come from additional API data
    archived_at: undefined   // Would come from additional API data
  }
}

function transformAnalytics(coreAnalytics: CorePlaylistAnalytics): PlaylistAnalytics {
  const avgTimeSeconds = coreAnalytics.step_completion_rates.reduce(
    (sum, step) => sum + step.average_time_spent, 0
  ) / coreAnalytics.step_completion_rates.length

  return {
    ...coreAnalytics,
    total_enrollments: coreAnalytics.unique_learners,
    completion_rate: coreAnalytics.average_completion_rate,
    average_time_minutes: Math.round(avgTimeSeconds / 60)
  }
}

// ===== DASHBOARD INTERFACES =====

interface CourseCreatorDashboardProps {
  organizationId: string
  userId: string
  apiBaseUrl?: string
  onPlaylistSelect?: (playlist: PlaylistWithCapsules) => void
  onCreateNew?: () => void
}

interface DashboardState {
  playlists: PlaylistWithCapsules[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  filterType: 'all' | 'published' | 'draft' | 'archived'
  selectedPlaylists: Set<string>
  showBulkActions: boolean
  viewMode: 'grid' | 'list'
  analytics: Record<string, PlaylistAnalytics>
}

interface PlaylistCardProps {
  playlist: PlaylistWithCapsules
  analytics?: PlaylistAnalytics
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onEdit: () => void
  onPreview: () => void
  onDuplicate: () => void
  onDelete: () => void
  onTogglePublish: () => void
  onGetEmbedCode: () => void
}

// ===== PLAYLIST CARD COMPONENT =====

function PlaylistCard({
  playlist,
  analytics,
  isSelected,
  onSelect,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onTogglePublish,
  onGetEmbedCode
}: PlaylistCardProps): JSX.Element {
  
  const [showDropdown, setShowDropdown] = useState(false)
  
  const getCapsuleTypeIcon = (type: CapsuleType) => {
    switch (type) {
      case 'CODE': return <Code className="w-4 h-4" />
      case 'DATABASE': return <Database className="w-4 h-4" />
      case 'TERMINAL': return <Terminal className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  const getStatusBadge = () => {
    if (playlist.published_at) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Published
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Draft
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className={clsx(
      'bg-slate-800 rounded-lg border-2 border-slate-700 transition-all duration-200 hover:shadow-md hover:border-slate-600',
      isSelected ? 'border-blue-500 shadow-sm' : 'border-gray-200'
    )}>
      
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            
            {/* Selection Checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            
            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {playlist.title}
              </h3>
              {playlist.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge()}
                <span className="text-xs text-gray-500">
                  Updated {formatDate(playlist.updated_at || playlist.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-600 z-10">
                <div className="py-1">
                  <button
                    onClick={() => { onEdit(); setShowDropdown(false) }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-slate-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Course
                  </button>
                  <button
                    onClick={() => { onPreview(); setShowDropdown(false) }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                  <button
                    onClick={() => { onGetEmbedCode(); setShowDropdown(false) }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-slate-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Get Embed Code
                  </button>
                  <button
                    onClick={() => { onDuplicate(); setShowDropdown(false) }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-slate-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => { onTogglePublish(); setShowDropdown(false) }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-slate-700"
                  >
                    {playlist.published_at ? (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowDropdown(false) }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        
        {/* Capsules Preview */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              {playlist.capsules?.length || 0} Exercises
            </span>
            <div className="flex items-center space-x-1">
              {playlist.capsules?.slice(0, 3).map((capsule) => (
                <div
                  key={capsule.id}
                  className="flex items-center justify-center w-6 h-6 rounded bg-slate-600 text-gray-300"
                  title={`${capsule.capsule_type}: ${capsule.title}`}
                >
                  {getCapsuleTypeIcon(capsule.capsule_type)}
                </div>
              ))}
              {playlist.capsules && playlist.capsules.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{playlist.capsules.length - 3}
                </span>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          {analytics && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-white">
                  {analytics.total_enrollments}
                </p>
                <p className="text-xs text-gray-400">Students</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-green-400">
                  {Math.round(analytics.completion_rate * 100)}%
                </p>
                <p className="text-xs text-gray-400">Complete</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-400">
                  {Math.round(analytics.average_time_minutes)}m
                </p>
                <p className="text-xs text-gray-400">Avg Time</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-200 bg-slate-700 border border-slate-600 rounded-md hover:bg-slate-600"
          >
            Edit
          </button>
          <button
            onClick={onPreview}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-1 inline" />
            Preview
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== MAIN DASHBOARD COMPONENT =====

export function CourseCreatorDashboard({
  organizationId,
  userId,
  apiBaseUrl = 'https://api.devcapsules.com',
  onPlaylistSelect,
  onCreateNew
}: CourseCreatorDashboardProps): JSX.Element {
  
  // ===== STATE MANAGEMENT =====
  
  const [state, setState] = useState<DashboardState>({
    playlists: [],
    isLoading: true,
    error: null,
    searchQuery: '',
    filterType: 'all',
    selectedPlaylists: new Set(),
    showBulkActions: false,
    viewMode: 'grid',
    analytics: {}
  })

  // ===== DATA FETCHING =====
  
  const fetchPlaylists = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch(`${apiBaseUrl}/api/organizations/${organizationId}/playlists`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.statusText}`)
      }
      
      const corePlaylists: CorePlaylistWithCapsules[] = await response.json()
      const playlists = corePlaylists.map(transformPlaylist)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        playlists
      }))
      
      // Fetch analytics for each playlist
      fetchAnalytics(playlists)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }))
    }
  }, [organizationId, apiBaseUrl])

  const fetchAnalytics = useCallback(async (playlists: PlaylistWithCapsules[]) => {
    try {
      const analyticsPromises = playlists.map(async (playlist) => {
        const response = await fetch(`${apiBaseUrl}/api/playlists/${playlist.id}/analytics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const coreAnalytics: CorePlaylistAnalytics = await response.json()
          const analytics = transformAnalytics(coreAnalytics)
          return { playlistId: playlist.id, analytics }
        }
        return null
      })
      
      const results = await Promise.allSettled(analyticsPromises)
      const analyticsMap: Record<string, PlaylistAnalytics> = {}
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          analyticsMap[result.value.playlistId] = result.value.analytics
        }
      })
      
      setState(prev => ({
        ...prev,
        analytics: analyticsMap
      }))
      
    } catch (error) {
      console.warn('Failed to load analytics:', error)
    }
  }, [apiBaseUrl])

  // Load data on mount
  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  // ===== SEARCH AND FILTERING =====
  
  const filteredPlaylists = state.playlists.filter(playlist => {
    // Search filter
    const matchesSearch = playlist.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         (playlist.description || '').toLowerCase().includes(state.searchQuery.toLowerCase())
    
    // Status filter
    let matchesFilter = true
    switch (state.filterType) {
      case 'published':
        matchesFilter = !!playlist.published_at
        break
      case 'draft':
        matchesFilter = !playlist.published_at
        break
      case 'archived':
        matchesFilter = !!playlist.archived_at
        break
      // 'all' matches everything
    }
    
    return matchesSearch && matchesFilter
  })

  // ===== ACTION HANDLERS =====
  
  const handlePlaylistSelect = (playlistId: string, selected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedPlaylists)
      if (selected) {
        newSelected.add(playlistId)
      } else {
        newSelected.delete(playlistId)
      }
      
      return {
        ...prev,
        selectedPlaylists: newSelected,
        showBulkActions: newSelected.size > 0
      }
    })
  }

  const handleSelectAll = () => {
    const allSelected = state.selectedPlaylists.size === filteredPlaylists.length
    setState(prev => ({
      ...prev,
      selectedPlaylists: allSelected ? new Set() : new Set(filteredPlaylists.map(p => p.id)),
      showBulkActions: !allSelected
    }))
  }

  const handleCreateNew = () => {
    onCreateNew?.()
    // Could also navigate to playlist editor here
  }

  const handlePlaylistAction = async (playlistId: string, action: string) => {
    const playlist = state.playlists.find(p => p.id === playlistId)
    if (!playlist) return

    switch (action) {
      case 'edit':
        onPlaylistSelect?.(playlist)
        break
        
      case 'preview':
        // Open preview in new window or modal
        window.open(`${apiBaseUrl}/playlists/${playlistId}/preview`, '_blank')
        break
        
      case 'embed':
        // Show embed code modal
        const embedCode = `<iframe src="${apiBaseUrl}/embed/${playlistId}" width="100%" height="600px" frameborder="0" allow="clipboard-write"></iframe>`
        navigator.clipboard.writeText(embedCode)
        alert('Embed code copied to clipboard!')
        break
        
      case 'duplicate':
        // Duplicate playlist
        try {
          const response = await fetch(`${apiBaseUrl}/api/playlists/${playlistId}/duplicate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          })
          if (response.ok) {
            fetchPlaylists() // Refresh list
          }
        } catch (error) {
          alert('Failed to duplicate playlist')
        }
        break
        
      case 'publish':
        // Toggle publish status
        try {
          const response = await fetch(`${apiBaseUrl}/api/playlists/${playlistId}/publish`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ published: !playlist.published_at })
          })
          if (response.ok) {
            fetchPlaylists() // Refresh list
          }
        } catch (error) {
          alert('Failed to update publish status')
        }
        break
        
      case 'delete':
        if (confirm('Are you sure you want to delete this playlist?')) {
          try {
            const response = await fetch(`${apiBaseUrl}/api/playlists/${playlistId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            })
            if (response.ok) {
              fetchPlaylists() // Refresh list
            }
          } catch (error) {
            alert('Failed to delete playlist')
          }
        }
        break
    }
  }

  // ===== RENDER =====
  
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-400">Loading your courses...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-xl">⚠️</div>
          <p className="text-sm font-medium text-red-400">Failed to load dashboard</p>
          <p className="text-xs text-red-300">{state.error}</p>
          <button
            onClick={fetchPlaylists}
            className="px-4 py-2 text-sm bg-red-900 hover:bg-red-800 text-red-200 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      
      {/* Header */}
      <div className="bg-slate-800 shadow-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-white">Course Library</h1>
              <span className="text-sm text-gray-400">
                {filteredPlaylists.length} course{filteredPlaylists.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 ml-6">
            <select
              value={state.filterType}
              onChange={(e) => setState(prev => ({ ...prev, filterType: e.target.value as any }))}
              className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Courses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>

            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: prev.viewMode === 'grid' ? 'list' : 'grid' }))}
              className="p-2 border border-slate-600 rounded-md bg-slate-700 text-white hover:bg-slate-600"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {state.showBulkActions && (
          <div className="bg-slate-800 border border-slate-600 rounded-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400">
                {state.selectedPlaylists.size} course{state.selectedPlaylists.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 text-blue-400 rounded hover:bg-slate-600">
                  Publish
                </button>
                <button className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 text-blue-400 rounded hover:bg-slate-600">
                  Archive
                </button>
                <button className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 text-red-400 rounded hover:bg-slate-600">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Select All */}
        {filteredPlaylists.length > 0 && (
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={state.selectedPlaylists.size === filteredPlaylists.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <span className="text-sm text-gray-600">Select all</span>
          </div>
        )}

        {/* Playlist Grid */}
        {filteredPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map(playlist => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                analytics={state.analytics[playlist.id]}
                isSelected={state.selectedPlaylists.has(playlist.id)}
                onSelect={(selected) => handlePlaylistSelect(playlist.id, selected)}
                onEdit={() => handlePlaylistAction(playlist.id, 'edit')}
                onPreview={() => handlePlaylistAction(playlist.id, 'preview')}
                onDuplicate={() => handlePlaylistAction(playlist.id, 'duplicate')}
                onDelete={() => handlePlaylistAction(playlist.id, 'delete')}
                onTogglePublish={() => handlePlaylistAction(playlist.id, 'publish')}
                onGetEmbedCode={() => handlePlaylistAction(playlist.id, 'embed')}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No courses found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {state.searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating your first course.'}
            </p>
            {!state.searchQuery && (
              <div className="mt-6">
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseCreatorDashboard