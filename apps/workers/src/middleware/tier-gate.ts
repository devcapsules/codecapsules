/**
 * Tier Gate Middleware — Feature-level plan enforcement
 *
 * Provides reusable middleware for gating routes behind specific plan tiers.
 * Complements rate-limit.ts (which handles quotas) by enforcing feature access.
 *
 * Usage:
 *   route.use('/premium-feature', requirePlan('creator'));
 *   route.use('/enterprise-only', requirePlan('enterprise'));
 */

import { createMiddleware } from 'hono/factory';
import { ApiError } from './error-handler';

type Plan = 'free' | 'creator' | 'team' | 'enterprise';

/** Plan hierarchy — higher index = more permissive */
const PLAN_HIERARCHY: Plan[] = ['free', 'creator', 'team', 'enterprise'];

/**
 * Capsule creation limits per plan (-1 = unlimited)
 */
export const CAPSULE_LIMITS: Record<Plan, number> = {
  free: 10,
  creator: 100,
  team: -1,
  enterprise: -1,
};

/**
 * Check if userPlan meets or exceeds the requiredPlan.
 */
export function planMeetsRequirement(userPlan: Plan, requiredPlan: Plan): boolean {
  const userIndex = PLAN_HIERARCHY.indexOf(userPlan);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  return userIndex >= requiredIndex;
}

/**
 * Middleware: require at least `minimumPlan` to access the route.
 * Returns 403 with upgrade message if plan is insufficient.
 */
export function requirePlan(minimumPlan: Plan) {
  return createMiddleware<{
    Bindings: Env;
    Variables: { auth: Auth | null; requestId: string };
  }>(async (c, next) => {
    const auth = c.get('auth');
    if (!auth) {
      throw new ApiError(401, 'Authentication required');
    }

    const userPlan = auth.plan || 'free';
    if (!planMeetsRequirement(userPlan, minimumPlan)) {
      throw new ApiError(403, `This feature requires a ${minimumPlan} plan or higher. Current plan: ${userPlan}`, 'PLAN_REQUIRED');
    }

    await next();
  });
}

/**
 * Check capsule creation limit for a user.
 * Returns { allowed: boolean, current: number, limit: number }.
 */
export async function checkCapsuleLimit(
  db: D1Database,
  userId: string,
  plan: Plan
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limit = CAPSULE_LIMITS[plan];
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM capsules WHERE creator_id = ? AND is_deleted = 0'
  ).bind(userId).first<{ count: number }>();

  const current = result?.count || 0;
  return {
    allowed: current < limit,
    current,
    limit,
  };
}
