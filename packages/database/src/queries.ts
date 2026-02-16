/**
 * Database Queries - High-level operations for Devcapsules
 */

import { prisma } from './client'

// Enum types (matching schema)
type UserTier = 'FREE' | 'PRO' | 'ENTERPRISE'
type CapsuleType = 'CODE' | 'QUIZ' | 'TERMINAL' | 'DATABASE' | 'SYSTEM_DESIGN'
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT'
type RuntimeTarget = 'WASM' | 'DOCKER' | 'CLOUD_RUN'
type FeedbackType = 'CODE_GENERATION' | 'HINT_GENERATION' | 'TEST_CASE_GENERATION' | 'EXPLANATION_GENERATION'

// Basic model interfaces (matching Prisma generated types)
interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  tier: UserTier
  createdAt: Date
  updatedAt: Date
  authId: string
}

interface Capsule {
  id: string
  title: string
  description: string
  type: CapsuleType
  language: string | null
  difficulty: Difficulty
  tags: string[]
  content: any // JSON
  runtime: any // JSON
  pedagogy: any // JSON
  business: any // JSON
  legacyData: any | null // JSON
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  creatorId: string
}

// ===== USER OPERATIONS =====

export const userQueries = {
  /**
   * Find or create user from Supabase auth
   */
  async findOrCreateUser(authId: string, email: string, name?: string): Promise<User> {
    return await prisma.user.upsert({
      where: { authId },
      update: { 
        name: name ?? undefined,
        updatedAt: new Date()
      },
      create: {
        authId,
        email,
        name,
        tier: 'FREE'
      }
    })
  },

  /**
   * Get user with analytics
   */
  async getUserWithAnalytics(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        analytics: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        },
        capsules: {
          select: {
            id: true,
            title: true,
            type: true,
            isPublished: true,
            createdAt: true
          }
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  },

  /**
   * Update user tier
   */
  async updateUserTier(userId: string, tier: UserTier) {
    return await prisma.user.update({
      where: { id: userId },
      data: { tier, updatedAt: new Date() }
    })
  }
}

// ===== CAPSULE OPERATIONS =====

