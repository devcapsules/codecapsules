import { PrismaClient } from '@prisma/client'

// Global Prisma client with proper configuration
declare global {
  var __prisma: PrismaClient | undefined
}

// Serverless-optimized Prisma configuration
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Cleanup connections for serverless environments
export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.warn('Prisma disconnect warning:', error)
  }
}

// Connect with retry logic for serverless
export const ensurePrismaConnection = async () => {
  try {
    await prisma.$connect()
  } catch (error) {
    console.error('Prisma connection failed:', error)
    // Force reconnect
    await disconnectPrisma()
    await prisma.$connect()
  }
}

// Legacy export for backward compatibility
export const databaseClient = prisma;