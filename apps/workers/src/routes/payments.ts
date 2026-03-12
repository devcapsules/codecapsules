/**
 * Payment Routes — Razorpay Integration
 *
 * Handles subscription creation, verification, webhooks, and billing management.
 * Razorpay flow:
 *   1. Client calls POST /payments/create-order → gets Razorpay order_id
 *   2. Client opens Razorpay checkout with order_id
 *   3. On success, client calls POST /payments/verify with payment details
 *   4. Server verifies signature, upgrades user plan
 *   5. Webhooks handle async events (payment.captured, subscription.cancelled, etc.)
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';
import { getQuotaInfo } from '../middleware/rate-limit';

type Variables = {
  auth: Auth | null;
  requestId: string;
};

export const paymentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Plan Config ──
const PLANS: Record<string, { name: string; amount: number; originalAmount?: number; currency: string; description: string; quotas: { executions: number; generations: number; capsules: number } }> = {
  creator: {
    name: 'Creator Plan',
    amount: 249900,         // ₹2,499/month in paise
    originalAmount: 299900, // ₹2,999 (slash price)
    currency: 'INR',
    description: 'Creator Plan — 10,000 executions, 50 generations, unlimited capsules',
    quotas: { executions: 10000, generations: 50, capsules: -1 },
  },
  team: {
    name: 'Pro / Bootcamp',
    amount: 829900, // ₹8,299/month in paise (~$99 USD)
    currency: 'INR',
    description: 'Pro / Bootcamp — 100,000 executions, 500 generations, 150 capsules, advanced analytics',
    quotas: { executions: 100000, generations: 500, capsules: 150 },
  },
};

// ── Helpers ──

/** Create HMAC-SHA256 hex digest using Web Crypto */
async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Base64 encode for Razorpay Basic Auth */
function base64Encode(str: string): string {
  // Workers support btoa
  return btoa(str);
}

/** Call Razorpay API */
async function razorpayFetch(env: Env, path: string, method: string = 'GET', body?: any): Promise<any> {
  const auth = base64Encode(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`Razorpay API error: ${res.status} ${errBody}`);
    throw new ApiError(502, `Razorpay API error: ${res.status}`);
  }
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /payments/create-order — Create a Razorpay order for one-time payment
// ══════════════════════════════════════════════════════════════════════════════

