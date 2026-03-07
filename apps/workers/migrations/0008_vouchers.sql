-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 0008: Voucher / Coupon System
-- Allows admin to create time-limited vouchers that grant a plan for N days.
-- Used for pilot course creators, partnerships, beta testers, etc.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vouchers (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  code            TEXT NOT NULL UNIQUE,          -- Human-readable code (e.g. "PILOT3MO", "PARTNER-XYZ")
  plan            TEXT NOT NULL DEFAULT 'creator' CHECK(plan IN ('creator','team','enterprise')),
  duration_days   INTEGER NOT NULL DEFAULT 90,   -- How many days the grant lasts
  max_uses        INTEGER NOT NULL DEFAULT 1,    -- Total number of redemptions allowed (-1 = unlimited)
  times_used      INTEGER NOT NULL DEFAULT 0,    -- Current redemption count
  created_by      TEXT,                          -- Admin user_id who created it
  note            TEXT,                          -- Internal note (e.g. "Pilot batch 1 — March 2026")
  expires_at      TEXT,                          -- Voucher itself expires (null = never)
  is_active       INTEGER NOT NULL DEFAULT 1,    -- 0 = deactivated
  created_at      TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);

-- Track every redemption for audit
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  voucher_id      TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  plan_granted    TEXT NOT NULL,
  granted_until   TEXT NOT NULL,                 -- When the voucher grant expires
  redeemed_at     TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(voucher_id, user_id)                    -- One redemption per user per voucher
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON voucher_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_voucher ON voucher_redemptions(voucher_id);

-- Add voucher tracking columns to subscriptions
ALTER TABLE subscriptions ADD COLUMN voucher_id TEXT;
ALTER TABLE subscriptions ADD COLUMN voucher_granted_until TEXT;
