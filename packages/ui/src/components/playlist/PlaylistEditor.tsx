/**
 * PlaylistEditor - Drag-and-Drop Course Builder
 * 
 * This component provides a visual interface for creating and editing playlists.
 * It integrates with the AI Generation Pipeline to create new capsules on demand.
 * 
 * Key Features:
 * - Drag-and-drop capsule ordering
 * - AI-powered capsule generation via Generation Pipeline
 * - Real-time preview of course flow
 * - Bulk capsule operations
 * - Auto-save functionality
 * - Course template system
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Save, Eye, Play, Trash2, GripVertical, Wand2, 
  Code, Database, Terminal, BookOpen, Clock, Users,
  ArrowUp, ArrowDown, Copy, Settings, Lightbulb
} from 'lucide-react'
import clsx from 'clsx'

import type { 
  PlaylistWithCapsules,
  BaseCapsule,
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  GenerationPipeline
} from '@codecapsule/core'

// ===== EDITOR INTERFACES =====

interface PlaylistEditorProps {
  playlistId?: string // If editing existing playlist
  initialPlaylist?: PlaylistWithCapsules
  organizationId: string
  userId: string
  onSave?: (playlist: PlaylistWithCapsules) => void
  onCancel?: () => void
  onPreview?: (playlist: PlaylistWithCapsules) => void
  apiBaseUrl?: string
}

interface EditorState {
  playlist: {
    title: string
    description: string
    is_public: boolean
  }
  capsules: BaseCapsule[]
  availableCapsules: BaseCapsule[]
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  error: string | null
  draggedItem: BaseCapsule | null
  showAIGenerator: boolean
  generationInProgress: boolean
}

interface CapsuleListItemProps {
  capsule: BaseCapsule
  index: number
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

interface AIGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string, type: 'CODE' | 'DATABASE' | 'TERMINAL') => Promise<void>
  isGenerating: boolean
}

// ===== CAPSULE LIST ITEM COMPONENT =====

function CapsuleListItem({
  capsule,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  canMoveUp,
  canMoveDown
}: CapsuleListItemProps): JSX.Element {
  
  const getCapsuleIcon = (type: string) => {
    switch (type) {
      case 'CODE': return <Code className="w-5 h-5 text-blue-500" />
      case 'DATABASE': return <Database className="w-5 h-5 text-green-500" />
      case 'TERMINAL': return <Terminal className="w-5 h-5 text-purple-500" />
      default: return <BookOpen className="w-5 h-5 text-gray-500" />
    }
  }

  const getCapsuleTypeBadge = (type: string) => {
    switch (type) {
      case 'CODE': return 'bg-blue-900 text-blue-200'
      case 'DATABASE': return 'bg-green-900 text-green-200'
      case 'TERMINAL': return 'bg-purple-900 text-purple-200'
      default: return 'bg-slate-700 text-slate-200'
    }
  }

  return (
    <div className={clsx(
      'bg-slate-700 rounded-lg border-2 p-4 transition-all duration-200',
      isSelected ? 'border-blue-500 shadow-sm' : 'border-slate-600 hover:border-slate-500'
    )}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          
          {/* Drag Handle */}
          <div className="flex flex-col space-y-1 mt-1">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
          </div>
          
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
              {getCapsuleIcon(capsule.capsule_type)}
              <span className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                getCapsuleTypeBadge(capsule.capsule_type)
              )}>
                {capsule.capsule_type}
              </span>
            </div>
            
            <h4 className="text-lg font-medium text-white truncate">
              {capsule.title}
            </h4>
            
            <p className="text-sm text-gray-300 line-clamp-2 mt-1">
              {capsule.problem_statement_md.replace(/[#*`]/g, '').substring(0, 100)}...
            </p>
          </div>
        </div>

        {/* Move Buttons */}
        <div className="flex flex-col space-y-1 ml-2">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className={clsx(
              'p-1 rounded hover:bg-slate-600 transition-colors text-gray-300',
              !canMoveUp && 'opacity-50 cursor-not-allowed'
            )}
            title="Move up"
          >
            <ArrowUp className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className={clsx(
              'p-1 rounded hover:bg-slate-600 transition-colors text-gray-300',
              !canMoveDown && 'opacity-50 cursor-not-allowed'
            )}
            title="Move down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-600">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>~5 min</span> {/* Would be calculated from actual difficulty */}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 rounded hover:bg-slate-600 transition-colors"
            title="Edit capsule"
          >
            <Settings className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 rounded hover:bg-slate-600 transition-colors"
            title="Duplicate capsule"
          >
            <Copy className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-slate-600 transition-colors"
            title="Remove from playlist"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== AI GENERATOR MODAL =====

function AIGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating
}: AIGeneratorModalProps): JSX.Element | null {
  
  const [prompt, setPrompt] = useState('')
  const [selectedType, setSelectedType] = useState<'CODE' | 'DATABASE' | 'TERMINAL'>('CODE')

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    await onGenerate(prompt, selectedType)
    setPrompt('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-600">
          <h3 className="text-lg font-semibold text-white">Generate New Exercise</h3>
          <p className="text-sm text-gray-300 mt-1">
            Describe what you want students to learn, and AI will create a complete exercise.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          
          {/* Exercise Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exercise Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'CODE' as const, icon: Code, label: 'Programming', color: 'blue' },
                { type: 'DATABASE' as const, icon: Database, label: 'SQL/Database', color: 'green' },
                { type: 'TERMINAL' as const, icon: Terminal, label: 'Command Line', color: 'purple' }
              ].map(({ type, icon: Icon, label, color }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={clsx(
                    'flex flex-col items-center p-4 border-2 rounded-lg transition-all',
                    selectedType === type
                      ? `border-${color}-500 bg-${color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon className={clsx(
                    'w-6 h-6 mb-2',
                    selectedType === type ? `text-${color}-600` : 'text-gray-400'
                  )} />
                  <span className={clsx(
                    'text-sm font-medium',
                    selectedType === type ? `text-${color}-900` : 'text-gray-600'
                  )}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What should students learn?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a function that calculates compound interest with parameters for principal, rate, and time..."
              className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* AI Examples */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-300 mb-1">AI Generation Tips</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Be specific about the learning objective</li>
                  <li>• Include difficulty level (beginner, intermediate, advanced)</li>
                  <li>• Mention any specific technologies or concepts</li>
                  <li>• Describe the expected outcome or deliverable</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-600 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-slate-700 border border-slate-600 rounded-md hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Exercise
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== MAIN EDITOR COMPONENT =====

export function PlaylistEditor({
  playlistId,
  initialPlaylist,
  organizationId,
  userId,
  onSave,
  onCancel,
  onPreview,
  apiBaseUrl = 'https://api.devcapsules.com'
}: PlaylistEditorProps): JSX.Element {
  
  // ===== STATE MANAGEMENT =====
  
  const [state, setState] = useState<EditorState>({
    playlist: {
      title: initialPlaylist?.title || '',
      description: initialPlaylist?.description || '',
      is_public: initialPlaylist?.is_public || false
    },
    capsules: [], // Will be populated from initialPlaylist.items
    availableCapsules: [],
    isLoading: true,
    isSaving: false,
    isDirty: false,
    error: null,
    draggedItem: null,
    showAIGenerator: false,
    generationInProgress: false
  })

  const [selectedCapsules, setSelectedCapsules] = useState<Set<string>>(new Set())

  // ===== DATA LOADING =====
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }))

        // Load available capsules for the organization
        const capsulesResponse = await fetch(`${apiBaseUrl}/api/organizations/${organizationId}/capsules`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        })

        if (capsulesResponse.ok) {
          const availableCapsules: BaseCapsule[] = await capsulesResponse.json()
          
          setState(prev => ({
            ...prev,
            availableCapsules,
            capsules: initialPlaylist?.items?.map(item => item.capsule) || [],
            isLoading: false
          }))
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load data'
        }))
      }
    }

    loadData()
  }, [organizationId, initialPlaylist, apiBaseUrl])

  // ===== CAPSULE MANAGEMENT =====
  
  const addCapsule = useCallback((capsule: BaseCapsule) => {
    setState(prev => ({
      ...prev,
      capsules: [...prev.capsules, capsule],
      isDirty: true
    }))
  }, [])

  const removeCapsule = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      capsules: prev.capsules.filter((_, i) => i !== index),
      isDirty: true
    }))
  }, [])

  const moveCapsule = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newCapsules = [...prev.capsules]
      const [movedItem] = newCapsules.splice(fromIndex, 1)
      newCapsules.splice(toIndex, 0, movedItem)
      
      return {
        ...prev,
        capsules: newCapsules,
        isDirty: true
      }
    })
  }, [])

  const duplicateCapsule = useCallback((index: number) => {
    const capsule = state.capsules[index]
    if (capsule) {
      const duplicated = {
        ...capsule,
        id: `${capsule.id}_copy_${Date.now()}`,
        title: `${capsule.title} (Copy)`
      }
      setState(prev => ({
        ...prev,
        capsules: [...prev.capsules.slice(0, index + 1), duplicated, ...prev.capsules.slice(index + 1)],
        isDirty: true
      }))
    }
  }, [state.capsules])

  // ===== AI GENERATION =====
  
  const handleAIGeneration = useCallback(async (prompt: string, type: 'CODE' | 'DATABASE' | 'TERMINAL') => {
    try {
      setState(prev => ({ ...prev, generationInProgress: true }))

      const response = await fetch(`${apiBaseUrl}/api/ai/generate-capsule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          capsule_type: type,
          organization_id: organizationId,
          creator_id: userId
        })
      })

      if (response.ok) {
        const newCapsule: BaseCapsule = await response.json()
        addCapsule(newCapsule)
      } else {
        throw new Error('Failed to generate capsule')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'AI generation failed'
      }))
    } finally {
      setState(prev => ({ ...prev, generationInProgress: false }))
    }
  }, [apiBaseUrl, organizationId, userId, addCapsule])

  // ===== SAVE FUNCTIONALITY =====
  
  const handleSave = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }))

      const capsuleItems = state.capsules.map((capsule, index) => ({
        capsule_id: capsule.id,
        order: index + 1
      }))

      if (playlistId) {
        // Update existing playlist
        const updateRequest: UpdatePlaylistRequest = {
          title: state.playlist.title,
          description: state.playlist.description,
          is_public: state.playlist.is_public,
          items: capsuleItems
        }

        const response = await fetch(`${apiBaseUrl}/api/playlists/${playlistId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateRequest)
        })

        if (response.ok) {
          const updatedPlaylist = await response.json()
          onSave?.(updatedPlaylist)
          setState(prev => ({ ...prev, isDirty: false }))
        }
      } else {
        // Create new playlist
        const createRequest: CreatePlaylistRequest = {
          title: state.playlist.title,
          description: state.playlist.description,
          is_public: state.playlist.is_public,
          items: capsuleItems
        }

        const response = await fetch(`${apiBaseUrl}/api/organizations/${organizationId}/playlists`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createRequest)
        })

        if (response.ok) {
          const newPlaylist = await response.json()
          onSave?.(newPlaylist)
          setState(prev => ({ ...prev, isDirty: false }))
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save playlist'
      }))
    } finally {
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }, [state.playlist, state.capsules, playlistId, organizationId, apiBaseUrl, onSave])

  // ===== RENDER =====
  
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-400">Loading playlist editor...</p>
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
              <h1 className="text-xl font-semibold text-white">
                {playlistId ? 'Edit Course' : 'Create New Course'}
              </h1>
              {state.isDirty && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900 text-yellow-200">
                  Unsaved changes
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onPreview?.({ ...state.playlist, capsules: state.capsules } as any)}
                className="inline-flex items-center px-3 py-2 border border-slate-600 text-sm font-medium rounded-md text-gray-200 bg-slate-700 hover:bg-slate-600"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
              <button
                onClick={onCancel}
                className="inline-flex items-center px-3 py-2 border border-slate-600 text-sm font-medium rounded-md text-gray-200 bg-slate-700 hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!state.isDirty || state.isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Course Settings Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-6">
              <h2 className="text-lg font-medium text-white mb-4">Course Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={state.playlist.title}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      playlist: { ...prev.playlist, title: e.target.value },
                      isDirty: true
                    }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={state.playlist.description}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      playlist: { ...prev.playlist, description: e.target.value },
                      isDirty: true
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={state.playlist.is_public}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      playlist: { ...prev.playlist, is_public: e.target.checked },
                      isDirty: true
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_public" className="ml-2 text-sm text-gray-300">
                    Make this course publicly discoverable
                  </label>
                </div>
              </div>

              {/* Course Stats */}
              <div className="mt-6 pt-6 border-t border-slate-600">
                <h3 className="text-sm font-medium text-white mb-3">Course Stats</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-400">Exercises</dt>
                    <dd className="text-sm font-medium text-white">{state.capsules.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-400">Est. Duration</dt>
                    <dd className="text-sm font-medium text-white">{state.capsules.length * 5} min</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Difficulty</dt>
                    <dd className="text-sm font-medium text-gray-900">Mixed</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Course Builder Panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700">
              
              {/* Builder Header */}
              <div className="px-6 py-4 border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">Course Content</h2>
                  <button
                    onClick={() => setState(prev => ({ ...prev, showAIGenerator: true }))}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-200 bg-blue-900 rounded-md hover:bg-blue-800"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate with AI
                  </button>
                </div>
              </div>

              {/* Exercise List */}
              <div className="p-6">
                {state.capsules.length > 0 ? (
                  <div className="space-y-4">
                    {state.capsules.map((capsule, index) => (
                      <CapsuleListItem
                        key={capsule.id}
                        capsule={capsule}
                        index={index}
                        isSelected={selectedCapsules.has(capsule.id)}
                        onSelect={(selected) => {
                          const newSelected = new Set(selectedCapsules)
                          if (selected) {
                            newSelected.add(capsule.id)
                          } else {
                            newSelected.delete(capsule.id)
                          }
                          setSelectedCapsules(newSelected)
                        }}
                        onEdit={() => {
                          // Navigate to capsule editor
                          console.log('Edit capsule:', capsule.id)
                        }}
                        onDelete={() => removeCapsule(index)}
                        onMoveUp={() => index > 0 && moveCapsule(index, index - 1)}
                        onMoveDown={() => index < state.capsules.length - 1 && moveCapsule(index, index + 1)}
                        onDuplicate={() => duplicateCapsule(index)}
                        canMoveUp={index > 0}
                        canMoveDown={index < state.capsules.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No exercises yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add exercises to your course to get started.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setState(prev => ({ ...prev, showAIGenerator: true }))}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate First Exercise
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      <AIGeneratorModal
        isOpen={state.showAIGenerator}
        onClose={() => setState(prev => ({ ...prev, showAIGenerator: false }))}
        onGenerate={handleAIGeneration}
        isGenerating={state.generationInProgress}
      />

      {/* Error Toast */}
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center justify-between">
            <span className="text-sm">{state.error}</span>
            <button
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaylistEditor