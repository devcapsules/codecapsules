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
const POLL_INTERVAL_MS = 300;   // Poll every 300ms
const POLL_TIMEOUT_MS = 30_000; // Give up after 30s

/**
 * Poll a job until it completes or fails
 */
async function pollJobResult(jobId: string): Promise<JobStatusResponse> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${API_URL}/execute/runs/${jobId}`);

    if (!res.ok) {
      if (res.status === 404) {
        // Job not found yet — might still be propagating to KV
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      throw new Error(`Poll failed: ${res.status}`);
    }

    const data = (await res.json()) as JobStatusResponse;

    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }

    // Still queued or running — wait and retry
    await sleep(POLL_INTERVAL_MS);
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
 * Generate test wrapper code for a specific language
 */
function generateTestCode(
  language: string,
  userCode: string,
  functionName: string,
  input: any
): string {
  const inputStr = JSON.stringify(input);

  switch (language.toLowerCase()) {
    case 'python':
      return `${userCode}

# Test execution
import json
result = ${functionName}(${Array.isArray(input) ? input.map(i => JSON.stringify(i)).join(', ') : inputStr})
print(result)`;

    case 'javascript':
      return `${userCode}

// Test execution
const result = ${functionName}(${Array.isArray(input) ? input.map(i => JSON.stringify(i)).join(', ') : inputStr});
console.log(result);`;

    default:
      return userCode;
  }
}

export default {
  executeCodeAsync,
  executeWithTests
};
