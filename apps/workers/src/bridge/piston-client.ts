/**
 * PistonClient — Resilient Bridge to Piston Code Execution Engine
 *
 * Phase 3: Circuit breaker + timeout enforcement + retry with jitter.
 *
 * This module wraps all communication with Piston (via Cloudflare Tunnel → Azure VMSS).
 * It provides enterprise-grade resilience:
 *
 *   1. Circuit Breaker (3-state): CLOSED → OPEN → HALF_OPEN
 *      - Trips OPEN after `failureThreshold` consecutive failures
 *      - Stays OPEN for `resetTimeoutMs`, then transitions to HALF_OPEN
 *      - In HALF_OPEN, one request is allowed through as a probe
 *      - If probe succeeds → CLOSED; if fails → back to OPEN
 *
 *   2. Request Timeout: AbortController-based hard timeout per request
 *      - Default 10s (configurable), separate from Piston's internal timeout
 *      - Kills the fetch if Tunnel/Piston is hung
 *
 *   3. Retry with Jitter: Single retry on transient errors
 *      - Exponential backoff: base * 2^attempt + random jitter
 *      - Only retries on network errors or 5xx, not 4xx
 *
 *   4. Health Reporting: Exposes circuit state for consumer/DO consumption
 *
 * Usage:
 *   const client = PistonClient.getInstance();
 *   const result = await client.execute(env, language, code, input, timeLimit, memoryLimit);
 */

import type { ExecutionResult } from '../routes/execute';
import { PISTON_LANGUAGE_MAP } from '../routes/execute';
import { wrapWithDatasetInjection } from './dataset-injection';

// ══════════════════════════════════════════════════════════════════════════════
// Circuit Breaker Types
// ══════════════════════════════════════════════════════════════════════════════

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  /** Number of consecutive failures before tripping OPEN (default: 5) */
  failureThreshold: number;
  /** How long circuit stays OPEN before allowing a probe (default: 30s) */
  resetTimeoutMs: number;
  /** Window for counting failures — resets after this (default: 60s) */
  failureWindowMs: number;
}

