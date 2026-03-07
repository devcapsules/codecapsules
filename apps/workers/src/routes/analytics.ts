/**
 * Analytics Routes
 * 
 * Provides analytics for capsule creators and platform admins.
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';
import { requirePlan } from '../middleware/tier-gate';

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
// GET /analytics/command-center — Combined dashboard data (single request)
// Returns: metrics, recent capsules, playlists, edge assist stats
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/command-center', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  // Run all queries in parallel for speed
  const [capsules, aggregate, totalStats, playlists, recentEvents, edgeEvents] = await Promise.all([
    // Recent capsules with stats
    c.env.DB.prepare(`
      SELECT 
        c.id, c.title, c.language, c.difficulty, c.type, c.is_published, c.created_at, c.updated_at,
        COALESCE(s.impressions, 0) as impressions,
        COALESCE(s.total_runs, 0) as total_runs,
        COALESCE(s.total_passes, 0) as total_passes,
        COALESCE(s.completion_rate, 0) as completion_rate
      FROM capsules c
      LEFT JOIN capsule_stats s ON c.id = s.capsule_id
      WHERE c.creator_id = ? AND c.is_deleted = 0
      ORDER BY c.updated_at DESC
      LIMIT 10
    `).bind(auth.userId).all(),

    // Aggregate counts
    c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_capsules,
        SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_capsules,
        SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) as draft_capsules
      FROM capsules 
      WHERE creator_id = ? AND is_deleted = 0
    `).bind(auth.userId).first(),

    // Total stats across all capsules
    c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(s.impressions), 0) as total_impressions,
        COALESCE(SUM(s.total_runs), 0) as total_runs,
        COALESCE(SUM(s.total_passes), 0) as total_passes,
        COALESCE(SUM(s.total_fails), 0) as total_fails
      FROM capsules c
      JOIN capsule_stats s ON c.id = s.capsule_id
      WHERE c.creator_id = ? AND c.is_deleted = 0
    `).bind(auth.userId).first(),

    // Playlists/courses
    c.env.DB.prepare(`
      SELECT p.id, p.title, p.description, p.is_published, p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM course_capsules WHERE course_id = p.id) as capsule_count
      FROM courses p
      WHERE p.creator_id = ? AND p.is_deleted = 0
      ORDER BY p.updated_at DESC
      LIMIT 5
    `).bind(auth.userId).all(),

    // Recent events count (last 30 days) for "this month" metrics
    c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN event_type IN ('code_run', 'run') THEN 1 ELSE 0 END) as runs_this_month,
        SUM(CASE WHEN event_type IN ('test_passed', 'test_pass') THEN 1 ELSE 0 END) as passes_this_month,
        SUM(CASE WHEN event_type IN ('test_failed', 'test_fail') THEN 1 ELSE 0 END) as fails_this_month,
        SUM(CASE WHEN event_type = 'hint_viewed' THEN 1 ELSE 0 END) as hints_this_month
      FROM capsule_events ce
      JOIN capsules c ON ce.capsule_id = c.id
      WHERE c.creator_id = ? AND ce.created_at > datetime('now', '-30 days')
    `).bind(auth.userId).first(),

    // EdGE assistant interactions (last 30 days)
    c.env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN event_type IN ('hint_viewed', 'solution_viewed') THEN 1 ELSE 0 END) as edge_interventions
      FROM capsule_events ce
      JOIN capsules c ON ce.capsule_id = c.id
      WHERE c.creator_id = ? AND ce.created_at > datetime('now', '-30 days')
    `).bind(auth.userId).first(),
  ]);

  return c.json({
    success: true,
    data: {
      metrics: {
        total_capsules: (aggregate as any)?.total_capsules || 0,
        published_capsules: (aggregate as any)?.published_capsules || 0,
        draft_capsules: (aggregate as any)?.draft_capsules || 0,
        total_impressions: (totalStats as any)?.total_impressions || 0,
        total_runs: (totalStats as any)?.total_runs || 0,
        total_passes: (totalStats as any)?.total_passes || 0,
        total_fails: (totalStats as any)?.total_fails || 0,
        runs_this_month: (recentEvents as any)?.runs_this_month || 0,
        passes_this_month: (recentEvents as any)?.passes_this_month || 0,
        fails_this_month: (recentEvents as any)?.fails_this_month || 0,
        hints_this_month: (recentEvents as any)?.hints_this_month || 0,
        edge_interventions: (edgeEvents as any)?.edge_interventions || 0,
      },
      recent_capsules: capsules.results || [],
      recent_playlists: playlists.results || [],
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

// Map embed event types to canonical DB event types
const EMBED_EVENT_MAP: Record<string, string> = {
  session_started: 'session_started',
  session_completed: 'session_ended',
  run_clicked: 'code_run',
  test_failed: 'test_failed',
  test_passed: 'test_passed',
  hint_viewed: 'hint_viewed',
  solution_viewed: 'solution_viewed',
  learner_identified: 'learner_identified',
  // Legacy dashboard event names
  impression: 'impression',
  run: 'code_run',
  test_pass: 'test_passed',
  test_fail: 'test_failed',
  completed: 'completed',
  abandoned: 'abandoned',
};

analyticsRoutes.post('/track', async (c) => {
  const body = await c.req.json();

  // ── Handle embed batch format: { events: [...] } ──
  if (Array.isArray(body.events)) {
    const results = [];
    for (const evt of body.events.slice(0, 25)) {
      const eventType = EMBED_EVENT_MAP[evt.type] || evt.type;
      const capsuleId = evt.capsuleId || evt.widgetId;
      if (!capsuleId || !eventType) continue;

      try {
        await c.env.DB.prepare(`
          INSERT INTO capsule_events (capsule_id, user_id, event_type, metadata, session_id, learner_id, learner_name)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          capsuleId,
          null,
          eventType,
          evt.metadata ? JSON.stringify(evt.metadata) : null,
          evt.sessionId || null,
          evt.learnerId || null,
          evt.learnerName || null
        ).run();

        // When a learner self-identifies, backfill their name on past events
        if (eventType === 'learner_identified' && evt.learnerId && evt.learnerName) {
          await c.env.DB.prepare(`
            UPDATE capsule_events SET learner_name = ? WHERE learner_id = ? AND (learner_name IS NULL OR learner_name = '')
          `).bind(evt.learnerName, evt.learnerId).run();
        }

        results.push({ type: evt.type, ok: true });
      } catch {
        results.push({ type: evt.type, ok: false });
      }
    }

    return c.json({
      success: true,
      tracked: results.length,
      meta: {
        requestId: c.get('requestId'),
        timestamp: Date.now(),
        version: c.env.API_VERSION,
      },
    });
  }

  // ── Single event format (dashboard): { capsuleId, eventType, ... } ──
  const { capsuleId, eventType, metadata, sessionId } = body;

  if (!capsuleId || !eventType) {
    throw new ApiError(400, 'capsuleId and eventType are required');
  }

  const canonicalType = EMBED_EVENT_MAP[eventType] || eventType;

  const auth = c.get('auth');

  const { learnerId, learnerName } = body;

  // Insert event
  await c.env.DB.prepare(`
    INSERT INTO capsule_events (capsule_id, user_id, event_type, metadata, session_id, learner_id, learner_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    capsuleId,
    auth?.userId || null,
    canonicalType,
    metadata ? JSON.stringify(metadata) : null,
    sessionId || null,
    learnerId || null,
    learnerName || null
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
// GET /analytics/learners/:capsuleId — Learner progress for a capsule (owner)
// Returns per-learner pass/fail status for the creator dashboard
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/learners/:capsuleId', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { capsuleId } = c.req.param();

  // Verify ownership
  const capsule = await c.env.DB.prepare(
    'SELECT creator_id, title FROM capsules WHERE id = ?'
  ).bind(capsuleId).first<{ creator_id: string; title: string }>();
  if (!capsule) throw new ApiError(404, 'Capsule not found');
  if (capsule.creator_id !== auth.userId) throw new ApiError(403, 'Access denied');

  // Get unique learners and their best result for this capsule
  const learners = await c.env.DB.prepare(`
    SELECT
      ce.learner_id,
      MAX(ce.learner_name) as learner_name,
      MIN(ce.created_at) as first_seen,
      MAX(ce.created_at) as last_seen,
      COUNT(CASE WHEN ce.event_type = 'code_run' THEN 1 END) as total_runs,
      COUNT(CASE WHEN ce.event_type = 'test_passed' THEN 1 END) as passes,
      COUNT(CASE WHEN ce.event_type = 'test_failed' THEN 1 END) as fails,
      COUNT(CASE WHEN ce.event_type = 'hint_viewed' THEN 1 END) as hints_used,
      COUNT(CASE WHEN ce.event_type = 'solution_viewed' THEN 1 END) as solution_views,
      CASE WHEN COUNT(CASE WHEN ce.event_type = 'test_passed' THEN 1 END) > 0 THEN 'passed' ELSE 'struggling' END as status
    FROM capsule_events ce
    WHERE ce.capsule_id = ? AND ce.learner_id IS NOT NULL
    GROUP BY ce.learner_id
    ORDER BY last_seen DESC
    LIMIT 200
  `).bind(capsuleId).all();

  return c.json({
    success: true,
    data: {
      capsuleId,
      capsuleTitle: capsule.title,
      learners: (learners.results || []).map((l: any) => ({
        learnerId: l.learner_id,
        displayName: l.learner_name || `Student #${(l.learner_id || '').slice(0, 6)}`,
        isAnonymous: !l.learner_name,
        firstSeen: l.first_seen,
        lastSeen: l.last_seen,
        totalRuns: l.total_runs,
        passes: l.passes,
        fails: l.fails,
        hintsUsed: l.hints_used,
        solutionViewed: l.solution_views > 0,
        status: l.status,
      })),
      totalLearners: learners.results?.length || 0,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /analytics/course-learners/:playlistId — Per-learner progress across a course
// Returns a progress grid: each learner × each capsule in the course
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/course-learners/:playlistId', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { playlistId } = c.req.param();

  // Verify ownership
  const playlist = await c.env.DB.prepare(
    'SELECT creator_id, title FROM courses WHERE id = ?'
  ).bind(playlistId).first<{ creator_id: string; title: string }>();
  if (!playlist) throw new ApiError(404, 'Course not found');
  if (playlist.creator_id !== auth.userId) throw new ApiError(403, 'Access denied');

  // Get capsules in this playlist
  const capsules = await c.env.DB.prepare(`
    SELECT pi.capsule_id, c.title as capsule_title, pi.position
    FROM course_capsules pi
    JOIN capsules c ON pi.capsule_id = c.id
    WHERE pi.course_id = ?
    ORDER BY pi.position ASC
  `).bind(playlistId).all();

  const capsuleIds = (capsules.results || []).map((c: any) => c.capsule_id);
  if (capsuleIds.length === 0) {
    return c.json({ success: true, data: { playlistId, title: playlist.title, capsules: [], learners: [] }, meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION } });
  }

  // Build placeholders for IN clause
  const placeholders = capsuleIds.map(() => '?').join(',');

  // Get all learner events for these capsules
  const events = await c.env.DB.prepare(`
    SELECT
      ce.learner_id,
      MAX(ce.learner_name) as learner_name,
      ce.capsule_id,
      COUNT(CASE WHEN ce.event_type = 'test_passed' THEN 1 END) as passes,
      COUNT(CASE WHEN ce.event_type = 'code_run' THEN 1 END) as attempts,
      MAX(ce.created_at) as last_activity
    FROM capsule_events ce
    WHERE ce.capsule_id IN (${placeholders}) AND ce.learner_id IS NOT NULL
    GROUP BY ce.learner_id, ce.capsule_id
  `).bind(...capsuleIds).all();

  // Build per-learner progress grid
  const learnerMap = new Map<string, { name: string | null; progress: Record<string, { passed: boolean; attempts: number; lastActivity: string }> }>();

  for (const evt of (events.results || []) as any[]) {
    if (!learnerMap.has(evt.learner_id)) {
      learnerMap.set(evt.learner_id, { name: evt.learner_name, progress: {} });
    }
    const learner = learnerMap.get(evt.learner_id)!;
    if (evt.learner_name && !learner.name) learner.name = evt.learner_name;
    learner.progress[evt.capsule_id] = {
      passed: evt.passes > 0,
      attempts: evt.attempts,
      lastActivity: evt.last_activity,
    };
  }

  const learners = Array.from(learnerMap.entries()).map(([id, data]) => ({
    learnerId: id,
    displayName: data.name || `Student #${id.slice(0, 6)}`,
    isAnonymous: !data.name,
    capsuleProgress: data.progress,
    capsulesPassed: Object.values(data.progress).filter(p => p.passed).length,
    totalCapsules: capsuleIds.length,
  }));

  // Sort: most progress first, then by name
  learners.sort((a, b) => b.capsulesPassed - a.capsulesPassed || a.displayName.localeCompare(b.displayName));

  return c.json({
    success: true,
    data: {
      playlistId,
      title: playlist.title,
      capsules: (capsules.results || []).map((c: any) => ({ id: c.capsule_id, title: c.capsule_title, position: c.position })),
      learners,
      totalLearners: learners.length,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /analytics/pro-tier/:userId — Pro-tier dashboard metrics for bloggers
// Returns: total impressions, engagement/completion rates, top capsules, funnel
// TIER GATE: creator+ plan required
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/pro-tier/:userId', requirePlan('creator'), async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { userId } = c.req.param();
  if (auth.userId !== userId) throw new ApiError(403, 'Access denied');

  const range = c.req.query('range') || '30d';
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[range] || 30;

  // Get user's capsules with pre-computed stats
  const capsules = await c.env.DB.prepare(`
    SELECT 
      c.id, c.title, c.created_at,
      COALESCE(s.impressions, 0) as impressions,
      COALESCE(s.total_runs, 0) as total_runs,
      COALESCE(s.total_passes, 0) as total_passes,
      COALESCE(s.engagement_rate, 0) as engagement_rate,
      COALESCE(s.completion_rate, 0) as completion_rate
    FROM capsules c
    LEFT JOIN capsule_stats s ON c.id = s.capsule_id
    WHERE c.creator_id = ? AND c.is_deleted = 0 AND c.is_published = 1
    ORDER BY COALESCE(s.impressions, 0) DESC
    LIMIT 20
  `).bind(userId).all();

  const capList = (capsules.results || []) as any[];

  // Compute aggregates
  const totalImpressions = capList.reduce((s, c) => s + c.impressions, 0);
  const totalRuns = capList.reduce((s, c) => s + c.total_runs, 0);
  const totalPasses = capList.reduce((s, c) => s + c.total_passes, 0);
  const overallEngagement = totalImpressions > 0 ? (totalRuns / totalImpressions) * 100 : 0;
  const overallCompletion = totalRuns > 0 ? (totalPasses / totalRuns) * 100 : 0;

  return c.json({
    success: true,
    metrics: {
      total_impressions: totalImpressions,
      overall_engagement_rate: Math.round(overallEngagement * 10) / 10,
      overall_completion_rate: Math.round(overallCompletion * 10) / 10,
      top_capsules: capList.map(cap => ({
        id: cap.id,
        title: cap.title,
        impressions: cap.impressions,
        runs: cap.total_runs,
        passes: cap.total_passes,
        engagement_rate: Math.round(cap.engagement_rate * 10) / 10,
        completion_rate: Math.round(cap.completion_rate * 10) / 10,
        created_at: cap.created_at,
      })),
      funnel_data: {
        impressions: totalImpressions,
        runs: totalRuns,
        passes: totalPasses,
      },
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /analytics/capsule-deep-dive/:capsuleId — Per-capsule pedagogical deep-dive
// Returns: student attempts, failing tests, difficulty/time analysis
// TIER GATE: creator+ plan required
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/capsule-deep-dive/:capsuleId', requirePlan('creator'), async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { capsuleId } = c.req.param();

  // Verify ownership
  const capsule = await c.env.DB.prepare(
    'SELECT creator_id, title FROM capsules WHERE id = ?'
  ).bind(capsuleId).first<{ creator_id: string; title: string }>();
  if (!capsule) throw new ApiError(404, 'Capsule not found');
  if (capsule.creator_id !== auth.userId) throw new ApiError(403, 'Access denied');

  // Run all queries in parallel
  const [stats, learnerAgg, failEvents, sessionData] = await Promise.all([
    // Pre-computed stats
    c.env.DB.prepare('SELECT * FROM capsule_stats WHERE capsule_id = ?').bind(capsuleId).first(),

    // Per-learner aggregates
    c.env.DB.prepare(`
      SELECT
        ce.learner_id,
        MAX(ce.learner_name) as learner_name,
        COUNT(CASE WHEN ce.event_type IN ('code_run','run') THEN 1 END) as attempts,
        MAX(CASE WHEN ce.event_type IN ('test_passed','test_pass') THEN 1 ELSE 0 END) as passed,
        MAX(ce.created_at) as last_attempt,
        MIN(ce.created_at) as first_seen
      FROM capsule_events ce
      WHERE ce.capsule_id = ? AND ce.learner_id IS NOT NULL
      GROUP BY ce.learner_id
      ORDER BY last_attempt DESC
      LIMIT 100
    `).bind(capsuleId).all(),

    // Raw test_failed events with metadata (for failing test analysis)
    c.env.DB.prepare(`
      SELECT metadata, COUNT(*) as fail_count
      FROM capsule_events
      WHERE capsule_id = ? AND event_type IN ('test_failed','test_fail') AND metadata IS NOT NULL
      GROUP BY metadata
      ORDER BY fail_count DESC
      LIMIT 50
    `).bind(capsuleId).all(),

    // Session timing data
    c.env.DB.prepare(`
      SELECT
        session_id,
        MIN(created_at) as session_start,
        MAX(created_at) as session_end,
        MIN(CASE WHEN event_type IN ('code_run','run') THEN created_at END) as first_run,
        MAX(CASE WHEN event_type IN ('test_passed','test_pass') THEN 1 ELSE 0 END) as did_pass
      FROM capsule_events
      WHERE capsule_id = ? AND session_id IS NOT NULL
      GROUP BY session_id
    `).bind(capsuleId).all(),
  ]);

  const learners = (learnerAgg.results || []) as any[];
  const failData = (failEvents.results || []) as any[];
  const sessions = (sessionData.results || []) as any[];

  // Compute unique students
  const totalStudents = learners.length;
  const passedStudents = learners.filter(l => l.passed > 0).length;
  const completionRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
  const avgAttempts = totalStudents > 0 ? learners.reduce((s, l) => s + l.attempts, 0) / totalStudents : 0;

  // Time analysis from sessions
  const sessionsWithFirstRun = sessions.filter(s => s.first_run && s.session_start);
  const avgTimeToFirstRun = sessionsWithFirstRun.length > 0
    ? sessionsWithFirstRun.reduce((sum, s) => {
        const diffMs = new Date(s.first_run).getTime() - new Date(s.session_start).getTime();
        return sum + diffMs / 60000; // minutes
      }, 0) / sessionsWithFirstRun.length
    : 0;

  const passedSessions = sessions.filter(s => s.did_pass > 0 && s.session_start && s.session_end);
  const avgTimeToCompletion = passedSessions.length > 0
    ? passedSessions.reduce((sum, s) => {
        const diffMs = new Date(s.session_end).getTime() - new Date(s.session_start).getTime();
        return sum + diffMs / 60000;
      }, 0) / passedSessions.length
    : 0;

  const gaveUpStudents = learners.filter(l => l.passed === 0 && l.attempts >= 3).length;

  // Build failing test cases from metadata
  const failingTestCases: any[] = [];
  for (const row of failData) {
    try {
      const meta = JSON.parse(row.metadata);
      const testName = meta.testName || meta.test_name || meta.failing_test || 'Unknown Test';
      const existing = failingTestCases.find(f => f.test_name === testName);
      if (existing) {
        existing.student_count += row.fail_count;
        if (meta.error && !existing.common_errors.includes(meta.error)) {
          existing.common_errors.push(meta.error);
        }
      } else {
        failingTestCases.push({
          test_name: testName,
          description: meta.description || '',
          failure_rate: 0, // computed below
          student_count: row.fail_count,
          avg_attempts: avgAttempts,
          common_errors: meta.error ? [meta.error] : [],
          insight: '',
        });
      }
    } catch { /* skip unparseable metadata */ }
  }

  // Compute failure rates
  const totalFailEvents = failingTestCases.reduce((s, f) => s + f.student_count, 0);
  for (const ftc of failingTestCases) {
    ftc.failure_rate = totalFailEvents > 0 ? Math.round((ftc.student_count / totalFailEvents) * 1000) / 10 : 0;
    // Generate simple insight
    if (ftc.common_errors.length > 0) {
      ftc.insight = `Common issue: ${ftc.common_errors[0]}. ${ftc.student_count} occurrences.`;
    }
  }

  // Difficulty perception from attempt distribution
  const easyThreshold = 2;
  const hardThreshold = 6;
  const tooEasy = totalStudents > 0 ? (learners.filter(l => l.attempts <= easyThreshold && l.passed > 0).length / totalStudents) * 100 : 0;
  const tooHard = totalStudents > 0 ? (learners.filter(l => l.attempts >= hardThreshold || (l.passed === 0 && l.attempts >= 3)).length / totalStudents) * 100 : 0;
  const justRight = 100 - tooEasy - tooHard;

  // Build student attempts list
  const studentAttempts = learners.slice(0, 50).map(l => ({
    student_id: l.learner_id,
    student_name: l.learner_name || `Student #${(l.learner_id || '').slice(0, 6)}`,
    attempts: l.attempts,
    last_attempt: l.last_attempt,
    status: l.passed > 0 ? 'passed' : 'failed',
    time_spent: 0, // Would need session duration tracking
    errors: [],
  }));

  return c.json({
    success: true,
    data: {
      capsule_id: capsuleId,
      capsule_title: capsule.title,
      total_students: totalStudents,
      completion_rate: Math.round(completionRate * 10) / 10,
      avg_attempts: Math.round(avgAttempts * 10) / 10,
      avg_time_to_completion: Math.round(avgTimeToCompletion * 10) / 10,
      failing_test_cases: failingTestCases.slice(0, 10),
      student_attempts: studentAttempts,
      difficulty_analysis: {
        too_easy: Math.round(tooEasy * 10) / 10,
        just_right: Math.round(justRight * 10) / 10,
        too_hard: Math.round(tooHard * 10) / 10,
      },
      time_analysis: {
        avg_time_to_first_run: Math.round(avgTimeToFirstRun * 10) / 10,
        avg_time_between_attempts: 0, // Not tracked at event level yet
        students_who_gave_up: gaveUpStudents,
      },
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /analytics/cohort/:cohortId — Cohort/Course dashboard for educators
// cohortId maps to playlistId; returns per-student progress grid
// TIER GATE: team+ plan required (B2B feature)
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/cohort/:cohortId', requirePlan('team'), async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { cohortId } = c.req.param();

  // cohortId is actually a playlistId
  const playlist = await c.env.DB.prepare(
    'SELECT creator_id, title FROM courses WHERE id = ?'
  ).bind(cohortId).first<{ creator_id: string; title: string }>();
  if (!playlist) throw new ApiError(404, 'Cohort/Course not found');
  if (playlist.creator_id !== auth.userId) throw new ApiError(403, 'Access denied');

  // Get capsules in this playlist
  const capsuleRows = await c.env.DB.prepare(`
    SELECT pi.capsule_id, c.title as capsule_title, c.difficulty, pi.position
    FROM course_capsules pi
    JOIN capsules c ON pi.capsule_id = c.id
    WHERE pi.course_id = ?
    ORDER BY pi.position ASC
  `).bind(cohortId).all();

  const capList = (capsuleRows.results || []) as any[];
  const capsuleIds = capList.map((cap: any) => cap.capsule_id);

  if (capsuleIds.length === 0) {
    return c.json({
      success: true,
      metrics: {
        cohort_id: cohortId,
        cohort_name: playlist.title,
        student_count: 0,
        avg_time_to_first_run: 0,
        avg_run_to_pass_ratio: 0,
        completion_rate: 0,
        students: [],
        at_risk_students: [],
        capsules: [],
      },
      meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
    });
  }

  const placeholders = capsuleIds.map(() => '?').join(',');

  // Get all learner events across these capsules
  const events = await c.env.DB.prepare(`
    SELECT
      ce.learner_id,
      MAX(ce.learner_name) as learner_name,
      ce.capsule_id,
      COUNT(CASE WHEN ce.event_type IN ('code_run','run') THEN 1 END) as runs,
      COUNT(CASE WHEN ce.event_type IN ('test_passed','test_pass') THEN 1 END) as passes,
      COUNT(CASE WHEN ce.event_type IN ('test_failed','test_fail') THEN 1 END) as fails,
      MIN(ce.created_at) as first_seen,
      MAX(ce.created_at) as last_activity
    FROM capsule_events ce
    WHERE ce.capsule_id IN (${placeholders}) AND ce.learner_id IS NOT NULL
    GROUP BY ce.learner_id, ce.capsule_id
  `).bind(...capsuleIds).all();

  // Build per-learner progress grid
  const learnerMap = new Map<string, {
    name: string | null;
    progressByCapsule: Record<string, { status: string; attempts: number; last_attempt: string }>;
    totalRuns: number;
    totalPasses: number;
    firstSeen: string;
    lastActivity: string;
  }>();

  for (const evt of (events.results || []) as any[]) {
    if (!learnerMap.has(evt.learner_id)) {
      learnerMap.set(evt.learner_id, {
        name: evt.learner_name,
        progressByCapsule: {},
        totalRuns: 0,
        totalPasses: 0,
        firstSeen: evt.first_seen,
        lastActivity: evt.last_activity,
      });
    }
    const learner = learnerMap.get(evt.learner_id)!;
    if (evt.learner_name && !learner.name) learner.name = evt.learner_name;
    learner.totalRuns += evt.runs;
    learner.totalPasses += evt.passes;
    if (evt.last_activity > (learner.lastActivity || '')) learner.lastActivity = evt.last_activity;
    if (evt.first_seen < (learner.firstSeen || 'z')) learner.firstSeen = evt.first_seen;

    const status = evt.passes > 0 ? 'passed' : (evt.runs > 0 ? 'failed' : 'not_started');
    learner.progressByCapsule[evt.capsule_id] = {
      status,
      attempts: evt.runs,
      last_attempt: evt.last_activity,
    };
  }

  // Convert to array with computed metrics
  const students: any[] = [];
  const atRiskStudents: any[] = [];

  for (const [learnerId, data] of learnerMap) {
    const capsCompleted = Object.values(data.progressByCapsule).filter(p => p.status === 'passed').length;
    const runToPassRatio = data.totalPasses > 0 ? data.totalRuns / data.totalPasses : data.totalRuns;
    const isAtRisk = runToPassRatio > 7 || (capsCompleted < capsuleIds.length * 0.3 && data.totalRuns > 5);

    const student = {
      student_id: learnerId,
      student_name: data.name || `Student #${learnerId.slice(0, 6)}`,
      email: '',
      capsules_completed: capsCompleted,
      total_capsules: capsuleIds.length,
      avg_run_to_pass_ratio: Math.round(runToPassRatio * 10) / 10,
      time_to_first_run_avg: 0,
      last_activity: data.lastActivity,
      is_at_risk: isAtRisk,
      progress_by_capsule: data.progressByCapsule,
    };

    students.push(student);
    if (isAtRisk) {
      atRiskStudents.push({ ...student, progress_by_capsule: {} });
    }
  }

  // Sort: at-risk first, then by completion
  students.sort((a, b) => {
    if (a.is_at_risk !== b.is_at_risk) return a.is_at_risk ? -1 : 1;
    return b.capsules_completed - a.capsules_completed;
  });

  // Compute cohort-level aggregates
  const studentCount = students.length;
  const avgRunToPass = studentCount > 0 ? students.reduce((s, st) => s + st.avg_run_to_pass_ratio, 0) / studentCount : 0;
  const cohortCompletion = studentCount > 0
    ? (students.reduce((s, st) => s + st.capsules_completed, 0) / (studentCount * capsuleIds.length)) * 100
    : 0;

  // Per-capsule completion rates
  const capsules = capList.map((cap: any) => {
    const passedCount = students.filter(st => st.progress_by_capsule[cap.capsule_id]?.status === 'passed').length;
    return {
      id: cap.capsule_id,
      title: cap.capsule_title,
      difficulty: cap.difficulty || 'Medium',
      completion_rate: studentCount > 0 ? Math.round((passedCount / studentCount) * 1000) / 10 : 0,
    };
  });

  return c.json({
    success: true,
    metrics: {
      cohort_id: cohortId,
      cohort_name: playlist.title,
      student_count: studentCount,
      avg_time_to_first_run: 0,
      avg_run_to_pass_ratio: Math.round(avgRunToPass * 10) / 10,
      completion_rate: Math.round(cohortCompletion * 10) / 10,
      students,
      at_risk_students: atRiskStudents,
      capsules,
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /analytics/overview — Aggregated metrics for main analytics page
// Returns: time-to-first-run, run-to-pass ratio, give-up rate, hint util,
//          top failing tests, capsule performance, cohort summary
// ══════════════════════════════════════════════════════════════════════════════

analyticsRoutes.get('/overview', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const range = c.req.query('range') || '30d';
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[range] || 30;

  const [capsulePerf, eventMetrics, failingTests, playlists] = await Promise.all([
    // Capsule performance
    c.env.DB.prepare(`
      SELECT
        c.id, c.title,
        COALESCE(s.impressions, 0) as impressions,
        COALESCE(s.total_runs, 0) as runs,
        COALESCE(s.total_passes, 0) as passes,
        COALESCE(s.completion_rate, 0) as pass_rate,
        COALESCE(s.avg_attempts, 0) as avg_attempts
      FROM capsules c
      LEFT JOIN capsule_stats s ON c.id = s.capsule_id
      WHERE c.creator_id = ? AND c.is_deleted = 0 AND c.is_published = 1
      ORDER BY COALESCE(s.impressions, 0) DESC
      LIMIT 10
    `).bind(auth.userId).all(),

    // Aggregated event metrics (last N days)
    c.env.DB.prepare(`
      SELECT
        COUNT(DISTINCT ce.learner_id) as unique_learners,
        COUNT(CASE WHEN ce.event_type IN ('code_run','run') THEN 1 END) as total_runs,
        COUNT(CASE WHEN ce.event_type IN ('test_passed','test_pass') THEN 1 END) as total_passes,
        COUNT(CASE WHEN ce.event_type IN ('test_failed','test_fail') THEN 1 END) as total_fails,
        COUNT(CASE WHEN ce.event_type = 'hint_viewed' THEN 1 END) as hint_views,
        COUNT(CASE WHEN ce.event_type = 'solution_viewed' THEN 1 END) as solution_views
      FROM capsule_events ce
      JOIN capsules c ON ce.capsule_id = c.id
      WHERE c.creator_id = ? AND ce.created_at > datetime('now', '-' || ? || ' days')
    `).bind(auth.userId, days).all(),

    // Top failing test metadata
    c.env.DB.prepare(`
      SELECT ce.metadata, ce.capsule_id, c.title as capsule_title, COUNT(*) as fail_count
      FROM capsule_events ce
      JOIN capsules c ON ce.capsule_id = c.id
      WHERE c.creator_id = ? AND ce.event_type IN ('test_failed','test_fail') AND ce.metadata IS NOT NULL
        AND ce.created_at > datetime('now', '-' || ? || ' days')
      GROUP BY ce.metadata, ce.capsule_id
      ORDER BY fail_count DESC
      LIMIT 20
    `).bind(auth.userId, days).all(),

    // Playlists as cohorts
    c.env.DB.prepare(`
      SELECT p.id, p.title,
        (SELECT COUNT(*) FROM course_capsules WHERE course_id = p.id) as capsule_count,
        (SELECT COUNT(DISTINCT ce.learner_id) FROM course_capsules pi
          JOIN capsule_events ce ON ce.capsule_id = pi.capsule_id
          WHERE pi.course_id = p.id AND ce.learner_id IS NOT NULL) as student_count,
        (SELECT ROUND(
          CAST(COUNT(DISTINCT CASE WHEN ce.event_type IN ('test_passed','test_pass') THEN ce.learner_id || ':' || ce.capsule_id END) AS REAL) /
          NULLIF(COUNT(DISTINCT CASE WHEN ce.event_type IN ('code_run','run') THEN ce.learner_id || ':' || ce.capsule_id END), 0) * 100, 1)
          FROM course_capsules pi
          JOIN capsule_events ce ON ce.capsule_id = pi.capsule_id
          WHERE pi.course_id = p.id AND ce.learner_id IS NOT NULL) as completion
      FROM courses p
      WHERE p.creator_id = ? AND p.is_deleted = 0
      ORDER BY p.updated_at DESC
      LIMIT 10
    `).bind(auth.userId).all(),
  ]);

  const metrics = (eventMetrics.results?.[0] || {}) as any;
  const runs = metrics.total_runs || 0;
  const passes = metrics.total_passes || 0;
  const hints = metrics.hint_views || 0;

  const runToPassRatio = passes > 0 ? Math.round((runs / passes) * 10) / 10 : runs;
  const hintUtilization = runs > 0 ? Math.round((hints / runs) * 1000) / 10 : 0;

  // Compute give-up rate: learners with runs but no passes
  // (We approximate: fails > 3 && passes == 0 for a capsule)
  const giveUpRate = runs > 0 ? Math.round(((runs - passes) / runs) * 1000) / 10 : 0;

  // Parse failing tests
  const failingTestMap = new Map<string, { testCase: string; failCount: number; capsule: string }>();
  for (const row of (failingTests.results || []) as any[]) {
    try {
      const meta = JSON.parse(row.metadata);
      const testCase = meta.testName || meta.test_name || meta.failing_test || 'Unknown';
      const key = `${testCase}::${row.capsule_id}`;
      const existing = failingTestMap.get(key);
      if (existing) {
        existing.failCount += row.fail_count;
      } else {
        failingTestMap.set(key, { testCase, failCount: row.fail_count, capsule: row.capsule_title });
      }
    } catch { /* skip */ }
  }

  const topFailingTests = Array.from(failingTestMap.values())
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, 5);

  // Capsule performance
  const capsulePerformance = ((capsulePerf.results || []) as any[]).map(cap => ({
    name: cap.title,
    impressions: cap.impressions,
    runs: cap.runs,
    passRate: Math.round(cap.pass_rate * 10) / 10,
    avgTime: 0,
  }));

  // Cohorts
  const cohortData = ((playlists.results || []) as any[]).map(p => ({
    cohort: p.title,
    students: p.student_count || 0,
    avgScore: p.completion || 0,
    completion: p.completion || 0,
  }));

  return c.json({
    success: true,
    data: {
      timeToFirstRun: { avg: 0, trend: '' },
      runToPassRatio: { avg: runToPassRatio, trend: '' },
      giveUpRate: { avg: giveUpRate > 100 ? 100 : giveUpRate, trend: '' },
      hintUtilization: { avg: hintUtilization, trend: '' },
      topFailingTests,
      capsulePerformance,
      cohortData,
      capsules: ((capsulePerf.results || []) as any[]).map(c => ({ name: c.title, id: c.id })),
      playlists: ((playlists.results || []) as any[]).map(p => ({ name: p.title, id: p.id })),
    },
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
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
