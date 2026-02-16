/**
 * Worker Authentication Middleware
 *
 * Verifies that incoming requests originate from authorized Cloudflare Workers
 * using HMAC-SHA256 signatures with timing-safe comparison.
 *
 * Protocol:
 *   x-worker-signature  — HMAC-SHA256(secret, `${timestamp}:${caller}:${body}`)
 *   x-worker-timestamp  — Unix epoch ms (must be within 30 s of server time)
 *   x-worker-caller     — Identifier of the calling Worker (e.g. 'generation-consumer')
 *
 * Standalone — only depends on Node.js `crypto` module. No npm packages.
 */

import crypto from 'crypto';

const MAX_TIMESTAMP_DRIFT_MS = 30_000; // 30 seconds

export interface WorkerAuthConfig {
  sharedSecret: string;
  allowedCallers: string[];
}

export interface VerifyResult {
  valid: boolean;
  caller?: string;
  error?: string;
}

/**
 * Verify that a request came from an authorized Cloudflare Worker
 */
export function verifyWorkerRequest(
  req: { headers: Record<string, string | string[] | undefined>; body: any },
  config: WorkerAuthConfig
): VerifyResult {
  const getHeader = (name: string): string | undefined => {
    const val = req.headers[name] || req.headers[name.toLowerCase()];
    return Array.isArray(val) ? val[0] : val;
  };

  const signature = getHeader('x-worker-signature');
  const timestampStr = getHeader('x-worker-timestamp');
  const caller = getHeader('x-worker-caller');

  // ── Check required headers ──
  if (!signature || !timestampStr || !caller) {
    return {
      valid: false,
      error: 'Missing worker auth headers (signature, timestamp, or caller)',
    };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, error: 'Invalid timestamp format' };
  }

  // ── Check caller is allowed ──
  if (!config.allowedCallers.includes(caller)) {
    return { valid: false, error: `Unknown caller: ${caller}` };
  }

  // ── Check timestamp freshness (prevent replay attacks) ──
  const drift = Math.abs(Date.now() - timestamp);
  if (drift > MAX_TIMESTAMP_DRIFT_MS) {
    return {
      valid: false,
      error: `Request expired (timestamp drift: ${drift}ms > ${MAX_TIMESTAMP_DRIFT_MS}ms)`,
    };
  }

  // ── Verify HMAC signature ──
  const payload = typeof req.body === 'string'
    ? req.body
    : JSON.stringify(req.body);

  const expectedSig = crypto
    .createHmac('sha256', config.sharedSecret)
    .update(`${timestamp}:${caller}:${payload}`)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }
  } catch {
    // timingSafeEqual throws if buffer lengths differ
    return { valid: false, error: 'Invalid signature format' };
  }

  return { valid: true, caller };
}

/**
 * Express middleware for the /internal router.
 *
 * Mounted on app.use('/internal', workerAuthMiddleware(...))
 * so req.path is relative (e.g. '/generate', '/health').
 * The /health sub-route is public for Docker health probes.
 */
export function workerAuthMiddleware(authConfig: WorkerAuthConfig) {
  return (req: any, res: any, next: any) => {
    // /internal/health is public — Docker health checks need it
    if (req.path === '/health' || req.path === '/health/') {
      return next();
    }

    const result = verifyWorkerRequest(
      { headers: req.headers, body: req.body },
      authConfig
    );

    if (!result.valid) {
      console.warn(`⚠️ Unauthorized /internal request: ${result.error}`, {
        path: req.path,
        caller: req.headers['x-worker-caller'] || 'none',
      });

      return res.status(401).json({
        error: 'Unauthorized',
        detail: result.error,
      });
    }

    // Attach caller for downstream logging
    req.workerCaller = result.caller;
    next();
  };
}
