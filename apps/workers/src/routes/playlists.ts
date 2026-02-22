/**
 * Playlist / Course Routes
 *
 * CRUD for courses (DB table: courses + course_capsules + user_progress).
 * The UI components call these as "playlists" so the route path is /playlists.
 *
 * Endpoints:
 *   GET    /playlists                -> list creator's courses
 *   GET    /playlists/:id            -> single course with capsule details
 *   GET    /playlists/:id/embed      -> public course data for embed widget
 *   POST   /playlists                -> create course
 *   PUT    /playlists/:id            -> update course + reorder items (batched txn)
 *   DELETE /playlists/:id            -> soft-delete course
 *   POST   /playlists/:id/duplicate  -> clone a course
 *   POST   /playlists/:id/publish    -> toggle publish status
 *   GET    /playlists/:id/analytics  -> engagement analytics
 *   GET    /playlists/:id/progress   -> learner progress
 *   POST   /playlists/:id/progress   -> update learner progress
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';

type Variables = {
  auth: Auth | null;
  requestId: string;
};

export const playlistRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Helpers ──

/** Standard meta object for responses */
function meta(c: any) {
  return {
    requestId: c.get('requestId'),
    timestamp: Date.now(),
    version: c.env.API_VERSION,
  };
}

/** Parse JSON string field safely */
function safeJsonParse(raw: unknown, fallback: any = null) {
  if (typeof raw !== 'string') return raw ?? fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

/** Normalize a course row from D1 into the shape the UI expects */
function normaliseCourse(row: Record<string, any>) {
  return {
    // Map DB column names → UI field names
    playlist_id: row.id,
    id: row.id,
    creator_id: row.creator_id,
    title: row.title,
    description: row.description || '',
    is_public: !!row.is_published,
    status: row.status || (row.is_published ? 'published' : 'draft'),
    cover_image: row.cover_image || null,
    tags: safeJsonParse(row.tags, []),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /playlists — List creator's courses
// Also matches /organizations/:orgId/playlists from the UI
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { search, status, limit = '50', offset = '0' } = c.req.query();

  let query = `
    SELECT c.*, COUNT(cc.capsule_id) as total_items
    FROM courses c
    LEFT JOIN course_capsules cc ON c.id = cc.course_id
    WHERE c.creator_id = ? AND c.is_deleted = 0
  `;
  const params: any[] = [auth.userId];

  if (search) {
    query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status && status !== 'all') {
    query += ` AND c.status = ?`;
    params.push(status);
  }

  query += ` GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await c.env.DB.prepare(query).bind(...params).all();
  const courses = (result.results || []).map((row: any) => ({
    ...normaliseCourse(row),
    total_items: row.total_items || 0,
    items: [], // list view doesn't need full items
  }));

  return c.json({ success: true, data: courses, meta: meta(c) });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /playlists/:id — Full course with capsule details
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.get('/:id', async (c) => {
  const auth = c.get('auth');
  const { id } = c.req.param();

  const course = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ? AND is_deleted = 0
  `).bind(id).first();

  if (!course) throw new ApiError(404, 'Course not found');

  // Access check: published courses are public, drafts need owner
  if (!course.is_published && course.creator_id !== auth?.userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Fetch ordered items with full capsule data
  const items = await c.env.DB.prepare(`
    SELECT cc.position, cc.is_gate, cc.is_optional,
           cap.id as capsule_id, cap.title, cap.description, cap.type,
           cap.difficulty, cap.language, cap.function_name, cap.test_count,
           cap.has_hints, cap.content, cap.tags, cap.is_published as capsule_published
    FROM course_capsules cc
    JOIN capsules cap ON cc.capsule_id = cap.id
    WHERE cc.course_id = ?
    ORDER BY cc.position ASC
  `).bind(id).all();

  const normalizedItems = (items.results || []).map((row: any) => ({
    item_id: `${id}_${row.capsule_id}`,
    playlist_id: id,
    capsule_id: row.capsule_id,
    order: row.position,
    is_gate: !!row.is_gate,
    is_optional: !!row.is_optional,
    created_at: course.created_at,
    capsule: {
      id: row.capsule_id,
      title: row.title,
      description: row.description,
      type: row.type,
      difficulty: row.difficulty,
      language: row.language,
      function_name: row.function_name,
      test_count: row.test_count,
      has_hints: !!row.has_hints,
      content: safeJsonParse(row.content, {}),
      tags: safeJsonParse(row.tags, []),
      is_published: !!row.capsule_published,
    },
  }));

  const data = {
    ...normaliseCourse(course as any),
    items: normalizedItems,
    total_items: normalizedItems.length,
  };

  return c.json({ success: true, data, meta: meta(c) });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /playlists/:id/embed — Public course data for embed widget
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.get('/:id/embed', async (c) => {
  const { id } = c.req.param();

  const course = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ? AND is_published = 1 AND is_deleted = 0
  `).bind(id).first();

  if (!course) throw new ApiError(404, 'Course not found or not published');

  const items = await c.env.DB.prepare(`
    SELECT cc.position, cc.is_gate, cc.is_optional,
           cap.id as capsule_id, cap.title, cap.description, cap.type,
           cap.difficulty, cap.language, cap.test_count
    FROM course_capsules cc
    JOIN capsules cap ON cc.capsule_id = cap.id
    WHERE cc.course_id = ?
    ORDER BY cc.position ASC
  `).bind(id).all();

  const data = {
    ...normaliseCourse(course as any),
    items: (items.results || []).map((row: any) => ({
      item_id: `${id}_${row.capsule_id}`,
      playlist_id: id,
      capsule_id: row.capsule_id,
      order: row.position,
      is_gate: !!row.is_gate,
      is_optional: !!row.is_optional,
      capsule: {
        id: row.capsule_id,
        title: row.title,
        description: row.description,
        type: row.type,
        difficulty: row.difficulty,
        language: row.language,
        test_count: row.test_count,
      },
    })),
    total_items: items.results?.length || 0,
  };

  return c.json({ success: true, data, meta: meta(c) });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /playlists — Create a course
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const body = await c.req.json();
  const { title, description, is_public, items } = body;

  if (!title) throw new ApiError(400, 'title is required');

  // Generate ID
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24);

  // Use DB.batch() for transactional safety
  const statements: D1PreparedStatement[] = [];

  statements.push(
    c.env.DB.prepare(`
      INSERT INTO courses (id, creator_id, title, description, is_published, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(id, auth.userId, title, description || '', is_public ? 1 : 0, is_public ? 'published' : 'draft')
  );

  // Insert items if provided
  if (Array.isArray(items) && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const position = item.order ?? item.position ?? (i + 1);
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO course_capsules (course_id, capsule_id, position, is_gate, is_optional)
          VALUES (?, ?, ?, ?, ?)
        `).bind(id, item.capsule_id, position, item.is_gate ? 1 : 0, item.is_optional ? 1 : 0)
      );
    }
  }

  await c.env.DB.batch(statements);

  // Return the created course
  const created = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ?
  `).bind(id).first();

  return c.json({
    success: true,
    data: { ...normaliseCourse(created as any), items: items || [], total_items: items?.length || 0 },
    meta: meta(c),
  }, 201);
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /playlists/:id — Update course + reorder items (batched transaction)
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.put('/:id', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { id } = c.req.param();

  // Verify ownership
  const course = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ? AND creator_id = ? AND is_deleted = 0
  `).bind(id, auth.userId).first();

  if (!course) throw new ApiError(404, 'Course not found');

  const body = await c.req.json();
  const { title, description, is_public, items } = body;

  // Build batched transaction (guardrail: delete + insert in single batch)
  const statements: D1PreparedStatement[] = [];

  // Update course metadata
  statements.push(
    c.env.DB.prepare(`
      UPDATE courses
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          is_published = CASE WHEN ? IS NOT NULL THEN ? ELSE is_published END,
          status = CASE WHEN ? = 1 THEN 'published' WHEN ? = 0 THEN 'draft' ELSE status END,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      title ?? null,
      description ?? null,
      is_public !== undefined ? 1 : null,
      is_public ? 1 : 0,
      is_public ? 1 : 0,
      is_public ? 0 : 0,
      id
    )
  );

  // If items are provided, delete-all then re-insert (transactional via batch)
  if (Array.isArray(items)) {
    statements.push(
      c.env.DB.prepare(`DELETE FROM course_capsules WHERE course_id = ?`).bind(id)
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const position = item.order ?? item.position ?? (i + 1);
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO course_capsules (course_id, capsule_id, position, is_gate, is_optional)
          VALUES (?, ?, ?, ?, ?)
        `).bind(id, item.capsule_id, position, item.is_gate ? 1 : 0, item.is_optional ? 1 : 0)
      );
    }
  }

  await c.env.DB.batch(statements);

  // Return updated course with items
  const updated = await c.env.DB.prepare(`SELECT * FROM courses WHERE id = ?`).bind(id).first();
  const updatedItems = await c.env.DB.prepare(`
    SELECT cc.*, cap.title as capsule_title, cap.type, cap.difficulty, cap.language
    FROM course_capsules cc
    JOIN capsules cap ON cc.capsule_id = cap.id
    WHERE cc.course_id = ?
    ORDER BY cc.position
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...normaliseCourse(updated as any),
      items: (updatedItems.results || []).map((r: any) => ({
        item_id: `${id}_${r.capsule_id}`,
        playlist_id: id,
        capsule_id: r.capsule_id,
        order: r.position,
        is_gate: !!r.is_gate,
        is_optional: !!r.is_optional,
        capsule: { id: r.capsule_id, title: r.capsule_title, type: r.type, difficulty: r.difficulty, language: r.language },
      })),
      total_items: updatedItems.results?.length || 0,
    },
    meta: meta(c),
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /playlists/:id — Soft-delete course
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.delete('/:id', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { id } = c.req.param();

  const result = await c.env.DB.prepare(`
    UPDATE courses SET is_deleted = 1, updated_at = datetime('now')
    WHERE id = ? AND creator_id = ?
  `).bind(id, auth.userId).run();

  if (!result.meta.changes) throw new ApiError(404, 'Course not found');

  return c.json({ success: true, meta: meta(c) });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /playlists/:id/duplicate — Clone a course
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.post('/:id/duplicate', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { id } = c.req.param();

  const course = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ? AND creator_id = ? AND is_deleted = 0
  `).bind(id, auth.userId).first();

  if (!course) throw new ApiError(404, 'Course not found');

  const newId = crypto.randomUUID().replace(/-/g, '').slice(0, 24);

  // Fetch items to clone
  const items = await c.env.DB.prepare(`
    SELECT capsule_id, position, is_gate, is_optional FROM course_capsules WHERE course_id = ? ORDER BY position
  `).bind(id).all();

  const statements: D1PreparedStatement[] = [];

  statements.push(
    c.env.DB.prepare(`
      INSERT INTO courses (id, creator_id, title, description, cover_image, is_published, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 'draft', datetime('now'), datetime('now'))
    `).bind(newId, auth.userId, `${course.title} (Copy)`, course.description || '', course.cover_image || null)
  );

  for (const item of (items.results || []) as any[]) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO course_capsules (course_id, capsule_id, position, is_gate, is_optional)
        VALUES (?, ?, ?, ?, ?)
      `).bind(newId, item.capsule_id, item.position, item.is_gate, item.is_optional)
    );
  }

  await c.env.DB.batch(statements);

  return c.json({
    success: true,
    data: { id: newId, playlist_id: newId, title: `${course.title} (Copy)` },
    meta: meta(c),
  }, 201);
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /playlists/:id/publish — Toggle publish status
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.post('/:id/publish', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const published = body.published !== undefined ? body.published : true;

  const result = await c.env.DB.prepare(`
    UPDATE courses
    SET is_published = ?, status = ?, updated_at = datetime('now')
    WHERE id = ? AND creator_id = ?
  `).bind(published ? 1 : 0, published ? 'published' : 'draft', id, auth.userId).run();

  if (!result.meta.changes) throw new ApiError(404, 'Course not found');

  return c.json({ success: true, data: { published }, meta: meta(c) });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /playlists/:id/analytics — Engagement analytics
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.get('/:id/analytics', async (c) => {
  const auth = c.get('auth');
  if (!auth) throw new ApiError(401, 'Authentication required');

  const { id } = c.req.param();

  // Verify ownership
  const course = await c.env.DB.prepare(`
    SELECT id FROM courses WHERE id = ? AND creator_id = ? AND is_deleted = 0
  `).bind(id, auth.userId).first();

  if (!course) throw new ApiError(404, 'Course not found');

  // Total items
  const itemCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM course_capsules WHERE course_id = ?
  `).bind(id).first();

  // Unique learners + completion stats from user_progress
  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(DISTINCT user_id) as unique_learners,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completions,
      COUNT(*) as total_progress_rows
    FROM user_progress
    WHERE course_id = ?
  `).bind(id).first();

  // Per-step completion rates
  const stepStats = await c.env.DB.prepare(`
    SELECT
      cc.position as step,
      cap.title as capsule_title,
      COUNT(DISTINCT up.user_id) as learners_reached,
      COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.user_id END) as learners_completed
    FROM course_capsules cc
    JOIN capsules cap ON cc.capsule_id = cap.id
    LEFT JOIN user_progress up ON up.capsule_id = cc.capsule_id AND up.course_id = ?
    WHERE cc.course_id = ?
    GROUP BY cc.position, cc.capsule_id
    ORDER BY cc.position
  `).bind(id, id).all();

  const totalItems = (itemCount as any)?.cnt || 0;
  const uniqueLearners = (stats as any)?.unique_learners || 0;
  const completions = (stats as any)?.completions || 0;

  const data = {
    playlist_id: id,
    total_views: uniqueLearners,
    unique_learners: uniqueLearners,
    total_completions: completions,
    average_completion_rate: totalItems > 0 && uniqueLearners > 0
      ? Math.round((completions / (uniqueLearners * totalItems)) * 100) / 100
      : 0,
    total_items: totalItems,
    step_completion_rates: (stepStats.results || []).map((row: any) => ({
      step: row.step,
      title: row.capsule_title,
      learners_reached: row.learners_reached,
      learners_completed: row.learners_completed,
      completion_rate: row.learners_reached > 0
        ? Math.round((row.learners_completed / row.learners_reached) * 100) / 100
        : 0,
    })),
    created_at: new Date().toISOString(),
  };

  return c.json({ success: true, data, meta: meta(c) });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /playlists/:id/progress — Get learner progress
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.get('/:id/progress', async (c) => {
  const { id } = c.req.param();
  const auth = c.get('auth');
  const { session_id } = c.req.query();

  if (!auth && !session_id) {
    throw new ApiError(400, 'session_id query param is required for anonymous progress');
  }

  let progress;
  if (auth) {
    progress = await c.env.DB.prepare(`
      SELECT up.*, cc.position
      FROM user_progress up
      JOIN course_capsules cc ON cc.capsule_id = up.capsule_id AND cc.course_id = up.course_id
      WHERE up.course_id = ? AND up.user_id = ?
      ORDER BY cc.position
    `).bind(id, auth.userId).all();
  } else {
    // Anonymous — we don't have session-based progress in user_progress yet
    // Return empty progress for anonymous users
    progress = { results: [] };
  }

  const rows = progress.results || [];
  const completedSteps = rows
    .filter((r: any) => r.status === 'completed')
    .map((r: any) => r.position);
  const currentStep = rows.length > 0
    ? Math.max(...rows.map((r: any) => r.position))
    : 1;

  // Get total items for completion rate
  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM course_capsules WHERE course_id = ?
  `).bind(id).first();
  const totalItems = (total as any)?.cnt || 0;

  const data: any = {
    progress_id: `${id}_${auth?.userId || session_id}`,
    playlist_id: id,
    learner_id: auth?.userId || null,
    session_id: session_id || auth?.userId || '',
    current_step: currentStep,
    completed_steps: completedSteps,
    started_at: rows.length > 0 ? (rows[0] as any).created_at : null,
    last_activity: rows.length > 0 ? (rows[rows.length - 1] as any).updated_at : null,
    completion_rate: totalItems > 0 ? completedSteps.length / totalItems : 0,
    details: rows.map((r: any) => ({
      capsule_id: r.capsule_id,
      position: r.position,
      status: r.status,
      attempts: r.attempts,
      best_time: r.best_time,
      hints_used: r.hints_used,
      completed_at: r.completed_at,
    })),
  };

  return c.json({ success: true, data, meta: meta(c) });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /playlists/:id/progress — Update learner progress
// Called when a learner completes a capsule step within a course
// ══════════════════════════════════════════════════════════════════════════════

playlistRoutes.post('/:id/progress', async (c) => {
  const { id } = c.req.param();
  const auth = c.get('auth');
  const body = await c.req.json();

  const { capsule_id, status, session_id, attempts, best_time, hints_used, last_code } = body;

  if (!capsule_id) throw new ApiError(400, 'capsule_id is required');

  const userId = auth?.userId;
  if (!userId && !session_id) {
    throw new ApiError(400, 'Authentication or session_id is required');
  }

  if (userId) {
    // Upsert progress for authenticated user
    await c.env.DB.prepare(`
      INSERT INTO user_progress (id, user_id, capsule_id, course_id, status, attempts, best_time, hints_used, last_code, completed_at, updated_at)
      VALUES (
        lower(hex(randomblob(12))),
        ?, ?, ?,
        COALESCE(?, 'in_progress'),
        COALESCE(?, 1),
        ?,
        COALESCE(?, 0),
        ?,
        CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END,
        datetime('now')
      )
      ON CONFLICT(user_id, capsule_id) DO UPDATE SET
        status = COALESCE(excluded.status, user_progress.status),
        attempts = user_progress.attempts + 1,
        best_time = CASE
          WHEN excluded.best_time IS NOT NULL AND (user_progress.best_time IS NULL OR excluded.best_time < user_progress.best_time)
          THEN excluded.best_time
          ELSE user_progress.best_time
        END,
        hints_used = CASE WHEN excluded.hints_used > user_progress.hints_used THEN excluded.hints_used ELSE user_progress.hints_used END,
        last_code = COALESCE(excluded.last_code, user_progress.last_code),
        completed_at = CASE WHEN excluded.status = 'completed' AND user_progress.completed_at IS NULL THEN datetime('now') ELSE user_progress.completed_at END,
        course_id = COALESCE(excluded.course_id, user_progress.course_id),
        updated_at = datetime('now')
    `).bind(
      userId, capsule_id, id,
      status || 'in_progress',
      attempts || 1,
      best_time || null,
      hints_used || 0,
      last_code || null,
      status || 'in_progress'
    ).run();
  }

  // For both auth'd and anonymous: return current overall progress
  const allProgress = userId
    ? await c.env.DB.prepare(`
        SELECT up.status, cc.position
        FROM user_progress up
        JOIN course_capsules cc ON cc.capsule_id = up.capsule_id AND cc.course_id = up.course_id
        WHERE up.course_id = ? AND up.user_id = ?
      `).bind(id, userId).all()
    : { results: [] };

  const completedSteps = (allProgress.results || [])
    .filter((r: any) => r.status === 'completed')
    .map((r: any) => r.position);

  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM course_capsules WHERE course_id = ?
  `).bind(id).first();

  return c.json({
    success: true,
    data: {
      playlist_id: id,
      capsule_id,
      status: status || 'in_progress',
      completed_steps: completedSteps,
      completion_rate: (total as any)?.cnt > 0
        ? completedSteps.length / (total as any).cnt
        : 0,
    },
    meta: meta(c),
  });
});
