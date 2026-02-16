/**
 * Playlist Components - B2B Course Creation and Delivery System
 * 
 * This module provides the complete playlist UI system for transforming
 * CodeCapsule from "widget tool" to "critical B2B infrastructure."
 */

// ===== MAIN COMPONENTS =====

export { PlaylistWidget } from './PlaylistWidget'
export { CourseCreatorDashboard } from './CourseCreatorDashboard'
export { PlaylistEditor } from './PlaylistEditor'

// ===== COMPONENT PROPS INTERFACES =====

// Re-export key interfaces for external use
export type { PlaylistWidgetProps } from '@codecapsule/core'

// Additional UI-specific interfaces
export interface PlaylistUITheme {
  mode: 'light' | 'dark'
  primaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
}

export interface PlaylistEmbedConfig {
  theme?: PlaylistUITheme
  showProgress?: boolean
  showNavigation?: boolean
  autoAdvance?: boolean
  height?: string
  width?: string
  customStyles?: React.CSSProperties
}

// ===== USAGE EXAMPLES =====

/**
 * 1. Embedding PlaylistWidget in Customer Website:
 * 
 * ```jsx
 * import { PlaylistWidget } from '@codecapsule/ui'
 * 
 * function CustomerCoursePage() {
 *   return (
 *     <div className="course-container">
 *       <PlaylistWidget 
 *         playlistId="course_123"
 *         embedToken="embed_token_456"
 *         height="600px"
 *         theme="light"
 *         onComplete={(progress) => {
 *           analytics.track('course_completed', progress)
 *           // Redirect to certificate page
 *         }}
 *         onProgress={(progress) => {
 *           // Save progress to user profile
 *           saveProgress(progress)
 *         }}
 *       />
 *     </div>
 *   )
 * }
 * ```
 * 
 * 2. B2B Dashboard for Course Creation:
 * 
 * ```jsx
 * import { CourseCreatorDashboard } from '@codecapsule/ui'
 * 
 * function CourseDashboard() {
 *   return (
 *     <CourseCreatorDashboard
 *       organizationId="org_789"
 *       userId="user_123"
 *       onPlaylistSelect={(playlist) => {
 *         // Navigate to editor
 *         navigate(`/editor/${playlist.id}`)
 *       }}
 *       onCreateNew={() => {
 *         // Navigate to new course flow
 *         navigate('/editor/new')
 *       }}
 *     />
 *   )
 * }
 * ```
 * 
 * 3. Course Builder with AI Generation:
 * 
 * ```jsx
 * import { PlaylistEditor } from '@codecapsule/ui'
 * 
 * function CourseEditor({ playlistId }) {
 *   return (
 *     <PlaylistEditor
 *       playlistId={playlistId}
 *       organizationId="org_789"
 *       userId="user_123"
 *       onSave={(playlist) => {
 *         // Redirect back to dashboard
 *         navigate('/dashboard')
 *         showSuccess('Course saved successfully!')
 *       }}
 *       onCancel={() => {
 *         navigate('/dashboard')
 *       }}
 *       onPreview={(playlist) => {
 *         // Open preview in new tab
 *         window.open(`/preview/${playlist.id}`, '_blank')
 *       }}
 *     />
 *   )
 * }
 * ```
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Generate embed code for customer websites
 */
export function generateEmbedCode(
  playlistId: string,
  config: PlaylistEmbedConfig = {}
): string {
  const {
    height = '600px',
    width = '100%',
    theme = { mode: 'light' },
    showProgress = true,
    showNavigation = true,
    autoAdvance = true
  } = config

  const params = new URLSearchParams({
    theme: theme.mode,
    showProgress: showProgress.toString(),
    showNavigation: showNavigation.toString(),
    autoAdvance: autoAdvance.toString()
  })

  return `<iframe 
  src="https://embed.codecapsule.com/playlist/${playlistId}?${params}" 
  width="${width}" 
  height="${height}"
  frameborder="0"
  allow="clipboard-write"
  title="CodeCapsule Course">
</iframe>`
}

/**
 * Generate React embed component code
 */
export function generateReactEmbedCode(
  playlistId: string,
  embedToken: string,
  config: PlaylistEmbedConfig = {}
): string {
  const configString = Object.entries(config)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`
      } else if (typeof value === 'boolean') {
        return `${key}={${value}}`  
      } else if (typeof value === 'object') {
        return `${key}={${JSON.stringify(value)}}`
      }
      return `${key}={${value}}`
    })
    .join('\n    ')

  return `import { PlaylistWidget } from '@codecapsule/ui'

function CoursePage() {
  return (
    <PlaylistWidget 
      playlistId="${playlistId}"
      embedToken="${embedToken}"
      ${configString}
      onComplete={(progress) => {
        console.log('Course completed!', progress)
      }}
      onProgress={(progress) => {
        console.log('Progress update:', progress)
      }}
    />
  )
}`
}

/**
 * Validate playlist structure for UI components
 */
export function validatePlaylistForUI(playlist: any): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!playlist.title?.trim()) {
    errors.push('Playlist title is required')
  }

  if (!playlist.items || !Array.isArray(playlist.items)) {
    errors.push('Playlist must have items array')
  } else if (playlist.items.length === 0) {
    warnings.push('Playlist has no exercises')
  }

  // Check capsule structure
  if (playlist.items) {
    playlist.items.forEach((item: any, index: number) => {
      if (!item.capsule) {
        errors.push(`Item ${index + 1} missing capsule data`)
      } else {
        if (!item.capsule.title?.trim()) {
          errors.push(`Exercise ${index + 1} missing title`)
        }
        if (!item.capsule.capsule_type) {
          errors.push(`Exercise ${index + 1} missing type`)
        }
        if (!item.capsule.problem_statement_md?.trim()) {
          warnings.push(`Exercise ${index + 1} missing problem statement`)
        }
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Calculate estimated completion time for playlist
 */
export function calculatePlaylistDuration(playlist: any): {
  totalMinutes: number
  breakdown: Array<{
    exerciseTitle: string
    estimatedMinutes: number
    type: string
  }>
} {
  const breakdown: Array<{
    exerciseTitle: string
    estimatedMinutes: number
    type: string
  }> = []

  let totalMinutes = 0

  if (playlist.items) {
    playlist.items.forEach((item: any) => {
      if (item.capsule) {
        // Estimate based on capsule type and complexity
        let estimatedMinutes = 5 // Base time
        
        switch (item.capsule.capsule_type) {
          case 'CODE':
            estimatedMinutes = 8
            break
          case 'DATABASE':
            estimatedMinutes = 6  
            break
          case 'TERMINAL':
            estimatedMinutes = 4
            break
        }

        // Adjust for content length
        const problemLength = item.capsule.problem_statement_md?.length || 0
        if (problemLength > 500) estimatedMinutes += 2
        if (problemLength > 1000) estimatedMinutes += 3

        breakdown.push({
          exerciseTitle: item.capsule.title,
          estimatedMinutes,
          type: item.capsule.capsule_type
        })

        totalMinutes += estimatedMinutes
      }
    })
  }

  return { totalMinutes, breakdown }
}