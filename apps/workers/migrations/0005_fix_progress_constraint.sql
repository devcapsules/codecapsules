-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: 0005 — Fix user_progress unique constraint
-- Critical #3: The UNIQUE(user_id, capsule_id) constraint prevents a student
-- from having independent progress on the same capsule in two different courses.
-- This migration recreates the table with UNIQUE(user_id, capsule_id, course_id).
--
-- D1/SQLite does not support ALTER TABLE ... DROP CONSTRAINT, so we must
-- recreate the table and migrate data.
-- ══════════════════════════════════════════════════════════════════════════════

-- Step 1: Create new table with correct constraint
CREATE TABLE IF NOT EXISTS user_progress_new (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  user_id     TEXT NOT NULL,
  capsule_id  TEXT NOT NULL,
  course_id   TEXT,                -- NULL if standalone capsule
  status      TEXT DEFAULT 'not_started' CHECK(status IN (
    'not_started',
    'in_progress',
    'completed'
  )),
  attempts    INTEGER DEFAULT 0,
  best_time   INTEGER,             -- Best completion time (ms)
  hints_used  INTEGER DEFAULT 0,
  solution_viewed INTEGER DEFAULT 0,
  last_code   TEXT,                -- User's last code attempt
  completed_at TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now')),

  -- Fixed: include course_id in uniqueness so the same capsule can have
  -- independent progress across different courses
  UNIQUE(user_id, capsule_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Step 2: Copy existing data
INSERT OR IGNORE INTO user_progress_new
  SELECT * FROM user_progress;

-- Step 3: Drop old table
DROP TABLE IF EXISTS user_progress;

-- Step 4: Rename new table
ALTER TABLE user_progress_new RENAME TO user_progress;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_capsule ON user_progress(capsule_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON user_progress(course_id, user_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON user_progress(status);
