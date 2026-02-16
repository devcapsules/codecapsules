-- ══════════════════════════════════════════════════════════════════════════════
-- DevCapsules D1 Database Schema
-- Migration: 0001_initial_schema
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- Users Table
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  avatar_url      TEXT,
  plan            TEXT DEFAULT 'free' CHECK(plan IN ('free','creator','team','enterprise')),
  generation_quota INTEGER DEFAULT 5,
  execution_quota  INTEGER DEFAULT 100,
  auth_provider   TEXT DEFAULT 'email' CHECK(auth_provider IN ('email','github','google')),
  auth_provider_id TEXT,
  password_hash   TEXT,  -- Only for email auth
  email_verified  INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_provider, auth_provider_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Capsules Table
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capsules (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  creator_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT DEFAULT 'CODE' CHECK(type IN ('CODE','DATABASE','TERMINAL')),
  difficulty      TEXT DEFAULT 'MEDIUM' CHECK(difficulty IN ('EASY','MEDIUM','HARD')),
  language        TEXT NOT NULL,
  function_name   TEXT,              -- Extracted for querying (e.g., 'twoSum')
  test_count      INTEGER DEFAULT 0, -- Number of test cases
  has_hints       INTEGER DEFAULT 0, -- Boolean: has hints?
  content         TEXT NOT NULL,     -- JSON blob (full capsule structure)
  tags            TEXT,              -- JSON array as text (e.g., '["arrays","sorting"]')
  quality_score   REAL,              -- 0.0 - 1.0
  is_published    INTEGER DEFAULT 0, -- Boolean
  is_deleted      INTEGER DEFAULT 0, -- Soft delete
  published_at    TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_capsules_creator ON capsules(creator_id);
CREATE INDEX IF NOT EXISTS idx_capsules_language ON capsules(language);
CREATE INDEX IF NOT EXISTS idx_capsules_published ON capsules(is_published, is_deleted);
CREATE INDEX IF NOT EXISTS idx_capsules_difficulty ON capsules(difficulty, language);
CREATE INDEX IF NOT EXISTS idx_capsules_type ON capsules(type);
CREATE INDEX IF NOT EXISTS idx_capsules_created ON capsules(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- Capsule Events (Event-Sourced Analytics)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capsule_events (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  capsule_id  TEXT NOT NULL,
  user_id     TEXT,                -- NULL for anonymous users
  event_type  TEXT NOT NULL CHECK(event_type IN (
    'impression',      -- Capsule was viewed
    'run',             -- User ran their code
    'test_pass',       -- Test case passed
    'test_fail',       -- Test case failed
    'hint_viewed',     -- User viewed a hint
    'solution_viewed', -- User viewed the solution
    'completed',       -- User completed all tests
    'abandoned'        -- User left without completing
  )),
  metadata    TEXT,                -- JSON (test case id, error message, etc.)
  session_id  TEXT,                -- Group events by session
  client_ip   TEXT,                -- For geo analytics (hashed)
  user_agent  TEXT,                -- Browser/device info
  referrer    TEXT,                -- Where user came from
  created_at  TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_capsule ON capsule_events(capsule_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_time ON capsule_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user ON capsule_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON capsule_events(session_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Capsule Stats (Pre-computed Analytics - Updated by Cron)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capsule_stats (
  capsule_id      TEXT PRIMARY KEY,
  impressions     INTEGER DEFAULT 0,
  unique_viewers  INTEGER DEFAULT 0,
  total_runs      INTEGER DEFAULT 0,
  total_passes    INTEGER DEFAULT 0,
  total_fails     INTEGER DEFAULT 0,
  unique_users    INTEGER DEFAULT 0,
  avg_attempts    REAL DEFAULT 0,
  completion_rate REAL DEFAULT 0,    -- passes / runs
  engagement_rate REAL DEFAULT 0,    -- runs / impressions
  hint_usage_rate REAL DEFAULT 0,    -- hint_views / runs
  solution_rate   REAL DEFAULT 0,    -- solution_views / runs
  last_computed   TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE
);

-- ══════════════════════════════════════════════════════════════════════════════
-- Courses / Playlists
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS courses (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  creator_id  TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_published INTEGER DEFAULT 0,
  is_deleted  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_courses_creator ON courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published, is_deleted);

-- ══════════════════════════════════════════════════════════════════════════════
-- Course Capsules (Many-to-Many with ordering)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS course_capsules (
  course_id   TEXT NOT NULL,
  capsule_id  TEXT NOT NULL,
  position    INTEGER NOT NULL,   -- Order in course
  is_gate     INTEGER DEFAULT 0,  -- Must complete before next?
  is_optional INTEGER DEFAULT 0,  -- Optional/bonus capsule?
  
  PRIMARY KEY (course_id, capsule_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_capsules_order ON course_capsules(course_id, position);

-- ══════════════════════════════════════════════════════════════════════════════
-- User Progress (Tracks completion status)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_progress (
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
  
  UNIQUE(user_id, capsule_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_capsule ON user_progress(capsule_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON user_progress(course_id, user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- API Keys (For embed widget + API consumers)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_keys (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,       -- "Production Key", "Test Key"
  key_hash    TEXT UNIQUE NOT NULL, -- SHA-256 of the actual key
  key_prefix  TEXT NOT NULL,       -- First 8 chars for identification (dk_xxxxxxxx)
  scopes      TEXT DEFAULT '["read","execute"]', -- JSON array of permissions
  rate_limit  INTEGER DEFAULT 100, -- Custom rate limit (per minute)
  last_used   TEXT,
  expires_at  TEXT,                -- NULL = never expires
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- ══════════════════════════════════════════════════════════════════════════════
-- Subscriptions (For billing integration)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  user_id         TEXT NOT NULL UNIQUE,
  plan            TEXT NOT NULL CHECK(plan IN ('free','creator','team','enterprise')),
  status          TEXT DEFAULT 'active' CHECK(status IN ('active','canceled','past_due','trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Triggers for updated_at
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_capsules_timestamp 
AFTER UPDATE ON capsules
BEGIN
  UPDATE capsules SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_courses_timestamp 
AFTER UPDATE ON courses
BEGIN
  UPDATE courses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_progress_timestamp 
AFTER UPDATE ON user_progress
BEGIN
  UPDATE user_progress SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_subscriptions_timestamp 
AFTER UPDATE ON subscriptions
BEGIN
  UPDATE subscriptions SET updated_at = datetime('now') WHERE id = NEW.id;
END;
