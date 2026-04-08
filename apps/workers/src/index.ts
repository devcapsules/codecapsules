/**
 * DevCapsules API — Cloudflare Workers Entry Point
 * 
 * Main router handling all API requests at the edge.
 * Uses Hono for routing with middleware chain:
 * [CORS] → [Request ID] → [Logger] → [Auth] → [Rate Limit] → [Route]
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';

// Routes
import { capsuleRoutes } from './routes/capsules';
import { generateRoutes } from './routes/generate';
import { executeRoutes } from './routes/execute';
import { authRoutes } from './routes/auth';
import { analyticsRoutes } from './routes/analytics';
import mentorRoutes from './routes/mentor';
import { playlistRoutes } from './routes/playlists';
import { edgeRoutes } from './routes/edge-assistant';
import { paymentRoutes } from './routes/payments';
import { voucherRoutes } from './routes/vouchers';
import { supabaseProxy } from './routes/supabase-proxy';

// Middleware
import { requestId } from './middleware/request-id';
import { rateLimiter } from './middleware/rate-limit';
import { authMiddleware } from './middleware/auth';
import { ApiError } from './middleware/error-handler';
import { defaultBodyLimit } from './middleware/body-limit';
import { CAPSULE_LIMITS } from './middleware/tier-gate';

// Durable Objects
export { ConcurrencyController } from './durable-objects/concurrency-controller';
export { SQLSandbox } from './durable-objects/sql-sandbox';

// Types
type Variables = {
  requestId: string;
  auth: Auth | null;
  startTime: number;
  quotaKey?: string;  // Set by rate limiter, used by route handlers to increment quota on success
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ══════════════════════════════════════════════════════════════════════════════
// Global Error Handler (Hono built-in — runs after all middleware)
// ══════════════════════════════════════════════════════════════════════════════

app.onError((error, c) => {
  const requestId = c.get('requestId') || 'unknown';
  const clientTag = (c.req.header('x-client') || c.req.header('X-Client') || 'unknown').slice(0, 64);

  // Log error
  console.error(JSON.stringify({
    level: 'error',
    requestId,
    clientTag,
    path: c.req.path,
    method: c.req.method,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
    timestamp: new Date().toISOString(),
  }));

  // Handle known error types
  if (error instanceof ApiError) {
    return c.json({
      success: false,
      error: error.message,
      code: error.code,
      meta: { requestId, timestamp: Date.now(), version: c.env?.API_VERSION },
    }, error.statusCode as any);
  }

  if (error instanceof HTTPException) {
    return c.json({
      success: false,
      error: error.message,
      meta: { requestId, timestamp: Date.now(), version: c.env?.API_VERSION },
    }, error.status);
  }

  // Unknown error — return 500
  return c.json({
    success: false,
    error: c.env?.ENVIRONMENT === 'production'
      ? 'Internal Server Error'
      : (error instanceof Error ? error.message : 'Unknown error'),
    meta: { requestId, timestamp: Date.now(), version: c.env?.API_VERSION },
  }, 500);
});

// ══════════════════════════════════════════════════════════════════════════════
// Global Middleware
// ══════════════════════════════════════════════════════════════════════════════

// Request ID for tracing
app.use('*', requestId);

// Timing
app.use('*', async (c, next) => {
  c.set('startTime', Date.now());
  await next();
});

// Structured request log for client-segment observability (e.g. devcapsules-learner)
app.use('*', async (c, next) => {
  const startedAt = Date.now();
  const requestId = c.get('requestId') || 'unknown';
  const rawClientTag = c.req.header('x-client') || c.req.header('X-Client') || 'unknown';
  const clientTag = rawClientTag.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64) || 'unknown';

  await next();

  console.log(JSON.stringify({
    level: 'info',
    type: 'request_complete',
    requestId,
    clientTag,
    path: c.req.path,
    method: c.req.method,
    status: c.res.status,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  }));

  // Buffer hit for D1 client-tag counter (fire-and-forget, non-blocking)
  const { trackClientTagHit } = await import('./utils/analytics-buffer');
  c.executionCtx.waitUntil(trackClientTagHit(c.env, clientTag));
});

// Security headers
app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://devcapsules.com', 'https://*.devcapsules.com'],
  },
  xFrameOptions: 'SAMEORIGIN',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
}));

// CORS
app.use('*', async (c, next) => {
  // Supabase proxy handles its own CORS — skip global CORS for it
  if (c.req.path.startsWith('/supabase')) {
    await next();
    return;
  }

  const allowedOrigins = c.env.CORS_ORIGINS.split(',');
  
  // Allow any origin for embed widget routes (capsule reads, execution, playlists, etc.)
  const isEmbedRoute = c.req.path.includes('/embed/') || 
                       c.req.path.includes('/capsules/') ||
                       c.req.path.includes('/playlists/') ||
                       c.req.path.includes('/execute/runs/') ||
                       c.req.path.includes('/edge/') ||
                       (c.req.path.includes('/execute') && c.req.method === 'POST');
  
  return cors({
    origin: isEmbedRoute ? '*' : allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Client'],
    credentials: !isEmbedRoute,
    maxAge: 86400, // 24 hours
  })(c, next);
});

// Logging (conditional based on environment)
app.use('*', async (c, next) => {
  if (c.env.LOG_LEVEL === 'debug' || c.env.ENVIRONMENT !== 'production') {
    return logger()(c, next);
  }
  await next();
});

// ══════════════════════════════════════════════════════════════════════════════
// Health Check (no auth required)
// ══════════════════════════════════════════════════════════════════════════════

app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'ok',
    timestamp: Date.now(),
    version: c.env.API_VERSION,
    environment: c.env.ENVIRONMENT,
    edge: c.req.raw.cf?.colo || 'unknown',
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Supabase Auth Proxy (bypasses ISP DNS blocks in India)
// No auth/rate-limit — Supabase handles its own auth & rate limiting
// ══════════════════════════════════════════════════════════════════════════════

// Handle CORS preflight for /supabase/* 
app.options('/supabase/*', (c) => {
  const origin = c.req.header('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
});

app.route('/supabase', supabaseProxy);

// ══════════════════════════════════════════════════════════════════════════════
// API v1 Routes
// ══════════════════════════════════════════════════════════════════════════════

const api = new Hono<{ Bindings: Env; Variables: Variables }>();

// Authentication first — rateLimiter needs auth context for monthly quota tracking
api.use('*', authMiddleware);

// Body size limit (Hono native stream-safe — counts actual bytes, not Content-Length)
api.use('*', defaultBodyLimit);

// Rate limiting (per-minute edge + monthly quota pre-check)
api.use('*', rateLimiter);

// Mount route handlers
api.route('/capsules', capsuleRoutes);
api.route('/generate', generateRoutes);
api.route('/execute', executeRoutes);
api.route('/auth', authRoutes);
api.route('/analytics', analyticsRoutes);
api.route('/mentor', mentorRoutes);
api.route('/playlists', playlistRoutes);
api.route('/edge', edgeRoutes);
api.route('/payments', paymentRoutes);
api.route('/vouchers', voucherRoutes);

// ── Organization-scoped aliases (UI components call these paths) ──
// GET/POST /organizations/:orgId/playlists → /playlists
api.get('/organizations/:orgId/playlists', (c) => playlistRoutes.fetch(new Request(new URL('/?' + new URL(c.req.url).searchParams.toString(), c.req.url), c.req.raw), c.env, c.executionCtx));
api.post('/organizations/:orgId/playlists', (c) => playlistRoutes.fetch(new Request(new URL('/', c.req.url), { method: 'POST', headers: c.req.raw.headers, body: c.req.raw.body }), c.env, c.executionCtx));
// GET /organizations/:orgId/capsules → /capsules (for capsule search in editor)
api.get('/organizations/:orgId/capsules', (c) => capsuleRoutes.fetch(new Request(new URL('/?' + new URL(c.req.url).searchParams.toString(), c.req.url), c.req.raw), c.env, c.executionCtx));

// GET /my-capsules — List authenticated user's capsules (draft + published)
api.get('/my-capsules', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  const capsules = await c.env.DB.prepare(`
    SELECT c.id, c.title, c.description, c.type, c.difficulty, c.language,
           c.function_name, c.test_count, c.has_hints, c.tags, c.quality_score,
           c.is_published, c.created_at, c.updated_at,
           COALESCE(s.impressions, 0) as impressions,
           COALESCE(s.total_runs, 0) as total_runs,
           COALESCE(s.total_passes, 0) as total_passes,
           COALESCE(s.total_fails, 0) as total_fails,
           COALESCE(s.completion_rate, 0) as completion_rate,
           GROUP_CONCAT(DISTINCT co.title) as course_names
    FROM capsules c
    LEFT JOIN capsule_stats s ON c.id = s.capsule_id
    LEFT JOIN course_capsules cc ON c.id = cc.capsule_id
    LEFT JOIN courses co ON cc.course_id = co.id AND co.is_deleted = 0
    WHERE c.creator_id = ? AND c.is_deleted = 0
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `).bind(auth.userId).all();

  const capsuleCount = (capsules.results || []).length;
  const plan = auth.plan || 'free';
  const capsuleLimit = CAPSULE_LIMITS[plan as keyof typeof CAPSULE_LIMITS] ?? 10;

  return c.json({
    success: true,
    capsules: capsules.results || [],
    limits: {
      capsules: { current: capsuleCount, limit: capsuleLimit, plan },
    },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// Mount API under /api/v1
app.route('/api/v1', api);

// ══════════════════════════════════════════════════════════════════════════════
// Legacy Routes (redirect to v1)
// ══════════════════════════════════════════════════════════════════════════════

app.all('/api/*', (c) => {
  // Only redirect paths that don't already have /v1/ to prevent infinite loops
  if (c.req.path.startsWith('/api/v1/')) {
    return c.json({ success: false, error: 'Not Found', path: c.req.path }, 404);
  }
  const newPath = c.req.path.replace('/api/', '/api/v1/');
  return c.redirect(newPath, 301);
});

// ══════════════════════════════════════════════════════════════════════════════
// 404 Handler
// ══════════════════════════════════════════════════════════════════════════════

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    path: c.req.path,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  }, 404);
});

// ══════════════════════════════════════════════════════════════════════════════
// Queue Consumer (Async Generation)
// ══════════════════════════════════════════════════════════════════════════════

export default {
  fetch: app.fetch,

  // Handle scheduled tasks (cron)
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    console.log('Running scheduled task:', event.cron);
    
    // Every 15 minutes: aggregate analytics + flush event buffer + downgrade expired subscriptions
    if (event.cron === '*/15 * * * *') {
      const { flushEventBuffer, flushClientTagCounters } = await import('./utils/analytics-buffer');
      await flushEventBuffer(env);
      await flushClientTagCounters(env);
      await aggregateAnalytics(env);
      await downgradeExpiredSubscriptions(env);
    }
  },

  // Handle queue messages (async generation + execution)
  async queue(batch: MessageBatch<unknown>, env: Env) {
    // Route to the correct consumer based on queue name
    if (batch.queue === 'execution-queue') {
      const { processExecutionQueue } = await import('./queues/execution-consumer');
      await processExecutionQueue(batch as MessageBatch<ExecutionJob>, env);
    } else {
      // Default: generation queue
      const { processGenerationQueue } = await import('./queues/generation-consumer');
      await processGenerationQueue(batch as MessageBatch<GenerationJob>, env);
    }
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// Analytics Aggregation (Cron Job)
// ══════════════════════════════════════════════════════════════════════════════

async function aggregateAnalytics(env: Env): Promise<void> {
  try {
    // Aggregate ALL events (no time window) into capsule_stats.
    // Valid event_type values (per CHECK constraint):
    //   impression — capsule viewed (embed session_started + capsules.ts trackEvent)
    //   run        — user clicked Run (embed run_clicked)
    //   test_pass  — test passed (embed test_passed)
    //   test_fail  — test failed (embed test_failed)
    //   hint_viewed, solution_viewed — learner assistance
    await env.DB.prepare(`
      INSERT OR REPLACE INTO capsule_stats (
        capsule_id, impressions, unique_viewers, total_runs, total_passes,
        total_fails, unique_users, avg_attempts, completion_rate, engagement_rate,
        hint_usage_rate, solution_rate, last_computed
      )
      SELECT
        capsule_id,
        SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) as impressions,
        COUNT(DISTINCT CASE WHEN event_type = 'impression' THEN COALESCE(learner_id, user_id, session_id) END) as unique_viewers,
        SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) as total_runs,
        SUM(CASE WHEN event_type = 'test_pass' THEN 1 ELSE 0 END) as total_passes,
        SUM(CASE WHEN event_type = 'test_fail' THEN 1 ELSE 0 END) as total_fails,
        COUNT(DISTINCT CASE WHEN event_type = 'run' THEN COALESCE(learner_id, user_id, session_id) END) as unique_users,
        CAST(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'test_pass' THEN COALESCE(learner_id, user_id, session_id) END), 0) as avg_attempts,
        CAST(SUM(CASE WHEN event_type = 'test_pass' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END), 0) as completion_rate,
        CAST(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END), 0) as engagement_rate,
        CAST(SUM(CASE WHEN event_type = 'hint_viewed' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END), 0) as hint_usage_rate,
        CAST(SUM(CASE WHEN event_type = 'solution_viewed' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END), 0) as solution_rate,
        datetime('now') as last_computed
      FROM capsule_events
      GROUP BY capsule_id
    `).run();
    
    console.log('Analytics aggregation completed');
  } catch (error) {
    console.error('Analytics aggregation failed:', error);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Subscription Downgrade (Cron Job)
// ══════════════════════════════════════════════════════════════════════════════

async function downgradeExpiredSubscriptions(env: Env): Promise<void> {
  try {
    // Find subscriptions that are past their period end and marked for cancellation
    const expired = await env.DB.prepare(`
      SELECT s.user_id FROM subscriptions s
      WHERE s.cancel_at_period_end = 1
        AND s.current_period_end < datetime('now')
        AND s.status = 'active'
    `).all<{ user_id: string }>();

    if (!expired.results?.length) return;

    for (const row of expired.results) {
      // Downgrade user to free plan
      await env.DB.prepare(
        'UPDATE users SET plan = ?, execution_quota = 200, generation_quota = 5 WHERE id = ?'
      ).bind('free', row.user_id).run();

      // Mark subscription as canceled
      await env.DB.prepare(
        `UPDATE subscriptions SET status = 'canceled', plan = 'free' WHERE user_id = ?`
      ).bind(row.user_id).run();
    }

    console.log(`Downgraded ${expired.results.length} expired subscription(s)`);
  } catch (error) {
    console.error('Subscription downgrade check failed:', error);
  }
}
