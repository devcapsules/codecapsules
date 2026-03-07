/**
 * Rate Limiting Middleware — v2 (Rewritten)
 *
 * Two-tier design:
 *
 * 1. PER-MINUTE ABUSE PREVENTION — Native Cloudflare Rate Limiting API
 *    Atomic counters at the edge PoP. Zero KV writes. No race conditions.
 *    Separate bindings per plan tier (RATE_LIMITER_FREE, _CREATOR, _TEAM).
 *    Enterprise is unlimited (bypasses limiter entirely).
 *
 * 2. MONTHLY BUSINESS QUOTAS — KV counters, incremented ONLY on success
 *    Middleware pre-checks the quota; route handlers call incrementQuota()
 *    AFTER the operation succeeds. No wasted writes on failed requests.
 *    Plan comes from JWT (auth context) — zero D1 queries.
 *
 * Exported:
 *   rateLimiter     — Hono middleware (applies per-minute + quota pre-check)
 *   incrementQuota  — called by route handlers after successful operations
 */

import { createMiddleware } from 'hono/factory';
import { ApiError } from './error-handler';

// ── Plan-tier limits ─────────────────────────────────────────────────────────

/** Monthly quotas per plan. -1 = unlimited. */
const MONTHLY_QUOTAS = {
  generation: {
    free: 5,
    creator: 50,
    team: 500,
    enterprise: -1,
  },
  execution: {
    free: 200,
    creator: 10000,
    team: 100000,
    enterprise: -1,
  },
} as const;

type QuotaType = keyof typeof MONTHLY_QUOTAS;
type Plan = 'free' | 'creator' | 'team' | 'enterprise';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Current month as YYYYMM string, used as KV key suffix. */
function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Extract client IP for anonymous rate-limit keys. */
function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** Pick the correct per-plan native rate limiter binding. */
function getRateLimiter(env: Env, plan: Plan): RateLimit | null {
  switch (plan) {
    case 'free':    return env.RATE_LIMITER_FREE;
    case 'creator': return env.RATE_LIMITER_CREATOR;
    case 'team':    return env.RATE_LIMITER_TEAM;
    case 'enterprise': return null; // unlimited
  }
}

/** Determine quota type from path. Returns null for non-quota routes. */
function getQuotaTypeFromPath(path: string): QuotaType | null {
  // Status polling should NOT count against generation quota
  if (path.includes('/generate') && !path.includes('/status')) return 'generation';
  if (path.includes('/execute') && !path.includes('/runs/')) return 'execution';
  return null;
}

// ── Middleware ────────────────────────────────────────────────────────────────

export const rateLimiter = createMiddleware<{
  Bindings: Env;
  Variables: { auth: Auth | null; requestId: string; quotaKey?: string };
}>(async (c, next) => {
  // Skip per-minute rate limiting for authenticated GET requests (dashboard reads)
  // Rate limiting should protect expensive write/compute ops, not browsing.
  if (c.req.method === 'GET') {
    await next();
    return;
  }

  const auth = c.get('auth');
  const plan: Plan = auth?.plan || 'free';

  // ── 1. Per-minute edge rate limiting (native, atomic, zero-latency) ──

  const limiter = getRateLimiter(c.env, plan);
  if (limiter) {
    // Key: userId for authed users, IP for anonymous
    const identifier = auth?.userId || getClientIP(c.req.raw);
    const { success } = await limiter.limit({ key: identifier });

    if (!success) {
      throw new ApiError(
        429,
        'Rate limit exceeded. Please try again later.',
        'RATE_LIMIT_MINUTE'
      );
    }
  }

  // ── 2. Monthly quota pre-check (KV read only — no writes here) ──

  const quotaType = getQuotaTypeFromPath(c.req.path);
  if (quotaType && auth) {
    const monthlyLimit = MONTHLY_QUOTAS[quotaType][plan];

    if (monthlyLimit !== -1) {
      const monthKey = `quota:${quotaType}:${auth.userId}:${getCurrentMonth()}`;
      const used = parseInt(await c.env.RATE_LIMITS.get(monthKey) || '0');

      if (used >= monthlyLimit) {
        throw new ApiError(
          429,
          `Monthly ${quotaType} limit reached (${used}/${monthlyLimit}). Upgrade for more.`,
          'QUOTA_EXCEEDED'
        );
      }

      // Pass the key to route handlers so they can increment after success
      c.set('quotaKey', monthKey);

      // Add quota headers
      c.header('X-Quota-Limit', String(monthlyLimit));
      c.header('X-Quota-Remaining', String(Math.max(0, monthlyLimit - used)));
      c.header('X-Quota-Type', quotaType);
    }
  }

  await next();
});

// ── Quota Increment (called by route handlers AFTER success) ─────────────────

/**
 * Increment monthly quota counter. Call this ONLY after a successful operation.
 * Single KV write with 32-day TTL. Fire-and-forget (errors logged, not thrown).
 */
export async function incrementQuota(
  env: Env,
  quotaKey: string | undefined
): Promise<void> {
  if (!quotaKey) return; // no quota tracking for this request

  try {
    const current = parseInt(await env.RATE_LIMITS.get(quotaKey) || '0');
    await env.RATE_LIMITS.put(quotaKey, String(current + 1), {
      expirationTtl: 2764800, // 32 days — covers the full month + buffer
    });
  } catch (err) {
    // Log but don't fail the request — quota is best-effort
    console.error('Failed to increment quota:', quotaKey, err);
  }
}

/**
 * Check remaining quota without incrementing.
 * Used by route handlers that need to show quota info in response.
 */
export async function getQuotaInfo(
  env: Env,
  userId: string,
  plan: Plan,
  quotaType: QuotaType
): Promise<{ remaining: number; limit: number; exceeded: boolean }> {
  const monthlyLimit = MONTHLY_QUOTAS[quotaType][plan];
  if (monthlyLimit === -1) {
    return { remaining: Infinity, limit: Infinity, exceeded: false };
  }

  const monthKey = `quota:${quotaType}:${userId}:${getCurrentMonth()}`;
  const used = parseInt(await env.RATE_LIMITS.get(monthKey) || '0');

  return {
    remaining: Math.max(0, monthlyLimit - used),
    limit: monthlyLimit,
    exceeded: used >= monthlyLimit,
  };
}
