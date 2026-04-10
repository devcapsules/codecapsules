/**
 * Dynamic Expected Output (DEO) — Post-Generation Test Calibration
 *
 * Problem:
 *   AI agents generate test cases with invented expected_output values because
 *   they never see the real CSV data (Apple 497 rows, Spotify 300 rows).
 *   This causes every data-analysis capsule's tests to fail at publish time.
 *
 * Solution:
 *   After generation, run the reference solution against real data on Piston
 *   for each test case. Capture the actual outputs and patch expected_output
 *   before the capsule is stored in KV. The user never sees wrong values.
 *
 * Where this runs:
 *   generation-consumer.ts → after pipeline result, before KV write (Step 9→10)
 *
 * Safety:
 *   - Only applies when isDataAnalysisContext() returns true
 *   - Non-fatal: if Piston execution fails, we log a warning and keep AI values
 *   - Timeout-aware: single Piston call, 3s limit (matches server cap)
 */

import { executeOnPiston, type ExecutionResult } from '../routes/execute';

// ══════════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════════

interface TestCase {
  id?: number;
  name?: string;
  input?: string;
  expected?: string;
  description?: string;
  input_args?: unknown[];
  expected_output?: unknown;
  is_hidden?: boolean;
  type?: string;
}

interface DEOResult {
  patched: boolean;
  patchedCount: number;
  totalTests: number;
  errors: string[];
}

// ══════════════════════════════════════════════════════════════════════════════
// Data Analysis Detection
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a capsule is a data-analysis capsule that needs DEO calibration.
 * Primary signal: capsuleMode === 'data-analysis' (explicit user selection).
 * Fallback: solution code references .csv files.
 */
export function needsDEO(language: string, prompt?: string, capsule?: any, capsuleMode?: string): boolean {
  // Explicit mode selection — most reliable signal
  if (capsuleMode === 'data-analysis') return true;

  const lang = (language || '').toLowerCase();

  // SQL capsules always need DEO if they reference CSV datasets
  if (lang === 'sql') return false; // SQL uses D1, not Piston CSVs — skip for now

  // Only Python data analysis capsules need DEO
  if (lang !== 'python') return false;

  // Check if the solution code references .csv files (strong signal independent of prompt)
  const solutionCode = extractSolutionCode(capsule);
  if (solutionCode && solutionCode.includes('.csv')) return true;

  return false;
}

// ══════════════════════════════════════════════════════════════════════════════
// Capsule Structure Helpers
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Extract reference solution code from the Universal Format capsule.
 */
function extractSolutionCode(capsule: any): string | null {
  if (!capsule) return null;

  // Universal format paths
  return capsule.solution
    || capsule.content?.primary?.code?.wasmVersion?.solution
    || null;
}

/**
 * Extract function name from solution code.
 */
