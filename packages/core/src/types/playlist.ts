/**
 * Playlist System - "Molecule" Architecture for Course Creation
 * 
 * Enables creators to group individual capsules into sequential learning experiences.
 * This transforms CodeCapsule from "widget tool" to "critical B2B infrastructure."
 */

import type { BaseCapsule } from './base-capsule'

// ===== PLAYLIST CORE INTERFACES =====

/**
 * Playlist - A sequential collection of capsules forming a course
 */
export interface Playlist {
  playlist_id: string
  creator_id: string
  title: string                    // "Python 101: The Complete Intro"
  description: string             // "A 5-part series for absolute beginners"
  is_public: boolean              // Allow discovery/sharing
  created_at: string
  updated_at: string
}

/**
 * PlaylistItem - Join table linking capsules to playlists with ordering
 */
export interface PlaylistItem {
  item_id: string
  playlist_id: string
  capsule_id: string
  order: number                   // 1, 2, 3, 4, 5... (CRITICAL sequencing field)
  created_at: string
}

/**
 * PlaylistWithCapsules - Full playlist data for rendering
 */
export interface PlaylistWithCapsules extends Playlist {
  items: Array<PlaylistItem & {
    capsule: BaseCapsule           // Full capsule data
  }>
  total_items: number
  current_position?: number       // For learner progress tracking
}

// ===== LEARNER PROGRESS TRACKING =====

/**
 * PlaylistProgress - Track learner's journey through a playlist
 */
export interface PlaylistProgress {
  progress_id: string
  playlist_id: string
  learner_id?: string             // Optional - can track anonymous users
  session_id: string              // For anonymous tracking
  current_step: number            // Which step they're currently on
  completed_steps: number[]       // Array of completed step numbers
  started_at: string
  last_activity: string
  completion_rate?: number        // 0-1 (calculated field, optional)
}

// ===== PLAYLIST WIDGET INTERFACES =====

/**
 * PlaylistWidgetProps - Props for the adaptive playlist widget
 */
export interface PlaylistWidgetProps {
  playlistId: string
  startPosition?: number          // Deep-link to specific step (default: 1)
  theme?: 'light' | 'dark'
  showProgress?: boolean          // Show progress bar (default: true)
  allowJumping?: boolean          // Allow jumping to any step (default: false)
}

/**
 * PlaylistWidgetState - Internal state of the playlist widget
 */
export interface PlaylistWidgetState {
  playlist: PlaylistWithCapsules | null
  currentPosition: number
  isLoading: boolean
  error: string | null
  progress: PlaylistProgress | null
}

/**
 * PlaylistNavigation - Navigation context for playlist widgets
 */
export interface PlaylistNavigation {
  has_previous: boolean
  has_next: boolean
  previous_title?: string
  next_title?: string
  can_jump_to: number[]           // Steps learner is allowed to jump to
}

// ===== CREATOR DASHBOARD INTERFACES =====

/**
 * PlaylistBuilderState - State for drag-and-drop playlist builder
 */
export interface PlaylistBuilderState {
  availableCapsules: BaseCapsule[]
  playlistItems: BaseCapsule[]    // Ordered list being built
  playlistMetadata: {
    title: string
    description: string
    is_public: boolean
  }
  isDirty: boolean                // Has unsaved changes
}

/**
 * PlaylistDragResult - Result from drag-and-drop operations
 */
export interface PlaylistDragResult {
  source: {
    droppableId: string           // 'available' | 'playlist'
    index: number
  }
  destination: {
    droppableId: string
    index: number
  } | null
}

// ===== API INTERFACES =====

/**
 * CreatePlaylistRequest - Request to create new playlist
 */
export interface CreatePlaylistRequest {
  title: string
  description: string
  is_public?: boolean
  items: Array<{
    capsule_id: string
    order?: number                // Auto-generated if not provided
  }>
}

/**
 * UpdatePlaylistRequest - Request to update existing playlist
 */
export interface UpdatePlaylistRequest {
  title?: string
  description?: string
  is_public?: boolean
  items?: Array<{
    capsule_id: string
    order: number
  }>
}

