-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 0007: Razorpay Billing Support
-- Adds Razorpay-specific columns to subscriptions table
-- ══════════════════════════════════════════════════════════════════════════════

-- Add Razorpay columns (keep stripe columns for compat, add razorpay ones)
ALTER TABLE subscriptions ADD COLUMN razorpay_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN razorpay_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN razorpay_plan_id TEXT;
ALTER TABLE subscriptions ADD COLUMN razorpay_payment_id TEXT;

-- Index for Razorpay lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay ON subscriptions(razorpay_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub ON subscriptions(razorpay_subscription_id);

-- Payment history table for audit trail
CREATE TABLE IF NOT EXISTS payment_history (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  user_id         TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount          INTEGER NOT NULL,        -- Amount in paise (INR smallest unit)
  currency        TEXT DEFAULT 'INR',
  plan            TEXT NOT NULL,
  status          TEXT DEFAULT 'created' CHECK(status IN ('created','authorized','captured','failed','refunded')),
  metadata        TEXT,                    -- JSON blob for extra info
  created_at      TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_order ON payment_history(razorpay_order_id);
