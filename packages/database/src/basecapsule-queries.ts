/**
 * Database Queries for BaseCapsule and Playlist System
 * 
 * This module provides type-safe database operations for the new
 * unified BaseCapsule architecture and playlist functionality.
 */

import { PrismaClient, Prisma } from '@prisma/client'
import type { 
  BaseCapsule, 
  GenerationResult, 
  BaseValidationResult,
  Playlist,
  PlaylistWithCapsules,
  PlaylistProgress,
  CreatePlaylistRequest,
  UpdatePlaylistRequest
} from '@codecapsule/core'

const prisma = new PrismaClient()

// ===== BASECAPSULE QUERIES =====

/**
 * Create a new capsule using BaseCapsule structure
 */
export async function createBaseCapsule(capsule: Omit<BaseCapsule, 'id' | 'created_at'>): Promise<BaseCapsule> {
  const created = await prisma.capsule.create({
    data: {
      title: capsule.title,
      description: capsule.problem_statement_md, // Legacy compatibility
      capsuleTypeNew: capsule.capsule_type,
      problemStatementMd: capsule.problem_statement_md,
      runtimeConfig: capsule.runtime_config,
      configData: capsule.config_data as any,
      creatorId: capsule.creator_id,
      
      // Legacy fields for backward compatibility
      type: mapToLegacyType(capsule.capsule_type) as any,
      language: capsule.runtime_config.language,
      difficulty: 'MEDIUM', // Default
      tags: [],
      content: {}, // Empty for new structure
      runtime: {},
      pedagogy: {},
      business: {}
    }
  })
  
  return mapPrismaToBaseCapsule(created)
}

/**
 * Get a capsule by ID with BaseCapsule structure
 */
export async function getBaseCapsule(id: string): Promise<BaseCapsule | null> {
  const capsule = await prisma.capsule.findUnique({
    where: { id }
  })
  
  if (!capsule) return null
  
  return mapPrismaToBaseCapsule(capsule)
}

/**
 * Update a capsule with BaseCapsule structure
 */
export async function updateBaseCapsule(
  id: string, 
  updates: Partial<BaseCapsule>
): Promise<BaseCapsule> {
  const updated = await prisma.capsule.update({
    where: { id },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.problem_statement_md && { 
        problemStatementMd: updates.problem_statement_md,
        description: updates.problem_statement_md // Keep legacy in sync
      }),
      ...(updates.capsule_type && { capsuleTypeNew: updates.capsule_type }),
      ...(updates.runtime_config && { runtimeConfig: updates.runtime_config }),
      ...(updates.config_data && { configData: updates.config_data as any }),
      updatedAt: new Date()
    }
  })
  
  return mapPrismaToBaseCapsule(updated)
}

/**
 * Get capsules by creator with BaseCapsule structure
 */
