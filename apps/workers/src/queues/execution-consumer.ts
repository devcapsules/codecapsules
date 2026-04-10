/**
 * Execution Queue Consumer — Async Code Execution via Piston
 *
 * Phase 2: Enhanced with Durable Object concurrency control.
 *
 * Flow:
 * 1. Queue delivers batch of execution jobs
 * 2. Consumer acquires a slot from ConcurrencyController DO (per-org)
 *    - If denied (at capacity) → msg.retry() (backpressure)
 * 3. Marks job as 'running' in KV
 * 4. Calls Piston via Cloudflare Tunnel (executeOnPiston)
 * 5. Writes result to KV (poll) + D1 (persistent history)
 * 6. Releases slot in DO
 * 7. Client polls GET /execute/runs/:jobId to retrieve result
 *
 * KV key: exec:{jobId}  TTL: 5 minutes
 * D1 table: execution_results (persistent)
 * Queue config: max_batch_size=10, max_retries=2, retry_delay=2s
 */

import {
  executeOnPiston,
  generateBatchedTestHarness,
  parseBatchedResults,
} from '../routes/execute';
import { PistonClient } from '../bridge/piston-client';
import { trackExecution } from '../utils/analytics-buffer';
import { incrementQuota } from '../middleware/rate-limit';

// ══════════════════════════════════════════════════════════════════════════════
// DO Slot Helper — Acquire / Release from ConcurrencyController
// ══════════════════════════════════════════════════════════════════════════════

interface AcquireResult {
  granted: boolean;
  reason: string;
  activeCount: number;
  maxSlots: number;
}

/**
 * Get the ConcurrencyController DO stub for a given org.
 * Shards by orgId → each org gets its own DO instance.
 * Falls back to userId, then "anonymous".
 */
function getConcurrencyStub(env: Env, job: ExecutionJob): DurableObjectStub {
  const shardKey = job.orgId || job.userId || 'anonymous';
  const id = env.CONCURRENCY_CONTROLLER.idFromName(shardKey);
  return env.CONCURRENCY_CONTROLLER.get(id);
}

async function acquireSlot(env: Env, job: ExecutionJob): Promise<AcquireResult> {
  const stub = getConcurrencyStub(env, job);

  const response = await stub.fetch(new Request('https://do/acquire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: job.jobId,
      orgId: job.orgId || job.userId || 'anonymous',
      plan: job.plan || 'free',
      language: job.language,
      type: job.type,
    }),
  }));

  return response.json() as Promise<AcquireResult>;
}

