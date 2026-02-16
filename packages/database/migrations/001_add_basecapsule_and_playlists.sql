-- Migration: Add BaseCapsule and Playlist Support
-- This migration adds support for the new unified BaseCapsule architecture
-- and playlist system while maintaining backward compatibility.

-- ===== 1. UPDATE CAPSULE TABLE FOR BASECAPSULE SUPPORT =====

-- Add new columns for BaseCapsule structure
ALTER TABLE capsules ADD COLUMN capsule_type_new VARCHAR(20);
ALTER TABLE capsules ADD COLUMN problem_statement_md TEXT;
ALTER TABLE capsules ADD COLUMN runtime_config JSONB;
ALTER TABLE capsules ADD COLUMN config_data JSONB;

-- Update capsule_type_new from existing type field
UPDATE capsules SET capsule_type_new = 
  CASE 
    WHEN type = 'CODE' THEN 'CODE'
    WHEN type = 'DATABASE' THEN 'DATABASE' 
    WHEN type = 'TERMINAL' THEN 'TERMINAL'
    ELSE 'CODE' -- Default fallback
  END;

-- Set NOT NULL constraint after data migration
ALTER TABLE capsules ALTER COLUMN capsule_type_new SET NOT NULL;

-- Add check constraint for valid capsule types
ALTER TABLE capsules ADD CONSTRAINT capsule_type_check 
  CHECK (capsule_type_new IN ('CODE', 'DATABASE', 'TERMINAL'));

-- Create indexes for better query performance
CREATE INDEX idx_capsules_type_new ON capsules(capsule_type_new);
CREATE INDEX idx_capsules_creator_type ON capsules(creatorId, capsule_type_new);
CREATE INDEX idx_capsules_config_data ON capsules USING gin(config_data);

-- ===== 2. CREATE PLAYLIST TABLES =====

-- Playlists table
CREATE TABLE playlists (
    playlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Playlist items (join table with ordering)
CREATE TABLE playlist_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    capsule_id VARCHAR(30) NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_playlist_order UNIQUE(playlist_id, "order"),
    CONSTRAINT unique_playlist_capsule UNIQUE(playlist_id, capsule_id),
    CONSTRAINT positive_order CHECK ("order" > 0)
);

-- Playlist progress tracking
CREATE TABLE playlist_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    learner_id VARCHAR(30) REFERENCES users(id) ON DELETE SET NULL, -- Optional for anonymous
    session_id VARCHAR(50) NOT NULL, -- For anonymous tracking
    current_step INTEGER NOT NULL DEFAULT 1,
    completed_steps INTEGER[] DEFAULT '{}',
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT positive_current_step CHECK (current_step > 0)
);

-- ===== 3. CREATE INDEXES FOR PERFORMANCE =====

-- Playlist indexes
CREATE INDEX idx_playlists_creator ON playlists(creator_id);
CREATE INDEX idx_playlists_public ON playlists(is_public) WHERE is_public = true;
CREATE INDEX idx_playlists_created ON playlists(created_at DESC);

-- Playlist items indexes
CREATE INDEX idx_playlist_items_playlist_order ON playlist_items(playlist_id, "order");
CREATE INDEX idx_playlist_items_capsule ON playlist_items(capsule_id);

-- Playlist progress indexes
CREATE INDEX idx_playlist_progress_playlist ON playlist_progress(playlist_id);
CREATE INDEX idx_playlist_progress_learner ON playlist_progress(learner_id) WHERE learner_id IS NOT NULL;
CREATE INDEX idx_playlist_progress_session ON playlist_progress(session_id);
CREATE INDEX idx_playlist_progress_activity ON playlist_progress(last_activity DESC);

-- ===== 4. CREATE HELPFUL VIEWS =====

-- View for playlists with item counts
CREATE VIEW playlist_summary AS
SELECT 
    p.*,
    COUNT(pi.item_id) as total_items,
    ARRAY_AGG(pi.capsule_id ORDER BY pi."order") as capsule_ids
FROM playlists p
LEFT JOIN playlist_items pi ON p.playlist_id = pi.playlist_id
GROUP BY p.playlist_id;