export async function getBaseCapsulesByCreator(
  creatorId: string,
  type?: 'CODE' | 'DATABASE' | 'TERMINAL'
): Promise<BaseCapsule[]> {
  const capsules = await prisma.capsule.findMany({
    where: {
      creatorId,
      ...(type && { capsuleTypeNew: type })
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return capsules
    .filter((c: any) => c.capsuleTypeNew) // Only return migrated capsules
    .map(mapPrismaToBaseCapsule)
}

/**
 * Save a generated capsule from AI pipeline
 */
export async function saveGeneratedCapsule(result: GenerationResult): Promise<BaseCapsule> {
  // Convert UniversalCapsule to BaseCapsule format
  const universalCapsule = result.capsule
  
  // Determine capsule type (only CODE, DATABASE, TERMINAL are valid)
  const capsuleType: 'CODE' | 'DATABASE' | 'TERMINAL' = 
    universalCapsule.type === 'database' ? 'DATABASE' : 
    universalCapsule.type === 'terminal' ? 'TERMINAL' : 'CODE'
  
  // Create appropriate config_data based on type
  const configData = capsuleType === 'CODE' ? {
    boilerplate_code: '',
    reference_solution: '',
    hints: [],
    test_cases: []
  } : capsuleType === 'DATABASE' ? {
    boilerplate_code: '',
    reference_solution: '',
    hints: [],
    schema_definition: '',
    seed_data: []
  } : {
    boilerplate_commands: [],
    expected_outputs: [],
    hints: []
  }
  
  const baseCapsule: Omit<BaseCapsule, 'id' | 'created_at'> = {
    title: universalCapsule.title,
    capsule_type: capsuleType,
    problem_statement_md: universalCapsule.description || '',
    runtime_config: {
      language: 'javascript', // Default for AI-generated capsules
      runtime_tier: 'basic'
    },
    config_data: configData as any,
    creator_id: 'ai-system' // Default for AI-generated capsules
  }
  
  return createBaseCapsule(baseCapsule)
}

// ===== PLAYLIST QUERIES =====

/**
 * Create a new playlist
 */
export async function createPlaylist(request: CreatePlaylistRequest & { creator_id: string }): Promise<Playlist> {
  const playlist = await prisma.playlist.create({
    data: {
      title: request.title,
      description: request.description,
      isPublic: request.is_public || false,
      creatorId: request.creator_id,
      items: {
        create: request.items.map((item, index) => ({
          capsuleId: item.capsule_id,
          order: item.order || index + 1
        }))
      }
    }
  })
  
  return {
    playlist_id: playlist.id,
    creator_id: playlist.creatorId,
    title: playlist.title,
    description: playlist.description || '',
    is_public: playlist.isPublic,
    created_at: playlist.createdAt.toISOString(),
    updated_at: playlist.updatedAt.toISOString()
  }
}

/**
 * Get playlist with all capsules
 */
export async function getPlaylistWithCapsules(playlistId: string): Promise<PlaylistWithCapsules | null> {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          capsule: true
        }
      }
    }
  })
  
  if (!playlist) return null
  
  return {
    playlist_id: playlist.id,
    creator_id: playlist.creatorId,
    title: playlist.title,
    description: playlist.description || '',
    is_public: playlist.isPublic,
    created_at: playlist.createdAt.toISOString(),
    updated_at: playlist.updatedAt.toISOString(),
    items: playlist.items.map((item: any) => ({
      item_id: item.id,
      playlist_id: item.playlistId,
      capsule_id: item.capsuleId,
      order: item.order,
      created_at: item.createdAt.toISOString(),
      capsule: mapPrismaToBaseCapsule(item.capsule)
    })),
    total_items: playlist.items.length
  }
}

/**
 * Update playlist
 */
export async function updatePlaylist(
  playlistId: string, 
  updates: UpdatePlaylistRequest
): Promise<Playlist> {
  const updated = await prisma.playlist.update({
    where: { id: playlistId },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.description && { description: updates.description }),
      ...(updates.is_public !== undefined && { isPublic: updates.is_public }),
      ...(updates.items && {
        items: {
          deleteMany: {}, // Remove all existing items
          create: updates.items.map(item => ({
            capsuleId: item.capsule_id,
            order: item.order
          }))
        }
      })
    }
  })
  
  return {
    playlist_id: updated.id,
    creator_id: updated.creatorId,
    title: updated.title,
    description: updated.description || '',
    is_public: updated.isPublic,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString()
  }
}

/**
 * Get playlists by creator
 */
export async function getPlaylistsByCreator(creatorId: string): Promise<Playlist[]> {
  const playlists = await prisma.playlist.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' }
  })
  
  return playlists.map((playlist: any) => ({
    playlist_id: playlist.id,
    creator_id: playlist.creatorId,
    title: playlist.title,
    description: playlist.description || '',
    is_public: playlist.isPublic,
    created_at: playlist.createdAt.toISOString(),
    updated_at: playlist.updatedAt.toISOString()
  }))
}

/**
 * Track playlist progress
 */
export async function updatePlaylistProgress(
  playlistId: string,
  sessionId: string,
  currentStep: number,
  completedSteps: number[],
  learnerId?: string
): Promise<PlaylistProgress> {
  // First try to find existing progress
  const existing = await prisma.playlistProgress.findFirst({
    where: {
      sessionId,
      playlistId
    }
  })
  
  const progress = existing 
    ? await prisma.playlistProgress.update({
        where: { id: existing.id },
        data: {
          currentStep,
          completedSteps,
          lastActivity: new Date()
        }
      })
    : await prisma.playlistProgress.create({
        data: {
          playlistId,
          sessionId,
          currentStep,
          completedSteps,
          learnerId,
          startedAt: new Date(),
          lastActivity: new Date()
        }
      })
  
  return {
    progress_id: progress.id,
    playlist_id: progress.playlistId,
    learner_id: progress.learnerId || undefined,
    session_id: progress.sessionId,
    current_step: progress.currentStep,
    completed_steps: progress.completedSteps,
    started_at: progress.startedAt.toISOString(),
    last_activity: progress.lastActivity.toISOString()
  }
}

