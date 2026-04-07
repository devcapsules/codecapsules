-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: 0010 — Client Tag Stats
-- Persists per-hour API request counts per x-client tag for traffic analytics.
-- Table is populated by the flushClientTagCounters() cron (every 15 min).
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_tag_stats (
  id            TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(6)))),
  client_tag    TEXT    NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  -- ISO-8601 truncated to the hour, e.g. '2026-03-16T12'
  hour_bucket   TEXT    NOT NULL,
  last_updated  TEXT    NOT NULL DEFAULT (datetime('now')),

  UNIQUE(client_tag, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_client_tag_stats_bucket ON client_tag_stats(hour_bucket);
CREATE INDEX IF NOT EXISTS idx_client_tag_stats_tag    ON client_tag_stats(client_tag);
