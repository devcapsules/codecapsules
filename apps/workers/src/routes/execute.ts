/**
 * Code Execution Routes
 *
 * Two-tier execution:
 * - Tier 1 (Edge): SQL via D1 — zero-latency, runs directly on Cloudflare
 * - Tier 2 (Piston): Python, JavaScript, Java, C++, C — routed through
 *   Cloudflare Tunnel to auto-scaling Azure VMSS running Piston
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';
import { trackExecution } from '../utils/analytics-buffer';
import { incrementQuota } from '../middleware/rate-limit';
import { executeLimit } from '../middleware/body-limit';

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
const EDGE_LANGUAGES = ['sql'];
const PISTON_LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c'];
const ALL_LANGUAGES = [...EDGE_LANGUAGES, ...PISTON_LANGUAGES];

// Map our language names → Piston runtime identifiers + file names
const PISTON_LANGUAGE_MAP: Record<string, { runtime: string; fileName: string }> = {
  python:     { runtime: 'python',     fileName: 'main.py' },
  javascript: { runtime: 'javascript', fileName: 'main.js' },
  java:       { runtime: 'java',       fileName: 'Main.java' },
  cpp:        { runtime: 'c++',        fileName: 'main.cpp' },
  c:          { runtime: 'c',          fileName: 'main.c' },
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /execute — Execute code
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

  const startTime = Date.now();

  // Route to appropriate tier
  let result: ExecutionResult;
  let tier: 'edge' | 'piston' = lang === 'sql' ? 'edge' : 'piston';

  if (lang === 'sql') {
    result = await executeSQL(c.env, source_code);
  } else {
    result = await executeOnPiston(c.env, lang, source_code, input, time_limit, memory_limit);
  }

  const executionTime = Date.now() - startTime;

  // Track execution (buffered — no D1 write on hot path)
  const auth = c.get('auth');
  trackExecution(c.env, auth?.userId, lang, result.success, executionTime, tier);

  // Increment daily quota on successful execution only
  if (result.success) {
    await incrementQuota(c.env, c.get('quotaKey'));
  }

  return c.json({
    success: result.success,
    stdout: result.stdout,
    stderr: result.stderr,
    exit_code: result.exit_code,
    execution_time: executionTime,
    tier,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /execute-tests — Run user code against test cases
// ══════════════════════════════════════════════════════════════════════════════

executeRoutes.post('/tests', async (c) => {
  const body = await c.req.json();
  const { userCode, testCases, language, functionName } = body;

  if (!userCode || !testCases || !language || !functionName) {
    throw new ApiError(400, 'userCode, testCases, language, and functionName are required');
  }

  const lang = language.toLowerCase();

  // Cap at 5 test cases (Golden 5 strategy)
  const cappedCases = testCases.slice(0, 5);
  const startTime = Date.now();

  // ── SQL: edge-only execution (no Piston harness) ──
  if (lang === 'sql') {
    const results: TestResult[] = [];
    let passedCount = 0;

    for (let i = 0; i < cappedCases.length; i++) {
      const tc = cappedCases[i];
      const sqlResult = await executeSQL(c.env, userCode);
      const passed = sqlResult.success;
      results.push({
        testCase: i + 1,
        description: tc.description || `Test ${i + 1}`,
        type: tc.type || 'unknown',
        passed,
        output: sqlResult.stdout,
        expected: tc.expected_output,
        executionTime: 0,
        error: sqlResult.stderr || undefined,
      });
      if (passed) passedCount++;
    }

    return c.json({
      success: true,
      summary: {
        totalTests: cappedCases.length,
        passedTests: passedCount,
        failedTests: cappedCases.length - passedCount,
        successRate: Math.round((passedCount / cappedCases.length) * 100),
        allPassed: passedCount === cappedCases.length,
        totalTime: Date.now() - startTime,
      },
      results,
      meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
    });
  }

  // ── Code: SINGLE Piston execution for ALL tests ──
  // Generate a batched harness that runs all tests in one container call
  const harnessCode = generateBatchedTestHarness(lang, userCode, functionName, cappedCases);

  const pistonResult = await executeOnPiston(c.env, lang, harnessCode, '', 3, 128);

  const totalTime = Date.now() - startTime;

  // Parse the ---JSON_START--- delimited output
  const results = parseBatchedResults(pistonResult, cappedCases);
  const passedCount = results.filter(r => r.passed).length;

  // Increment daily quota
  await incrementQuota(c.env, c.get('quotaKey'));

  return c.json({
    success: true,
    summary: {
      totalTests: cappedCases.length,
      passedTests: passedCount,
      failedTests: cappedCases.length - passedCount,
      successRate: Math.round((passedCount / cappedCases.length) * 100),
      allPassed: passedCount === cappedCases.length,
      totalTime,
    },
    results,
    meta: { requestId: c.get('requestId'), timestamp: Date.now(), version: c.env.API_VERSION },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tier 1 (Edge): SQL via D1
// ══════════════════════════════════════════════════════════════════════════════
async function executeSQL(
  env: Env,
  code: string
): Promise<ExecutionResult> {
  try {
    // Split into statements
    const statements = code.split(';').filter(s => s.trim());
    const results: unknown[] = [];

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;

      // Basic security: only allow SELECT, INSERT, UPDATE, DELETE, CREATE TABLE
      const allowed = /^(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE|DROP\s+TABLE|ALTER)/i;
      if (!allowed.test(trimmed)) {
        throw new Error(`Statement not allowed: ${trimmed.slice(0, 50)}`);
      }

      const result = await env.DB.prepare(trimmed).all();
      results.push(result.results);
    }

    return {
      success: true,
      stdout: JSON.stringify(results, null, 2),
      stderr: '',
      exit_code: 0,
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : 'SQL execution failed',
      exit_code: 1,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tier 2 (Piston): Python, JavaScript, Java, C++, C
// Routed through Cloudflare Tunnel → Azure VMSS → Piston container
// ══════════════════════════════════════════════════════════════════════════════

async function executeOnPiston(
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

    const response = await fetch(`${pistonUrl}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: mapping.runtime,
        version: '*',
        files: [{ name: mapping.fileName, content: code }],
        stdin: input,
        args: [],
        compile_timeout: timeLimit * 1000,
        run_timeout: timeLimit * 1000,
        run_memory_limit: memoryLimit * 1024 * 1024, // MB → bytes
      }),
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
 * Generate a batched test harness that runs ALL test cases in a single execution.
 * Uses ---JSON_START--- delimiter to separate user output from test results.
 */
function generateBatchedTestHarness(
  language: string,
  userCode: string,
  functionName: string,
  testCases: Array<{ input_args: unknown[]; expected_output: unknown; description?: string; type?: string }>
): string {
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
    """Normalize for comparison: tuples->lists, sets->sorted lists, round floats."""
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

for _t in _tests:
    _res = {"id": _t["id"], "passed": False, "actual": None, "error": None, "type": _t.get("type", "unknown")}
    try:
        _val = ${functionName}(*_t["input_args"])
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
function parseBatchedResults(
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

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
}

interface TestResult {
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
