/**
 * Queue-based Code Execution Client
 *
 * Supports two modes:
 * - Sync (SQL): POST /execute returns result inline
 * - Async (Piston): POST /execute returns jobId → poll GET /execute/runs/:jobId
 *
 * The client auto-detects which mode based on the response status code:
 * - 200 → sync result (SQL on edge)
 * - 202 → async job → poll until completed/failed
 */

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  language: string;
}

export interface QueueJobResponse {
  success: boolean;
  jobId: string;
  status: string;
  statusUrl: string;
}

export interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  type: 'run' | 'tests';
  result?: {
    success: boolean;
    stdout: string;
    stderr: string;
    exit_code: number;
    execution_time: number;
    tier: string;
  };
  testResult?: {
    success: boolean;
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      successRate: number;
      allPassed: boolean;
      totalTime: number;
    };
    results: Array<{
      testCase: number;
      description: string;
      type: string;
      passed: boolean;
      output: unknown;
      expected: unknown;
      executionTime: number;
      error?: string;
    }>;
  };
  error?: string;
  createdAt?: number;
  completedAt?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Poll configuration ──
const POLL_START_MS = 2000;     // Start polling at 2s
const POLL_MAX_MS = 6000;       // Cap at 6s
const POLL_TIMEOUT_MS = 60_000; // Give up after 60s

/**
 * Poll a job until it completes or fails (exponential backoff)
 */
async function pollJobResult(jobId: string): Promise<JobStatusResponse> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let interval = POLL_START_MS;

  while (Date.now() < deadline) {
    await sleep(interval);
    interval = Math.min(interval * 1.5, POLL_MAX_MS);

    const res = await fetch(`${API_URL}/execute/runs/${jobId}`);

    if (!res.ok) {
      if (res.status === 404) {
        // Job not found yet — might still be propagating to KV
        continue;
      }
      throw new Error(`Poll failed: ${res.status}`);
    }

    const data = (await res.json()) as JobStatusResponse;

    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }
  }

  throw new Error('Execution timed out — the server may be under heavy load. Please try again.');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute code using the async queue pipeline.
 * Auto-detects sync (SQL) vs async (Piston) based on HTTP status.
 */
export async function executeCodeAsync(
  language: string,
  code: string,
  input: string = ''
): Promise<ExecutionResult> {
  const response = await fetch(`${API_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      source_code: code, 
      language,
      input,
      time_limit: 10,
      memory_limit: 128
    })
  });

  if (!response.ok && response.status !== 202) {
    const error = await response.json().catch(() => ({ error: 'Execution failed' }));
    throw new Error((error as any).error || (error as any).message || 'Failed to execute code');
  }

  const result = await response.json() as any;

  // ── Sync path (SQL — 200) ──
  if (response.status === 200) {
    return {
      success: result.success,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exit_code ?? (result.success ? 0 : 1),
      language
    };
  }

  // ── Async path (Piston — 202) ──
  const jobId = result.jobId as string;
  if (!jobId) {
    throw new Error('Server returned 202 but no jobId');
  }

  const jobResult = await pollJobResult(jobId);

  if (jobResult.status === 'failed') {
    throw new Error(jobResult.error || 'Execution failed on server');
  }

  if (jobResult.result) {
    return {
      success: jobResult.result.success,
      stdout: jobResult.result.stdout || '',
      stderr: jobResult.result.stderr || '',
      exitCode: jobResult.result.exit_code ?? (jobResult.result.success ? 0 : 1),
      language,
    };
  }

  throw new Error('Job completed but no result returned');
}

/**
 * Execute code with test cases using the queue system
 */
export async function executeWithTests(
  language: string,
  userCode: string,
  testCases: Array<{ input: any; expected_output: any; description?: string }>,
  functionName: string = 'solution'
): Promise<{
  success: boolean;
  results: Array<{
    passed: boolean;
    description: string;
    expected: any;
    actual: any;
    error?: string;
  }>;
  output: string;
  stderr: string;
}> {
  const results = [];
  let allOutput = '';
  let allStderr = '';

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    // Generate test wrapper code based on language
    const testCode = generateTestCode(language, userCode, functionName, testCase.input);
    
    try {
      const result = await executeCodeAsync(language, testCode, '');
      const actualOutput = result.stdout.trim();
      const expectedOutput = String(testCase.expected_output).trim();
      const passed = actualOutput === expectedOutput;

      results.push({
        passed,
        description: testCase.description || `Test case ${i + 1}`,
        expected: testCase.expected_output,
        actual: actualOutput || result.stderr,
        error: result.success ? undefined : result.stderr
      });

      allOutput += result.stdout;
      allStderr += result.stderr;
    } catch (error) {
      results.push({
        passed: false,
        description: testCase.description || `Test case ${i + 1}`,
        expected: testCase.expected_output,
        actual: '',
        error: error instanceof Error ? error.message : 'Execution failed'
      });
    }
  }

  return {
    success: results.every(r => r.passed),
    results,
    output: allOutput,
    stderr: allStderr
  };
}

/**
 * Convert a JS value to a valid Python literal string.
 * Handles null→None, true→True, false→False, nested arrays/objects.
 */
function toPythonLiteral(value: any): string {
  if (value === null || value === undefined) return 'None';
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `[${value.map(toPythonLiteral).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${toPythonLiteral(v)}`);
    return `{${entries.join(', ')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Generate test wrapper code for a specific language
 */
function generateTestCode(
  language: string,
  userCode: string,
  functionName: string,
  input: any
): string {
  switch (language.toLowerCase()) {
    case 'python':
      return `${userCode}

# Test execution
result = ${functionName}(${Array.isArray(input) ? input.map(toPythonLiteral).join(', ') : toPythonLiteral(input)})
print(result)`;

    case 'javascript': {
      const inputStr = JSON.stringify(input);
      return `${userCode}

// Test execution
const result = ${functionName}(${Array.isArray(input) ? input.map(i => JSON.stringify(i)).join(', ') : inputStr});
console.log(result);`;
    }

    default:
      return userCode;
  }
}

export default {
  executeCodeAsync,
  executeWithTests
};
