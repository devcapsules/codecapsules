/**
 * Generation Queue Consumer — TUNNEL BRIDGE ARCHITECTURE
 * 
 * This consumer processes async capsule generation jobs by calling the
 * 3-agent AI pipeline running on Azure VMs via Cloudflare Tunnel.
 * 
 * WHY THIS APPROACH:
 * - CF Queue gives us: async UX, backpressure, retries, DLQ
 * - Azure VMs give us: 3-agent pipeline (Pedagogist → Coder → Debugger)
 * - Workers give us: auth, rate limiting, caching, progress tracking
 * 
 * The Queue Consumer is the BRIDGE between these worlds.
 * 
 * Flow:
 * 1. User requests generation → Workers queue the job
 * 2. Queue Consumer picks up job
 * 3. Queue Consumer calls Azure VM /internal/generate via Tunnel (signed request)
 * 4. Pipeline runs full GenerationPipeline (Pedagogist → Coder → Debugger)
 * 5. Queue Consumer stores result in KV for polling
 * 
 * Timeout: Queue Consumer has 15 minutes. Generation takes ~60s.
 */

import { createTunnelClient } from '../utils/tunnel-client';

// ══════════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════════

interface GenerationJob {
  jobId: string;
  userId: string;
  prompt: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type?: string;
  timestamp: number;
}

interface ProgressUpdate {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  steps?: string[];
  result?: unknown;
  error?: string;
  updatedAt?: number;
}

interface PipelineGenerationResult {
  success: boolean;
  jobId: string;
  capsule: any;
  qualityScore: number;
  tokenUsage: {
    pedagogist: { model: string; prompt_tokens: number; completion_tokens: number };
    coder: { model: string; prompt_tokens: number; completion_tokens: number };
    debugger: { model: string; prompt_tokens: number; completion_tokens: number };
  };
  generationTimeMs: number;
  pipeline?: {
    educational_score: number;
    technical_score: number;
    agents_used: string[];
    pedagogical_idea?: any;
    warnings?: string[];
  };
  error?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Cost Calculation
// ══════════════════════════════════════════════════════════════════════════════

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
};

