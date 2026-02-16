/**
 * DevCapsules API — Cloudflare Workers Entry Point
 * 
 * Main router handling all API requests at the edge.
 * Uses Hono for routing with middleware chain:
 * [CORS] → [Request ID] → [Logger] → [Rate Limit] → [Auth] → [Route]
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

// Middleware
import { requestId } from './middleware/request-id';
import { rateLimiter } from './middleware/rate-limit';
import { authMiddleware } from './middleware/auth';
import { ApiError } from './middleware/error-handler';
import { defaultBodyLimit } from './middleware/body-limit';

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

  // Log error
  console.error(JSON.stringify({
    level: 'error',
    requestId,
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
  const allowedOrigins = c.env.CORS_ORIGINS.split(',');
  
  // Allow any origin for embed widget on specific routes
  const isEmbedRoute = c.req.path.includes('/embed/') || 
                       (c.req.path.includes('/execute') && c.req.method === 'POST');
  
  return cors({
    origin: isEmbedRoute ? '*' : allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
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
// API v1 Routes
// ══════════════════════════════════════════════════════════════════════════════

const api = new Hono<{ Bindings: Env; Variables: Variables }>();

// Rate limiting (before auth to prevent auth abuse)
api.use('*', rateLimiter);

// Body size limit (Hono native stream-safe — counts actual bytes, not Content-Length)
api.use('*', defaultBodyLimit);

// Authentication (optional for some routes)
api.use('*', authMiddleware);

// Mount route handlers
api.route('/capsules', capsuleRoutes);
api.route('/generate', generateRoutes);
api.route('/execute', executeRoutes);
api.route('/auth', authRoutes);
api.route('/analytics', analyticsRoutes);
api.route('/mentor', mentorRoutes);

// GET /my-capsules — List authenticated user's capsules (draft + published)
api.get('/my-capsules', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  const capsules = await c.env.DB.prepare(`
    SELECT id, title, description, type, difficulty, language,
           function_name, test_count, has_hints, tags, quality_score,
           is_published, created_at, updated_at
    FROM capsules
    WHERE creator_id = ? AND is_deleted = 0
    ORDER BY updated_at DESC
  `).bind(auth.userId).all();

  return c.json({
    success: true,
    capsules: capsules.results || [],
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
    
    // Every 15 minutes: aggregate analytics + flush event buffer
    if (event.cron === '*/15 * * * *') {
      const { flushEventBuffer } = await import('./utils/analytics-buffer');
      await flushEventBuffer(env);
      await aggregateAnalytics(env);
    }
  },

  // Handle queue messages (async generation)
  async queue(batch: MessageBatch<GenerationJob>, env: Env) {
    const { processGenerationQueue } = await import('./queues/generation-consumer');
    await processGenerationQueue(batch, env);
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// Analytics Aggregation (Cron Job)
// ══════════════════════════════════════════════════════════════════════════════

async function aggregateAnalytics(env: Env): Promise<void> {
  try {
    await env.DB.exec(`
      INSERT OR REPLACE INTO capsule_stats (
        capsule_id, impressions, total_runs, total_passes,
        total_fails, completion_rate, engagement_rate, last_computed
      )
      SELECT
        capsule_id,
        SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) as impressions,
        SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) as total_runs,
        SUM(CASE WHEN event_type = 'test_pass' THEN 1 ELSE 0 END) as total_passes,
        SUM(CASE WHEN event_type = 'test_fail' THEN 1 ELSE 0 END) as total_fails,
        CAST(SUM(CASE WHEN event_type = 'test_pass' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END), 0) as completion_rate,
        CAST(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END), 0) as engagement_rate,
        datetime('now') as last_computed
      FROM capsule_events
      WHERE created_at > datetime('now', '-1 day')
      GROUP BY capsule_id
    `);
    
    console.log('Analytics aggregation completed');
  } catch (error) {
    console.error('Analytics aggregation failed:', error);
  }
}
