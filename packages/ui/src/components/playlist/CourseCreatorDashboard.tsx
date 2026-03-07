/**
 * CourseCreatorDashboard - B2B Course Creation Interface
 * 
 * This is the main dashboard where B2B customers create, edit, and manage
 * their playlists. It provides a full-featured course authoring experience.
 * 
 * Key Features:
 * - Course cards with inline stats and status
 * - View Details page for read-only course inspection
 * - Preview restricted to Draft courses only
 * - Embed code generation (Playlist + Headless LMS modes)
 * - Bulk operations and filtering
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Search, Filter, MoreVertical, Play, Edit, Copy, Trash2, 
  Users, TrendingUp, Clock, BookOpen, Code, Database, Terminal,
  Eye, ExternalLink, Settings, Download, Upload, ChevronRight,
  BarChart3, Layers, ArrowRight
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
    capsules: (corePlaylist.items || []).map(item => item.capsule),
    published_at: (corePlaylist as any).published_at || undefined,
    archived_at: (corePlaylist as any).archived_at || undefined
  }
}

function transformAnalytics(coreAnalytics: CorePlaylistAnalytics): PlaylistAnalytics {
  const steps = coreAnalytics.step_completion_rates || [];
  const avgTimeSeconds = steps.length > 0
    ? steps.reduce((sum, step) => sum + step.average_time_spent, 0) / steps.length
    : 0;

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
  authToken?: string
  onPlaylistSelect?: (playlist: PlaylistWithCapsules) => void
  onPreviewPlaylist?: (playlist: PlaylistWithCapsules) => void
  onViewDetails?: (playlist: PlaylistWithCapsules) => void
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
  embedModal: { playlistId: string; playlist: PlaylistWithCapsules } | null
}

interface PlaylistCardProps {
  playlist: PlaylistWithCapsules
  analytics?: PlaylistAnalytics
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onView: () => void
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
  onView,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onTogglePublish,
  onGetEmbedCode
}: PlaylistCardProps): JSX.Element {
  
  const [showDropdown, setShowDropdown] = useState(false)
  const isDraft = !playlist.published_at
  const capsuleCount = (playlist as any).total_items || playlist.capsules?.length || 0

  const getCapsuleTypeIcon = (type: CapsuleType) => {
    switch (type) {
      case 'CODE': return <Code className="w-3.5 h-3.5" />
      case 'DATABASE': return <Database className="w-3.5 h-3.5" />
      case 'TERMINAL': return <Terminal className="w-3.5 h-3.5" />
      default: return <BookOpen className="w-3.5 h-3.5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div
      className={clsx(
        'group bg-[#0a0a14] rounded-xl border transition-all duration-200 cursor-pointer',
        'hover:shadow-lg hover:shadow-emerald-500/5',
        isSelected
          ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
          : 'border-slate-700/60 hover:border-slate-600'
      )}
      onClick={onView}
    >
      {/* Top accent bar */}
      <div className={clsx(
        'h-1 rounded-t-xl',
        isDraft
          ? 'bg-gradient-to-r from-amber-500/60 to-amber-500/20'
          : 'bg-gradient-to-r from-emerald-500/80 to-emerald-500/20'
      )} />

      {/* Card Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Selection Checkbox — stop propagation so click doesn't navigate */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); onSelect(e.target.checked) }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {playlist.title}
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>

              {playlist.description && (
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                  {playlist.description}
                </p>
              )}

              {/* Tags row */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide',
                  isDraft
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                )}>
                  {isDraft ? 'Draft' : 'Published'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Layers className="w-3 h-3" />
                  {capsuleCount} exercise{capsuleCount !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-slate-600">
                  {formatDate(playlist.updated_at || playlist.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Dropdown */}
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-300"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-[#12121f] rounded-lg shadow-xl border border-slate-700 z-20 py-1">
                  <button
                    onClick={() => { onEdit(); setShowDropdown(false) }}
                    className="flex items-center w-full px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2.5 text-slate-400" />
                    Edit Course
                  </button>
                  {isDraft && (
                    <button
                      onClick={() => { onPreview(); setShowDropdown(false) }}
                      className="flex items-center w-full px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2.5 text-slate-400" />
                      Preview Draft
                    </button>
                  )}
                  <button
                    onClick={() => { onGetEmbedCode(); setShowDropdown(false) }}
                    className="flex items-center w-full px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2.5 text-slate-400" />
                    Get Embed Code
                  </button>
                  <button
                    onClick={() => { onDuplicate(); setShowDropdown(false) }}
                    className="flex items-center w-full px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2.5 text-slate-400" />
                    Duplicate
                  </button>
                  <div className="border-t border-slate-700/60 my-1" />
                  <button
                    onClick={() => { onTogglePublish(); setShowDropdown(false) }}
                    className="flex items-center w-full px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    {playlist.published_at ? (
                      <><Download className="w-4 h-4 mr-2.5 text-slate-400" /> Unpublish</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2.5 text-emerald-400" /> Publish</>
                    )}
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowDropdown(false) }}
                    className="flex items-center w-full px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {analytics && (
        <div className="px-5 pb-3">
          <div className="grid grid-cols-3 gap-3 bg-slate-800/40 rounded-lg p-3">
            <div className="text-center">
              <p className="text-sm font-semibold text-white">{analytics.total_enrollments}</p>
              <p className="text-[11px] text-slate-500">Students</p>
            </div>
            <div className="text-center border-x border-slate-700/40">
              <p className="text-sm font-semibold text-emerald-400">{Math.round(analytics.completion_rate * 100)}%</p>
              <p className="text-[11px] text-slate-500">Completion</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-sky-400">{Math.round(analytics.average_time_minutes)}m</p>
              <p className="text-[11px] text-slate-500">Avg Time</p>
            </div>
          </div>
        </div>
      )}

      {/* Capsule type icons */}
      {playlist.capsules && playlist.capsules.length > 0 && (
        <div className="px-5 pb-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {playlist.capsules.slice(0, 5).map((capsule) => (
              <div
                key={capsule.id}
                className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-slate-400 border border-slate-700/50"
                title={`${capsule.capsule_type}: ${capsule.title}`}
              >
                {getCapsuleTypeIcon(capsule.capsule_type)}
              </div>
            ))}
            {playlist.capsules.length > 5 && (
              <span className="text-xs text-slate-500 ml-1">+{playlist.capsules.length - 5}</span>
            )}
            <div className="flex-1" />
            {/* Quick action buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onView() }}
              className="px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
            >
              View <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== MAIN DASHBOARD COMPONENT =====

export function CourseCreatorDashboard({
  organizationId,
  userId,
  apiBaseUrl = 'https://devcapsules-api.devleep-edu.workers.dev/api/v1',
  authToken,
  onPlaylistSelect,
  onPreviewPlaylist,
  onViewDetails,
  onCreateNew
}: CourseCreatorDashboardProps): JSX.Element {

  const getAuthToken = () => authToken || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) || ''
  
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
    analytics: {},
    embedModal: null
  })

  // ===== DATA FETCHING =====
  
  const fetchPlaylists = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch(`${apiBaseUrl}/playlists`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.statusText}`)
      }
      
      const json = await response.json()
      const corePlaylists: CorePlaylistWithCapsules[] = json.data || json
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
        const response = await fetch(`${apiBaseUrl}/playlists/${playlist.id}/analytics`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const json = await response.json()
          const coreAnalytics: CorePlaylistAnalytics = json.data || json
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
      case 'view':
        if (onViewDetails) {
          onViewDetails(playlist)
        } else {
          // Fallback: open detail page
          window.location.href = `/courses/detail/?id=${playlistId}`
        }
        break

      case 'edit':
        onPlaylistSelect?.(playlist)
        break
        
      case 'preview':
        // Only allow preview for drafts
        if (!playlist.published_at) {
          if (onPreviewPlaylist) {
            onPreviewPlaylist(playlist)
          } else {
            window.open(`/courses/preview/?id=${playlistId}`, '_blank')
          }
        }
        break
        
      case 'embed':
        // Open the embed code modal with both Playlist + per-capsule LMS options
        setState(prev => ({ ...prev, embedModal: { playlistId, playlist } }))
        break
        
      case 'duplicate':
        // Duplicate playlist
        try {
          const response = await fetch(`${apiBaseUrl}/playlists/${playlistId}/duplicate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
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
          const response = await fetch(`${apiBaseUrl}/playlists/${playlistId}/publish`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
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
            const response = await fetch(`${apiBaseUrl}/playlists/${playlistId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${getAuthToken()}`
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
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500/30 border-t-emerald-500 mx-auto"></div>
          <p className="text-sm text-slate-400">Loading your courses...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-sm font-medium text-red-400">Failed to load dashboard</p>
          <p className="text-xs text-red-300/70">{state.error}</p>
          <button
            onClick={fetchPlaylists}
            className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg border border-red-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#04040a]">

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-white">Courses</h1>
            <span className="px-2 py-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              {filteredPlaylists.length}
            </span>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-[#04040a] bg-[#00ff87] hover:bg-[#00e077] transition-colors shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </button>
        </div>
        <div className="flex items-center justify-between mb-6">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-[#0a0a14] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 ml-6">
            {(['all', 'published', 'draft'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setState(prev => ({ ...prev, filterType: filter }))}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize',
                  state.filterType === filter
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                )}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {state.showBulkActions && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-400">
                {state.selectedPlaylists.size} course{state.selectedPlaylists.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-emerald-400 rounded-md hover:bg-slate-700 transition-colors">
                  Publish
                </button>
                <button className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700 transition-colors">
                  Archive
                </button>
                <button className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-md hover:bg-red-500/20 transition-colors">
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
              checked={state.selectedPlaylists.size === filteredPlaylists.length && filteredPlaylists.length > 0}
              onChange={handleSelectAll}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 mr-2"
            />
            <span className="text-sm text-slate-500">Select all</span>
          </div>
        )}

        {/* Playlist Grid */}
        {filteredPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlaylists.map(playlist => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                analytics={state.analytics[playlist.id]}
                isSelected={state.selectedPlaylists.has(playlist.id)}
                onSelect={(selected) => handlePlaylistSelect(playlist.id, selected)}
                onView={() => handlePlaylistAction(playlist.id, 'view')}
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
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-slate-500" />
            </div>
            <h3 className="text-base font-medium text-white mb-1">No courses found</h3>
            <p className="text-sm text-slate-400 mb-6">
              {state.searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating your first course.'}
            </p>
            {!state.searchQuery && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-[#04040a] bg-[#00ff87] hover:bg-[#00e077] transition-colors shadow-lg shadow-emerald-500/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Course
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== EMBED CODE MODAL ===== */}
      {state.embedModal && (
        <EmbedCodeModal
          playlist={state.embedModal.playlist}
          onClose={() => setState(prev => ({ ...prev, embedModal: null }))}
        />
      )}
    </div>
  )
}

// ===== EMBED CODE MODAL COMPONENT =====

function EmbedCodeModal({
  playlist,
  onClose,
}: {
  playlist: PlaylistWithCapsules
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'playlist' | 'lms'>('playlist')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const playlistEmbed = `<iframe src="https://embed.devcapsules.com/?playlist=${playlist.id}" width="100%" height="700px" frameborder="0" allow="clipboard-write" style="border-radius: 8px; border: 1px solid #1a1a2e;"></iframe>`

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const getLmsEmbed = (capsuleId: string) =>
    `<iframe src="https://embed.devcapsules.com/?id=${capsuleId}&courseId=${playlist.id}" width="100%" height="600px" frameborder="0" allow="clipboard-write" style="border-radius: 8px; border: 1px solid #1a1a2e;"></iframe>`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-600 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Embed: {playlist.title}</h3>
            <p className="text-sm text-gray-400 mt-0.5">Choose how you want to embed this course</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-700 text-gray-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex space-x-1 bg-slate-700/30 flex-shrink-0">
          <button
            onClick={() => setActiveTab('playlist')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === 'playlist'
                ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Playlist Embed
          </button>
          <button
            onClick={() => setActiveTab('lms')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === 'lms'
                ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            LMS / Per-Capsule Embeds
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {activeTab === 'playlist' && (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-white">Single Iframe — "Seamless Arcade"</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      One iframe for the entire course. Students progress through all {playlist.capsules?.length || 0} exercises
                      without leaving the widget. Best for Notion, Substack, WordPress, or standalone lab pages.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-slate-900 rounded-lg p-4 text-xs text-green-300 font-mono overflow-x-auto border border-slate-700">{playlistEmbed}</pre>
                <button
                  onClick={() => copyToClipboard(playlistEmbed, 'playlist')}
                  className={`absolute top-2 right-2 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    copiedId === 'playlist'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-600 text-gray-200 hover:bg-slate-500'
                  }`}
                >
                  {copiedId === 'playlist' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'lms' && (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-white">Headless Playlist — LMS Integration</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      One embed per capsule, each with your course ID baked in for analytics grouping.
                      Paste each into its own Graphy / Thinkific / Teachable lesson. Analytics are automatically
                      aggregated into this course's dashboard.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {(playlist.capsules || []).map((capsule, index) => {
                  const embedId = `lms-${capsule.id}`
                  const embedCode = getLmsEmbed(capsule.id)
                  return (
                    <div key={capsule.id} className="bg-slate-900 rounded-lg border border-slate-700 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-300">
                            {index + 1}
                          </span>
                          <span className="text-sm text-white truncate">{capsule.title}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">{capsule.capsule_type}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(embedCode, embedId)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            copiedId === embedId
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-600 text-gray-200 hover:bg-slate-500'
                          }`}
                        >
                          {copiedId === embedId ? 'Copied!' : 'Copy LMS Embed'}
                        </button>
                      </div>
                      <pre className="text-[10px] text-green-300/70 font-mono overflow-x-auto whitespace-nowrap">{embedCode}</pre>
                    </div>
                  )
                })}
              </div>
              {(!playlist.capsules || playlist.capsules.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No capsules in this course yet. Add capsules to generate embed codes.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-600 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-slate-700 border border-slate-600 rounded-md hover:bg-slate-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default CourseCreatorDashboard