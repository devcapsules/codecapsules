-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 0011: Expand capsule_events event_type CHECK constraint
--
-- Adds 'edge_assist' and 'hint_feedback' to the valid event_type values.
-- These events were being tracked by edge-assistant.ts and mentor.ts
-- but silently dropped on D1 insert due to the CHECK constraint.
--
-- SQLite requires table recreation to modify CHECK constraints.
-- ══════════════════════════════════════════════════════════════════════════════

-- Step 1: Create new table with expanded CHECK constraint
CREATE TABLE IF NOT EXISTS capsule_events_new (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  capsule_id  TEXT NOT NULL,
  user_id     TEXT,
  event_type  TEXT NOT NULL CHECK(event_type IN (
    'impression',
    'run',
    'test_pass',
    'test_fail',
    'hint_viewed',
    'hint_feedback',
    'solution_viewed',
    'completed',
    'abandoned',
    'edge_assist'
  )),
  metadata    TEXT,
  session_id  TEXT,
  client_ip   TEXT,
  user_agent  TEXT,
  referrer    TEXT,
  learner_id  TEXT,
  learner_name TEXT,
  created_at  TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE
);

-- Step 2: Copy all existing data
INSERT INTO capsule_events_new (id, capsule_id, user_id, event_type, metadata, session_id, client_ip, user_agent, referrer, learner_id, learner_name, created_at)
SELECT id, capsule_id, user_id, event_type, metadata, session_id, client_ip, user_agent, referrer, learner_id, learner_name, created_at
FROM capsule_events;

-- Step 3: Drop old table
DROP TABLE capsule_events;

-- Step 4: Rename new table
ALTER TABLE capsule_events_new RENAME TO capsule_events;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_events_capsule ON capsule_events(capsule_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON capsule_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_learner ON capsule_events(learner_id, capsule_id);
CREATE INDEX IF NOT EXISTS idx_events_learner_id ON capsule_events(learner_id);
