import { PrismaClient } from '@prisma/client'

// Global Prisma client with proper configuration
declare global {
  var __prisma: PrismaClient | undefined
}

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

// Legacy export for backward compatibility
export const databaseClient = prisma;