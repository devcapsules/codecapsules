/**
 * Queue-based Code Execution Client
 * Uses the new Phase 2 queue system for scalable code execution
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
  websocketChannel: string;
}

export interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: ExecutionResult;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Execute code using the queue system
 * This is the new scalable method that replaces direct Lambda calls
 */
export async function executeCodeAsync(
  language: string,
  code: string,
  input: string = ''
): Promise<ExecutionResult> {
  // 1. Submit job to queue
  const submitResponse = await fetch(`${API_URL}/api/v2/execute/${language}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, input })
  });

  if (!submitResponse.ok) {
    const error = await submitResponse.json();
    throw new Error(error.message || 'Failed to submit job');
  }

  const { jobId, statusUrl }: QueueJobResponse = await submitResponse.json();

  // 2. Poll for results (with timeout)
  const maxAttempts = 60; // 60 seconds max
  const pollInterval = 1000; // 1 second

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const statusResponse = await fetch(`${API_URL}${statusUrl}`);
    
    if (!statusResponse.ok) {
      continue; // Retry
    }

    const status: JobStatusResponse = await statusResponse.json();

    if (status.status === 'completed' || status.status === 'failed') {
      return status.result || {
        success: false,
        stdout: '',
        stderr: 'No result returned',
        exitCode: 1,
        language
      };
    }
  }

  throw new Error('Execution timed out');
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
