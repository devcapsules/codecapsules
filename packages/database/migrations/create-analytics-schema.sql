-- =============================================
-- CODECAPSULE ANALYTICS SCHEMA - PRODUCTION
-- =============================================
-- This creates the analytics schema and tables for the hybrid-cloud deployment
-- Pipeline: Cloudflare Worker → Azure Event Hubs → Azure Function → Supabase

-- Create analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- =============================================
-- RAW EVENT INGESTION TABLES
-- =============================================

-- Raw events from Cloudflare Workers (high-throughput buffer)
CREATE TABLE analytics.event_stream (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID DEFAULT gen_random_uuid(),
    
    -- Event metadata
    event_type VARCHAR(50) NOT NULL,
    capsule_id UUID,
    user_id UUID,
    session_id VARCHAR(100),
    
    -- Tracking data
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Event payload
    event_data JSONB,
    
    -- Processing metadata
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    batch_id UUID,
    
    -- Indexes for performance
    CONSTRAINT event_stream_event_type_check CHECK (event_type IN (
        'session_started', 'session_ended', 'code_run', 'test_passed', 'test_failed',
        'hint_requested', 'solution_viewed', 'capsule_completed', 'error_encountered'
    ))
);

-- Indexes for high-performance queries
CREATE INDEX idx_event_stream_timestamp ON analytics.event_stream (timestamp DESC);
CREATE INDEX idx_event_stream_capsule ON analytics.event_stream (capsule_id, timestamp DESC);
CREATE INDEX idx_event_stream_user ON analytics.event_stream (user_id, timestamp DESC);
CREATE INDEX idx_event_stream_type ON analytics.event_stream (event_type, timestamp DESC);
CREATE INDEX idx_event_stream_processed ON analytics.event_stream (processed, timestamp);

-- =============================================
-- AGGREGATED ANALYTICS TABLES
-- =============================================

-- Hourly capsule statistics (the main analytics table)
CREATE TABLE analytics.capsule_hourly_stats (
    id BIGSERIAL PRIMARY KEY,
    capsule_id UUID NOT NULL,
    hour_bucket TIMESTAMPTZ NOT NULL, -- Rounded to hour
    
    -- Engagement metrics
    total_sessions INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_session_duration_seconds INTEGER DEFAULT 0,
    avg_time_to_first_run_seconds INTEGER DEFAULT 0,
    avg_attempts_per_completion DECIMAL(4,2) DEFAULT 0,
    
    -- Learning metrics
    completion_rate DECIMAL(5,4) DEFAULT 0, -- 0.0 to 1.0
    hint_usage_rate DECIMAL(5,4) DEFAULT 0,
    solution_view_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Error analysis
    total_errors INTEGER DEFAULT 0,
    common_error_types JSONB, -- Array of error patterns
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(capsule_id, hour_bucket)
);

-- Indexes for dashboard queries
CREATE INDEX idx_capsule_hourly_capsule_time ON analytics.capsule_hourly_stats (capsule_id, hour_bucket DESC);
CREATE INDEX idx_capsule_hourly_bucket ON analytics.capsule_hourly_stats (hour_bucket DESC);

-- Daily user engagement (for user-level analytics)
CREATE TABLE analytics.user_daily_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    
    -- Activity metrics
    capsules_attempted INTEGER DEFAULT 0,
    capsules_completed INTEGER DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    
    -- Learning progress
    session_duration_seconds INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    concepts_mastered TEXT[], -- Array of concept tags
    
    -- Engagement quality
    avg_attempts_per_capsule DECIMAL(4,2) DEFAULT 0,
    completion_streak INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Index for user analytics queries
CREATE INDEX idx_user_daily_user_date ON analytics.user_daily_stats (user_id, date DESC);

-- =============================================
-- B2B ANALYTICS TABLES
-- =============================================

-- Organization-level analytics (for B2B dashboards)
CREATE TABLE analytics.organization_daily_stats (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,
    date DATE NOT NULL,
    
    -- Student metrics
    active_students INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    avg_session_duration_seconds INTEGER DEFAULT 0,
    
    -- Performance metrics  
    total_capsules_completed INTEGER DEFAULT 0,
    overall_success_rate DECIMAL(5,4) DEFAULT 0,
    avg_attempts_per_completion DECIMAL(4,2) DEFAULT 0,
    
    -- Pedagogical insights
    at_risk_student_count INTEGER DEFAULT 0,
    top_struggling_concepts TEXT[],
    most_failed_test_cases JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, date)
);

