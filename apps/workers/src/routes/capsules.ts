/**
 * Capsule CRUD Routes
 * 
 * Handles capsule creation, reading, updating, and deletion.
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';

type Variables = {
  auth: Auth | null;
  requestId: string;
};

export const capsuleRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ══════════════════════════════════════════════════════════════════════════════
// GET /capsules — List published capsules
// ══════════════════════════════════════════════════════════════════════════════

capsuleRoutes.get('/', async (c) => {
  const { limit = '10', offset = '0', language, difficulty, type } = c.req.query();
  
  let query = `
    SELECT id, title, description, type, difficulty, language, 
           function_name, test_count, has_hints, tags, quality_score,
           created_at
    FROM capsules 
    WHERE is_published = 1 AND is_deleted = 0
  `;
  const params: string[] = [];

  if (language) {
    query += ' AND language = ?';
    params.push(language);
  }
  if (difficulty) {
    query += ' AND difficulty = ?';
    params.push(difficulty.toUpperCase());
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type.toUpperCase());
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const capsules = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: capsules.results,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: capsules.results?.length || 0,
      },
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /capsules/:id — Get single capsule
// ══════════════════════════════════════════════════════════════════════════════

capsuleRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const auth = c.get('auth');

  // Try cache first
  const cacheKey = `capsule:${id}`;
  const cached = await c.env.CACHE.get(cacheKey, 'json');
  
  if (cached) {
    // Track impression (fire and forget)
    trackEvent(c.env, id, auth?.userId, 'impression');
    return c.json({
      success: true,
      data: cached,
      source: 'cache',
      meta: {
        requestId: c.get('requestId'),
        timestamp: Date.now(),
        version: c.env.API_VERSION,
      },
    });
  }

  const capsule = await c.env.DB.prepare(`
    SELECT * FROM capsules 
    WHERE id = ? AND is_deleted = 0
  `).bind(id).first();

  if (!capsule) {
    throw new ApiError(404, 'Capsule not found');
  }

  // Check access (published or owner)
  if (!capsule.is_published && capsule.creator_id !== auth?.userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Cache if published (1 hour TTL)
  if (capsule.is_published) {
    await c.env.CACHE.put(cacheKey, JSON.stringify(capsule), {
      expirationTtl: 3600,
    });
  }

  // Track impression
  trackEvent(c.env, id, auth?.userId, 'impression');

  return c.json({
    success: true,
    data: capsule,
    source: 'database',
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /capsules — Create new capsule (auth required)
// ══════════════════════════════════════════════════════════════════════════════

capsuleRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  const body = await c.req.json();
  const { title, description, type, difficulty, language, content, tags } = body;

  if (!title || !language || !content) {
    throw new ApiError(400, 'title, language, and content are required');
  }

  const id = crypto.randomUUID().slice(0, 24);
  
  // Extract metadata from content
  const functionName = content?.primary?.code?.wasmVersion?.solution?.match(/def (\w+)/)?.[1] ||
                       content?.primary?.code?.wasmVersion?.solution?.match(/function (\w+)/)?.[1];
  const testCount = content?.testCases?.length || 0;
  const hasHints = content?.pedagogy?.hints?.length > 0 ? 1 : 0;

  await c.env.DB.prepare(`
    INSERT INTO capsules (id, creator_id, title, description, type, difficulty, language, 
                          function_name, test_count, has_hints, content, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    auth.userId,
    title,
    description || null,
    type || 'CODE',
    difficulty || 'MEDIUM',
    language,
    functionName || null,
    testCount,
    hasHints,
    JSON.stringify(content),
    tags ? JSON.stringify(tags) : null
  ).run();

  return c.json({
    success: true,
    data: { id, title },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  }, 201);
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /capsules/:id — Update capsule (owner only)
// ══════════════════════════════════════════════════════════════════════════════

capsuleRoutes.put('/:id', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  const { id } = c.req.param();
  const body = await c.req.json();

  // Verify ownership
  const existing = await c.env.DB.prepare(
    'SELECT creator_id FROM capsules WHERE id = ? AND is_deleted = 0'
  ).bind(id).first<{ creator_id: string }>();

  if (!existing) {
    throw new ApiError(404, 'Capsule not found');
  }
  if (existing.creator_id !== auth.userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];

  if (body.title) { updates.push('title = ?'); values.push(body.title); }
  if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
  if (body.content) { updates.push('content = ?'); values.push(JSON.stringify(body.content)); }
  if (body.tags) { updates.push('tags = ?'); values.push(JSON.stringify(body.tags)); }
  if (body.isPublished !== undefined) { 
    updates.push('is_published = ?'); 
    values.push(body.isPublished ? 1 : 0);
    if (body.isPublished) {
      updates.push('published_at = datetime("now")');
    }
  }

  if (updates.length === 0) {
    throw new ApiError(400, 'No fields to update');
  }

  values.push(id);
  await c.env.DB.prepare(`
    UPDATE capsules SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();

  // Invalidate cache
  await c.env.CACHE.delete(`capsule:${id}`);

  return c.json({
    success: true,
    data: { id },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /capsules/:id — Soft delete capsule (owner only)
// ══════════════════════════════════════════════════════════════════════════════

capsuleRoutes.delete('/:id', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  const { id } = c.req.param();

  // Verify ownership
  const existing = await c.env.DB.prepare(
    'SELECT creator_id FROM capsules WHERE id = ? AND is_deleted = 0'
  ).bind(id).first<{ creator_id: string }>();

  if (!existing) {
    throw new ApiError(404, 'Capsule not found');
  }
  if (existing.creator_id !== auth.userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Soft delete
  await c.env.DB.prepare(
    'UPDATE capsules SET is_deleted = 1 WHERE id = ?'
  ).bind(id).run();

  // Invalidate cache
  await c.env.CACHE.delete(`capsule:${id}`);

  return c.json({
    success: true,
    message: 'Capsule deleted',
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper: Track analytics event
// ══════════════════════════════════════════════════════════════════════════════

function trackEvent(
  env: Env, 
  capsuleId: string, 
  userId: string | null | undefined, 
  eventType: string,
  metadata?: Record<string, unknown>
): void {
  // Fire and forget
  env.DB.prepare(`
    INSERT INTO capsule_events (capsule_id, user_id, event_type, metadata)
    VALUES (?, ?, ?, ?)
  `).bind(
    capsuleId,
    userId || null,
    eventType,
    metadata ? JSON.stringify(metadata) : null
  ).run().catch(() => {});
}
