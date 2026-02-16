/**
 * Async Generation Routes
 * 
 * Handles capsule generation using the 3-agent pipeline.
 * Returns immediately with jobId, client polls for progress.
 * 
 * Safety features:
 * - Idempotency key: hash(userId + prompt + language) deduplicates for 10min
 * - AI circuit breaker: kills generation if Azure is failing
 * - Concurrency cap: max N concurrent AI jobs
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';
import { incrementQuota, getQuotaInfo } from '../middleware/rate-limit';
import { generateLimit } from '../middleware/body-limit';

type Variables = {
  auth: Auth | null;
  requestId: string;
  quotaKey?: string;
};

export const generateRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Stream-safe body limit: 512KB (counts actual bytes, not Content-Length)
generateRoutes.use('*', generateLimit);

// ── Safety limits ──
const MAX_CONCURRENT_JOBS = 5;        // Max simultaneous AI generation jobs
const IDEMPOTENCY_TTL = 600;          // 10 minutes dedup window
const CIRCUIT_BREAKER_THRESHOLD = 5;  // Trip after 5 consecutive failures
const CIRCUIT_BREAKER_RESET_TTL = 300;// Auto-reset after 5 minutes

// ══════════════════════════════════════════════════════════════════════════════
// POST /generate — Start async generation
// ══════════════════════════════════════════════════════════════════════════════

generateRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required to generate capsules');
  }

  const body = await c.req.json();
  const { prompt, language, difficulty = 'medium' } = body;

  // Validate inputs
  if (!prompt || typeof prompt !== 'string') {
    throw new ApiError(400, 'prompt is required');
  }
  if (!language || typeof language !== 'string') {
    throw new ApiError(400, 'language is required');
  }

  const supportedLanguages = ['python', 'javascript', 'java', 'cpp', 'c', 'sql'];
  if (!supportedLanguages.includes(language.toLowerCase())) {
    throw new ApiError(400, `Unsupported language. Supported: ${supportedLanguages.join(', ')}`);
  }

  // Quota is pre-checked by rateLimiter middleware (sets quotaKey in context)
  // No need to call checkQuota() here — middleware already threw 429 if exceeded

  // ── Circuit Breaker: Check if AI is healthy ──
  const circuitState = await c.env.CACHE.get('system:circuit:generation');
  if (circuitState === 'open') {
    throw new ApiError(503, 'AI generation is temporarily unavailable. Please try again in a few minutes.', 'CIRCUIT_OPEN');
  }

  // ── Idempotency: Deduplicate identical requests within 10min window ──
  const idempotencyKey = await hashPrompt(`${auth.userId}:${prompt.trim().toLowerCase()}:${language}`);
  const existingJob = await c.env.CACHE.get(`idemp:${idempotencyKey}`, 'json') as { jobId: string } | null;
  if (existingJob) {
    return c.json({
      success: true,
      jobId: existingJob.jobId,
      status: 'already_queued',
      statusUrl: `/api/v1/generate/${existingJob.jobId}/status`,
      deduplicated: true,
      meta: {
        requestId: c.get('requestId'),
        timestamp: Date.now(),
        version: c.env.API_VERSION,
      },
    }, 200);
  }

  // ── Concurrency Cap: Reject if too many jobs in flight ──
  const queueDepth = parseInt(await c.env.CACHE.get('system:queue:depth') || '0');
  if (queueDepth >= MAX_CONCURRENT_JOBS) {
    throw new ApiError(429, `AI generation queue is full (${queueDepth}/${MAX_CONCURRENT_JOBS}). Please wait for current jobs to complete.`, 'QUEUE_FULL');
  }

  // Check semantic cache (similar prompts)
  const cachedResult = await checkSemanticCache(c.env, prompt, language);
  if (cachedResult) {
    // Return cached result immediately
    return c.json({
      success: true,
      jobId: cachedResult.jobId,
      status: 'completed',
      fromCache: true,
      result: cachedResult,
      meta: {
        requestId: c.get('requestId'),
        timestamp: Date.now(),
        version: c.env.API_VERSION,
      },
    });
  }

  // Create job
  const jobId = `gen_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  // Initialize progress in JOB_PROGRESS KV
  await c.env.JOB_PROGRESS.put(`job:${jobId}`, JSON.stringify({
    status: 'queued',
    progress: 0,
    currentStep: 'Waiting in queue...',
    steps: [],
    userId: auth.userId,
    prompt: prompt.slice(0, 200), // Truncate for display
    language,
    difficulty,
    createdAt: Date.now(),
  }), { expirationTtl: 600 }); // 10 minute TTL

  // Enqueue job
  await c.env.GENERATION_QUEUE.send({
    jobId,
    userId: auth.userId,
    prompt,
    language: language.toLowerCase(),
    difficulty: difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
    timestamp: Date.now(),
  });

  // Store idempotency key (dedup for 10 min)
  await c.env.CACHE.put(`idemp:${idempotencyKey}`, JSON.stringify({ jobId }), {
    expirationTtl: IDEMPOTENCY_TTL,
  });

  // Increment queue depth counter
  await c.env.CACHE.put(
    'system:queue:depth',
    String(queueDepth + 1),
    { expirationTtl: 600 }
  );

  // Increment quota (KV write only on successful queue submission)
  await incrementQuota(c.env, c.get('quotaKey'));

  // Get quota info for response
  const quotaInfo = await getQuotaInfo(c.env, auth.userId, auth.plan, 'generation');

  return c.json({
    success: true,
    jobId,
    status: 'queued',
    statusUrl: `/api/v1/generate/${jobId}/status`,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
      quota: {
        remaining: Math.max(0, quotaInfo.remaining - 1),
        limit: quotaInfo.limit,
      },
    },
  }, 202); // 202 Accepted
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /generate/:jobId/status — Check generation progress
// ══════════════════════════════════════════════════════════════════════════════

generateRoutes.get('/:jobId/status', async (c) => {
  const { jobId } = c.req.param();

  const data = await c.env.JOB_PROGRESS.get(`job:${jobId}`, 'json') as {
    status: string;
    progress: number;
    currentStep: string;
    steps: string[];
    result?: unknown;
    error?: string;
    userId: string;
  } | null;

  if (!data) {
    throw new ApiError(404, 'Job not found or expired');
  }

  // If completed, include result
  if (data.status === 'completed' && data.result) {
    return c.json({
      success: true,
      jobId,
      status: 'completed',
      progress: 100,
      currentStep: 'Done!',
      result: data.result,
      meta: {
        requestId: c.get('requestId'),
        timestamp: Date.now(),
        version: c.env.API_VERSION,
      },
    });
  }

  // If failed, include error
  if (data.status === 'failed') {
    return c.json({
      success: false,
      jobId,
      status: 'failed',
      progress: data.progress,
      currentStep: data.currentStep,
      error: data.error,
      meta: {
        requestId: c.get('requestId'),
        timestamp: Date.now(),
        version: c.env.API_VERSION,
      },
    }, 500);
  }

  // In progress
  return c.json({
    success: true,
    jobId,
    status: data.status,
    progress: data.progress,
    currentStep: data.currentStep,
    steps: data.steps,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper: Check semantic cache
// ══════════════════════════════════════════════════════════════════════════════

async function checkSemanticCache(
  env: Env,
  prompt: string,
  language: string
): Promise<{ jobId: string; capsule: unknown } | null> {
  // Normalize prompt for cache lookup
  const normalizedPrompt = prompt.toLowerCase().trim().replace(/\s+/g, ' ');
  const hash = await hashPrompt(normalizedPrompt);
  const cacheKey = `gencache:${language}:${hash}`;

  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    const cachedData = cached as { capsule?: unknown };
    // Generate new ID but return cached content
    return {
      jobId: `cached_${Date.now()}`,
      capsule: cachedData.capsule || cachedData,
    };
  }

  return null;
}

async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}
