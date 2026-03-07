/**
 * Capsule CRUD Routes
 * 
 * Handles capsule creation, reading, updating, and deletion.
 * Includes self-healing validation: when saving, validates the capsule
 * and auto-heals via DebuggerAgent if tests fail (max 2 attempts).
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';
import { checkCapsuleLimit } from '../middleware/tier-gate';
import { TunnelClient } from '../utils/tunnel-client';

type Variables = {
  auth: Auth | null;
  requestId: string;
};

// ══════════════════════════════════════════════════════════════════════════════
// Self-Healing Helpers
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Validate capsule content by running solution against test cases via Piston
 */
async function validateCapsuleContent(
  env: Env,
  content: any,
  language: string
): Promise<{ valid: boolean; error?: { type: string; message: string; test_case_id?: number } }> {
  const solutionCode =
    content?.primary?.code?.wasmVersion?.solution ||
    content?.solutionCode ||
    content?.config_data?.reference_solution;
  const testCases = content?.primary?.code?.wasmVersion?.testCases || content?.primary?.database?.testCases || content?.testCases || content?.config_data?.test_cases || [];

  if (!solutionCode || testCases.length === 0) {
    // No tests to run = consider valid (can't validate)
    return { valid: true };
  }

  const pistonUrl = env.PISTON_URL;
  if (!pistonUrl) {
    console.warn('PISTON_URL not configured, skipping validation');
    return { valid: true };
  }

  // Build batched test harness
  const functionName =
    content?.functionName ||
    solutionCode.match(/def (\w+)/)?.[1] ||
    solutionCode.match(/function (\w+)/)?.[1] ||
    'solution';

  const harness = buildBatchedTestHarness(solutionCode, testCases, language, functionName);

  const langMap: Record<string, { runtime: string; fileName: string }> = {
    python: { runtime: 'python', fileName: 'main.py' },
    javascript: { runtime: 'javascript', fileName: 'main.js' },
    java: { runtime: 'java', fileName: 'Main.java' },
    cpp: { runtime: 'c++', fileName: 'main.cpp' },
    c: { runtime: 'c', fileName: 'main.c' },
  };

  const mapping = langMap[language.toLowerCase()];
  if (!mapping) {
    return { valid: true }; // Can't validate this language
  }

  // Data analysis capsules (pandas/numpy) need more memory
  const isDataAnalysis = solutionCode.includes('import pandas') || solutionCode.includes('read_csv');
  const memoryLimit = isDataAnalysis ? 256 * 1024 * 1024 : 128 * 1024 * 1024;

  try {
    const resp = await fetch(`${pistonUrl}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: mapping.runtime,
        version: '*',
        files: [{ name: mapping.fileName, content: harness }],
        run_timeout: 10000,
        run_memory_limit: memoryLimit,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return { valid: false, error: { type: 'runtime', message: `Piston error: ${errText.slice(0, 200)}` } };
    }

    const result = (await resp.json()) as any;
    const stdout = result.run?.stdout || '';
    const stderr = result.run?.stderr || '';

    // Detect sandbox crash (OOM / signal kill)
    if (stderr.includes('fatal signal') || stderr.includes('signal 6') || stderr.includes('Killed')) {
      return {
        valid: false,
        error: {
          type: 'runtime',
          message: 'Sandbox out of memory — test data may be too large. Try reducing expected output size.',
        },
      };
    }

    // Parse test results from stdout
    const passMatch = stdout.match(/PASSED:\s*(\d+)/);
    const failMatch = stdout.match(/FAILED:\s*(\d+)/);
    const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : testCases.length - passed;

    if (failed > 0 || result.run?.code !== 0) {
      const firstFailMatch = stdout.match(/FAIL test_(\d+)/) || stderr.match(/Error|Exception/i);
      return {
        valid: false,
        error: {
          type: stderr ? 'runtime' : 'test_mismatch',
          message: stderr || `${failed}/${testCases.length} tests failed`,
          test_case_id: firstFailMatch ? parseInt(firstFailMatch[1], 10) : undefined,
        },
      };
    }

    return { valid: true };
  } catch (e) {
    console.warn('Validation fetch error:', e);
    return { valid: true }; // Network error - allow save
  }
}

/**
 * Call bridge-api /internal/heal to auto-fix capsule
 */
async function healCapsule(
  env: Env,
  capsule: any,
  error: { type: string; message: string; test_case_id?: number }
): Promise<{ healed: boolean; capsule?: any; error?: string }> {
  if (!env.TUNNEL_URL || !env.WORKER_SHARED_SECRET) {
    console.warn('TUNNEL_URL or WORKER_SHARED_SECRET not set, skipping heal');
    return { healed: false, error: 'Bridge not configured' };
  }

  const client = new TunnelClient({
    baseUrl: env.TUNNEL_URL,
    sharedSecret: env.WORKER_SHARED_SECRET,
    callerName: 'capsules-route',
  });

  const result = await client.call<{ success: boolean; healedCapsule?: any; error?: string }>(
    '/internal/heal',
    { capsule, error },
    { timeoutMs: 45_000 }
  );

  if (result.success && result.data?.success && result.data?.healedCapsule) {
    return { healed: true, capsule: result.data.healedCapsule };
  }

  return { healed: false, error: result.data?.error || result.error || 'Healing failed' };
}

/**
 * UTF-8 safe base64 encoding for embedding test data in harness.
 */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Build batched test harness for validation.
 * Uses base64-encoded test data (not inline literals) to handle large outputs
 * from data analysis capsules safely.
 */
function buildBatchedTestHarness(
  solution: string,
  testCases: any[],
  language: string,
  functionName: string
): string {
  const lang = language.toLowerCase();

  // Normalize test cases into a consistent shape
  const normalized = testCases.map((tc, i) => {
    let inputArgs = tc.input_args;
    
    // If input_args is missing, try to parse tc.input as JSON array
    if (inputArgs === undefined && tc.input !== undefined) {
      try {
        const parsed = JSON.parse(typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input));
        if (Array.isArray(parsed)) {
          inputArgs = parsed;
        } else {
          inputArgs = [parsed];
        }
      } catch {
        inputArgs = [tc.input];
      }
    }
    
    // Parse expected_output from string if needed
    let expectedOutput = tc.expected_output ?? tc.expectedOutput ?? tc.expected;
    if (typeof expectedOutput === 'string') {
      try {
        expectedOutput = JSON.parse(expectedOutput);
      } catch {
        // Keep as string
      }
    }
    
    return {
      id: i,
      input_args: inputArgs ?? [],
      expected_output: expectedOutput,
      description: tc.description || tc.name || `Test ${i}`,
    };
  });

  const testDataB64 = utf8ToBase64(JSON.stringify(normalized));

  if (lang === 'python') {
    return `
import random
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

${solution}

import json, base64

def _normalize(obj):
    try:
        import pandas as _pd
        import numpy as _np
        if isinstance(obj, _pd.DataFrame):
            obj = obj.values.tolist()
        elif isinstance(obj, _pd.Series):
            obj = obj.tolist()
        elif isinstance(obj, (_np.integer,)):
            obj = int(obj)
        elif isinstance(obj, (_np.floating,)):
            obj = float(obj)
        elif isinstance(obj, _np.ndarray):
            obj = obj.tolist()
    except ImportError:
        pass
    if obj is None:
        return None
    if isinstance(obj, tuple):
        return [_normalize(x) for x in obj]
    if isinstance(obj, set):
        return sorted([_normalize(x) for x in obj], key=lambda x: json.dumps(x, default=str))
    if isinstance(obj, dict):
        return {k: _normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_normalize(x) for x in obj]
    if isinstance(obj, float):
        return round(obj, 6)
    return obj

_tests = json.loads(base64.b64decode("${testDataB64}").decode('utf-8'))
passed = 0
failed = 0

for _t in _tests:
    try:
        result = ${functionName}(*_t["input_args"])
        if _normalize(result) == _normalize(_t["expected_output"]):
            print(f"PASS test_{_t['id']}")
            passed += 1
        else:
            print(f"FAIL test_{_t['id']}: mismatch")
            failed += 1
    except Exception as e:
        print(f"FAIL test_{_t['id']}: {e}")
        failed += 1

print(f"PASSED: {passed}")
print(f"FAILED: {failed}")
`;
  }

  if (lang === 'javascript') {
    return `
${solution}

function _normalize(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'number') return Math.round(obj * 1e6) / 1e6;
    if (Array.isArray(obj)) return obj.map(_normalize);
    if (typeof obj === 'object') {
        const out = {};
        for (const k of Object.keys(obj).sort()) out[k] = _normalize(obj[k]);
        return out;
    }
    return obj;
}

const _tests = JSON.parse(atob("${testDataB64}"));
let passed = 0;
let failed = 0;

for (const _t of _tests) {
    try {
        const result = ${functionName}(..._t.input_args);
        if (JSON.stringify(_normalize(result)) === JSON.stringify(_normalize(_t.expected_output))) {
            console.log("PASS test_" + _t.id);
            passed++;
        } else {
            console.log("FAIL test_" + _t.id + ": mismatch");
            failed++;
        }
    } catch (e) {
        console.log("FAIL test_" + _t.id + ": " + e.message);
        failed++;
    }
}

console.log("PASSED: " + passed);
console.log("FAILED: " + failed);
`;
  }

  // Fallback - just run solution (no test harness)
  return solution;
}

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
      capsule: cached,
      data: cached,
      source: 'cache',
      meta: {
        requestId: c.get('requestId'),
        timestamp: Date.now(),
        version: c.env.API_VERSION,
      },
    });
  }

  const row = await c.env.DB.prepare(`
    SELECT c.*, u.plan as creator_plan FROM capsules c
    LEFT JOIN users u ON c.creator_id = u.id
    WHERE c.id = ? AND c.is_deleted = 0
  `).bind(id).first();

  if (!row) {
    throw new ApiError(404, 'Capsule not found');
  }

  // Check access (published or owner)
  if (!row.is_published && row.creator_id !== auth?.userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Parse JSON string fields from D1
  const capsule: Record<string, any> = { ...row };
  for (const key of ['content', 'config_data', 'tags', 'pedagogy']) {
    if (typeof capsule[key] === 'string') {
      try { capsule[key] = JSON.parse(capsule[key]); } catch {}
    }
  }
  // Ensure tags is always an array
  if (!Array.isArray(capsule.tags)) {
    capsule.tags = capsule.tags ? [String(capsule.tags)] : [];
  }

  // Normalize field names for embed compatibility
  capsule.isPublished = !!capsule.is_published;
  capsule.createdAt = capsule.created_at;
  capsule.updatedAt = capsule.updated_at;

  // Cache if published (1 hour TTL)
  if (row.is_published) {
    await c.env.CACHE.put(cacheKey, JSON.stringify(capsule), {
      expirationTtl: 3600,
    });
  }

  // Track impression
  trackEvent(c.env, id, auth?.userId, 'impression');

  return c.json({
    success: true,
    capsule,
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
// POST /capsules — Create new capsule (auth required, with self-healing)
// ══════════════════════════════════════════════════════════════════════════════

capsuleRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  // ── Tier Enforcement: Capsule creation limit ──
  const capsuleCheck = await checkCapsuleLimit(c.env.DB, auth.userId, auth.plan);
  if (!capsuleCheck.allowed) {
    throw new ApiError(
      403,
      `Capsule limit reached (${capsuleCheck.current}/${capsuleCheck.limit} on ${auth.plan} plan). Upgrade for more.`,
      'CAPSULE_LIMIT_EXCEEDED'
    );
  }

  const body = await c.req.json();
  let { title, description, type, difficulty, language, content, tags } = body;

  if (!title || !language || !content) {
    throw new ApiError(400, 'title, language, and content are required');
  }

  // Normalize difficulty to uppercase to match database constraint
  const normalizedDifficulty = (difficulty || 'MEDIUM').toUpperCase();
  if (!['EASY', 'MEDIUM', 'HARD'].includes(normalizedDifficulty)) {
    throw new ApiError(400, 'Invalid difficulty. Must be EASY, MEDIUM, or HARD');
  }

  // ── Self-Healing Validation Loop ──
  // Validate the capsule's solution against test cases.
  // If validation fails, auto-heal via DebuggerAgent and retry (max 2x).
  const MAX_HEAL_ATTEMPTS = 2;
  let healingAttempts = 0;
  let lastError: { type: string; message: string; test_case_id?: number } | undefined;

  for (let attempt = 0; attempt <= MAX_HEAL_ATTEMPTS; attempt++) {
    const validation = await validateCapsuleContent(c.env, content, language);

    if (validation.valid) {
      // Tests pass - proceed to save
      break;
    }

    // Validation failed
    lastError = validation.error;
    console.log(`🧪 Validation failed (attempt ${attempt + 1}): ${lastError?.message}`);

    if (attempt < MAX_HEAL_ATTEMPTS) {
      // Try to heal the capsule
      console.log(`🩹 Attempting heal (${attempt + 1}/${MAX_HEAL_ATTEMPTS})...`);
      
      // Build a capsule-like object for DebuggerAgent
      const capsuleForHealing = {
        id: `temp-${Date.now()}`,
        title,
        description,
        type: type || 'CODE',
        difficulty: normalizedDifficulty.toLowerCase(),
        language,
        content,
        tags,
      };

      const healResult = await healCapsule(c.env, capsuleForHealing, lastError!);

      if (healResult.healed && healResult.capsule) {
        // Replace content with healed version
        content = healResult.capsule.content || healResult.capsule;
        healingAttempts++;
        console.log(`✅ Heal succeeded, retrying validation...`);
      } else {
        console.warn(`❌ Heal failed: ${healResult.error}`);
        // Continue loop - will try to save anyway after max attempts
      }
    }
  }

  // If still failing after max attempts, save anyway but log warning
  if (lastError && healingAttempts === MAX_HEAL_ATTEMPTS) {
    console.warn(`⚠️ Saving capsule with validation issues after ${MAX_HEAL_ATTEMPTS} heal attempts: ${lastError.message}`);
  }

  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  
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
    normalizedDifficulty,
    language,
    functionName || null,
    testCount,
    hasHints,
    JSON.stringify(content),
    tags ? JSON.stringify(tags) : null
  ).run();

  // Sync to R2/CDN for fast embed loading
  try {
    const cdnPayload = {
      id,
      title,
      description: description || null,
      type: type || 'CODE',
      difficulty: normalizedDifficulty,
      language,
      content,
      created_at: new Date().toISOString(),
    };
    await c.env.CDN.put(
      `capsules/${id}.json`,
      JSON.stringify(cdnPayload),
      { httpMetadata: { contentType: 'application/json' } }
    );
    console.log(`✅ Synced capsule to CDN: capsules/${id}.json`);
  } catch (r2Error) {
    console.error('⚠️ R2 sync failed (non-blocking):', r2Error);
  }

  return c.json({
    success: true,
    data: { 
      id, 
      title,
      healed: healingAttempts > 0,
      healingAttempts,
    },
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
  if (body.difficulty) { 
    const normalizedDifficulty = body.difficulty.toUpperCase();
    if (!['EASY', 'MEDIUM', 'HARD'].includes(normalizedDifficulty)) {
      throw new ApiError(400, 'Invalid difficulty. Must be EASY, MEDIUM, or HARD');
    }
    updates.push('difficulty = ?'); 
    values.push(normalizedDifficulty); 
  }
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

  // Re-sync to R2/CDN if content or publishable fields changed
  if (body.content || body.title || body.description || body.isPublished) {
    try {
      // Fetch updated capsule for CDN sync
      const updated = await c.env.DB.prepare(
        'SELECT id, title, description, type, difficulty, language, content FROM capsules WHERE id = ?'
      ).bind(id).first<{ id: string; title: string; description: string | null; type: string; difficulty: string; language: string; content: string }>();
      
      if (updated) {
        const cdnPayload = {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          type: updated.type,
          difficulty: updated.difficulty,
          language: updated.language,
          content: JSON.parse(updated.content),
          updated_at: new Date().toISOString(),
        };
        await c.env.CDN.put(
          `capsules/${id}.json`,
          JSON.stringify(cdnPayload),
          { httpMetadata: { contentType: 'application/json' } }
        );
        console.log(`✅ Re-synced capsule to CDN: capsules/${id}.json`);
      }
    } catch (r2Error) {
      console.error('⚠️ R2 re-sync failed (non-blocking):', r2Error);
    }
  }

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