interface CircuitBreakerState {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  trippedAt: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  totalTimeouts: number;
  totalCircuitBreaks: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// Piston Client Config
// ══════════════════════════════════════════════════════════════════════════════

interface PistonClientConfig {
  /** Hard timeout per request in ms (default: 10000) */
  requestTimeoutMs: number;
  /** Max retries on transient failures (default: 1) */
  maxRetries: number;
  /** Base delay for exponential backoff in ms (default: 500) */
  retryBaseDelayMs: number;
  /** Max jitter added to retry delay in ms (default: 300) */
  retryJitterMaxMs: number;
  /** Circuit breaker config */
  circuitBreaker: CircuitBreakerConfig;
}

const DEFAULT_CONFIG: PistonClientConfig = {
  requestTimeoutMs: 10_000,
  maxRetries: 1,
  retryBaseDelayMs: 500,
  retryJitterMaxMs: 300,
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    failureWindowMs: 60_000,
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// Piston Client (Singleton per isolate)
// ══════════════════════════════════════════════════════════════════════════════

export class PistonClient {
  private static instance: PistonClient | null = null;

  private config: PistonClientConfig;
  private cb: CircuitBreakerState;

  private constructor(config?: Partial<PistonClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cb = {
      state: 'CLOSED',
      consecutiveFailures: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      trippedAt: 0,
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalTimeouts: 0,
      totalCircuitBreaks: 0,
    };
  }

  static getInstance(config?: Partial<PistonClientConfig>): PistonClient {
    if (!PistonClient.instance) {
      PistonClient.instance = new PistonClient(config);
    }
    return PistonClient.instance;
  }

  /** Reset singleton (for testing) */
  static reset(): void {
    PistonClient.instance = null;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Execute code on Piston with full resilience:
   * circuit breaker → timeout → retry with jitter
   */
  async execute(
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

    const pistonUrl = env.PISTON_URL;
    if (!pistonUrl) {
      return {
        success: false,
        stdout: '',
        stderr: 'PISTON_URL not configured',
        exit_code: 1,
      };
    }

    // ── Circuit Breaker Check ──
    const cbResult = this.checkCircuit();
    if (cbResult === 'REJECT') {
      this.cb.totalCircuitBreaks++;
      console.log(JSON.stringify({
        type: 'warn',
        action: 'piston_client.circuit_open',
        state: this.cb.state,
        consecutiveFailures: this.cb.consecutiveFailures,
        trippedAt: this.cb.trippedAt,
        totalCircuitBreaks: this.cb.totalCircuitBreaks,
      }));

      return {
        success: false,
        stdout: '',
        stderr: 'Circuit breaker OPEN — Piston backend temporarily unavailable. Retrying shortly.',
        exit_code: 1,
      };
    }

    // ── Execute with Retry ──
    const payload = wrapWithDatasetInjection({
      language: mapping.runtime,
      version: '*',
      files: [{ name: mapping.fileName, content: code }],
      stdin: input,
      args: [] as string[],
      compile_timeout: Math.min(timeLimit, 3) * 1000,
      run_timeout: Math.min(timeLimit, 3) * 1000,
      run_memory_limit: memoryLimit * 1024 * 1024,
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff + jitter
        const delay = this.calculateRetryDelay(attempt);
        console.log(JSON.stringify({
          type: 'info',
          action: 'piston_client.retry',
          attempt,
          delayMs: delay,
          lastError: lastError?.message,
        }));
        await sleep(delay);
      }

      this.cb.totalRequests++;

      try {
        const result = await this.fetchWithTimeout(
          `${pistonUrl}/api/v2/execute`,
          payload
        );

        // Success — reset circuit breaker
        this.onSuccess();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Only retry on transient errors (network, 5xx, timeout)
        if (!this.isTransientError(lastError)) {
          this.onFailure();
          break; // Don't retry 4xx or config errors
        }

        this.onFailure();
      }
    }

    // All retries exhausted
    return {
      success: false,
      stdout: '',
      stderr: lastError?.message || 'Piston execution failed after retries',
      exit_code: 1,
    };
  }

  /** Get current health/circuit breaker status */
  getHealth(): CircuitBreakerState & { config: PistonClientConfig } {
    return {
      ...this.cb,
      config: this.config,
    };
  }

  // ── Circuit Breaker Logic ────────────────────────────────────────────────

  private checkCircuit(): 'ALLOW' | 'REJECT' {
    const now = Date.now();

    switch (this.cb.state) {
      case 'CLOSED':
        // Reset failure count if outside failure window
        if (
          this.cb.consecutiveFailures > 0 &&
          now - this.cb.lastFailureTime > this.config.circuitBreaker.failureWindowMs
        ) {
          this.cb.consecutiveFailures = 0;
        }
        return 'ALLOW';

      case 'OPEN': {
        // Check if reset timeout has elapsed → transition to HALF_OPEN
        const elapsed = now - this.cb.trippedAt;
        if (elapsed >= this.config.circuitBreaker.resetTimeoutMs) {
          this.cb.state = 'HALF_OPEN';
          console.log(JSON.stringify({
            type: 'info',
            action: 'piston_client.circuit_half_open',
            elapsed,
            resetTimeoutMs: this.config.circuitBreaker.resetTimeoutMs,
          }));
          return 'ALLOW'; // Allow one probe request
        }
        return 'REJECT';
      }

      case 'HALF_OPEN':
        // In HALF_OPEN, allow the probe through
        return 'ALLOW';
    }
  }

  private onSuccess(): void {
    this.cb.totalSuccesses++;
    this.cb.consecutiveFailures = 0;
    this.cb.lastSuccessTime = Date.now();

    if (this.cb.state === 'HALF_OPEN') {
      // Probe succeeded — close the circuit
      this.cb.state = 'CLOSED';
      console.log(JSON.stringify({
        type: 'info',
        action: 'piston_client.circuit_closed',
        message: 'Half-open probe succeeded, circuit closed',
      }));
    }
  }

  private onFailure(): void {
    this.cb.totalFailures++;
    this.cb.consecutiveFailures++;
    this.cb.lastFailureTime = Date.now();

    if (this.cb.state === 'HALF_OPEN') {
      // Probe failed — reopen the circuit
      this.cb.state = 'OPEN';
      this.cb.trippedAt = Date.now();
      console.log(JSON.stringify({
        type: 'warn',
        action: 'piston_client.circuit_reopened',
        message: 'Half-open probe failed, circuit reopened',
      }));
      return;
    }

    if (
      this.cb.state === 'CLOSED' &&
      this.cb.consecutiveFailures >= this.config.circuitBreaker.failureThreshold
    ) {
      // Trip the circuit open
      this.cb.state = 'OPEN';
      this.cb.trippedAt = Date.now();
      console.log(JSON.stringify({
        type: 'error',
        action: 'piston_client.circuit_tripped',
        consecutiveFailures: this.cb.consecutiveFailures,
        threshold: this.config.circuitBreaker.failureThreshold,
      }));
    }
  }

  // ── Fetch with AbortController Timeout ───────────────────────────────────

  private async fetchWithTimeout(
    url: string,
    payload: unknown
  ): Promise<ExecutionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'unknown');
        const statusError = new Error(
          `Piston returned ${response.status}: ${errText.slice(0, 200)}`
        );
        // Tag the error with status for retry logic
        (statusError as any).statusCode = response.status;
        throw statusError;
      }

      const pistonResult = await response.json() as PistonResponse;

      // Check compile step (for compiled languages like Java, C++, C)
      if (pistonResult.compile && pistonResult.compile.code !== 0) {
        return {
          success: false,
          stdout: pistonResult.compile.stdout || '',
          stderr:
            pistonResult.compile.stderr ||
            pistonResult.compile.output ||
            'Compilation failed',
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
      if (error instanceof DOMException && error.name === 'AbortError') {
        this.cb.totalTimeouts++;
        throw new Error(
          `Piston request timed out after ${this.config.requestTimeoutMs}ms`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Retry Helpers ────────────────────────────────────────────────────────

  private calculateRetryDelay(attempt: number): number {
    const base = this.config.retryBaseDelayMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * this.config.retryJitterMaxMs;
    return Math.min(base + jitter, 5_000); // Cap at 5s
  }

  private isTransientError(error: Error): boolean {
    const msg = error.message.toLowerCase();

    // Timeout = transient
    if (msg.includes('timed out') || msg.includes('timeout')) return true;

    // Network errors = transient
    if (msg.includes('fetch failed') || msg.includes('network')) return true;

    // 5xx = transient (server error)
    const statusCode = (error as any).statusCode;
    if (statusCode && statusCode >= 500) return true;

    // 429 = transient (rate limited, retry after backoff)
    if (statusCode === 429) return true;

    // 4xx (except 429) = NOT transient — don't retry
    if (statusCode && statusCode >= 400 && statusCode < 500) return false;

    // Connection refused, reset, etc. = transient
    if (msg.includes('econnrefused') || msg.includes('econnreset')) return true;

    // Default: assume transient to be safe
    return true;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Piston Response Types (local to this module)
// ══════════════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