export const capsuleQueries = {
  /**
   * Create new capsule with universal format
   */
  async createCapsule(data: {
    title: string
    description: string
    type: CapsuleType
    difficulty: Difficulty
    language?: string
    tags: string[]
    content: any // AdaptiveContent JSON
    runtime: any // RuntimeConfiguration JSON
    pedagogy: any // Pedagogy JSON
    business: any // Business JSON
    creatorId: string
  }) {
    return await prisma.capsule.create({
      data: {
        ...data,
        isPublished: false
      }
    })
  },

  /**
   * Get capsule with full details
   */
  async getCapsuleById(id: string) {
    return await prisma.capsule.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            tier: true
          }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 7 // Last 7 days
        }
      }
    })
  },

  /**
   * Get published capsules with filters
   */
  async getPublishedCapsules(filters?: {
    type?: CapsuleType
    difficulty?: Difficulty
    language?: string
    tags?: string[]
    limit?: number
    offset?: number
  }) {
    const where: any = { isPublished: true }
    
    if (filters?.type) where.type = filters.type
    if (filters?.difficulty) where.difficulty = filters.difficulty
    if (filters?.language) where.language = filters.language
    if (filters?.tags?.length) {
      where.tags = { hasSome: filters.tags }
    }

    return await prisma.capsule.findMany({
      where,
      include: {
        creator: {
          select: { name: true, tier: true }
        },
        analytics: {
          select: { 
            successRate: true,
            popularityScore: true 
          },
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0
    })
  },

  /**
   * Get user's capsules (including unpublished)
   */
  async getUserCapsules(creatorId: string) {
    return await prisma.capsule.findMany({
      where: { creatorId },
      include: {
        analytics: {
          select: { 
            successRate: true,
            popularityScore: true,
            totalAttempts: true
          },
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * Update capsule content
   */
  async updateCapsule(id: string, updates: {
    title?: string
    description?: string
    type?: CapsuleType
    content?: any
    runtime?: any
    pedagogy?: any
    isPublished?: boolean
  }) {
    return await prisma.capsule.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })
  },

  /**
   * Delete capsule and related data
   */
  async deleteCapsule(id: string) {
    // Delete in order due to foreign key constraints
    await prisma.$transaction([
      // Delete analytics first
      prisma.capsuleAnalytics.deleteMany({ where: { capsuleId: id } }),
      // Delete executions
      prisma.capsuleExecution.deleteMany({ where: { capsuleId: id } }),
      // Finally delete the capsule
      prisma.capsule.delete({ where: { id } })
    ])
  }
}

// ===== EXECUTION OPERATIONS =====

export const executionQueries = {
  /**
   * Create new execution
   */
  async createExecution(data: {
    capsuleId: string
    userId?: string
    runtime: RuntimeTarget
    code?: string
    input?: any
  }) {
    return await prisma.capsuleExecution.create({
      data: {
        ...data,
        status: 'PENDING'
      }
    })
  },

  /**
   * Update execution with results
   */
  async updateExecution(id: string, updates: {
    status: ExecutionStatus
    output?: any
    errors?: string[]
    executionTime?: number
    memoryUsage?: number
  }) {
    return await prisma.capsuleExecution.update({
      where: { id },
      data: {
        ...updates,
        endedAt: updates.status === 'COMPLETED' || updates.status === 'FAILED' 
          ? new Date() 
          : undefined
      }
    })
  },

  /**
   * Get execution history for capsule
   */
  async getExecutionHistory(capsuleId: string, limit = 50) {
    return await prisma.capsuleExecution.findMany({
      where: { capsuleId },
      orderBy: { startedAt: 'desc' },
      take: limit
    })
  }
}

// ===== ANALYTICS OPERATIONS =====

export const analyticsQueries = {
  /**
   * Record user analytics for today
   */
  async recordUserAnalytics(userId: string, metrics: {
    capsulesCompleted?: number
    executionTime?: number
    hintsUsed?: number
    conceptsMastered?: string[]
  }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await prisma.userAnalytics.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        capsulesCompleted: { increment: metrics.capsulesCompleted ?? 0 },
        totalExecutionTime: { increment: metrics.executionTime ?? 0 },
        hintsUsed: { increment: metrics.hintsUsed ?? 0 },
        conceptsMastered: metrics.conceptsMastered ?? undefined
      },
      create: {
        userId,
        date: today,
        capsulesCompleted: metrics.capsulesCompleted ?? 0,
        totalExecutionTime: metrics.executionTime ?? 0,
        hintsUsed: metrics.hintsUsed ?? 0,
        conceptsMastered: metrics.conceptsMastered ?? []
      }
    })
  },

  /**
   * Record capsule analytics for today
   */
  async recordCapsuleAnalytics(capsuleId: string, metrics: {
    attempts?: number
    successes?: number
    averageTime?: number
  }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await prisma.capsuleAnalytics.upsert({
      where: {
        capsuleId_date: {
          capsuleId,
          date: today
        }
      },
      update: {
        totalAttempts: { increment: metrics.attempts ?? 0 },
        successRate: metrics.successes && metrics.attempts 
          ? metrics.successes / metrics.attempts 
          : undefined,
        averageTime: metrics.averageTime ?? undefined
      },
      create: {
        capsuleId,
        date: today,
        totalAttempts: metrics.attempts ?? 0,
        successRate: metrics.successes && metrics.attempts 
          ? metrics.successes / metrics.attempts 
          : 0,
        averageTime: metrics.averageTime ?? 0
      }
    })
  }
}

// ===== CREATOR FEEDBACK OPERATIONS =====

export const feedbackQueries = {
  /**
   * Save creator feedback for AI training
   */
  async saveCreatorFeedback(data: {
    type: 'CODE_GENERATION' | 'HINT_GENERATION' | 'TEST_CASE_GENERATION' | 'EXPLANATION_GENERATION'
    originalPrompt: string
    aiGeneratedContent: any
    humanEditedContent: any
    editSummary?: string
    qualityScore?: number
    creatorId: string
    capsuleId: string
  }) {
    return await prisma.creatorFeedback.create({
      data
    })
  },

  /**
   * Get training data for AI improvement
   */
  async getTrainingData(type?: string, limit = 1000) {
    const where = type ? { type: type as any } : {}
    
    return await prisma.creatorFeedback.findMany({
      where: {
        ...where,
        isApprovedForTraining: true,
        qualityScore: { gte: 0.7 }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
}