paymentRoutes.post('/create-order', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { plan } = await c.req.json<{ plan: string }>();
  const planConfig = PLANS[plan];
  if (!planConfig) throw new ApiError(400, `Invalid plan: ${plan}. Valid: ${Object.keys(PLANS).join(', ')}`);

  // Check if user already has an active sub for this plan
  const existing = await c.env.DB.prepare(
    'SELECT id, plan, status FROM subscriptions WHERE user_id = ? AND status = ?'
  ).bind(auth.userId, 'active').first();

  if (existing && (existing as any).plan === plan) {
    throw new ApiError(409, 'You already have an active subscription for this plan');
  }

  // Create Razorpay order
  // Receipt must be <= 40 chars (Razorpay constraint)
  const shortUserId = auth.userId.slice(0, 16);
  const shortTimestamp = Date.now().toString().slice(-8);
  const receipt = `sub_${shortUserId}_${shortTimestamp}`;
  const order = await razorpayFetch(c.env, '/orders', 'POST', {
    amount: planConfig.amount,
    currency: planConfig.currency,
    receipt,
    notes: {
      user_id: auth.userId,
      email: auth.email,
      plan,
    },
  });

  // Record in payment_history
  await c.env.DB.prepare(`
    INSERT INTO payment_history (user_id, razorpay_order_id, amount, currency, plan, status)
    VALUES (?, ?, ?, ?, ?, 'created')
  `).bind(auth.userId, order.id, planConfig.amount, planConfig.currency, plan).run();

  return c.json({
    success: true,
    data: {
      orderId: order.id,
      amount: planConfig.amount,
      currency: planConfig.currency,
      planName: planConfig.name,
      description: planConfig.description,
      keyId: c.env.RAZORPAY_KEY_ID,
      prefill: {
        email: auth.email,
      },
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /payments/verify — Verify Razorpay payment signature & activate plan
// ══════════════════════════════════════════════════════════════════════════════

paymentRoutes.post('/verify', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await c.req.json<{
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }>();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, 'Missing payment verification fields');
  }

  // Verify HMAC signature: sha256(order_id + "|" + payment_id, key_secret)
  const expectedSig = await hmacSha256(
    c.env.RAZORPAY_KEY_SECRET,
    `${razorpay_order_id}|${razorpay_payment_id}`
  );

  if (expectedSig !== razorpay_signature) {
    // Update payment history as failed
    await c.env.DB.prepare(
      'UPDATE payment_history SET status = ?, razorpay_payment_id = ? WHERE razorpay_order_id = ?'
    ).bind('failed', razorpay_payment_id, razorpay_order_id).run();

    throw new ApiError(400, 'Payment signature verification failed');
  }

  // Look up original order to find plan
  const paymentRecord = await c.env.DB.prepare(
    'SELECT plan, amount, currency FROM payment_history WHERE razorpay_order_id = ? AND user_id = ?'
  ).bind(razorpay_order_id, auth.userId).first<{ plan: string; amount: number; currency: string }>();

  if (!paymentRecord) {
    throw new ApiError(404, 'Order not found');
  }

  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days

  // Upsert subscription
  await c.env.DB.prepare(`
    INSERT INTO subscriptions (user_id, plan, status, razorpay_payment_id, razorpay_plan_id, current_period_start, current_period_end)
    VALUES (?, ?, 'active', ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      plan = excluded.plan,
      status = 'active',
      razorpay_payment_id = excluded.razorpay_payment_id,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = 0
  `).bind(auth.userId, paymentRecord.plan, razorpay_payment_id, paymentRecord.plan, now, periodEnd).run();

  // Update user plan
  await c.env.DB.prepare(
    'UPDATE users SET plan = ? WHERE id = ?'
  ).bind(paymentRecord.plan, auth.userId).run();

  // Update payment history
  await c.env.DB.prepare(
    'UPDATE payment_history SET status = ?, razorpay_payment_id = ?, razorpay_signature = ? WHERE razorpay_order_id = ?'
  ).bind('captured', razorpay_payment_id, razorpay_signature, razorpay_order_id).run();

  // Update quotas based on plan
  const planConfig = PLANS[paymentRecord.plan];
  if (planConfig) {
    await c.env.DB.prepare(
      'UPDATE users SET execution_quota = ?, generation_quota = ? WHERE id = ?'
    ).bind(planConfig.quotas.executions, planConfig.quotas.generations, auth.userId).run();
  }

  return c.json({
    success: true,
    data: {
      plan: paymentRecord.plan,
      status: 'active',
      currentPeriodEnd: periodEnd,
      message: `Successfully upgraded to ${PLANS[paymentRecord.plan]?.name || paymentRecord.plan}!`,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /payments/subscription — Get current subscription status
// ══════════════════════════════════════════════════════════════════════════════

paymentRoutes.get('/subscription', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const sub = await c.env.DB.prepare(`
    SELECT plan, status, current_period_start, current_period_end, cancel_at_period_end, created_at
    FROM subscriptions WHERE user_id = ?
  `).bind(auth.userId).first();

  const user = await c.env.DB.prepare(
    'SELECT plan, execution_quota, generation_quota FROM users WHERE id = ?'
  ).bind(auth.userId).first<{ plan: string; execution_quota: number; generation_quota: number }>();

  const plan = (user?.plan || 'free') as 'free' | 'creator' | 'team' | 'enterprise';

  // Fetch today's actual usage from KV
  const [execUsage, genUsage] = await Promise.all([
    getQuotaInfo(c.env, auth.userId, plan, 'execution'),
    getQuotaInfo(c.env, auth.userId, plan, 'generation'),
  ]);

  // Fetch capsule count
  const capsuleCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM capsules WHERE creator_id = ? AND is_deleted = 0'
  ).bind(auth.userId).first<{ count: number }>();

  const capsuleLimit = PLANS[plan]?.quotas?.capsules ?? 10;

  return c.json({
    success: true,
    data: {
      plan: plan,
      subscription: sub ? {
        status: (sub as any).status,
        currentPeriodStart: (sub as any).current_period_start,
        currentPeriodEnd: (sub as any).current_period_end,
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end === 1,
      } : null,
      quotas: {
        executions: { limit: execUsage.limit, used: execUsage.limit === Infinity ? 0 : execUsage.limit - execUsage.remaining, remaining: execUsage.remaining },
        generations: { limit: genUsage.limit, used: genUsage.limit === Infinity ? 0 : genUsage.limit - genUsage.remaining, remaining: genUsage.remaining },
        capsules: { limit: capsuleLimit, current: capsuleCount?.count || 0 },
      },
      planConfig: PLANS[plan] || null,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /payments/cancel — Cancel subscription (downgrades at period end)
// ══════════════════════════════════════════════════════════════════════════════

paymentRoutes.post('/cancel', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const sub = await c.env.DB.prepare(
    'SELECT id, plan, status, current_period_end FROM subscriptions WHERE user_id = ? AND status = ?'
  ).bind(auth.userId, 'active').first();

  if (!sub) {
    throw new ApiError(404, 'No active subscription found');
  }

  // Mark for cancellation at period end (don't downgrade immediately)
  await c.env.DB.prepare(
    'UPDATE subscriptions SET cancel_at_period_end = 1 WHERE user_id = ?'
  ).bind(auth.userId).run();

  return c.json({
    success: true,
    data: {
      message: `Your ${(sub as any).plan} plan will remain active until ${(sub as any).current_period_end}. After that, you'll be downgraded to the free plan.`,
      cancelAt: (sub as any).current_period_end,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /payments/history — Payment history for user
// ══════════════════════════════════════════════════════════════════════════════

paymentRoutes.get('/history', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const payments = await c.env.DB.prepare(`
    SELECT razorpay_order_id, razorpay_payment_id, amount, currency, plan, status, created_at
    FROM payment_history WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).bind(auth.userId).all();

  return c.json({
    success: true,
    data: (payments.results || []).map((p: any) => ({
      orderId: p.razorpay_order_id,
      paymentId: p.razorpay_payment_id,
      amount: p.amount,
      currency: p.currency,
      plan: p.plan,
      status: p.status,
      date: p.created_at,
      displayAmount: `₹${(p.amount / 100).toLocaleString('en-IN')}`,
    })),
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /payments/webhook — Razorpay webhook handler (unauthenticated, verified by signature)
// ══════════════════════════════════════════════════════════════════════════════

paymentRoutes.post('/webhook', async (c) => {
  const webhookBody = await c.req.text();
  const webhookSignature = c.req.header('x-razorpay-signature');

  if (!webhookSignature) {
    throw new ApiError(400, 'Missing webhook signature');
  }

  // Verify webhook signature
  const expectedSig = await hmacSha256(c.env.RAZORPAY_WEBHOOK_SECRET, webhookBody);
  if (expectedSig !== webhookSignature) {
    throw new ApiError(401, 'Invalid webhook signature');
  }

  const event = JSON.parse(webhookBody);
  const eventType = event.event;

  console.log(`[Razorpay Webhook] Event: ${eventType}`);

  switch (eventType) {
    case 'payment.captured': {
      // Payment successfully captured — already handled in /verify, but this is a safety net
      const payment = event.payload?.payment?.entity;
      if (payment?.notes?.user_id) {
        await c.env.DB.prepare(
          'UPDATE payment_history SET status = ? WHERE razorpay_payment_id = ?'
        ).bind('captured', payment.id).run();
      }
      break;
    }

    case 'payment.failed': {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        await c.env.DB.prepare(
          'UPDATE payment_history SET status = ? WHERE razorpay_order_id = ?'
        ).bind('failed', payment.order_id).run();
      }
      break;
    }

    case 'refund.created':
    case 'refund.processed': {
      const refund = event.payload?.refund?.entity;
      if (refund?.payment_id) {
        await c.env.DB.prepare(
          'UPDATE payment_history SET status = ? WHERE razorpay_payment_id = ?'
        ).bind('refunded', refund.payment_id).run();

        // Find user and downgrade
        const payment = await c.env.DB.prepare(
          'SELECT user_id FROM payment_history WHERE razorpay_payment_id = ?'
        ).bind(refund.payment_id).first<{ user_id: string }>();

        if (payment) {
          await c.env.DB.prepare('UPDATE users SET plan = ? WHERE id = ?').bind('free', payment.user_id).run();
          await c.env.DB.prepare(
            'UPDATE subscriptions SET status = ?, plan = ? WHERE user_id = ?'
          ).bind('canceled', 'free', payment.user_id).run();
        }
      }
      break;
    }

    default:
      console.log(`[Razorpay Webhook] Unhandled event: ${eventType}`);
  }

  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /payments/usage — Monthly usage counters + capsule count
// ══════════════════════════════════════════════════════════════════════════════

const MONTHLY_LIMITS: Record<string, { execution: number; generation: number }> = {
  free:       { execution: 200,    generation: 5 },
  creator:    { execution: 10000,  generation: 50 },
  team:       { execution: 100000, generation: 500 },
  enterprise: { execution: -1,     generation: -1 },
};

paymentRoutes.get('/usage', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const now = new Date();
  const month = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const plan = auth.plan || 'free';

  // Read this month's KV counters
  const [execUsed, genUsed] = await Promise.all([
    c.env.RATE_LIMITS.get(`quota:execution:${auth.userId}:${month}`),
    c.env.RATE_LIMITS.get(`quota:generation:${auth.userId}:${month}`),
  ]);

  // Get capsule count from D1
  const capsuleRow = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM capsules WHERE creator_id = ? AND is_deleted = 0'
  ).bind(auth.userId).first<{ cnt: number }>();

  const limits = MONTHLY_LIMITS[plan] || MONTHLY_LIMITS.free;
  const execUsedNum = parseInt(execUsed || '0');
  const genUsedNum = parseInt(genUsed || '0');

  return c.json({
    success: true,
    data: {
      plan,
      month,
      execution: {
        used: execUsedNum,
        limit: limits.execution,
        remaining: limits.execution === -1 ? -1 : Math.max(0, limits.execution - execUsedNum),
      },
      generation: {
        used: genUsedNum,
        limit: limits.generation,
        remaining: limits.generation === -1 ? -1 : Math.max(0, limits.generation - genUsedNum),
      },
      capsules: {
        count: capsuleRow?.cnt || 0,
      },
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});