function extractFunctionName(code: string): string {
  // Python: find last top-level (unindented) def — handles class + wrapper pattern
  const topLevelDefs = [...code.matchAll(/^def\s+(\w+)\s*\(/gm)];
  if (topLevelDefs.length > 0) return topLevelDefs[topLevelDefs.length - 1][1];
  const pyMatch = code.match(/def\s+(\w+)\s*\(/);
  if (pyMatch) return pyMatch[1];
  const jsMatch = code.match(/function\s+(\w+)\s*\(/) || code.match(/const\s+(\w+)\s*=\s*\(/);
  if (jsMatch) return jsMatch[1];
  return 'solution';
}

/**
 * Extract test cases from the Universal Format capsule.
 * Returns both the array and a path indicator for patching back.
 */
function extractTestCases(capsule: any): TestCase[] {
  if (!capsule) return [];

  // Top-level testCases (most common)
  if (Array.isArray(capsule.testCases) && capsule.testCases.length > 0) {
    return capsule.testCases;
  }

  // Nested in content.primary.code.wasmVersion.testCases
  const wasmTests = capsule.content?.primary?.code?.wasmVersion?.testCases;
  if (Array.isArray(wasmTests) && wasmTests.length > 0) {
    return wasmTests;
  }

  // Content-level testCases
  if (Array.isArray(capsule.content?.testCases) && capsule.content.testCases.length > 0) {
    return capsule.content.testCases;
  }

  return [];
}

// ══════════════════════════════════════════════════════════════════════════════
// Core DEO: Run Reference Solution → Capture Real Outputs → Patch
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Run the reference solution on Piston for each test case, capture real outputs,
 * and patch the expected_output values in-place on the capsule object.
 *
 * Uses a single Piston execution with a batched harness (same as test execution)
 * to minimize latency and Piston calls.
 */
export async function calibrateExpectedOutputs(
  capsule: any,
  env: Env,
  jobId: string,
): Promise<DEOResult> {
  const result: DEOResult = {
    patched: false,
    patchedCount: 0,
    totalTests: 0,
    errors: [],
  };

  try {
    // 1. Extract solution code
    const solutionCode = extractSolutionCode(capsule);
    if (!solutionCode) {
      result.errors.push('No reference solution found');
      return result;
    }

    // 2. Extract test cases
    const testCases = extractTestCases(capsule);
    result.totalTests = testCases.length;

    if (testCases.length === 0) {
      result.errors.push('No test cases found');
      return result;
    }

    // 3. Extract function name
    const functionName = capsule.content?.functionName
      || extractFunctionName(solutionCode);

    console.log(JSON.stringify({
      type: 'info',
      action: 'deo.calibrate_start',
      jobId,
      functionName,
      testCount: testCases.length,
      solutionPreview: solutionCode.substring(0, 100),
    }));

    // 4. Build a DEO-specific harness that captures actual outputs WITHOUT comparing
    //    This is similar to generateBatchedTestHarness but only captures outputs.
    const harnessCode = buildDEOHarness(solutionCode, functionName, testCases);

    // 5. Execute on Piston (with dataset injection via the existing pipeline)
    const pistonResult = await executeOnPiston(
      env,
      'python',
      harnessCode,
      '',  // no stdin
      3,   // 3 second timeout (Piston server max)
      256, // 256MB memory (server-side -1 overrides to unlimited)
    );

    // 6. Parse the results
    if (!pistonResult.success && !pistonResult.stdout.includes('---DEO_START---')) {
      result.errors.push(`Piston execution failed: ${pistonResult.stderr || 'unknown error'}`);
      console.warn(JSON.stringify({
        type: 'warn',
        action: 'deo.piston_failed',
        jobId,
        stderr: pistonResult.stderr?.substring(0, 500),
        exitCode: pistonResult.exit_code,
      }));
      return result;
    }

    // 7. Parse DEO results from stdout
    const parts = pistonResult.stdout.split('---DEO_START---');
    if (parts.length < 2) {
      result.errors.push('DEO harness output missing delimiter');
      return result;
    }

    const jsonStr = parts[1].trim();
    let deoResults: Array<{
      id: number;
      success: boolean;
      actual_output: unknown;
      error?: string;
    }>;

    try {
      deoResults = JSON.parse(jsonStr);
    } catch (parseErr) {
      result.errors.push(`DEO JSON parse failed: ${parseErr}`);
      return result;
    }

    // 8. Patch expected_output in-place for each successful execution
    for (const deoItem of deoResults) {
      const testIndex = deoItem.id - 1;
      if (testIndex < 0 || testIndex >= testCases.length) continue;

      if (deoItem.success && deoItem.actual_output !== undefined) {
        const tc = testCases[testIndex];

        // Patch both expected_output and expected (Universal Format has both)
        tc.expected_output = deoItem.actual_output;
        tc.expected = JSON.stringify(deoItem.actual_output);

        result.patchedCount++;
      } else if (deoItem.error) {
        result.errors.push(`Test ${deoItem.id}: ${deoItem.error}`);
      }
    }

    // 9. Write patched test cases back to all locations in the capsule
    if (result.patchedCount > 0) {
      patchCapsuleTestCases(capsule, testCases);
      result.patched = true;
    }

    console.log(JSON.stringify({
      type: 'info',
      action: 'deo.calibrate_complete',
      jobId,
      patched: result.patched,
      patchedCount: result.patchedCount,
      totalTests: result.totalTests,
      errors: result.errors.length,
    }));

    return result;

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`DEO unexpected error: ${msg}`);
    console.error(JSON.stringify({
      type: 'error',
      action: 'deo.calibrate_error',
      jobId,
      error: msg,
    }));
    return result;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DEO Harness Builder
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Build a Python harness that runs the reference solution for each test case
 * and captures the actual output (without comparing to expected).
 *
 * Uses the same ---delimiter--- pattern as the test harness for consistency.
 * Dataset injection (symlinks) will be applied by wrapWithDatasetInjection()
 * in executeOnPiston → PistonClient.
 */
function buildDEOHarness(
  solutionCode: string,
  functionName: string,
  testCases: TestCase[],
): string {
  // Build a safe JSON representation of test input_args
  const testData = testCases.map((tc, i) => ({
    id: i + 1,
    input_args: tc.input_args || [],
  }));

  // UTF-8 safe base64 encode
  const testDataB64 = utf8ToBase64(JSON.stringify(testData));

  return `
# Force determinism
import random
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

# Reference solution
${solutionCode}

# --- DEO HARNESS: Capture actual outputs ---
import json
import base64

def _deo_normalize(obj):
    """Normalize output for storage: tuples->lists, sets->sorted lists, round floats, pandas->native."""
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
        return [_deo_normalize(x) for x in obj]
    if isinstance(obj, set):
        return sorted([_deo_normalize(x) for x in obj], key=lambda x: json.dumps(x, default=str))
    if isinstance(obj, dict):
        return {k: _deo_normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_deo_normalize(x) for x in obj]
    if isinstance(obj, float):
        return round(obj, 6)
    return obj

_deo_tests = json.loads(base64.b64decode("${testDataB64}").decode('utf-8'))
_deo_results = []

for _t in _deo_tests:
    _res = {"id": _t["id"], "success": False, "actual_output": None, "error": None}
    try:
        _val = ${functionName}(*_t["input_args"])
        _res["actual_output"] = _deo_normalize(_val)
        _res["success"] = True
    except Exception as _e:
        _res["error"] = str(_e)
    _deo_results.append(_res)

print("---DEO_START---")
print(json.dumps(_deo_results, default=str))
`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

/**
 * UTF-8 safe base64 encode (same as execute.ts)
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
 * Write patched test cases back to all locations in the capsule object.
 * The Universal Format stores tests in multiple places for backwards compatibility.
 */
function patchCapsuleTestCases(capsule: any, patchedTests: TestCase[]): void {
  // Top-level testCases
  if (Array.isArray(capsule.testCases)) {
    capsule.testCases = patchedTests;
  }

  // content.testCases
  if (capsule.content && Array.isArray(capsule.content.testCases)) {
    capsule.content.testCases = patchedTests;
  }

  // content.primary.code.wasmVersion.testCases
  if (capsule.content?.primary?.code?.wasmVersion) {
    capsule.content.primary.code.wasmVersion.testCases = patchedTests;
  }
}
