-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: 0003 — Courses Enhancements
-- Adds status/tags to existing courses table + indexes for performance
-- Tables already exist: courses, course_capsules, user_progress
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Add status column to courses (draft/published/archived workflow) ──
ALTER TABLE courses ADD COLUMN status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','archived'));

-- ── Add tags column to courses ──
ALTER TABLE courses ADD COLUMN tags TEXT;  -- JSON array e.g. '["react","hooks"]'

-- ── Backfill status from is_published ──
UPDATE courses SET status = CASE WHEN is_published = 1 THEN 'published' ELSE 'draft' END;

-- ── Indexes for courses ──
CREATE INDEX IF NOT EXISTS idx_courses_creator ON courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published, is_deleted);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at DESC);

-- ── Indexes for course_capsules ──
CREATE INDEX IF NOT EXISTS idx_course_capsules_course ON course_capsules(course_id, position);
CREATE INDEX IF NOT EXISTS idx_course_capsules_capsule ON course_capsules(capsule_id);

-- ── Indexes for user_progress ──
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_capsule ON user_progress(capsule_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON user_progress(status);
