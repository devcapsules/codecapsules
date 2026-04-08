/**
 * Code Execution Routes
 *
 * Two-tier execution with async queue pipeline:
 * - Tier 1 (Edge): SQL via D1 — zero-latency, runs directly on Cloudflare (SYNC)
 * - Tier 2 (Piston): Python, JavaScript, Java, C++, C — queued via Cloudflare Queue,
 *   processed by consumer, routed through Cloudflare Tunnel to Azure VMSS Piston
 *
 * Endpoints:
 *   POST /execute       — Submit code for execution (returns jobId for Piston, sync for SQL)
 *   POST /execute/tests — Submit test run (returns jobId for Piston, sync for SQL)
 *   GET  /execute/runs/:jobId — Poll job status + result
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';
import { trackExecution } from '../utils/analytics-buffer';
import { incrementQuota } from '../middleware/rate-limit';
import { executeLimit } from '../middleware/body-limit';
import { wrapWithDatasetInjection } from '../bridge/dataset-injection';

type Variables = {
  auth: Auth | null;
  requestId: string;
  quotaKey?: string;
};

export const executeRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Stream-safe body limit: 100KB (counts actual bytes, not Content-Length)
executeRoutes.use('*', executeLimit);

// ── Language tier mapping ────────────────────────────────────────────────────
// SQL: edge (D1). Everything else: Piston on Azure VMSS via Cloudflare Tunnel.
export const EDGE_LANGUAGES = ['sql'];
export const PISTON_LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c'];
export const ALL_LANGUAGES = [...EDGE_LANGUAGES, ...PISTON_LANGUAGES];

// Map our language names → Piston runtime identifiers + file names
export const PISTON_LANGUAGE_MAP: Record<string, { runtime: string; fileName: string }> = {
  python:     { runtime: 'python',     fileName: 'main.py' },
  javascript: { runtime: 'javascript', fileName: 'main.js' },
  java:       { runtime: 'java',       fileName: 'Main.java' },
  cpp:        { runtime: 'c++',        fileName: 'main.cpp' },
  c:          { runtime: 'c',          fileName: 'main.c' },
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /execute — Execute code (async queue for Piston, sync for SQL)
// ══════════════════════════════════════════════════════════════════════════════

executeRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const { 
    source_code, 
    language, 
    input = '', 
    time_limit = 10, 
    memory_limit = 128 
  } = body;

  // Validate inputs
  if (!source_code || typeof source_code !== 'string') {
    throw new ApiError(400, 'source_code is required');
  }
  if (!language || typeof language !== 'string') {
    throw new ApiError(400, 'language is required');
  }

  const lang = language.toLowerCase();

  if (!ALL_LANGUAGES.includes(lang)) {
    throw new ApiError(400, `Unsupported language. Supported: ${ALL_LANGUAGES.join(', ')}`);
  }

  // Input validation
  if (source_code.length > 50000) {
    throw new ApiError(400, 'Code too long. Maximum 50KB.');
  }
  if (time_limit < 1 || time_limit > 30) {
    throw new ApiError(400, 'time_limit must be between 1 and 30 seconds');
  }

  // ── Tier 1: SQL stays synchronous on edge ──
  if (lang === 'sql') {
    const startTime = Date.now();
    const result = await executeSQL(c.env, source_code);
    const executionTime = Date.now() - startTime;

    const auth = c.get('auth');
    trackExecution(c.env, auth?.userId, lang, result.success, executionTime, 'edge');

    if (result.success) {
      await incrementQuota(c.env, c.get('quotaKey'));
    }

    return c.json({
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exit_code,
      execution_time: executionTime,
      tier: 'edge',
      // No jobId for sync — result is inline
      meta: {
        requestId: c.get('requestId'),
        timestamp: Date.now(),
        version: c.env.API_VERSION,
      },
    });
  }

  // ── Tier 2: Piston → Queue (async) ──
  const jobId = crypto.randomUUID();
  const auth = c.get('auth');

  const job: ExecutionJob = {
    jobId,
    type: 'run',
    language: lang,
    sourceCode: source_code,
    input,
    timeLimit: time_limit,
    memoryLimit: memory_limit,
    userId: auth?.userId,
    orgId: auth?.userId,    // Per-org DO sharding (B2B orgId when available)
    plan: auth?.plan,       // Determines per-org concurrency limit
    quotaKey: c.get('quotaKey'),
    requestId: c.get('requestId'),
    timestamp: Date.now(),
  };

  // Write initial status to KV
  const initialStatus: ExecutionJobResult = {
    jobId,
    status: 'queued',
    type: 'run',
    createdAt: Date.now(),
  };
  await c.env.JOB_PROGRESS.put(
    `exec:${jobId}`,
    JSON.stringify(initialStatus),
    { expirationTtl: 300 } // 5 min TTL
  );

  // Push to execution queue
  await c.env.EXECUTION_QUEUE.send(job);

  return c.json({
    success: true,
    jobId,
    status: 'queued',
    statusUrl: `/api/v1/execute/runs/${jobId}`,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  }, 202);
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /execute-tests — Run user code against test cases
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// POST /execute/tests — Run user code against test cases (async queue for Piston)
// ══════════════════════════════════════════════════════════════════════════════

executeRoutes.post('/tests', async (c) => {
  const body = await c.req.json();
  const { userCode, testCases, language, functionName, schema_setup } = body;

  if (!userCode || !testCases || !language) {
    throw new ApiError(400, 'userCode, testCases, and language are required');
  }

  const lang = language.toLowerCase();

  // Cap at 5 test cases (Golden 5 strategy)
  const cappedCases = testCases.slice(0, 5);

  // ── SQL: edge-only execution (no Piston harness) — stays SYNC ──
  if (lang === 'sql') {
    const startTime = Date.now();
    const results: TestResult[] = [];
    let passedCount = 0;

    // schema_setup is passed into each executeSQL call → runs in isolated DO
    const schemaStatements: string[] = Array.isArray(schema_setup) ? schema_setup : [];

    // Run reference solution first to get expected output (if provided)
    const { referenceSolution } = body;
    let expectedRows: unknown[] | null = null;
    if (referenceSolution) {
      const refResult = await executeSQL(c.env, referenceSolution, schemaStatements);
      if (refResult.success) {
        try { expectedRows = JSON.parse(refResult.stdout); } catch { expectedRows = null; }
      }
    }

    // ── Smart SQL comparison helpers ──

    /** Normalize a value for loose comparison: 42 == 42.0, null == null */
    const normalizeValue = (v: unknown): unknown => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const num = Number(v);
        if (!isNaN(num) && v.trim() !== '') return num;
      }
      return v;
    };

    /** Normalize a row object: lowercase keys + coerce numeric values */
    const normalizeRow = (row: Record<string, unknown>): Record<string, unknown> => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        out[k.toLowerCase()] = normalizeValue(v);
      }
      return out;
    };

    /** Check if user query contains ORDER BY (means row order matters) */
    const queryHasOrderBy = /\border\s+by\b/i.test(userCode);

    /** Compare two row arrays with smart matching */
    const compareResults = (
      userRows: Record<string, unknown>[],
      expectedRows: Record<string, unknown>[]
    ): { passed: boolean; diff?: string; columnMismatch?: boolean } => {
      if (!expectedRows || expectedRows.length === 0) return { passed: true };

      // 1. Column name validation
      const expectedCols = Object.keys(expectedRows[0]).map(c => c.toLowerCase()).sort();
      if (userRows.length > 0) {
        const userCols = Object.keys(userRows[0]).map(c => c.toLowerCase()).sort();
        if (JSON.stringify(userCols) !== JSON.stringify(expectedCols)) {
          return {
            passed: false,
            columnMismatch: true,
            diff: `Column mismatch: expected [${expectedCols.join(', ')}], got [${userCols.join(', ')}]`,
          };
        }
      }

      // 2. Row count check
      if (userRows.length !== expectedRows.length) {
        return {
          passed: false,
          diff: `Row count mismatch: expected ${expectedRows.length} rows, got ${userRows.length}`,
        };
      }

      // 3. Normalize all rows (type coercion)
      const normalizedUser = userRows.map(normalizeRow);
      const normalizedExpected = expectedRows.map(normalizeRow);

      // 4. Compare — order-sensitive if query has ORDER BY, otherwise sort both
      const toSortKey = (row: Record<string, unknown>) => JSON.stringify(Object.entries(row).sort(([a], [b]) => a.localeCompare(b)));

      if (queryHasOrderBy) {
        // Strict order comparison
        for (let r = 0; r < normalizedExpected.length; r++) {
          const uStr = JSON.stringify(normalizedUser[r]);
          const eStr = JSON.stringify(normalizedExpected[r]);
          if (uStr !== eStr) {
            return { passed: false, diff: `Row ${r + 1} mismatch` };
          }
        }
      } else {
        // Order-insensitive: sort both by stringified row content
        const sortedUser = [...normalizedUser].sort((a, b) => toSortKey(a).localeCompare(toSortKey(b)));
        const sortedExpected = [...normalizedExpected].sort((a, b) => toSortKey(a).localeCompare(toSortKey(b)));
        for (let r = 0; r < sortedExpected.length; r++) {
          const uStr = JSON.stringify(sortedUser[r]);
          const eStr = JSON.stringify(sortedExpected[r]);
          if (uStr !== eStr) {
            return { passed: false, diff: `Output mismatch (compared order-insensitively)` };
          }
        }
      }

      return { passed: true };
    };

    for (let i = 0; i < cappedCases.length; i++) {
      const tc = cappedCases[i];
      // Each test gets its own DO instance: fresh schema + user query, fully isolated
      const sqlResult = await executeSQL(c.env, userCode, schemaStatements);

      let passed = sqlResult.success;
      let diff: string | undefined;

      // Compare output to expected (from reference solution or test case)
      if (passed) {
        try {
          const userRows = JSON.parse(sqlResult.stdout);
          const expectedOutput = expectedRows || (tc.expected_output ?
            (typeof tc.expected_output === 'string' ? JSON.parse(tc.expected_output) : tc.expected_output) : null);

          if (expectedOutput && Array.isArray(expectedOutput) && Array.isArray(userRows)) {
            const cmp = compareResults(userRows, expectedOutput);
            passed = cmp.passed;
            diff = cmp.diff;
          }
        } catch { /* comparison parse error — keep passed as is */ }
      }

      results.push({
        testCase: i + 1,
        description: tc.description || `Test ${i + 1}`,
        type: tc.type || 'unknown',
        passed,
        output: sqlResult.stdout,
        expected: tc.expected_output,
        executionTime: 0,
        error: sqlResult.stderr || diff || undefined,
      });
      if (passed) passedCount++;
    }

    return c.json({
      success: passedCount === cappedCases.length,
      summary: {
        totalTests: cappedCases.length,
        passedTests: passedCount,
        failedTests: cappedCases.length - passedCount,
        successRate: Math.round((passedCount / cappedCases.length) * 100),
        allPassed: passedCount === cappedCases.length,
        totalTime: Date.now() - startTime,
      },
      results,
      // Provide expected output for embed side-by-side comparison
      expected: expectedRows,
      meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
    });
  }

  // ── Piston test execution → Queue (async) ──
  const jobId = crypto.randomUUID();
  const auth = c.get('auth');

  const job: ExecutionJob = {
    jobId,
    type: 'tests',
    language: lang,
    sourceCode: '', // not used for tests — userCode is used instead
    input: '',
    timeLimit: 3,
    memoryLimit: 128,
    userCode,
    functionName,
    testCases: cappedCases,
    userId: auth?.userId,
    orgId: auth?.userId,    // Per-org DO sharding (B2B orgId when available)
    plan: auth?.plan,       // Determines per-org concurrency limit
    quotaKey: c.get('quotaKey'),
    requestId: c.get('requestId'),
    timestamp: Date.now(),
  };

  // Write initial status to KV
  const initialStatus: ExecutionJobResult = {
    jobId,
    status: 'queued',
    type: 'tests',
    createdAt: Date.now(),
  };
  await c.env.JOB_PROGRESS.put(
    `exec:${jobId}`,
    JSON.stringify(initialStatus),
    { expirationTtl: 300 }
  );

  // Push to execution queue
  await c.env.EXECUTION_QUEUE.send(job);

  return c.json({
    success: true,
    jobId,
    status: 'queued',
    statusUrl: `/api/v1/execute/runs/${jobId}`,
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  }, 202);
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /execute/runs/:jobId — Poll job status
// ══════════════════════════════════════════════════════════════════════════════

