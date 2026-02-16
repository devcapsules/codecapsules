import { promises as fs } from 'fs';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

async function runAnalyticsMigration() {
  console.log('🚀 Running analytics schema migration...');
  
  try {
    // First, create the analytics schema
    console.log('📝 Creating analytics schema...');
    await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS analytics;`;
    
    console.log('📝 Creating analytics tables...');
    
    // Create tables one by one with proper SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS analytics.event_stream (
          id BIGSERIAL PRIMARY KEY,
          event_id UUID DEFAULT gen_random_uuid(),
          event_type VARCHAR(50) NOT NULL,
          capsule_id UUID,
          user_id UUID,
          session_id VARCHAR(100),
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT,
          referrer TEXT,
          event_data JSONB,
          processed BOOLEAN DEFAULT FALSE,
          processed_at TIMESTAMPTZ,
          batch_id UUID,
          CONSTRAINT event_stream_event_type_check CHECK (event_type IN (
              'session_started', 'session_ended', 'code_run', 'test_passed', 'test_failed',
              'hint_requested', 'solution_viewed', 'capsule_completed', 'error_encountered'
          ))
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS analytics.capsule_hourly_stats (
          id BIGSERIAL PRIMARY KEY,
          capsule_id UUID NOT NULL,
          hour_bucket TIMESTAMPTZ NOT NULL,
          total_sessions INTEGER DEFAULT 0,
          unique_users INTEGER DEFAULT 0,
          total_runs INTEGER DEFAULT 0,
          successful_runs INTEGER DEFAULT 0,
          avg_session_duration_seconds INTEGER DEFAULT 0,
          avg_time_to_first_run_seconds INTEGER DEFAULT 0,
          avg_attempts_per_completion DECIMAL(4,2) DEFAULT 0,
          completion_rate DECIMAL(5,4) DEFAULT 0,
          hint_usage_rate DECIMAL(5,4) DEFAULT 0,
          solution_view_rate DECIMAL(5,4) DEFAULT 0,
          total_errors INTEGER DEFAULT 0,
          common_error_types JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(capsule_id, hour_bucket)
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS analytics.user_daily_stats (
          id BIGSERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          date DATE NOT NULL,
          capsules_attempted INTEGER DEFAULT 0,
          capsules_completed INTEGER DEFAULT 0,
          total_runs INTEGER DEFAULT 0,
          successful_runs INTEGER DEFAULT 0,
          session_duration_seconds INTEGER DEFAULT 0,
          hints_used INTEGER DEFAULT 0,
          concepts_mastered TEXT[],
          avg_attempts_per_capsule DECIMAL(4,2) DEFAULT 0,
          completion_streak INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, date)
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS analytics.test_case_failures (
          id BIGSERIAL PRIMARY KEY,
          capsule_id UUID NOT NULL,
          test_case_id VARCHAR(100) NOT NULL,
          test_case_name VARCHAR(200),
          date DATE NOT NULL,
          total_attempts INTEGER DEFAULT 0,
          failure_count INTEGER DEFAULT 0,
          failure_rate DECIMAL(5,4) DEFAULT 0,
          common_error_messages JSONB,
          affected_user_count INTEGER DEFAULT 0,
          avg_attempts_before_success DECIMAL(4,2),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(capsule_id, test_case_id, date)
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS analytics.active_sessions (
          session_id VARCHAR(100) PRIMARY KEY,
          user_id UUID,
          capsule_id UUID,
          started_at TIMESTAMPTZ DEFAULT NOW(),
          last_activity TIMESTAMPTZ DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT,
          current_code TEXT,
          attempts_count INTEGER DEFAULT 0,
          hints_used INTEGER DEFAULT 0,
          is_completed BOOLEAN DEFAULT FALSE,
          expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
      );
    `;
    
    console.log('📝 Creating indexes...');
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_event_stream_timestamp ON analytics.event_stream (timestamp DESC);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_event_stream_capsule ON analytics.event_stream (capsule_id, timestamp DESC);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_capsule_hourly_capsule_time ON analytics.capsule_hourly_stats (capsule_id, hour_bucket DESC);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_user_daily_user_date ON analytics.user_daily_stats (user_id, date DESC);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_test_failures_capsule_date ON analytics.test_case_failures (capsule_id, date DESC);`;
    
    console.log('✅ Analytics schema migration completed successfully!');
    
    // Test that the schema was created
    const result = await prisma.$queryRaw`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'analytics'
      ORDER BY tablename;
    `;
    
    console.log('📊 Created analytics tables:');
    console.log(result);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAnalyticsMigration();