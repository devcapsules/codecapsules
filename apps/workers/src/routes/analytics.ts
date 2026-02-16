/**
 * Analytics Routes
 * 
 * Provides analytics for capsule creators and platform admins.
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';

type Variables = {
  auth: Auth | null;
  requestId: string;
};

export const analyticsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ══════════════════════════════════════════════════════════════════════════════
// GET /analytics/capsules/:id — Get analytics for a capsule (owner only)
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/capsules/:id', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  const { id } = c.req.param();

  // Verify ownership
  const capsule = await c.env.DB.prepare(
    'SELECT creator_id, title FROM capsules WHERE id = ?'
  ).bind(id).first<{ creator_id: string; title: string }>();

  if (!capsule) {
    throw new ApiError(404, 'Capsule not found');
  }
  if (capsule.creator_id !== auth.userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Get pre-computed stats
  const stats = await c.env.DB.prepare(`
    SELECT * FROM capsule_stats WHERE capsule_id = ?
  `).bind(id).first();

  // Get recent events (last 24 hours)
  const recentEvents = await c.env.DB.prepare(`
    SELECT event_type, COUNT(*) as count
    FROM capsule_events
    WHERE capsule_id = ? AND created_at > datetime('now', '-24 hours')
    GROUP BY event_type
  `).bind(id).all();

  // Get daily trends (last 7 days)
  const dailyTrends = await c.env.DB.prepare(`
    SELECT 
      date(created_at) as date,
      SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) as impressions,
      SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) as runs,
      SUM(CASE WHEN event_type = 'test_pass' THEN 1 ELSE 0 END) as passes
    FROM capsule_events
    WHERE capsule_id = ? AND created_at > datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date DESC
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      capsuleId: id,
      capsuleTitle: capsule.title,
      summary: stats || {
        impressions: 0,
        total_runs: 0,
        completion_rate: 0,
        engagement_rate: 0,
      },
      last24Hours: recentEvents.results,
      dailyTrends: dailyTrends.results,
    },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /analytics/dashboard — Creator dashboard overview
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/dashboard', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  // Get user's capsules with stats
  const capsules = await c.env.DB.prepare(`
    SELECT 
      c.id, c.title, c.language, c.is_published, c.created_at,
      COALESCE(s.impressions, 0) as impressions,
      COALESCE(s.total_runs, 0) as total_runs,
      COALESCE(s.completion_rate, 0) as completion_rate
    FROM capsules c
    LEFT JOIN capsule_stats s ON c.id = s.capsule_id
    WHERE c.creator_id = ? AND c.is_deleted = 0
    ORDER BY c.created_at DESC
    LIMIT 20
  `).bind(auth.userId).all();

  // Get aggregate stats
  const aggregate = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_capsules,
      SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_capsules,
      SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) as draft_capsules
    FROM capsules 
    WHERE creator_id = ? AND is_deleted = 0
  `).bind(auth.userId).first();

  const totalStats = await c.env.DB.prepare(`
    SELECT 
      SUM(s.impressions) as total_impressions,
      SUM(s.total_runs) as total_runs,
      SUM(s.total_passes) as total_passes
    FROM capsules c
    JOIN capsule_stats s ON c.id = s.capsule_id
    WHERE c.creator_id = ? AND c.is_deleted = 0
  `).bind(auth.userId).first();

  return c.json({
    success: true,
    data: {
      overview: {
        ...aggregate,
        ...totalStats,
      },
      capsules: capsules.results,
    },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /analytics/track — Track event (public, rate limited)
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.post('/track', async (c) => {
  const body = await c.req.json();
  const { capsuleId, eventType, metadata, sessionId } = body;

  if (!capsuleId || !eventType) {
    throw new ApiError(400, 'capsuleId and eventType are required');
  }

  const allowedEvents = ['impression', 'run', 'test_pass', 'test_fail', 'hint_viewed', 'solution_viewed', 'completed', 'abandoned'];
  if (!allowedEvents.includes(eventType)) {
    throw new ApiError(400, `Invalid eventType. Allowed: ${allowedEvents.join(', ')}`);
  }

  const auth = c.get('auth');

  // Insert event
  await c.env.DB.prepare(`
    INSERT INTO capsule_events (capsule_id, user_id, event_type, metadata, session_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    capsuleId,
    auth?.userId || null,
    eventType,
    metadata ? JSON.stringify(metadata) : null,
    sessionId || null
  ).run();

  return c.json({
    success: true,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /analytics/public/:id — Public capsule stats (limited data)
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/public/:id', async (c) => {
  const { id } = c.req.param();

  // Only published capsules
  const capsule = await c.env.DB.prepare(
    'SELECT id FROM capsules WHERE id = ? AND is_published = 1'
  ).bind(id).first();

  if (!capsule) {
    throw new ApiError(404, 'Capsule not found');
  }

  // Get limited public stats
  const stats = await c.env.DB.prepare(`
    SELECT impressions, total_runs, completion_rate
    FROM capsule_stats 
    WHERE capsule_id = ?
  `).bind(id).first();

  return c.json({
    success: true,
    data: stats || {
      impressions: 0,
      total_runs: 0,
      completion_rate: 0,
    },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});