/**
 * Get playlist progress for session
 */
export async function getPlaylistProgress(
  playlistId: string,
  sessionId: string
): Promise<PlaylistProgress | null> {
  const progress = await prisma.playlistProgress.findFirst({
    where: {
      playlistId,
      sessionId
    }
  })
  
  if (!progress) return null
  
  return {
    progress_id: progress.id,
    playlist_id: progress.playlistId,
    learner_id: progress.learnerId || undefined,
    session_id: progress.sessionId,
    current_step: progress.currentStep,
    completed_steps: progress.completedSteps,
    started_at: progress.startedAt.toISOString(),
    last_activity: progress.lastActivity.toISOString()
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Map Prisma capsule to BaseCapsule format
 */
function mapPrismaToBaseCapsule(prisma: any): BaseCapsule {
  // Handle both migrated and legacy capsules
  if (prisma.capsuleTypeNew) {
    // New BaseCapsule structure
    return {
      id: prisma.id,
      title: prisma.title,
      capsule_type: prisma.capsuleTypeNew,
      problem_statement_md: prisma.problemStatementMd || prisma.description,
      runtime_config: prisma.runtimeConfig || {
        language: prisma.language || 'python',
        runtime_tier: 'wasm-python'
      },
      config_data: prisma.configData || {},
      creator_id: prisma.creatorId,
      created_at: prisma.createdAt.toISOString(),
      updated_at: prisma.updatedAt?.toISOString()
    }
  } else {
    // Legacy capsule - convert on the fly
    const type = mapFromLegacyType(prisma.type)
    return {
      id: prisma.id,
      title: prisma.title,
      capsule_type: type,
      problem_statement_md: prisma.description,
      runtime_config: {
        language: prisma.language || 'python',
        runtime_tier: getRuntimeTierForLegacy(prisma.language, type)
      },
      config_data: convertLegacyContent(prisma.content, type),
      creator_id: prisma.creatorId,
      created_at: prisma.createdAt.toISOString(),
      updated_at: prisma.updatedAt?.toISOString()
    }
  }
}

function mapToLegacyType(baseCapsuleType: 'CODE' | 'DATABASE' | 'TERMINAL'): string {
  return baseCapsuleType // They're the same for now
}

function mapFromLegacyType(legacyType: string): 'CODE' | 'DATABASE' | 'TERMINAL' {
  switch (legacyType) {
    case 'DATABASE': return 'DATABASE'
    case 'TERMINAL': return 'TERMINAL'
    default: return 'CODE'
  }
}

function getRuntimeTierForLegacy(language: string | null, type: 'CODE' | 'DATABASE' | 'TERMINAL'): string {
  if (type === 'DATABASE') return 'server-sql'
  if (type === 'TERMINAL') return 'wasm-linux'
  
  switch (language) {
    case 'python': return 'wasm-python'
    case 'javascript': return 'wasm-javascript'
    case 'java': return 'server-java'
    default: return 'wasm-python'
  }
}

function convertLegacyContent(content: any, type: 'CODE' | 'DATABASE' | 'TERMINAL'): any {
  if (!content || typeof content !== 'object') return {}
  
  if (type === 'CODE') {
    return {
      boilerplate_code: content.starterCode || '',
      reference_solution: content.solutionCode || '',
      hints: content.hints || [],
      test_cases: content.testCases || []
    }
  } else if (type === 'DATABASE') {
    return {
      boilerplate_code: content.starterQuery || '',
      reference_solution: content.solutionQuery || '',
      hints: content.hints || [],
      schema_info: content.schema || [],
      seed_sql_url: content.seedDataUrl || ''
    }
  } else if (type === 'TERMINAL') {
    return {
      environment_config: {
        disk_image_url: content.diskImage || 'https://r2.devleep.com/images/alpine-v1.img'
      },
      hints: content.hints || [],
      tasks: content.tasks || []
    }
  }
  
  return {}
}

// Cleanup
export async function disconnect() {
  await prisma.$disconnect()
}