function calculateCost(
  model: string,
  usage: { prompt_tokens: number; completion_tokens: number }
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
  return (usage.prompt_tokens * pricing.input) + (usage.completion_tokens * pricing.output);
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Queue Consumer
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Process generation queue batch
 * Called by Cloudflare Queue consumer handler
 */
export async function processGenerationQueue(
  batch: MessageBatch<GenerationJob>,
  env: Env
): Promise<void> {
  // Create tunnel client once per batch (routes through Cloudflare Tunnel → Azure VMs)
  const tunnel = createTunnelClient(env, 'generation-consumer', 55_000);

  for (const message of batch.messages) {
    const job = message.body;
    const startTime = Date.now();

    console.log(JSON.stringify({
      type: 'log',
      level: 'info',
      action: 'generation.start',
      jobId: job.jobId,
      userId: job.userId,
      language: job.language,
      difficulty: job.difficulty,
      timestamp: new Date().toISOString(),
    }));

    try {
      // ══════════════════════════════════════════════════════════════════════
      // Step 1: Check Kill Switch
      // ══════════════════════════════════════════════════════════════════════

      const killSwitch = await env.CACHE.get('system:generation:enabled');
      if (killSwitch === 'false') {
        console.log(JSON.stringify({
          type: 'log',
          level: 'warn',
          action: 'generation.killed',
          jobId: job.jobId,
          reason: 'Kill switch is active',
        }));

        await updateProgress(env, job.jobId, {
          status: 'failed',
          progress: 0,
          currentStep: 'AI generation is temporarily paused',
          error: 'AI generation is temporarily paused. Please try again later.',
        });

        message.ack();
        continue;
      }

      // ══════════════════════════════════════════════════════════════════════
      // Step 2: Check Semantic Cache (avoid regenerating similar prompts)
      // ══════════════════════════════════════════════════════════════════════

      const cacheKey = await hashForCache(job.userId, job.prompt, job.language);
      const cached = await env.CACHE.get(`gen:cache:${cacheKey}`, 'json') as any;

      if (cached) {
        console.log(JSON.stringify({
          type: 'metric',
          name: 'generation.cache_hit',
          jobId: job.jobId,
          language: job.language,
        }));

        await updateProgress(env, job.jobId, {
          status: 'completed',
          progress: 100,
          currentStep: 'Retrieved from cache!',
          steps: ['Cache Hit ✓'],
          result: {
            capsule: { 
              ...cached.capsule, 
              id: crypto.randomUUID().slice(0, 24), 
              fromCache: true 
            },
            qualityScore: cached.qualityScore || 0.8,
            generationTime: Date.now() - startTime,
            fromCache: true,
          },
        });

        // Log zero cost for cached results
        await logGenerationCost(env, job, 0, 0, 0, 0, true, Date.now() - startTime);

        message.ack();
        continue;
      }

      // ══════════════════════════════════════════════════════════════════════
      // Step 3: Update Progress — "Starting..."
      // ══════════════════════════════════════════════════════════════════════

      await updateProgress(env, job.jobId, {
        status: 'processing',
        progress: 5,
        currentStep: 'Queued for AI generation...',
        steps: ['Queue'],
      });

      // ══════════════════════════════════════════════════════════════════════
      // Step 4: Call Azure VM Pipeline (THE BRIDGE)
      // 
      // This is where we hand off to the 3-agent pipeline via Cloudflare Tunnel.
      // The Azure VM runs the full AI pipeline:
      //   PedagogistAgent → CoderAgent → DebuggerAgent
      //   Quality gates, FeedbackFlywheel, capsule conversion
      //
      // We just wait for the result.
      // ══════════════════════════════════════════════════════════════════════

      await updateProgress(env, job.jobId, {
        status: 'processing',
        progress: 15,
        currentStep: 'AI agents are working on your exercise...',
        steps: ['Queue ✓', 'AI Pipeline'],
      });

      const pipelineResult = await tunnel.call<PipelineGenerationResult>(
        '/internal/generate',
        {
          jobId: job.jobId,
          userId: job.userId,
          prompt: job.prompt,
          language: job.language,
          difficulty: job.difficulty,
          type: job.type || 'code',
        },
        { timeoutMs: 55_000 } // Pipeline typically takes ~60s, we wait 55s
      );

      // Check for tunnel-level failure (network, timeout, 500, etc.)
      if (!pipelineResult.success) {
        await trackCircuitBreakerFailure(env);
        throw new Error(pipelineResult.error || 'Pipeline request failed');
      }

      // Check for application-level failure (pipeline error)
      if (!pipelineResult.data?.success) {
        await trackCircuitBreakerFailure(env);
        throw new Error(
          pipelineResult.data?.error || 'Generation pipeline failed'
        );
      }

      // Reset circuit breaker on success
      await env.CACHE.delete('system:circuit:failures');

      const result = pipelineResult.data;

      // ══════════════════════════════════════════════════════════════════════
      // Step 5: Update Progress — "Almost done..."
      // ══════════════════════════════════════════════════════════════════════

      await updateProgress(env, job.jobId, {
        status: 'processing',
        progress: 90,
        currentStep: 'Finalizing your capsule...',
        steps: [
          'Queue ✓',
          'Pedagogist ✓',
          'Coder ✓',
          'Debugger ✓',
          'Finalizing',
        ],
      });

      // ══════════════════════════════════════════════════════════════════════
      // Step 6: Calculate Cost
      // ══════════════════════════════════════════════════════════════════════

      const pedagogistCost = calculateCost(
        result.tokenUsage.pedagogist.model,
        result.tokenUsage.pedagogist
      );
      const coderCost = calculateCost(
        result.tokenUsage.coder.model,
        result.tokenUsage.coder
      );
      const debuggerCost = calculateCost(
        result.tokenUsage.debugger.model,
        result.tokenUsage.debugger
      );
      const totalCost = pedagogistCost + coderCost + debuggerCost;

      // ══════════════════════════════════════════════════════════════════════
      // Step 7: Persist Cost to D1
      // ══════════════════════════════════════════════════════════════════════

      const pedagogistTokens = result.tokenUsage.pedagogist.prompt_tokens + 
                               result.tokenUsage.pedagogist.completion_tokens;
      const coderTokens = result.tokenUsage.coder.prompt_tokens + 
                          result.tokenUsage.coder.completion_tokens;
      const debuggerTokens = result.tokenUsage.debugger.prompt_tokens + 
                             result.tokenUsage.debugger.completion_tokens;

      await logGenerationCost(
        env,
        job,
        pedagogistTokens,
        coderTokens,
        debuggerTokens,
        totalCost,
        false,
        result.generationTimeMs
      );

      // ══════════════════════════════════════════════════════════════════════
      // Step 8: Check AI Budget Circuit Breaker
      // ══════════════════════════════════════════════════════════════════════

      const DAILY_AI_BUDGET_USD = parseFloat(
        await env.CACHE.get('system:ai:daily_budget') || '15'
      );
      const dailySpend = parseFloat(
        await env.CACHE.get('system:ai:daily_spend') || '0'
      );
      const newDailySpend = dailySpend + totalCost;

      await env.CACHE.put('system:ai:daily_spend', String(newDailySpend), {
        expirationTtl: 86400, // Reset after 24 hours
      });

      if (newDailySpend > DAILY_AI_BUDGET_USD) {
        // Trip the circuit breaker — pause generation for 1 hour
        await env.CACHE.put('system:generation:enabled', 'false', {
          expirationTtl: 3600, // Auto-re-enable after 1 hour
        });

        console.log(JSON.stringify({
          type: 'alert',
          name: 'ai.budget.exceeded',
          dailySpend: newDailySpend,
          budget: DAILY_AI_BUDGET_USD,
          action: 'generation_paused_1hr',
        }));
      }

      // ══════════════════════════════════════════════════════════════════════
      // Step 9: Cache for Future Semantic Hits
      // ══════════════════════════════════════════════════════════════════════

      await env.CACHE.put(
        `gen:cache:${cacheKey}`,
        JSON.stringify({
          capsule: result.capsule,
          qualityScore: result.qualityScore,
          pipeline: result.pipeline,
        }),
        { expirationTtl: 3600 } // 1 hour cache
      );

      // ══════════════════════════════════════════════════════════════════════
      // Step 10: Mark Complete
      // ══════════════════════════════════════════════════════════════════════

      await updateProgress(env, job.jobId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Done!',
        steps: [
          'Queue ✓',
          'Pedagogist ✓',
          'Coder ✓',
          'Debugger ✓',
          'Quality Check ✓',
        ],
        result: {
          capsule: result.capsule,
          qualityScore: result.qualityScore,
          generationTime: result.generationTimeMs,
          costBreakdown: {
            pedagogist: { 
              cost: pedagogistCost, 
              model: result.tokenUsage.pedagogist.model,
              tokens: pedagogistTokens,
            },
            coder: { 
              cost: coderCost, 
              model: result.tokenUsage.coder.model,
              tokens: coderTokens,
            },
            debugger: { 
              cost: debuggerCost, 
              model: result.tokenUsage.debugger.model,
              tokens: debuggerTokens,
            },
            totalCostUSD: totalCost,
          },
          pipeline: result.pipeline,
        },
      });

      // Decrement queue depth
      await decrementQueueDepth(env);

      console.log(JSON.stringify({
        type: 'metric',
        name: 'generation.complete',
        jobId: job.jobId,
        durationMs: Date.now() - startTime,
        tunnelDurationMs: pipelineResult.latencyMs,
        pipelineDurationMs: result.generationTimeMs,
        costUSD: totalCost,
        qualityScore: result.qualityScore,
        language: job.language,
        difficulty: job.difficulty,
      }));

      message.ack();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(JSON.stringify({
        type: 'log',
        level: 'error',
        action: 'generation.failed',
        jobId: job.jobId,
        attempt: message.attempts,
        maxAttempts: 3,
        error: errorMessage,
        durationMs: Date.now() - startTime,
      }));

      // ══════════════════════════════════════════════════════════════════════
      // Retry Logic
      // ══════════════════════════════════════════════════════════════════════

      if (message.attempts < 3) {
        // Retry with exponential backoff: 5s, 10s, 15s
        const delay = 5 * message.attempts;

        await updateProgress(env, job.jobId, {
          status: 'processing',
          progress: 5,
          currentStep: `Retrying (attempt ${message.attempts + 1}/3)...`,
          error: errorMessage,
        });

        message.retry({ delaySeconds: delay });
      } else {
        // ══════════════════════════════════════════════════════════════════════
        // Dead Letter — Max Retries Exhausted
        // ══════════════════════════════════════════════════════════════════════

        await updateProgress(env, job.jobId, {
          status: 'failed',
          progress: 0,
          currentStep: 'Generation failed after 3 attempts',
          error: 'We couldn\'t generate your exercise. Please try again or use a different prompt.',
        });

        // Decrement queue depth on final failure
        await decrementQueueDepth(env);

        console.error(JSON.stringify({
          type: 'alert',
          name: 'generation.dlq',
          jobId: job.jobId,
          userId: job.userId,
          prompt: job.prompt.slice(0, 100),
          error: errorMessage,
        }));

        message.ack(); // Don't retry forever
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════════════════════

async function updateProgress(
  env: Env, 
  jobId: string, 
  data: ProgressUpdate
): Promise<void> {
  try {
    await env.JOB_PROGRESS.put(`job:${jobId}`, JSON.stringify({
      ...data,
      updatedAt: Date.now(),
    }), { expirationTtl: 600 }); // 10 minute TTL
  } catch (err) {
    console.error('Failed to update progress:', err);
  }
}

async function hashForCache(
  _userId: string, 
  prompt: string, 
  language: string
): Promise<string> {
  // Normalize prompt for cache key (lowercase, trim, first 200 chars)
  const normalizedPrompt = prompt.trim().toLowerCase().slice(0, 200);
  const data = `${normalizedPrompt}:${language}`;
  
  const hash = await crypto.subtle.digest(
    'SHA-256', 
    new TextEncoder().encode(data)
  );
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

async function logGenerationCost(
  env: Env,
  job: GenerationJob,
  pedagogistTokens: number,
  coderTokens: number,
  debuggerTokens: number,
  totalCostUSD: number,
  cached: boolean,
  generationTimeMs: number
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO generation_logs (
        id, user_id, job_id, prompt, language,
        pedagogist_tokens, coder_tokens, debugger_tokens,
        total_cost_usd, pedagogist_model, coder_model, debugger_model,
        generation_time_ms, cached, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID().slice(0, 24),
      job.userId,
      job.jobId,
      job.prompt.slice(0, 500),
      job.language,
      pedagogistTokens,
      coderTokens,
      debuggerTokens,
      totalCostUSD,
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4o-mini',
      generationTimeMs,
      cached ? 1 : 0
    ).run();
  } catch (err) {
    // Don't fail the generation if cost logging fails
    console.error('Failed to log generation cost:', err);
  }
}

async function decrementQueueDepth(env: Env): Promise<void> {
  try {
    const current = parseInt(await env.CACHE.get('system:queue:depth') || '1');
    await env.CACHE.put(
      'system:queue:depth', 
      String(Math.max(0, current - 1)), 
      { expirationTtl: 600 }
    );
  } catch (err) {
    console.error('Failed to decrement queue depth:', err);
  }
}

/**
 * Track circuit breaker failures.
 * After 5 consecutive failures, trip the circuit breaker for 5 minutes.
 */
async function trackCircuitBreakerFailure(env: Env): Promise<void> {
  try {
    const failures = parseInt(await env.CACHE.get('system:circuit:failures') || '0') + 1;
    await env.CACHE.put('system:circuit:failures', String(failures), { expirationTtl: 600 });

    if (failures >= 5) {
      // Trip the circuit breaker — block new generation for 5 min
      await env.CACHE.put('system:circuit:generation', 'open', { expirationTtl: 300 });
      console.error(JSON.stringify({
        type: 'alert',
        name: 'circuit_breaker.tripped',
        consecutiveFailures: failures,
        action: 'generation_blocked_5min',
      }));
    }
  } catch (err) {
    console.error('Failed to track circuit breaker:', err);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Export for Queue Handler
// ══════════════════════════════════════════════════════════════════════════════

export default {
  async queue(batch: MessageBatch<GenerationJob>, env: Env): Promise<void> {
    return processGenerationQueue(batch, env);
  },
};