-- Failing test case analysis (the "killer feature")
CREATE TABLE analytics.test_case_failures (
    id BIGSERIAL PRIMARY KEY,
    capsule_id UUID NOT NULL,
    test_case_id VARCHAR(100) NOT NULL,
    test_case_name VARCHAR(200),
    
    -- Failure metrics (updated daily)
    date DATE NOT NULL,
    total_attempts INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    failure_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Error analysis
    common_error_messages JSONB, -- Array of frequent errors
    affected_user_count INTEGER DEFAULT 0,
    avg_attempts_before_success DECIMAL(4,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(capsule_id, test_case_id, date)
);

-- Index for deep-dive dashboard queries
CREATE INDEX idx_test_failures_capsule_date ON analytics.test_case_failures (capsule_id, date DESC);
CREATE INDEX idx_test_failures_rate ON analytics.test_case_failures (failure_rate DESC, date DESC);

-- =============================================
-- REAL-TIME SESSION TRACKING
-- =============================================

-- Active user sessions (for real-time analytics)
CREATE TABLE analytics.active_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id UUID,
    capsule_id UUID,
    
    -- Session metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Current state
    current_code TEXT,
    attempts_count INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Expires after 1 hour of inactivity
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for cleanup and real-time queries
CREATE INDEX idx_active_sessions_expires ON analytics.active_sessions (expires_at);
CREATE INDEX idx_active_sessions_user ON analytics.active_sessions (user_id, started_at DESC);

-- =============================================
-- VIEWS FOR DASHBOARD QUERIES
-- =============================================

-- Pro Tier Dashboard View (Content Engagement)
CREATE VIEW analytics.pro_tier_metrics AS
SELECT 
    c.id as capsule_id,
    c.title,
    c.creator_id,
    -- Last 30 days metrics
    SUM(chs.unique_users) as total_impressions,
    AVG(chs.completion_rate) as avg_engagement_rate,
    AVG(CASE WHEN chs.total_sessions > 0 THEN chs.successful_runs::DECIMAL / chs.total_runs ELSE 0 END) as completion_rate,
    SUM(chs.total_sessions) as total_sessions
FROM capsules c
LEFT JOIN analytics.capsule_hourly_stats chs ON c.id = chs.capsule_id
WHERE chs.hour_bucket >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.title, c.creator_id;

-- B2B Cohort Dashboard View (Student Progress)
CREATE VIEW analytics.cohort_metrics AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT u.id) as total_students,
    AVG(uds.completion_streak) as avg_completion_streak,
    AVG(uds.avg_attempts_per_capsule) as avg_attempts_per_capsule,
    COUNT(CASE WHEN uds.avg_attempts_per_capsule > 5 THEN 1 END) as at_risk_students
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN analytics.user_daily_stats uds ON u.id = uds.user_id
WHERE uds.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY o.id, o.name;

-- =============================================
-- FUNCTIONS FOR DATA PROCESSING
-- =============================================

-- Function to process raw events into hourly stats (called by Azure Function)
CREATE OR REPLACE FUNCTION analytics.process_hourly_batch(batch_start TIMESTAMPTZ, batch_end TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    hour_bucket TIMESTAMPTZ;
    capsule_record RECORD;
BEGIN
    -- Round down to hour boundary
    hour_bucket := date_trunc('hour', batch_start);
    
    -- Process each capsule's events for the hour
    FOR capsule_record IN 
        SELECT DISTINCT capsule_id 
        FROM analytics.event_stream 
        WHERE timestamp >= batch_start 
        AND timestamp < batch_end 
        AND processed = FALSE
        AND capsule_id IS NOT NULL
    LOOP
        -- Insert or update hourly stats
        INSERT INTO analytics.capsule_hourly_stats (
            capsule_id, hour_bucket, total_sessions, unique_users, total_runs, successful_runs
        )
        SELECT 
            capsule_record.capsule_id,
            hour_bucket,
            COUNT(DISTINCT session_id) as total_sessions,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(CASE WHEN event_type = 'code_run' THEN 1 END) as total_runs,
            COUNT(CASE WHEN event_type = 'test_passed' THEN 1 END) as successful_runs
        FROM analytics.event_stream
        WHERE capsule_id = capsule_record.capsule_id
        AND timestamp >= batch_start 
        AND timestamp < batch_end
        AND processed = FALSE
        ON CONFLICT (capsule_id, hour_bucket) 
        DO UPDATE SET 
            total_sessions = EXCLUDED.total_sessions,
            unique_users = EXCLUDED.unique_users,
            total_runs = EXCLUDED.total_runs,
            successful_runs = EXCLUDED.successful_runs,
            updated_at = NOW();
            
        processed_count := processed_count + 1;
    END LOOP;
    
    -- Mark events as processed
    UPDATE analytics.event_stream 
    SET processed = TRUE, processed_at = NOW()
    WHERE timestamp >= batch_start 
    AND timestamp < batch_end 
    AND processed = FALSE;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old raw events (retention policy)
CREATE OR REPLACE FUNCTION analytics.cleanup_old_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete processed events older than 7 days
    DELETE FROM analytics.event_stream 
    WHERE processed = TRUE 
    AND processed_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up expired sessions
    DELETE FROM analytics.active_sessions 
    WHERE expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all analytics tables
ALTER TABLE analytics.event_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.capsule_hourly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.user_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.organization_daily_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY user_analytics_policy ON analytics.user_daily_stats
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Organization admins can see their org data
CREATE POLICY org_analytics_policy ON analytics.organization_daily_stats
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Public capsule analytics (for Pro tier)
CREATE POLICY capsule_analytics_policy ON analytics.capsule_hourly_stats
    FOR SELECT USING (
        capsule_id IN (
            SELECT id FROM capsules WHERE is_published = true
            OR creator_id = auth.uid()
        )
    );

-- =============================================
-- INITIAL SETUP COMPLETE
-- =============================================

-- Create indexes for common dashboard queries
CREATE INDEX CONCURRENTLY idx_analytics_dashboard_pro 
ON analytics.capsule_hourly_stats (capsule_id, hour_bucket DESC) 
WHERE hour_bucket >= NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY idx_analytics_dashboard_b2b 
ON analytics.user_daily_stats (user_id, date DESC) 
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Grant permissions to the application role
GRANT USAGE ON SCHEMA analytics TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA analytics TO authenticated;