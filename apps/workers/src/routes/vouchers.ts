/**
 * Voucher / Coupon Routes
 *
 * Admin: Create, list, deactivate vouchers
 * Users: Redeem voucher codes to get time-limited plan upgrades
 *
 * Voucher flow:
 *   1. Admin creates voucher: POST /vouchers/admin/create { code, plan, durationDays, maxUses }
 *   2. User redeems:         POST /vouchers/redeem { code }
 *   3. System upgrades user plan + sets expiry
 *   4. Cron/webhook checks expiry and downgrades when expired
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';

type Variables = {
  auth: Auth | null;
  requestId: string;
};

export const voucherRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Admin email whitelist (hardcoded for now — move to env/DB later) ──
const ADMIN_EMAILS = [
  'yashw@devcapsules.com',
  'yash@devleep.com',
  'admin@devcapsules.com',
];

function requireAdmin(auth: Auth | null): void {
  if (!auth) throw new ApiError(401, 'Authentication required');
  if (!ADMIN_EMAILS.includes(auth.email)) {
    throw new ApiError(403, 'Admin access required');
  }
}

// ── Plan quotas (same as payments.ts — shared config) ──
const PLAN_QUOTAS: Record<string, { executions: number; generations: number }> = {
  creator:    { executions: 10000,  generations: 50 },
  team:       { executions: 100000, generations: 500 },
  enterprise: { executions: -1,     generations: -1 },
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /vouchers/admin/create — Create a new voucher (admin only)
// ══════════════════════════════════════════════════════════════════════════════

voucherRoutes.post('/admin/create', async (c) => {
  const auth = c.get('auth');
  requireAdmin(auth);

  const body = await c.req.json<{
    code: string;
    plan?: string;
    durationDays?: number;
    maxUses?: number;
    note?: string;
    expiresAt?: string;
  }>();

  const code = (body.code || '').trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
  if (!code || code.length < 3 || code.length > 32) {
    throw new ApiError(400, 'code must be 3-32 alphanumeric characters (dashes/underscores allowed)');
  }

  const plan = body.plan || 'creator';
  if (!['creator', 'team', 'enterprise'].includes(plan)) {
    throw new ApiError(400, 'plan must be creator, team, or enterprise');
  }

  const durationDays = body.durationDays || 90;
  if (durationDays < 1 || durationDays > 365) {
    throw new ApiError(400, 'durationDays must be 1–365');
  }

  const maxUses = body.maxUses ?? 1;

  // Check for duplicate code
  const existing = await c.env.DB.prepare('SELECT id FROM vouchers WHERE code = ?').bind(code).first();
  if (existing) {
    throw new ApiError(409, `Voucher code "${code}" already exists`);
  }

  await c.env.DB.prepare(`
    INSERT INTO vouchers (code, plan, duration_days, max_uses, created_by, note, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    code,
    plan,
    durationDays,
    maxUses,
    auth!.userId,
    body.note || null,
    body.expiresAt || null
  ).run();

  return c.json({
    success: true,
    data: {
      code,
      plan,
      durationDays,
      maxUses,
      note: body.note || null,
      message: `Voucher "${code}" created. Grants ${plan} plan for ${durationDays} days.`,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /vouchers/admin/batch — Create multiple vouchers at once (admin only)
// ══════════════════════════════════════════════════════════════════════════════

voucherRoutes.post('/admin/batch', async (c) => {
  const auth = c.get('auth');
  requireAdmin(auth);

  const { prefix, count, plan, durationDays, maxUses, note } = await c.req.json<{
    prefix: string;
    count: number;
    plan?: string;
    durationDays?: number;
    maxUses?: number;
    note?: string;
  }>();

  if (!prefix || count < 1 || count > 100) {
    throw new ApiError(400, 'prefix required, count must be 1–100');
  }

  const validPlan = plan || 'creator';
  const validDuration = durationDays || 90;
  const validMaxUses = maxUses ?? 1;
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate unique suffix: prefix + random 6-char hex
    const suffix = Array.from(crypto.getRandomValues(new Uint8Array(3)))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const code = `${prefix.toUpperCase()}-${suffix}`;

    try {
      await c.env.DB.prepare(`
        INSERT INTO vouchers (code, plan, duration_days, max_uses, created_by, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(code, validPlan, validDuration, validMaxUses, auth!.userId, note || `Batch: ${prefix}`).run();
      codes.push(code);
    } catch {
      // Skip duplicates silently
    }
  }

  return c.json({
    success: true,
    data: {
      created: codes.length,
      codes,
      plan: validPlan,
      durationDays: validDuration,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /vouchers/admin/list — List all vouchers (admin only)
// ══════════════════════════════════════════════════════════════════════════════

voucherRoutes.get('/admin/list', async (c) => {
  const auth = c.get('auth');
  requireAdmin(auth);

  const vouchers = await c.env.DB.prepare(`
    SELECT v.*, 
           (SELECT COUNT(*) FROM voucher_redemptions WHERE voucher_id = v.id) as actual_uses
    FROM vouchers v
    ORDER BY v.created_at DESC
    LIMIT 100
  `).all();

  return c.json({
    success: true,
    data: (vouchers.results || []).map((v: any) => ({
      id: v.id,
      code: v.code,
      plan: v.plan,
      durationDays: v.duration_days,
      maxUses: v.max_uses,
      timesUsed: v.actual_uses,
      isActive: v.is_active === 1,
      expiresAt: v.expires_at,
      note: v.note,
      createdAt: v.created_at,
    })),
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /vouchers/admin/deactivate — Deactivate a voucher (admin only)
// ══════════════════════════════════════════════════════════════════════════════

voucherRoutes.post('/admin/deactivate', async (c) => {
  const auth = c.get('auth');
  requireAdmin(auth);

  const { code } = await c.req.json<{ code: string }>();
  if (!code) throw new ApiError(400, 'code is required');

  const result = await c.env.DB.prepare(
    'UPDATE vouchers SET is_active = 0 WHERE code = ?'
  ).bind(code.toUpperCase()).run();

  if (!result.meta.changes) {
    throw new ApiError(404, `Voucher "${code}" not found`);
  }

  return c.json({
    success: true,
    data: { message: `Voucher "${code}" deactivated.` },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /vouchers/redeem — User redeems a voucher code
// ══════════════════════════════════════════════════════════════════════════════

voucherRoutes.post('/redeem', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { code } = await c.req.json<{ code: string }>();
  if (!code) throw new ApiError(400, 'Voucher code is required');

  const normalizedCode = code.trim().toUpperCase();

  // Look up voucher
  const voucher = await c.env.DB.prepare(`
    SELECT * FROM vouchers WHERE code = ? AND is_active = 1
  `).bind(normalizedCode).first<any>();

  if (!voucher) {
    throw new ApiError(404, 'Invalid or expired voucher code');
  }

  // Check if voucher has expired
  if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
    throw new ApiError(410, 'This voucher has expired');
  }

  // Check max uses
  if (voucher.max_uses !== -1 && voucher.times_used >= voucher.max_uses) {
    throw new ApiError(410, 'This voucher has been fully redeemed');
  }

  // Check if user already redeemed this voucher
  const alreadyRedeemed = await c.env.DB.prepare(
    'SELECT id FROM voucher_redemptions WHERE voucher_id = ? AND user_id = ?'
  ).bind(voucher.id, auth.userId).first();

  if (alreadyRedeemed) {
    throw new ApiError(409, 'You have already redeemed this voucher');
  }

  // Calculate grant end date
  const grantedUntil = new Date(Date.now() + voucher.duration_days * 24 * 60 * 60 * 1000).toISOString();

  // Record redemption
  await c.env.DB.prepare(`
    INSERT INTO voucher_redemptions (voucher_id, user_id, plan_granted, granted_until)
    VALUES (?, ?, ?, ?)
  `).bind(voucher.id, auth.userId, voucher.plan, grantedUntil).run();

  // Increment usage counter
  await c.env.DB.prepare(
    'UPDATE vouchers SET times_used = times_used + 1 WHERE id = ?'
  ).bind(voucher.id).run();

  // Upgrade user plan
  await c.env.DB.prepare(
    'UPDATE users SET plan = ? WHERE id = ?'
  ).bind(voucher.plan, auth.userId).run();

  // Update quotas
  const quotas = PLAN_QUOTAS[voucher.plan];
  if (quotas) {
    await c.env.DB.prepare(
      'UPDATE users SET execution_quota = ?, generation_quota = ? WHERE id = ?'
    ).bind(quotas.executions, quotas.generations, auth.userId).run();
  }

  // Upsert subscription with voucher info
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end, voucher_id, voucher_granted_until)
    VALUES (?, ?, 'active', ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      plan = excluded.plan,
      status = 'active',
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      voucher_id = excluded.voucher_id,
      voucher_granted_until = excluded.voucher_granted_until,
      cancel_at_period_end = 0
  `).bind(auth.userId, voucher.plan, now, grantedUntil, voucher.id, grantedUntil).run();

  const planLabels: Record<string, string> = {
    creator: 'Creator',
    team: 'Business',
    enterprise: 'Enterprise',
  };

  return c.json({
    success: true,
    data: {
      plan: voucher.plan,
      planLabel: planLabels[voucher.plan] || voucher.plan,
      grantedUntil,
      durationDays: voucher.duration_days,
      message: `🎉 Voucher redeemed! You now have the ${planLabels[voucher.plan] || voucher.plan} plan until ${new Date(grantedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /vouchers/status — Check user's active voucher grants
// ══════════════════════════════════════════════════════════════════════════════

voucherRoutes.get('/status', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const grants = await c.env.DB.prepare(`
    SELECT vr.plan_granted, vr.granted_until, vr.redeemed_at, v.code, v.note
    FROM voucher_redemptions vr
    JOIN vouchers v ON vr.voucher_id = v.id
    WHERE vr.user_id = ?
    ORDER BY vr.redeemed_at DESC
  `).bind(auth.userId).all();

  const activeGrants = (grants.results || []).filter((g: any) =>
    new Date(g.granted_until) > new Date()
  );

  return c.json({
    success: true,
    data: {
      activeGrants: activeGrants.map((g: any) => ({
        plan: g.plan_granted,
        grantedUntil: g.granted_until,
        redeemedAt: g.redeemed_at,
        voucherCode: g.code,
        daysRemaining: Math.max(0, Math.ceil((new Date(g.granted_until).getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
      })),
      allGrants: (grants.results || []).map((g: any) => ({
        plan: g.plan_granted,
        grantedUntil: g.granted_until,
        redeemedAt: g.redeemed_at,
        voucherCode: g.code,
        isExpired: new Date(g.granted_until) <= new Date(),
      })),
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /vouchers/admin/check-expiry — Run expiry check (can be called by cron)
// Downgrades users whose voucher grants have expired
// ══════════════════════════════════════════════════════════════════════════════

voucherRoutes.post('/admin/check-expiry', async (c) => {
  const auth = c.get('auth');
  requireAdmin(auth);

  const now = new Date().toISOString();

  // Find subscriptions where voucher has expired but user is still on paid plan
  const expired = await c.env.DB.prepare(`
    SELECT s.user_id, s.plan, s.voucher_granted_until
    FROM subscriptions s
    WHERE s.voucher_id IS NOT NULL
      AND s.voucher_granted_until IS NOT NULL
      AND s.voucher_granted_until < ?
      AND s.status = 'active'
      AND s.razorpay_payment_id IS NULL
  `).bind(now).all();

  let downgraded = 0;
  for (const sub of (expired.results || []) as any[]) {
    // Downgrade to free
    await c.env.DB.prepare('UPDATE users SET plan = ?, execution_quota = 100, generation_quota = 5 WHERE id = ?')
      .bind('free', sub.user_id).run();
    await c.env.DB.prepare('UPDATE subscriptions SET status = ?, plan = ? WHERE user_id = ?')
      .bind('expired', 'free', sub.user_id).run();
    downgraded++;
  }

  return c.json({
    success: true,
    data: {
      checked: (expired.results || []).length,
      downgraded,
      message: `Expired ${downgraded} voucher grants.`,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});