async function releaseSlot(env: Env, job: ExecutionJob): Promise<void> {
  const stub = getConcurrencyStub(env, job);

  await stub.fetch(new Request('https://do/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: job.jobId }),
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
// D1 Result Persistence
// ══════════════════════════════════════════════════════════════════════════════

async function persistResultToD1(
  env: Env,
  job: ExecutionJob,
  result: ExecutionJobResult
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT OR REPLACE INTO execution_results (
        job_id, type, language, status, user_id, org_id,
        stdout, stderr, exit_code, execution_time,
        test_summary, error, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      job.jobId,
      job.type,
      job.language,
      result.status,
      job.userId || null,
      job.orgId || job.userId || null,
      result.result?.stdout || null,
      result.result?.stderr || null,
      result.result?.exit_code ?? null,
      result.result?.execution_time || result.testResult?.summary?.totalTime || null,
      result.testResult ? JSON.stringify(result.testResult) : null,
      result.error || null,
      new Date(result.createdAt).toISOString(),
      result.completedAt ? new Date(result.completedAt).toISOString() : null,
    ).run();
  } catch (error) {
    // Non-fatal: KV is the primary source for polling, D1 is durable backup
    console.warn(JSON.stringify({
      type: 'warn',
      action: 'execution_queue.d1_persist_failed',
      jobId: job.jobId,
      error: error instanceof Error ? error.message : 'Unknown',
    }));
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Queue Consumer
// ══════════════════════════════════════════════════════════════════════════════

export async function processExecutionQueue(
  batch: MessageBatch<ExecutionJob>,
  env: Env
): Promise<void> {
  console.log(JSON.stringify({
    type: 'info',
    action: 'execution_queue.batch_received',
    batchSize: batch.messages.length,
    timestamp: Date.now(),
  }));

  // Process each message in the batch concurrently
  const promises = batch.messages.map(async (msg) => {
    const job = msg.body;
    const kvKey = `exec:${job.jobId}`;

    // ── Step 1: Acquire DO slot ──────────────────────────────────────────
    let slotAcquired = false;
    try {
      const slotResult = await acquireSlot(env, job);

      if (!slotResult.granted) {
        // At capacity — retry or fail if retries exhausted
        console.log(JSON.stringify({
          type: 'info',
          action: 'execution_queue.slot_denied_retrying',
          jobId: job.jobId,
          reason: slotResult.reason,
          activeCount: slotResult.activeCount,
          maxSlots: slotResult.maxSlots,
          attempt: msg.attempts,
        }));

        // After max retries (2), write failure to KV so client isn't stuck polling forever
        if (msg.attempts >= 2) {
          console.log(JSON.stringify({
            type: 'warn',
            action: 'execution_queue.slot_denied_exhausted',
            jobId: job.jobId,
            attempts: msg.attempts,
          }));
          await env.JOB_PROGRESS.put(
            kvKey,
            JSON.stringify({
              jobId: job.jobId,
              status: 'failed',
              type: job.type,
              error: `Server busy — concurrency limit reached (${slotResult.activeCount}/${slotResult.maxSlots} slots). Please try again.`,
              createdAt: job.timestamp,
              completedAt: Date.now(),
            } satisfies ExecutionJobResult),
            { expirationTtl: 300 }
          );
          msg.ack(); // Don't retry further
        } else {
          msg.retry();
        }
        return; // Don't process
      }

      slotAcquired = true;
    } catch (doError) {
      // DO unavailable — fall through without slot control (graceful degradation)
      console.warn(JSON.stringify({
        type: 'warn',
        action: 'execution_queue.do_unavailable',
        jobId: job.jobId,
        error: doError instanceof Error ? doError.message : 'Unknown',
      }));
      // Process anyway — better to execute than to drop
      slotAcquired = false;
    }

    try {
      // ── Step 2: Mark as running ────────────────────────────────────────
      await env.JOB_PROGRESS.put(
        kvKey,
        JSON.stringify({
          jobId: job.jobId,
          status: 'running',
          type: job.type,
          createdAt: job.timestamp,
        } satisfies ExecutionJobResult),
        { expirationTtl: 300 }
      );

      // ── Step 3: Execute ────────────────────────────────────────────────
      let completed: ExecutionJobResult;

      if (job.type === 'run') {
        completed = await processRunJob(job, env);
      } else if (job.type === 'tests') {
        completed = await processTestJob(job, env);
      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      // ── Step 4: Write results (KV + D1) ────────────────────────────────
      await env.JOB_PROGRESS.put(kvKey, JSON.stringify(completed), {
        expirationTtl: 300,
      });

      // Persist to D1 (non-blocking, non-fatal)
      await persistResultToD1(env, job, completed);

      // ── Step 5: Release DO slot ────────────────────────────────────────
      if (slotAcquired) {
        await releaseSlot(env, job).catch((err) => {
          console.warn(JSON.stringify({
            type: 'warn',
            action: 'execution_queue.slot_release_failed',
            jobId: job.jobId,
            error: err instanceof Error ? err.message : 'Unknown',
          }));
        });
      }

      // Acknowledge message (remove from queue)
      msg.ack();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';

      console.error(JSON.stringify({
        type: 'error',
        action: 'execution_queue.job_failed',
        jobId: job.jobId,
        jobType: job.type,
        error: errMsg,
        attempt: msg.attempts,
      }));

      // Write failure to KV so client gets an error response
      const failedResult: ExecutionJobResult = {
        jobId: job.jobId,
        status: 'failed',
        type: job.type,
        error: errMsg,
        createdAt: job.timestamp,
        completedAt: Date.now(),
      };

      await env.JOB_PROGRESS.put(
        kvKey,
        JSON.stringify(failedResult),
        { expirationTtl: 300 }
      );

      // Persist failure to D1
      await persistResultToD1(env, job, failedResult);

      // Always release slot on failure
      if (slotAcquired) {
        await releaseSlot(env, job).catch(() => {});
      }

      // Retry if retries remaining, otherwise ack (DLQ will catch it)
      if (msg.attempts < 2) {
        msg.retry();
      } else {
        msg.ack();
      }
    }
  });

  await Promise.allSettled(promises);
}

// ══════════════════════════════════════════════════════════════════════════════
// Process a single code execution job (POST /execute equivalent)
// ══════════════════════════════════════════════════════════════════════════════

async function processRunJob(
  job: ExecutionJob,
  env: Env
): Promise<ExecutionJobResult> {
  const startTime = Date.now();
  const client = PistonClient.getInstance();

  const result = await client.execute(
    env,
    job.language,
    job.sourceCode,
    job.input,
    job.timeLimit,
    job.memoryLimit
  );

  const executionTime = Date.now() - startTime;

  // Track execution analytics (buffered)
  trackExecution(env, job.userId, job.language, result.success, executionTime, 'piston');

  // Increment daily quota on success
  if (result.success && job.quotaKey) {
    await incrementQuota(env, job.quotaKey);
  }

  const completed: ExecutionJobResult = {
    jobId: job.jobId,
    status: 'completed',
    type: 'run',
    result: {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exit_code,
      execution_time: executionTime,
      tier: 'piston',
    },
    createdAt: job.timestamp,
    completedAt: Date.now(),
  };

  console.log(JSON.stringify({
    type: 'info',
    action: 'execution_queue.run_completed',
    jobId: job.jobId,
    language: job.language,
    success: result.success,
    executionTime,
  }));

  return completed;
}

// ══════════════════════════════════════════════════════════════════════════════
// Process a test execution job (POST /execute/tests equivalent)
// ══════════════════════════════════════════════════════════════════════════════

async function processTestJob(
  job: ExecutionJob,
  env: Env
): Promise<ExecutionJobResult> {
  if (!job.userCode || !job.functionName || !job.testCases) {
    throw new Error('Test job missing userCode, functionName, or testCases');
  }

  const startTime = Date.now();
  const cappedCases = job.testCases.slice(0, 5);

  // Normalize test cases: ensure input_args and expected_output are properly typed
  const normalizedCases = cappedCases.map((tc: any) => {
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
      input_args: inputArgs ?? [],
      expected_output: expectedOutput,
      description: tc.description || tc.name || `Test ${tc.id || ''}`,
      type: tc.type || 'unknown',
    };
  });

  // Generate batched test harness
  const harnessCode = generateBatchedTestHarness(
    job.language,
    job.userCode,
    job.functionName,
    normalizedCases,
    job.capsuleMode
  );

  console.log(JSON.stringify({
    type: 'debug',
    action: 'execution_queue.test_harness',
    jobId: job.jobId,
    language: job.language,
    functionName: job.functionName,
    harnessLength: harnessCode.length,
    testCaseCount: cappedCases.length,
  }));

  const pistonResult = await PistonClient.getInstance().execute(
    env,
    job.language,
    harnessCode,
    '',
    job.timeLimit,
    job.memoryLimit
  );

  const totalTime = Date.now() - startTime;

  // Parse batched results
  const results = parseBatchedResults(pistonResult, cappedCases);
  const passedCount = results.filter((r) => r.passed).length;

  // Increment daily quota
  if (job.quotaKey) {
    await incrementQuota(env, job.quotaKey);
  }

  const completed: ExecutionJobResult = {
    jobId: job.jobId,
    status: 'completed',
    type: 'tests',
    testResult: {
      success: results.every((r) => r.passed),
      summary: {
        totalTests: cappedCases.length,
        passedTests: passedCount,
        failedTests: cappedCases.length - passedCount,
        successRate: Math.round((passedCount / cappedCases.length) * 100),
        allPassed: passedCount === cappedCases.length,
        totalTime,
      },
      results,
    },
    createdAt: job.timestamp,
    completedAt: Date.now(),
  };

  console.log(JSON.stringify({
    type: 'info',
    action: 'execution_queue.tests_completed',
    jobId: job.jobId,
    language: job.language,
    passed: passedCount,
    total: cappedCases.length,
    totalTime,
  }));

  return completed;
}