executeRoutes.get('/runs/:jobId', async (c) => {
  const { jobId } = c.req.param();

  if (!jobId || jobId.length > 50) {
    throw new ApiError(400, 'Invalid jobId');
  }

  const raw = await c.env.JOB_PROGRESS.get(`exec:${jobId}`);

  if (!raw) {
    throw new ApiError(404, 'Job not found or expired');
  }

  let jobResult = JSON.parse(raw) as ExecutionJobResult;

  // KV is eventually consistent — stale reads may show 'queued'/'running'
  // even after the consumer wrote 'completed'. Fall back to D1 (strongly consistent)
  // if the job has been pending for over 3 seconds.
  if (
    (jobResult.status === 'queued' || jobResult.status === 'running') &&
    jobResult.createdAt &&
    Date.now() - jobResult.createdAt > 3000
  ) {
    try {
      const d1Row = await c.env.DB.prepare(
        'SELECT job_id, type, status, stdout, stderr, exit_code, execution_time, test_summary, error, created_at, completed_at FROM execution_results WHERE job_id = ?'
      ).bind(jobId).first<{
        job_id: string; type: string; status: string;
        stdout: string | null; stderr: string | null; exit_code: number | null;
        execution_time: number | null; test_summary: string | null;
        error: string | null; created_at: string; completed_at: string | null;
      }>();

      if (d1Row && (d1Row.status === 'completed' || d1Row.status === 'failed')) {
        console.log(JSON.stringify({
          type: 'info',
          action: 'execute_runs.d1_fallback_hit',
          jobId,
          kvStatus: jobResult.status,
          d1Status: d1Row.status,
          staleDuration: Date.now() - (jobResult.createdAt || 0),
        }));
        // Reconstruct the result from D1
        const d1Result: ExecutionJobResult = {
          jobId: d1Row.job_id,
          status: d1Row.status as 'completed' | 'failed',
          type: d1Row.type as 'run' | 'tests',
          createdAt: new Date(d1Row.created_at).getTime(),
          completedAt: d1Row.completed_at ? new Date(d1Row.completed_at).getTime() : Date.now(),
          error: d1Row.error || undefined,
        };

        if (d1Row.type === 'run') {
          d1Result.result = {
            success: !d1Row.error && d1Row.exit_code === 0,
            stdout: d1Row.stdout || '',
            stderr: d1Row.stderr || '',
            exit_code: d1Row.exit_code ?? 1,
            execution_time: d1Row.execution_time || 0,
            tier: 'piston',
          };
        } else if (d1Row.type === 'tests' && d1Row.test_summary) {
          try {
            d1Result.testResult = JSON.parse(d1Row.test_summary);
          } catch {}
        }

        jobResult = d1Result;
      }
    } catch {
      // D1 fallback failed — continue with stale KV result
    }
  }

  return c.json({
    success: true,
    ...jobResult,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /execute/health — Bridge + Circuit Breaker Status (admin only)
// ══════════════════════════════════════════════════════════════════════════════

executeRoutes.get('/health', async (c) => {
  const { PistonClient } = await import('../bridge/piston-client');
  const client = PistonClient.getInstance();
  const health = client.getHealth();

  return c.json({
    success: true,
    bridge: {
      circuit: health.state,
      consecutiveFailures: health.consecutiveFailures,
      totalRequests: health.totalRequests,
      totalSuccesses: health.totalSuccesses,
      totalFailures: health.totalFailures,
      totalTimeouts: health.totalTimeouts,
      totalCircuitBreaks: health.totalCircuitBreaks,
      lastFailureTime: health.lastFailureTime || null,
      lastSuccessTime: health.lastSuccessTime || null,
      trippedAt: health.trippedAt || null,
    },
    config: {
      requestTimeoutMs: health.config.requestTimeoutMs,
      maxRetries: health.config.maxRetries,
      failureThreshold: health.config.circuitBreaker.failureThreshold,
      resetTimeoutMs: health.config.circuitBreaker.resetTimeoutMs,
    },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tier 1 (Edge): SQL via SQLSandbox Durable Object (isolated per-execution)
// ══════════════════════════════════════════════════════════════════════════════

async function executeSQL(
  env: Env,
  code: string,
  schemaSetup?: string[]
): Promise<ExecutionResult> {
  try {
    // Each execution gets a unique DO instance → its own private SQLite
    const id = env.SQL_SANDBOX.newUniqueId();
    const stub = env.SQL_SANDBOX.get(id);

    const response = await stub.fetch('https://sandbox/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'execute',
        schemaSetup: schemaSetup || [],
        userCode: code,
      }),
    });

    const result = await response.json() as { success: boolean; results: unknown[]; error?: string };

    if (!result.success) {
      return {
        success: false,
        stdout: '',
        stderr: result.error || 'SQL execution failed',
        exit_code: 1,
      };
    }

    return {
      success: true,
      stdout: JSON.stringify(
        // Flatten: single-statement results [[rows]] → [rows]
        result.results.length === 1 ? result.results[0] : result.results,
        null, 2
      ),
      stderr: '',
      exit_code: 0,
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : 'SQL sandbox error',
      exit_code: 1,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tier 2 (Piston): Python, JavaScript, Java, C++, C
// Routed through Cloudflare Tunnel → Azure VMSS → Piston container
// ══════════════════════════════════════════════════════════════════════════════

export async function executeOnPiston(
  env: Env,
  language: string,
  code: string,
  input: string,
  timeLimit: number,
  memoryLimit: number
): Promise<ExecutionResult> {
  const mapping = PISTON_LANGUAGE_MAP[language];
  if (!mapping) {
    return {
      success: false,
      stdout: '',
      stderr: `No Piston mapping for language: ${language}`,
      exit_code: 1,
    };
  }

  try {
    const pistonUrl = env.PISTON_URL;
    if (!pistonUrl) {
      throw new Error('PISTON_URL not configured');
    }

    // Build base payload (dataset injection wraps with bash if .csv is referenced)
    const payload = wrapWithDatasetInjection({
      language: mapping.runtime,
      version: '*',
      files: [{ name: mapping.fileName, content: code }],
      stdin: input,
      args: [] as string[],
      compile_timeout: Math.min(timeLimit, 3) * 1000, // Piston max: 3s
      run_timeout: Math.min(timeLimit, 3) * 1000,     // Piston max: 3s
      compile_memory_limit: -1,                     // Unlimited — prevents signal 6
      run_memory_limit: -1,                          // Unlimited — prevents signal 6
    });

    const response = await fetch(`${pistonUrl}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown');
      throw new Error(`Piston returned ${response.status}: ${errText.slice(0, 200)}`);
    }

    const pistonResult = await response.json() as PistonResponse;

    // Check compile step (for compiled languages like Java, C++, C)
    if (pistonResult.compile && pistonResult.compile.code !== 0) {
      return {
        success: false,
        stdout: pistonResult.compile.stdout || '',
        stderr: pistonResult.compile.stderr || pistonResult.compile.output || 'Compilation failed',
        exit_code: pistonResult.compile.code ?? 1,
      };
    }

    // Return run result
    const run = pistonResult.run;
    return {
      success: run.code === 0,
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      exit_code: run.code ?? 1,
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Piston execution failed',
      exit_code: 1,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Batched Test Execution — Single Piston Call for All Tests
// ══════════════════════════════════════════════════════════════════════════════

/**
 * UTF-8 safe base64 encode (btoa only handles Latin1)
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
 * Sanitize code for language-specific keyword mismatches.
 * Fixes common AI generation mistakes like using JS keywords in Python code.
 */
function sanitizeCodeForLanguage(code: string, language: string): string {
  if (language === 'python') {
    // Fix JS null/true/false used as standalone identifiers in Python code
    // Uses word-boundary-aware regex to avoid mutating strings/comments incorrectly
    return code
      .replace(/\bis null\b/g, 'is None')
      .replace(/\b== null\b/g, '== None')
      .replace(/\b!= null\b/g, '!= None')
      .replace(/\bnull\b(?=\s*[),:\]\n])/g, 'None')
      .replace(/(?<!['"])\btrue\b(?!['"])/gi, (match) => {
        // Only replace lowercase 'true' (JS), not 'True' (already Python)
        return match === 'true' ? 'True' : match;
      })
      .replace(/(?<!['"])\bfalse\b(?!['"])/gi, (match) => {
        return match === 'false' ? 'False' : match;
      });
  }
  return code;
}

/**
 * Generate a batched test harness that runs ALL test cases in a single execution.
 * Uses ---JSON_START--- delimiter to separate user output from test results.
 */
export function generateBatchedTestHarness(
  language: string,
  userCode: string,
  functionName: string,
  testCases: Array<{ input_args: unknown[]; expected_output: unknown; description?: string; type?: string }>
): string {
  // Sanitize user code for language-specific keyword mismatches
  userCode = sanitizeCodeForLanguage(userCode, language);

  // Base64-encode the full test data array (UTF-8 safe)
  const testDataB64 = utf8ToBase64(JSON.stringify(
    testCases.map((tc, i) => ({
      id: i + 1,
      input_args: tc.input_args,
      expected_output: tc.expected_output,
      description: tc.description || `Test ${i + 1}`,
      type: tc.type || 'unknown',
    }))
  ));

  if (language === 'python') {
    return `
# Force determinism
import random
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

# User code
${userCode}

# --- HIDDEN TEST HARNESS ---
import json
import base64

def _normalize(obj):
    """Normalize for comparison: tuples->lists, sets->sorted lists, round floats, pandas->native."""
    # Convert pandas types to native Python before normalizing
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
        elif isinstance(obj, _pd.Timestamp):
            obj = str(obj)
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
_results = []

# Auto-convert list args to pandas Series if pandas is available (safety net)
def _maybe_convert_args(args):
    try:
        import pandas as _pd
        return [_pd.Series(a) if isinstance(a, list) and len(a) > 0 and not isinstance(a[0], (list, dict)) else a for a in args]
    except ImportError:
        return args

for _t in _tests:
    _res = {"id": _t["id"], "passed": False, "actual": None, "error": None, "type": _t.get("type", "unknown")}
    try:
        # First try with raw JSON args
        try:
            _val = ${functionName}(*_t["input_args"])
        except (AttributeError, TypeError) as _conv_err:
            if "has no attribute" in str(_conv_err) or "apply" in str(_conv_err):
                # Retry with pandas-converted args (list -> Series)
                _val = ${functionName}(*_maybe_convert_args(_t["input_args"]))
            else:
                raise
        _norm_actual = _normalize(_val)
        _norm_expected = _normalize(_t["expected_output"])
        if _norm_actual == _norm_expected:
            _res["passed"] = True
        _res["actual"] = json.dumps(_norm_actual, default=str)
        _res["expected"] = json.dumps(_norm_expected, default=str)
    except Exception as _e:
        import traceback
        _res["error"] = str(_e)
    _results.append(_res)

print("---JSON_START---")
print(json.dumps(_results))
`;
  }

  if (language === 'javascript') {
    return `
// User code
${userCode}

// --- HIDDEN TEST HARNESS ---
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
const _results = [];

for (const _t of _tests) {
    const _res = { id: _t.id, passed: false, actual: null, error: null, type: _t.type || "unknown" };
    try {
        const _val = ${functionName}(..._t.input_args);
        const _normActual = _normalize(_val);
        const _normExpected = _normalize(_t.expected_output);
        if (JSON.stringify(_normActual) === JSON.stringify(_normExpected)) {
            _res.passed = true;
        }
        _res.actual = JSON.stringify(_normActual);
        _res.expected = JSON.stringify(_normExpected);
    } catch (_e) {
        _res.error = _e.message || String(_e);
    }
    _results.push(_res);
}

console.log("---JSON_START---");
console.log(JSON.stringify(_results));
`;
  }

  // Fallback for unsupported languages
  return userCode;
}

/**
 * Parse the ---JSON_START--- delimited output from a batched Piston execution.
 * Separates user logs from structured test results.
 */
export function parseBatchedResults(
  pistonResult: ExecutionResult,
  testCases: Array<{ description?: string; type?: string; expected_output?: unknown }>
): TestResult[] {
  const stdout = (pistonResult.stdout || '').trim();
  const stderr = (pistonResult.stderr || '').trim();

  // If Piston itself failed (non-zero exit, network error)
  if (!pistonResult.success && !stdout.includes('---JSON_START---')) {
    return testCases.map((tc, i) => ({
      testCase: i + 1,
      description: tc.description || `Test ${i + 1}`,
      type: tc.type || 'unknown',
      passed: false,
      output: null,
      expected: tc.expected_output,
      executionTime: 0,
      error: stderr || `Execution failed (exit code ${pistonResult.exit_code})`,
    }));
  }

  // Split by delimiter
  const parts = stdout.split('---JSON_START---');

  if (parts.length < 2) {
    // Code crashed before reaching the harness output
    return testCases.map((tc, i) => ({
      testCase: i + 1,
      description: tc.description || `Test ${i + 1}`,
      type: tc.type || 'unknown',
      passed: false,
      output: stdout || null,
      expected: tc.expected_output,
      executionTime: 0,
      error: stderr || 'Code crashed before test harness could run. Check for syntax errors or import issues.',
    }));
  }

  const _userLogs = parts[0].trim(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const jsonStr = parts[1].trim();

  try {
    const parsed = JSON.parse(jsonStr) as Array<{
      id: number;
      passed: boolean;
      actual?: string;
      expected?: string;
      error?: string | null;
      type?: string;
    }>;

    return parsed.map((r, i) => {
      const tc = testCases[i] || {};
      return {
        testCase: r.id || i + 1,
        description: tc.description || `Test ${r.id || i + 1}`,
        type: r.type || tc.type || 'unknown',
        passed: r.passed,
        output: r.actual || null,
        expected: r.expected || tc.expected_output,
        executionTime: 0,
        error: r.error || undefined,
      };
    });
  } catch (parseError) {
    // JSON parsing failed — return all tests as failed
    return testCases.map((tc, i) => ({
      testCase: i + 1,
      description: tc.description || `Test ${i + 1}`,
      type: tc.type || 'unknown',
      passed: false,
      output: jsonStr.substring(0, 200),
      expected: tc.expected_output,
      executionTime: 0,
      error: `Failed to parse test results JSON: ${parseError instanceof Error ? parseError.message : 'unknown'}`,
    }));
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════════

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
}

export interface TestResult {
  testCase: number;
  description: string;
  type: string;
  passed: boolean;
  output: unknown;
  expected: unknown;
  executionTime: number;
  error?: string;
}

/** Piston API v2 response shape */
interface PistonRunResult {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  output: string;
}

interface PistonResponse {
  language: string;
  version: string;
  run: PistonRunResult;
  compile?: PistonRunResult;
}
