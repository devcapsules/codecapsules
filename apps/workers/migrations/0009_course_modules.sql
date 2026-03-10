-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: 0009 — Course Modules
-- Adds a modules layer between courses and capsules for grouping.
-- Course → Modules → Capsules (via course_capsules.module_id)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── New table: course_modules ──
CREATE TABLE IF NOT EXISTS course_modules (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  course_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id, position);

-- ── Add module_id to course_capsules ──
ALTER TABLE course_capsules ADD COLUMN module_id TEXT REFERENCES course_modules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_capsules_module ON course_capsules(module_id);
