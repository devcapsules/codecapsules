-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 0006: Learner Identity for Embed Analytics
--
-- Adds persistent learner tracking to capsule_events so course creators
-- can see per-student pass/fail results without requiring student login.
--
-- Two new columns:
--   learner_id   — stable UUID stored in student's localStorage (survives reloads)
--   learner_name — optional human name (set when student enters name via toast)
--
-- The leaderboard toast ("Passive-Aggressive Upgrade") fires after a successful
-- test pass and asks students to optionally enter their name.  When they do,
-- a 'learner_identified' event is fired and all prior events for that learnerId
-- get backfilled with the name.
-- ══════════════════════════════════════════════════════════════════════════════

-- Add learner identity columns to capsule_events
ALTER TABLE capsule_events ADD COLUMN learner_id TEXT;
ALTER TABLE capsule_events ADD COLUMN learner_name TEXT;

-- Index for querying by learner across capsules (creator dashboard)
CREATE INDEX IF NOT EXISTS idx_events_learner ON capsule_events(learner_id, capsule_id);

-- Index for backfill query (UPDATE ... WHERE learner_id = ?)
CREATE INDEX IF NOT EXISTS idx_events_learner_id ON capsule_events(learner_id);
