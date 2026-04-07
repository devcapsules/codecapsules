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

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Plus, Save, Eye, Play, Trash2, GripVertical, Wand2, 
  Code, Database, Terminal, BookOpen, Clock, Users,
  ArrowUp, ArrowDown, Copy, Settings, Lightbulb, Search, X,
  FolderPlus, ChevronDown, ChevronRight, Pencil
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

interface CourseModule {
  id: string
  title: string
  description: string
  position: number
}

interface PlaylistEditorProps {
  playlistId?: string // If editing existing playlist
  initialPlaylist?: PlaylistWithCapsules
  organizationId: string
  userId: string
  onSave?: (playlist: PlaylistWithCapsules) => void
  onCancel?: () => void
  onPreview?: (playlist: PlaylistWithCapsules) => void
  apiBaseUrl?: string
  authToken?: string
  onGenerateAI?: () => void
}

interface EditorState {
  playlist: {
    title: string
    description: string
    is_public: boolean
  }
  capsules: BaseCapsule[]
  availableCapsules: BaseCapsule[]
  modules: CourseModule[]
  capsuleModuleMap: Record<string, string | null> // capsule_id -> module_id
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
              {(capsule.problem_statement_md || capsule.title || 'No description').replace(/[#*`]/g, '').substring(0, 100)}
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
          <h3 className="text-lg font-semibold text-white">EdGE Forge — New Exercise</h3>
          <p className="text-sm text-gray-300 mt-1">
            Describe what you want students to learn, and EdGE Forge will create a complete exercise.
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
                <h4 className="text-sm font-medium text-blue-300 mb-1">EdGE Forge Tips</h4>
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
  apiBaseUrl = 'https://devcapsules-api.devleep-edu.workers.dev/api/v1',
  authToken,
  onGenerateAI
}: PlaylistEditorProps): JSX.Element {

  const getAuthToken = () => authToken || localStorage.getItem('auth_token') || '';
  const handleGenerateAI = () => {
    if (onGenerateAI) {
      onGenerateAI()
    } else {
      setState(prev => ({ ...prev, showAIGenerator: true }))
    }
  };
  
  // ===== STATE MANAGEMENT =====
  
  const [state, setState] = useState<EditorState>({
    playlist: {
      title: initialPlaylist?.title || '',
      description: initialPlaylist?.description || '',
      is_public: initialPlaylist?.is_public || false
    },
    capsules: [], // Will be populated from initialPlaylist.items
    availableCapsules: [],
    modules: [],
    capsuleModuleMap: {},
    isLoading: true,
    isSaving: false,
    isDirty: false,
    error: null,
    draggedItem: null,
    showAIGenerator: false,
    generationInProgress: false
  })

  const [selectedCapsules, setSelectedCapsules] = useState<Set<string>>(new Set())
  const [capsuleSearch, setCapsuleSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'browse'>(playlistId ? 'content' : 'browse')

  // Filter available capsules that aren't already in the course
  const filteredAvailableCapsules = useMemo(() => {
    const addedIds = new Set(state.capsules.map(c => c.id))
    return state.availableCapsules
      .filter(c => !addedIds.has(c.id))
      .filter(c => {
        if (!capsuleSearch.trim()) return true
        const q = capsuleSearch.toLowerCase()
        return (
          c.title?.toLowerCase().includes(q) ||
          c.capsule_type?.toLowerCase().includes(q) ||
          c.problem_statement_md?.toLowerCase().includes(q)
        )
      })
  }, [state.availableCapsules, state.capsules, capsuleSearch])

  // ===== DATA LOADING =====
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }))

        // If editing an existing playlist, fetch it from the API
        let loadedPlaylist: PlaylistWithCapsules | null = initialPlaylist || null

        if (playlistId && !initialPlaylist) {
          const playlistResponse = await fetch(`${apiBaseUrl}/playlists/${playlistId}`, {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          })

          if (playlistResponse.ok) {
            const playlistJson = await playlistResponse.json()
            loadedPlaylist = playlistJson.data || playlistJson
          } else {
            throw new Error('Failed to load course data')
          }
        }