-- View for playlist progress with completion rates
CREATE VIEW playlist_progress_summary AS
SELECT 
    pp.*,
    ps.total_items,
    CASE 
        WHEN ps.total_items > 0 
        THEN ROUND((array_length(pp.completed_steps, 1)::decimal / ps.total_items) * 100, 2)
        ELSE 0 
    END as completion_percentage
FROM playlist_progress pp
JOIN playlist_summary ps ON pp.playlist_id = ps.playlist_id;

-- ===== 5. ADD TRIGGERS FOR UPDATED_AT =====

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for playlists
CREATE TRIGGER update_playlists_updated_at 
    BEFORE UPDATE ON playlists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for playlist progress last_activity
CREATE OR REPLACE FUNCTION update_playlist_progress_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_playlist_progress_activity 
    BEFORE UPDATE ON playlist_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_playlist_progress_activity();

-- ===== 6. SAMPLE DATA MIGRATION (OPTIONAL) =====

-- Example of migrating existing capsule data to new structure
-- This would be customized based on actual data structure

/*
-- Migrate CODE capsules
UPDATE capsules 
SET 
    problem_statement_md = description,
    runtime_config = jsonb_build_object(
        'language', COALESCE(language, 'python'),
        'runtime_tier', CASE 
            WHEN language = 'python' THEN 'wasm-python'
            WHEN language = 'javascript' THEN 'wasm-javascript'
            WHEN language = 'sql' THEN 'server-sql'
            ELSE 'wasm-python'
        END
    ),
    config_data = jsonb_build_object(
        'boilerplate_code', COALESCE(content->>'starterCode', ''),
        'reference_solution', COALESCE(content->>'solutionCode', ''),
        'hints', COALESCE(content->'hints', '[]'::jsonb),
        'test_cases', COALESCE(content->'testCases', '[]'::jsonb)
    )
WHERE capsule_type_new = 'CODE';

-- Migrate DATABASE capsules  
UPDATE capsules 
SET 
    problem_statement_md = description,
    runtime_config = jsonb_build_object(
        'language', 'sql',
        'runtime_tier', 'server-sql'
    ),
    config_data = jsonb_build_object(
        'boilerplate_code', COALESCE(content->>'starterQuery', ''),
        'reference_solution', COALESCE(content->>'solutionQuery', ''),
        'hints', COALESCE(content->'hints', '[]'::jsonb),
        'schema_info', COALESCE(content->'schema', '[]'::jsonb),
        'seed_sql_url', COALESCE(content->>'seedDataUrl', '')
    )
WHERE capsule_type_new = 'DATABASE';

-- Migrate TERMINAL capsules
UPDATE capsules 
SET 
    problem_statement_md = description,
    runtime_config = jsonb_build_object(
        'language', 'bash',
        'runtime_tier', 'wasm-linux'
    ),
    config_data = jsonb_build_object(
        'environment_config', jsonb_build_object(
            'disk_image_url', COALESCE(content->>'diskImage', 'https://r2.devleep.com/images/alpine-v1.img')
        ),
        'hints', COALESCE(content->'hints', '[]'::jsonb),
        'tasks', COALESCE(content->'tasks', '[]'::jsonb)
    )
WHERE capsule_type_new = 'TERMINAL';
*/

-- ===== 7. VERIFICATION QUERIES =====

-- Check migration success
-- SELECT capsule_type_new, COUNT(*) FROM capsules GROUP BY capsule_type_new;
-- SELECT COUNT(*) FROM playlists;
-- SELECT COUNT(*) FROM playlist_items;

COMMENT ON TABLE playlists IS 'Sequential collections of capsules forming courses';
COMMENT ON TABLE playlist_items IS 'Join table linking capsules to playlists with ordering';
COMMENT ON TABLE playlist_progress IS 'Tracks learner progress through playlists';
COMMENT ON COLUMN playlist_items."order" IS 'Sequence number for capsule ordering in playlist (1, 2, 3...)';
COMMENT ON COLUMN playlist_progress.completed_steps IS 'Array of step numbers that learner has completed';
COMMENT ON COLUMN playlist_progress.session_id IS 'Session identifier for anonymous progress tracking';