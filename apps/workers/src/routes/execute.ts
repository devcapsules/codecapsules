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
  const results: TestResult[] = [];
  let passedCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testResult = await runSingleTest(
      c.env,
      lang,
      userCode,
      functionName,
      testCase
    );

    results.push({
      testCase: i + 1,
      description: testCase.description || `Test ${i + 1}`,
      passed: testResult.passed,
      output: testResult.output,
      expected: testCase.expected,
      executionTime: testResult.executionTime,
      error: testResult.error,
    });

    if (testResult.passed) passedCount++;
  }

  const totalTime = Date.now() - startTime;

  // Increment daily quota (test runs count as executions)
  await incrementQuota(c.env, c.get('quotaKey'));

  return c.json({
    success: true,
    summary: {
      totalTests: testCases.length,
      passedTests: passedCount,
      failedTests: testCases.length - passedCount,
      successRate: Math.round((passedCount / testCases.length) * 100),
      allPassed: passedCount === testCases.length,
      totalTime,
    },
    results,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
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
// Helper: Run single test case
// ══════════════════════════════════════════════════════════════════════════════

async function runSingleTest(
  env: Env,
  language: string,
  userCode: string,
  functionName: string,
  testCase: { input_args: unknown[]; expected_output: unknown; description?: string }
): Promise<{ passed: boolean; output: unknown; executionTime: number; error?: string }> {
  const startTime = Date.now();

  // Generate test harness code
  const harnessCode = generateTestHarness(language, userCode, functionName, testCase);

  // Execute — SQL on edge, everything else on Piston
  let result: ExecutionResult;
  if (language === 'sql') {
    result = await executeSQL(env, harnessCode);
  } else {
    result = await executeOnPiston(env, language, harnessCode, '', 10, 128);
  }

  const executionTime = Date.now() - startTime;

  // Parse result
  if (!result.success) {
    return { passed: false, output: null, executionTime, error: result.stderr };
  }

  const stdout = result.stdout.trim();
  const passed = stdout.includes('TEST_PASSED');

  return { passed, output: stdout, executionTime };
}

/**
 * Generate test harness code
 */
function generateTestHarness(
  language: string,
  userCode: string,
  functionName: string,
  testCase: { input_args: unknown[]; expected_output: unknown }
): string {
  // Base64 encode test data (Layer 1 defense)
  const testDataB64 = btoa(JSON.stringify({
    input_args: testCase.input_args,
    expected_output: testCase.expected_output,
  }));

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

# Test harness
import json
import base64
import sys

try:
    test_data = json.loads(base64.b64decode("${testDataB64}").decode('utf-8'))
    args = test_data['input_args']
    expected = test_data['expected_output']
    
    actual = ${functionName}(*args)
    
    if actual == expected:
        print('TEST_PASSED')
    else:
        print(f'FAILED: expected {expected}, got {actual}')
        sys.exit(1)
except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)
`;
  }

  if (language === 'javascript') {
    return `
// User code
${userCode}

// Test harness
const testDataB64 = "${testDataB64}";
const testData = JSON.parse(atob(testDataB64));
const args = testData.input_args;
const expected = testData.expected_output;

try {
    const actual = ${functionName}(...args);
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        console.log('TEST_PASSED');
    } else {
        console.log(\`FAILED: expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\`);
        process.exit(1);
    }
} catch (e) {
    console.log(\`ERROR: \${e.message}\`);
    process.exit(1);
}
`;
  }

  // For other languages, return simple wrapper
  return userCode;
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
