-- ══════════════════════════════════════════════════════════════════════════════
-- DevCapsules D1 Schema Migration
-- Migration: 0002_generation_logs
-- Purpose: Per-job AI cost tracking and attribution
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- Generation Logs — Per-job AI cost attribution
-- Tracks tokens, models, and costs for every generation (or cache hit)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS generation_logs (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL,
  job_id              TEXT NOT NULL,
  prompt              TEXT,                          -- First 500 chars of prompt
  language            TEXT NOT NULL,

  -- Per-agent token usage
  pedagogist_tokens   INTEGER DEFAULT 0,
  coder_tokens        INTEGER DEFAULT 0,
  debugger_tokens     INTEGER DEFAULT 0,

  -- Cost tracking
  total_cost_usd      REAL DEFAULT 0.0,              -- Total USD cost for this job

  -- Model attribution
  pedagogist_model    TEXT DEFAULT 'gpt-4o-mini',
  coder_model         TEXT DEFAULT 'gpt-4o',
  debugger_model      TEXT DEFAULT 'gpt-4o-mini',

  -- Performance
  generation_time_ms  INTEGER,                       -- Total pipeline time
  cached              INTEGER DEFAULT 0,             -- 1 = served from semantic cache

  created_at          TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gen_logs_user ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_logs_job ON generation_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gen_logs_cost ON generation_logs(total_cost_usd DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- Daily Cost Summary View (for budget monitoring)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE VIEW IF NOT EXISTS daily_cost_summary AS
SELECT
  date(created_at) AS day,
  COUNT(*) AS total_jobs,
  SUM(CASE WHEN cached = 1 THEN 1 ELSE 0 END) AS cached_jobs,
  SUM(CASE WHEN cached = 0 THEN 1 ELSE 0 END) AS ai_jobs,
  ROUND(SUM(total_cost_usd), 4) AS total_cost_usd,
  ROUND(AVG(CASE WHEN cached = 0 THEN total_cost_usd END), 4) AS avg_cost_per_ai_job,
  ROUND(AVG(CASE WHEN cached = 0 THEN generation_time_ms END), 0) AS avg_generation_time_ms,
  SUM(pedagogist_tokens + coder_tokens + debugger_tokens) AS total_tokens
FROM generation_logs
GROUP BY date(created_at)
ORDER BY day DESC;

-- ══════════════════════════════════════════════════════════════════════════════
-- Per-User Cost Summary View (for user attribution)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE VIEW IF NOT EXISTS user_cost_summary AS
SELECT
  user_id,
  COUNT(*) AS total_generations,
  SUM(CASE WHEN cached = 1 THEN 1 ELSE 0 END) AS cached_hits,
  ROUND(SUM(total_cost_usd), 4) AS total_cost_usd,
  ROUND(AVG(CASE WHEN cached = 0 THEN total_cost_usd END), 4) AS avg_cost_per_generation,
  MAX(created_at) AS last_generation
FROM generation_logs
GROUP BY user_id
ORDER BY total_cost_usd DESC;