        // Load available capsules for the creator (only their own)
        const capsulesResponse = await fetch(`${apiBaseUrl}/my-capsules`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        })

        if (capsulesResponse.ok) {
          const capsulesJson = await capsulesResponse.json()
          const availableCapsules: BaseCapsule[] = capsulesJson.capsules || capsulesJson.data || capsulesJson

          // Extract capsules from loaded playlist items
          const sortedItems = loadedPlaylist?.items
            ? [...loadedPlaylist.items].sort((a: any, b: any) => (a.order ?? a.position ?? 0) - (b.order ?? b.position ?? 0))
            : []

          const playlistCapsules: BaseCapsule[] = sortedItems
            .map((item: any) => item.capsule)
            .filter(Boolean)
          
          // Build capsule -> module mapping
          const moduleMap: Record<string, string | null> = {}
          sortedItems.forEach((item: any) => {
            if (item.capsule?.id) {
              moduleMap[item.capsule.id] = item.module_id || null
            }
          })

          // Load modules from the playlist response
          const loadedModules: CourseModule[] = (loadedPlaylist as any)?.modules || []

          // Check if course is featured
          const tags: string[] = (() => {
            const t = (loadedPlaylist as any)?.tags
            if (Array.isArray(t)) return t
            try { return JSON.parse(t || '[]') } catch { return [] }
          })()
          setIsFeatured(tags.includes('featured'))
          
          setState(prev => ({
            ...prev,
            playlist: {
              title: loadedPlaylist?.title || prev.playlist.title || '',
              description: loadedPlaylist?.description || prev.playlist.description || '',
              is_public: loadedPlaylist?.is_public ?? prev.playlist.is_public ?? false
            },
            availableCapsules,
            capsules: playlistCapsules,
            modules: loadedModules,
            capsuleModuleMap: moduleMap,
            isLoading: false
          }))
        } else {
          throw new Error('Failed to load capsules')
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
  }, [playlistId, organizationId, initialPlaylist, apiBaseUrl])

  // ===== CAPSULE MANAGEMENT =====
  
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null)

  const addCapsule = useCallback((capsule: BaseCapsule, moduleId?: string | null) => {
    const assignTo = moduleId !== undefined ? moduleId : targetModuleId
    setState(prev => ({
      ...prev,
      capsules: [...prev.capsules, capsule],
      capsuleModuleMap: { ...prev.capsuleModuleMap, [capsule.id]: assignTo || null },
      isDirty: true
    }))
  }, [targetModuleId])

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

  // ===== MODULE MANAGEMENT =====

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState('')
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const [isFeatured, setIsFeatured] = useState(false)
  const [togglingFeatured, setTogglingFeatured] = useState(false)

  const addModule = useCallback(async () => {
    if (!playlistId) return
    try {
      const newPosition = state.modules.length + 1
      const response = await fetch(`${apiBaseUrl}/playlists/${playlistId}/modules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Module ${newPosition}`,
          description: '',
          position: newPosition
        })
      })
      if (response.ok) {
        const json = await response.json()
        const mod = json.data || json
        setState(prev => ({
          ...prev,
          modules: [...prev.modules, mod],
          isDirty: true
        }))
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to create module' }))
    }
  }, [playlistId, state.modules.length, apiBaseUrl])

  const updateModule = useCallback(async (moduleId: string, title: string) => {
    if (!playlistId) return
    try {
      const response = await fetch(`${apiBaseUrl}/playlists/${playlistId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      })
      if (response.ok) {
        setState(prev => ({
          ...prev,
          modules: prev.modules.map(m => m.id === moduleId ? { ...m, title } : m),
          isDirty: true
        }))
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to update module' }))
    }
  }, [playlistId, apiBaseUrl])

  const deleteModule = useCallback(async (moduleId: string) => {
    if (!playlistId) return
    try {
      const response = await fetch(`${apiBaseUrl}/playlists/${playlistId}/modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        setState(prev => ({
          ...prev,
          modules: prev.modules.filter(m => m.id !== moduleId),
          capsuleModuleMap: Object.fromEntries(
            Object.entries(prev.capsuleModuleMap).map(([k, v]) => [k, v === moduleId ? null : v])
          ),
          isDirty: true
        }))
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to delete module' }))
    }
  }, [playlistId, apiBaseUrl])

  const assignCapsuleToModule = useCallback((capsuleId: string, moduleId: string | null) => {
    setState(prev => ({
      ...prev,
      capsuleModuleMap: { ...prev.capsuleModuleMap, [capsuleId]: moduleId },
      isDirty: true
    }))
  }, [])

  const toggleModuleCollapse = useCallback((moduleId: string) => {
    setCollapsedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }, [])

  const toggleFeatured = useCallback(async () => {
    if (!playlistId || togglingFeatured) return
    setTogglingFeatured(true)
    try {
      const newTags = isFeatured ? [] : ['featured']
      const response = await fetch(`${apiBaseUrl}/playlists/${playlistId}/tags`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags: newTags })
      })
      if (response.ok) {
        setIsFeatured(prev => !prev)
      }
    } catch {
      // silent fail
    } finally {
      setTogglingFeatured(false)
    }
  }, [playlistId, togglingFeatured, apiBaseUrl])

  // Group capsules by module for display
  const capsulesByModule = useMemo(() => {
    const groups: Record<string, { module: CourseModule | null; capsules: { capsule: BaseCapsule; globalIndex: number }[] }> = {}
    
    // Create a group for each module (in position order)
    const sortedModules = [...state.modules].sort((a, b) => a.position - b.position)
    for (const mod of sortedModules) {
      groups[mod.id] = { module: mod, capsules: [] }
    }
    // Unassigned group
    groups['__unassigned__'] = { module: null, capsules: [] }

    state.capsules.forEach((capsule, index) => {
      const modId = state.capsuleModuleMap[capsule.id]
      const key = modId && groups[modId] ? modId : '__unassigned__'
      groups[key].capsules.push({ capsule, globalIndex: index })
    })

    return groups
  }, [state.capsules, state.modules, state.capsuleModuleMap])

  // ===== AI GENERATION =====
  
  const handleAIGeneration = useCallback(async (prompt: string, type: 'CODE' | 'DATABASE' | 'TERMINAL') => {
    try {
      setState(prev => ({ ...prev, generationInProgress: true }))

      const response = await fetch(`${apiBaseUrl}/ai/generate-capsule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
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
        const aiJson = await response.json()
        const newCapsule: BaseCapsule = aiJson.data || aiJson
        addCapsule(newCapsule)
      } else {
        throw new Error('Failed to generate capsule')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'EdGE Forge generation failed'
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
        order: index + 1,
        module_id: state.capsuleModuleMap[capsule.id] || null
      }))

      if (playlistId) {
        // Update existing playlist
        const updateRequest: UpdatePlaylistRequest = {
          title: state.playlist.title,
          description: state.playlist.description,
          is_public: state.playlist.is_public,
          items: capsuleItems
        }

        const response = await fetch(`${apiBaseUrl}/playlists/${playlistId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateRequest)
        })

        if (response.ok) {
          const updateJson = await response.json()
          const updatedPlaylist = updateJson.data || updateJson
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

        const response = await fetch(`${apiBaseUrl}/playlists`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createRequest)
        })

        if (response.ok) {
          const createJson = await response.json()
          const newPlaylist = createJson.data || createJson
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
  }, [state.playlist, state.capsules, state.capsuleModuleMap, playlistId, organizationId, apiBaseUrl, onSave])

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

                {/* Featured toggle */}
                {playlistId && (
                  <div className="flex items-center">
                    <button
                      onClick={toggleFeatured}
                      disabled={togglingFeatured}
                      className={clsx(
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                        isFeatured ? 'bg-emerald-500' : 'bg-slate-600',
                        togglingFeatured && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={clsx(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          isFeatured ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <span className="ml-2 text-sm text-gray-300">
                      Feature on public catalog
                    </span>
                  </div>
                )}
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
                    <dt className="text-sm text-gray-400">Modules</dt>
                    <dd className="text-sm font-medium text-white">{state.modules.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-400">Est. Duration</dt>
                    <dd className="text-sm font-medium text-white">{state.capsules.length * 5} min</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-400">Difficulty</dt>
                    <dd className="text-sm font-medium text-gray-100">Mixed</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Course Builder Panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700">
              
              {/* Tab Header */}
              <div className="px-6 py-3 border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1 bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('content')}
                      className={clsx(
                        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        activeTab === 'content'
                          ? 'bg-slate-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-200'
                      )}
                    >
                      <span className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Course Content ({state.capsules.length})
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className={clsx(
                        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        activeTab === 'browse'
                          ? 'bg-slate-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-200'
                      )}
                    >
                      <span className="flex items-center">
                        <Search className="w-4 h-4 mr-2" />
                        Browse Capsules ({filteredAvailableCapsules.length})
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={handleGenerateAI}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-200 bg-blue-900 rounded-md hover:bg-blue-800"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate with EdGE Forge
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">

                {/* ==== BROWSE CAPSULES TAB ==== */}
                {activeTab === 'browse' && (
                  <div>
                    {/* Module target selector */}
                    {state.modules.length > 0 && (
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-xs text-gray-400">Add to:</span>
                        <select
                          value={targetModuleId || ''}
                          onChange={(e) => setTargetModuleId(e.target.value || null)}
                          className="text-sm bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {state.modules.map(m => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={capsuleSearch}
                        onChange={(e) => setCapsuleSearch(e.target.value)}
                        placeholder="Search your capsules by title, type..."
                        className="w-full pl-10 pr-8 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {capsuleSearch && (
                        <button
                          onClick={() => setCapsuleSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {filteredAvailableCapsules.length > 0 ? (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {filteredAvailableCapsules.map((capsule) => {
                          const typeIcon = capsule.capsule_type === 'CODE'
                            ? <Code className="w-4 h-4 text-blue-400" />
                            : capsule.capsule_type === 'DATABASE'
                            ? <Database className="w-4 h-4 text-green-400" />
                            : <Terminal className="w-4 h-4 text-purple-400" />

                          const typeBadge = capsule.capsule_type === 'CODE'
                            ? 'bg-blue-900 text-blue-200'
                            : capsule.capsule_type === 'DATABASE'
                            ? 'bg-green-900 text-green-200'
                            : 'bg-purple-900 text-purple-200'

                          return (
                            <div
                              key={capsule.id}
                              className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                {typeIcon}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-white truncate">{capsule.title}</p>
                                  <div className="flex items-center space-x-2 mt-0.5">
                                    <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium', typeBadge)}>
                                      {capsule.capsule_type}
                                    </span>
                                    {capsule.language && (
                                      <span className="text-xs text-gray-400">{capsule.language}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => { addCapsule(capsule); setActiveTab('content') }}
                                className="ml-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-200 bg-green-900 rounded-md hover:bg-green-800 transition-colors flex-shrink-0"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : state.availableCapsules.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-300">No capsules found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Create capsules first, then add them to your course.
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={handleGenerateAI}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate with EdGE Forge
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="mx-auto h-10 w-10 text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-300">
                          {capsuleSearch ? 'No matching capsules' : 'All capsules already added'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {capsuleSearch
                            ? 'Try a different search term.'
                            : 'All your capsules are already in this course.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ==== COURSE CONTENT TAB ==== */}
                {activeTab === 'content' && (
                  <>
                    {/* Module management toolbar */}
                    {playlistId && (
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-600">
                        <span className="text-sm text-gray-400">
                          {state.modules.length} module{state.modules.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={addModule}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-200 bg-purple-900 rounded-md hover:bg-purple-800 transition-colors"
                        >
                          <FolderPlus className="w-4 h-4 mr-1" />
                          Add Module
                        </button>
                      </div>
                    )}

                    {state.capsules.length > 0 || state.modules.length > 0 ? (
                      <div className="space-y-2">
                        {/* Render by modules if modules exist */}
                        {state.modules.length > 0 ? (
                          <>
                            {[...state.modules].sort((a, b) => a.position - b.position).map(mod => {
                              const group = capsulesByModule[mod.id]
                              const isCollapsed = collapsedModules.has(mod.id)
                              const isEditing = editingModuleId === mod.id

                              return (
                                <div key={mod.id} className="rounded-lg border border-slate-600 overflow-hidden">
                                  {/* Module Header */}
                                  <div className="flex items-center bg-slate-700/50 px-4 py-2.5">
                                    <button
                                      onClick={() => toggleModuleCollapse(mod.id)}
                                      className="text-gray-400 hover:text-white mr-2"
                                    >
                                      {isCollapsed
                                        ? <ChevronRight className="w-4 h-4" />
                                        : <ChevronDown className="w-4 h-4" />
                                      }
                                    </button>

                                    {isEditing ? (
                                      <input
                                        autoFocus
                                        value={editingModuleTitle}
                                        onChange={(e) => setEditingModuleTitle(e.target.value)}
                                        onBlur={() => {
                                          if (editingModuleTitle.trim()) {
                                            updateModule(mod.id, editingModuleTitle.trim())
                                          }
                                          setEditingModuleId(null)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            if (editingModuleTitle.trim()) {
                                              updateModule(mod.id, editingModuleTitle.trim())
                                            }
                                            setEditingModuleId(null)
                                          }
                                          if (e.key === 'Escape') setEditingModuleId(null)
                                        }}
                                        className="flex-1 px-2 py-0.5 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    ) : (
                                      <span className="flex-1 text-sm font-medium text-white">
                                        {mod.title}
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({group?.capsules.length || 0} capsules)
                                        </span>
                                      </span>
                                    )}

                                    <div className="flex items-center space-x-1 ml-2">
                                      <button
                                        onClick={() => {
                                          setEditingModuleId(mod.id)
                                          setEditingModuleTitle(mod.title)
                                        }}
                                        className="p-1 text-gray-400 hover:text-white rounded"
                                        title="Rename module"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => deleteModule(mod.id)}
                                        className="p-1 text-gray-400 hover:text-red-400 rounded"
                                        title="Delete module"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Module Capsule List */}
                                  {!isCollapsed && (
                                    <div className="p-3 space-y-3">
                                      {group?.capsules.length ? (
                                        group.capsules.map(({ capsule, globalIndex }) => (
                                          <div key={capsule.id} className="relative">
                                            <CapsuleListItem
                                              capsule={capsule}
                                              index={globalIndex}
                                              isSelected={selectedCapsules.has(capsule.id)}
                                              onSelect={(selected) => {
                                                const newSelected = new Set(selectedCapsules)
                                                if (selected) newSelected.add(capsule.id)
                                                else newSelected.delete(capsule.id)
                                                setSelectedCapsules(newSelected)
                                              }}
                                              onEdit={() => console.log('Edit capsule:', capsule.id)}
                                              onDelete={() => removeCapsule(globalIndex)}
                                              onMoveUp={() => globalIndex > 0 && moveCapsule(globalIndex, globalIndex - 1)}
                                              onMoveDown={() => globalIndex < state.capsules.length - 1 && moveCapsule(globalIndex, globalIndex + 1)}
                                              onDuplicate={() => duplicateCapsule(globalIndex)}
                                              canMoveUp={globalIndex > 0}
                                              canMoveDown={globalIndex < state.capsules.length - 1}
                                            />
                                            {/* Move to different module */}
                                            {state.modules.length > 1 && (
                                              <select
                                                value={mod.id}
                                                onChange={(e) => assignCapsuleToModule(capsule.id, e.target.value || null)}
                                                className="absolute top-2 right-2 text-[10px] bg-slate-600 border border-slate-500 text-gray-300 rounded px-1 py-0.5"
                                              >
                                                <option value="">→ Unassigned</option>
                                                {state.modules.map(m => (
                                                  <option key={m.id} value={m.id}>{m.id === mod.id ? `✓ ${m.title}` : m.title}</option>
                                                ))}
                                              </select>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-gray-500 text-center py-4">
                                          No capsules in this module yet.
                                        </p>
                                      )}

                                      {/* Add capsule to this module */}
                                      <button
                                        onClick={() => {
                                          setTargetModuleId(mod.id)
                                          setActiveTab('browse')
                                        }}
                                        className="w-full py-2 border border-dashed border-slate-600 rounded-lg text-gray-500 hover:text-gray-300 hover:border-slate-500 transition-colors flex items-center justify-center space-x-1 text-xs"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add capsule to {mod.title}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}

                            {/* Unassigned capsules */}
                            {capsulesByModule['__unassigned__']?.capsules.length > 0 && (
                              <div className="rounded-lg border border-dashed border-slate-600 overflow-hidden">
                                <div className="flex items-center bg-slate-700/30 px-4 py-2.5">
                                  <span className="flex-1 text-sm font-medium text-gray-400">
                                    Unassigned Capsules
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({capsulesByModule['__unassigned__'].capsules.length})
                                    </span>
                                  </span>
                                </div>
                                <div className="p-3 space-y-3">
                                  {capsulesByModule['__unassigned__'].capsules.map(({ capsule, globalIndex }) => (
                                    <div key={capsule.id} className="relative">
                                      <CapsuleListItem
                                        capsule={capsule}
                                        index={globalIndex}
                                        isSelected={selectedCapsules.has(capsule.id)}
                                        onSelect={(selected) => {
                                          const newSelected = new Set(selectedCapsules)
                                          if (selected) newSelected.add(capsule.id)
                                          else newSelected.delete(capsule.id)
                                          setSelectedCapsules(newSelected)
                                        }}
                                        onEdit={() => console.log('Edit capsule:', capsule.id)}
                                        onDelete={() => removeCapsule(globalIndex)}
                                        onMoveUp={() => globalIndex > 0 && moveCapsule(globalIndex, globalIndex - 1)}
                                        onMoveDown={() => globalIndex < state.capsules.length - 1 && moveCapsule(globalIndex, globalIndex + 1)}
                                        onDuplicate={() => duplicateCapsule(globalIndex)}
                                        canMoveUp={globalIndex > 0}
                                        canMoveDown={globalIndex < state.capsules.length - 1}
                                      />
                                      {/* Module assign dropdown */}
                                      {state.modules.length > 0 && (
                                        <select
                                          value=""
                                          onChange={(e) => assignCapsuleToModule(capsule.id, e.target.value || null)}
                                          className="absolute top-2 right-2 text-[10px] bg-slate-600 border border-slate-500 text-gray-300 rounded px-1 py-0.5"
                                        >
                                          <option value="">→ Assign to module…</option>
                                          {state.modules.map(m => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          /* Flat list when no modules exist */
                          <div className="space-y-4">
                            {state.capsules.map((capsule, index) => (
                              <CapsuleListItem
                                key={capsule.id}
                                capsule={capsule}
                                index={index}
                                isSelected={selectedCapsules.has(capsule.id)}
                                onSelect={(selected) => {
                                  const newSelected = new Set(selectedCapsules)
                                  if (selected) newSelected.add(capsule.id)
                                  else newSelected.delete(capsule.id)
                                  setSelectedCapsules(newSelected)
                                }}
                                onEdit={() => console.log('Edit capsule:', capsule.id)}
                                onDelete={() => removeCapsule(index)}
                                onMoveUp={() => index > 0 && moveCapsule(index, index - 1)}
                                onMoveDown={() => index < state.capsules.length - 1 && moveCapsule(index, index + 1)}
                                onDuplicate={() => duplicateCapsule(index)}
                                canMoveUp={index > 0}
                                canMoveDown={index < state.capsules.length - 1}
                              />
                            ))}
                          </div>
                        )}

                        {/* Add more button at bottom */}
                        <button
                          onClick={() => setActiveTab('browse')}
                          className="w-full py-3 border-2 border-dashed border-slate-600 rounded-lg text-gray-400 hover:text-gray-200 hover:border-slate-500 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-medium">Add More Capsules</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-100">No exercises yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Browse your capsules and add them to build your course.
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={() => setActiveTab('browse')}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Browse Capsules
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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