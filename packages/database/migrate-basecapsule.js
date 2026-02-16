#!/usr/bin/env node

/**
 * Database Migration Script for BaseCapsule and Playlist Support
 * 
 * This script applies the new schema changes to support:
 * 1. BaseCapsule unified architecture
 * 2. Playlist system for course creation
 * 
 * Usage: node migrate-basecapsule.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function runMigration() {
  console.log('🚀 Starting BaseCapsule and Playlist migration...')
  
  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_add_basecapsule_and_playlists.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX')) {
        console.log(`⚙️  Executing: ${statement.substring(0, 50)}...`)
        
        try {
          await prisma.$executeRawUnsafe(statement)
          console.log(`✅ Success`)
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Skipped (already exists)`)
          } else {
            console.error(`❌ Error: ${error.message}`)
            throw error
          }
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!')
    
    // Verify the migration
    console.log('\n📊 Verifying migration...')
    
    const capsuleCount = await prisma.capsule.count()
    console.log(`📦 Total capsules: ${capsuleCount}`)
    
    // Check if new columns exist by trying to select them
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = 'capsules' 
        AND column_name IN ('capsule_type_new', 'problem_statement_md', 'runtime_config', 'config_data')
      `
      console.log(`📋 New capsule columns added: ${result[0].count}/4`)
    } catch (error) {
      console.log(`⚠️  Could not verify capsule columns: ${error.message}`)
    }
    
    // Check playlist tables
    try {
      const playlistCount = await prisma.playlist.count()
      console.log(`🎼 Playlist tables created (current count: ${playlistCount})`)
    } catch (error) {
      console.log(`⚠️  Playlist tables not accessible: ${error.message}`)
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Data migration helper functions
async function migrateExistingCapsules() {
  console.log('\n🔄 Starting data migration for existing capsules...')
  
  try {
    // Get all capsules that haven't been migrated yet
    const capsulesNeedingMigration = await prisma.capsule.findMany({
      where: {
        capsuleTypeNew: null
      }
    })
    
    console.log(`📦 Found ${capsulesNeedingMigration.length} capsules to migrate`)
    
    for (const capsule of capsulesNeedingMigration) {
      // Determine new capsule type
      let newType = 'CODE' // default
      if (capsule.type === 'DATABASE') newType = 'DATABASE'
      if (capsule.type === 'TERMINAL') newType = 'TERMINAL'
      
      // Extract runtime config
      const runtimeConfig = {
        language: capsule.language || 'python',
        runtime_tier: getRuntimeTier(capsule.language, newType)
      }
      
      // Extract config data based on type
      let configData = {}
      
      if (newType === 'CODE') {
        configData = {
          boilerplate_code: capsule.content?.starterCode || '',
          reference_solution: capsule.content?.solutionCode || '',
          hints: capsule.content?.hints || [],
          test_cases: capsule.content?.testCases || []
        }
      } else if (newType === 'DATABASE') {
        configData = {
          boilerplate_code: capsule.content?.starterQuery || '',
          reference_solution: capsule.content?.solutionQuery || '',
          hints: capsule.content?.hints || [],
          schema_info: capsule.content?.schema || [],
          seed_sql_url: capsule.content?.seedDataUrl || ''
        }
      } else if (newType === 'TERMINAL') {
        configData = {
          environment_config: {
            disk_image_url: capsule.content?.diskImage || 'https://r2.devleep.com/images/alpine-v1.img'
          },
          hints: capsule.content?.hints || [],
          tasks: capsule.content?.tasks || []
        }
      }
      
      // Update the capsule
      await prisma.capsule.update({
        where: { id: capsule.id },
        data: {
          capsuleTypeNew: newType,
          problemStatementMd: capsule.description,
          runtimeConfig: runtimeConfig,
          configData: configData
        }
      })
    }
    
    console.log(`✅ Successfully migrated ${capsulesNeedingMigration.length} capsules`)
    
  } catch (error) {
    console.error('❌ Data migration failed:', error.message)
    throw error
  }
}

function getRuntimeTier(language, type) {
  if (type === 'DATABASE') return 'server-sql'
  if (type === 'TERMINAL') return 'wasm-linux'
  
  switch (language) {
    case 'python': return 'wasm-python'
    case 'javascript': return 'wasm-javascript'
    case 'java': return 'server-java'
    case 'go': return 'server-go'
    case 'csharp': return 'server-csharp'
    default: return 'wasm-python'
  }
}

// Main execution
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎯 Migration process completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error)
      process.exit(1)
    })
}

module.exports = {
  runMigration,
  migrateExistingCapsules
}