/**
 * PlaylistEmbedResponse - Response for embed widget requests
 */
export interface PlaylistEmbedResponse {
  playlist: {
    playlist_id: string
    title: string
    total_items: number
    current_position: number
  }
  current_capsule: BaseCapsule
  navigation: PlaylistNavigation
  progress?: PlaylistProgress
}

// ===== ANALYTICS INTERFACES =====

/**
 * PlaylistAnalytics - Analytics data for playlist performance
 */
export interface PlaylistAnalytics {
  playlist_id: string
  total_views: number
  unique_learners: number
  average_completion_rate: number
  step_completion_rates: Array<{
    step: number
    completion_rate: number
    average_time_spent: number    // seconds
    common_exit_point: boolean
  }>
  most_popular_entry_point: number
  created_at: string
}

/**
 * PlaylistEngagement - Detailed engagement metrics
 */
export interface PlaylistEngagement {
  playlist_id: string
  session_id: string
  events: Array<{
    event_type: 'step_start' | 'step_complete' | 'navigation' | 'exit'
    step_number: number
    timestamp: string
    time_spent?: number           // seconds on this step
    navigation_method?: 'next_button' | 'previous_button' | 'jump_menu' | 'deep_link'
  }>
}

// ===== EMBED CODE GENERATION =====

/**
 * PlaylistEmbedOptions - Options for generating embed codes
 */
export interface PlaylistEmbedOptions {
  width?: string                  // "100%" | "800px"
  height?: string                 // "600px"
  theme?: 'light' | 'dark'
  showProgress?: boolean
  allowJumping?: boolean
  startStep?: number
  customCSS?: string              // Custom styling
}

/**
 * PlaylistEmbedCode - Generated embed code with metadata
 */
export interface PlaylistEmbedCode {
  html: string                    // The actual <iframe> code
  preview_url: string             // URL for testing
  embed_id: string                // Unique identifier for analytics
  options: PlaylistEmbedOptions   // Options used for generation
}

// ===== UTILITY TYPES =====

export type PlaylistEvent = 
  | 'playlist_created'
  | 'playlist_updated' 
  | 'playlist_deleted'
  | 'item_added'
  | 'item_removed'
  | 'item_reordered'
  | 'playlist_completed'

export type PlaylistVisibility = 'private' | 'unlisted' | 'public'

export type PlaylistStatus = 'draft' | 'published' | 'archived'

// ===== TYPE GUARDS =====

export function isPlaylistWithCapsules(
  playlist: Playlist | PlaylistWithCapsules
): playlist is PlaylistWithCapsules {
  return 'items' in playlist && Array.isArray(playlist.items)
}

export function hasPlaylistProgress(
  state: PlaylistWidgetState
): state is PlaylistWidgetState & { progress: PlaylistProgress } {
  return state.progress !== null
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate completion rate for a playlist progress
 */
export function calculateCompletionRate(progress: PlaylistProgress, totalItems: number): number {
  return progress.completed_steps.length / totalItems
}

/**
 * Generate embed code for a playlist
 */
export function generatePlaylistEmbedCode(
  playlistId: string,
  options: PlaylistEmbedOptions = {}
): string {
  const params = new URLSearchParams()
  
  if (options.startStep) params.set('step', options.startStep.toString())
  if (options.theme) params.set('theme', options.theme)
  if (options.showProgress === false) params.set('progress', 'false')
  if (options.allowJumping) params.set('jumping', 'true')
  
  const queryString = params.toString()
  const src = `https://embed.codecapsule.dev/playlist/${playlistId}${queryString ? '?' + queryString : ''}`
  
  return `<iframe 
  src="${src}"
  width="${options.width || '100%'}"
  height="${options.height || '600px'}"
  frameborder="0"
  title="Interactive Learning Playlist"
  data-playlist-id="${playlistId}"
></iframe>`
}

/**
 * Create a new playlist template
 */
export function createPlaylistTemplate(creatorId: string): Partial<Playlist> {
  return {
    creator_id: creatorId,
    title: '',
    description: '',
    is_public: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}