/**
 * Mentor Routes — AI Hint Generation (TUNNEL BRIDGE)
 * 
 * Provides progressive hints to help learners debug their code.
 * Uses Azure VM's AIMentor system via Cloudflare Tunnel.
 * 
 * Endpoints:
 * - POST /api/mentor/hint - Get an AI-generated hint
 * - GET /api/mentor/history - Get hint history for a capsule
 * 
 * Rate Limits:
 * - Free tier: 3 hints per capsule
 * - Creator tier: 10 hints per capsule
 * - Enterprise tier: 50 hints per capsule
 */

import { Hono } from 'hono';
import { createTunnelClient } from '../utils/tunnel-client';

type Variables = {
  auth: { userId: string; plan: string } | null;
};

const mentor = new Hono<{ Bindings: Env; Variables: Variables }>();

// ══════════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════════

interface HintRequest {
  capsuleId: string;
  userCode: string;
  errorMessage?: string;
  language: string;
  attemptNumber?: number;
}

interface TunnelMentorResult {
  success: boolean;
  hint: string;
  hintLevel: 'nudge' | 'guide' | 'reveal';
  tokenUsage?: {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
  };
  error?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════════════════════

const HINT_LIMITS: Record<string, number> = {
  free: 3,
  creator: 10,
  enterprise: 50,
};

const HINT_COST_USD = 0.002; // ~300 tokens in + 150 out at gpt-4o-mini rates

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/mentor/hint - Get an AI-generated hint
// ══════════════════════════════════════════════════════════════════════════════

mentor.post('/hint', async (c) => {
  const auth = c.get('auth') as { userId: string; plan: string } | undefined;
  
  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const body = await c.req.json<HintRequest>();
  const { capsuleId, userCode, errorMessage, language, attemptNumber } = body;

  // ── Validate request ──
  if (!capsuleId || !userCode || !language) {
    return c.json(
      { error: 'capsuleId, userCode, and language are required' },
      400
    );
  }

  const env = c.env;

  // ══════════════════════════════════════════════════════════════════════════
  // Rate Limit: Per-capsule hint limit based on plan
  // ══════════════════════════════════════════════════════════════════════════

  const hintCountKey = `mentor:${auth.userId}:${capsuleId}:count`;
  const hintCount = parseInt(await env.CACHE.get(hintCountKey) || '0');
  const maxHints = HINT_LIMITS[auth.plan] || HINT_LIMITS.free;

  if (hintCount >= maxHints) {
    console.log(JSON.stringify({
      type: 'log',
      level: 'warn',
      action: 'mentor.rate_limited',
      userId: auth.userId,
      capsuleId,
      hintsUsed: hintCount,
      maxHints,
      plan: auth.plan,
    }));

    return c.json({
      error: `Hint limit reached (${maxHints} per capsule on ${auth.plan} plan)`,
      hintsUsed: hintCount,
      hintsRemaining: 0,
      upgrade: auth.plan === 'free' 
        ? 'Upgrade to Creator for 10 hints per capsule' 
        : undefined,
    }, 429);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Fetch capsule context from D1
  // ══════════════════════════════════════════════════════════════════════════

  const capsule = await env.DB.prepare(
    'SELECT title, description, content FROM capsules WHERE id = ? AND is_deleted = 0'
  ).bind(capsuleId).first<{ title: string; description: string; content: string }>();

  if (!capsule) {
    return c.json({ error: 'Capsule not found' }, 404);
  }

  // Parse capsule content to extract test cases
  let capsuleContext: { title: string; description: string; testCases: any[] };
  try {
    const content = JSON.parse(capsule.content);
    capsuleContext = {
      title: capsule.title,
      description: capsule.description,
      testCases: content?.testCases || content?.content?.testCases || [],
    };
  } catch {
    capsuleContext = {
      title: capsule.title,
      description: capsule.description,
      testCases: [],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Call Azure VM AIMentor (THE BRIDGE)
  // ══════════════════════════════════════════════════════════════════════

  const tunnel = createTunnelClient(env, 'mentor-worker', 15_000);

  const result = await tunnel.call<TunnelMentorResult>('/internal/mentor-hint', {
    userCode,
    errorMessage: errorMessage || '',
    capsuleContext,
    language,
    attemptNumber: attemptNumber || hintCount + 1,
    userId: auth.userId,
    capsuleId,
  });

  if (!result.success) {
    console.error(JSON.stringify({
      type: 'log',
      level: 'error',
      action: 'mentor.tunnel_failed',
      userId: auth.userId,
      capsuleId,
      error: result.error,
      latencyMs: result.latencyMs,
    }));

    return c.json(
      { error: 'Mentor hint generation failed. Please try again.' },
      502
    );
  }

  if (!result.data?.success) {
    return c.json(
      { error: result.data?.error || 'Failed to generate hint' },
      500
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Track usage
  // ══════════════════════════════════════════════════════════════════════════

  // Increment hint count
  await env.CACHE.put(hintCountKey, String(hintCount + 1), {
    expirationTtl: 86400, // Reset daily
  });

  // Track daily AI spend
  const dailySpend = parseFloat(await env.CACHE.get('system:ai:daily_spend') || '0');
  await env.CACHE.put('system:ai:daily_spend', String(dailySpend + HINT_COST_USD), {
    expirationTtl: 86400,
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Buffer analytics event
  // ══════════════════════════════════════════════════════════════════════════

  const eventKey = `events:pending:${Math.floor(Date.now() / 60_000)}:${crypto.randomUUID().slice(0, 8)}`;
  await env.CACHE.put(eventKey, JSON.stringify({
    capsuleId,
    userId: auth.userId,
    eventType: 'hint_viewed',
    metadata: { 
      hintLevel: result.data.hintLevel, 
      attemptNumber: attemptNumber || hintCount + 1,
      language,
    },
    timestamp: new Date().toISOString(),
  }), { expirationTtl: 900 });

  console.log(JSON.stringify({
    type: 'metric',
    name: 'mentor.hint_generated',
    userId: auth.userId,
    capsuleId,
    hintLevel: result.data.hintLevel,
    hintsUsed: hintCount + 1,
    latencyMs: result.latencyMs,
  }));

  return c.json({
    hint: result.data.hint,
    hintLevel: result.data.hintLevel,
    hintsUsed: hintCount + 1,
    hintsRemaining: maxHints - hintCount - 1,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/mentor/status/:capsuleId - Get hint usage status
// ══════════════════════════════════════════════════════════════════════════════

mentor.get('/status/:capsuleId', async (c) => {
  const auth = c.get('auth') as { userId: string; plan: string } | undefined;
  
  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const capsuleId = c.req.param('capsuleId');
  const env = c.env;

  const hintCountKey = `mentor:${auth.userId}:${capsuleId}:count`;
  const hintCount = parseInt(await env.CACHE.get(hintCountKey) || '0');
  const maxHints = HINT_LIMITS[auth.plan] || HINT_LIMITS.free;

  return c.json({
    capsuleId,
    hintsUsed: hintCount,
    hintsRemaining: Math.max(0, maxHints - hintCount),
    maxHints,
    plan: auth.plan,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/mentor/feedback - Feedback on hint usefulness
// ══════════════════════════════════════════════════════════════════════════════

mentor.post('/feedback', async (c) => {
  const auth = c.get('auth') as { userId: string; plan: string } | undefined;
  
  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const body = await c.req.json<{
    capsuleId: string;
    hintLevel: string;
    helpful: boolean;
    solvedAfter: boolean;
  }>();

  const env = c.env;

  // Buffer feedback for batch processing
  const eventKey = `events:pending:${Math.floor(Date.now() / 60_000)}:${crypto.randomUUID().slice(0, 8)}`;
  await env.CACHE.put(eventKey, JSON.stringify({
    capsuleId: body.capsuleId,
    userId: auth.userId,
    eventType: 'hint_feedback',
    metadata: {
      hintLevel: body.hintLevel,
      helpful: body.helpful,
      solvedAfter: body.solvedAfter,
    },
    timestamp: new Date().toISOString(),
  }), { expirationTtl: 900 });

  return c.json({ success: true });
});

export default mentor;
