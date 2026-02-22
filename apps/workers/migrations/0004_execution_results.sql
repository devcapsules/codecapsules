-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 0004: Execution Results Table
-- Phase 2: Persistent D1 storage for execution results (beyond KV TTL)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS execution_results (
  job_id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('run', 'tests')),
  language TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'completed', 'failed')),
  user_id TEXT,
  org_id TEXT,
  stdout TEXT,
  stderr TEXT,
  exit_code INTEGER,
  execution_time INTEGER,
  test_summary TEXT,       -- JSON blob for test results
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Query by user (execution history)
CREATE INDEX IF NOT EXISTS idx_execution_results_user
  ON execution_results(user_id);

-- Query by org (B2B analytics)
CREATE INDEX IF NOT EXISTS idx_execution_results_org
  ON execution_results(org_id);

-- Time-range queries (cleanup, analytics)
CREATE INDEX IF NOT EXISTS idx_execution_results_created
  ON execution_results(created_at);

-- Status queries (find stuck/failed jobs)
CREATE INDEX IF NOT EXISTS idx_execution_results_status
  ON execution_results(status);
