/**
 * Worker Authentication Middleware
 * 
 * Verify requests come from our Cloudflare Workers.
 * This replaces the missing auth on server.ts with a different model:
 * Users never hit Lambda directly. Workers are the only caller.
 */

import crypto from 'crypto';

const MAX_TIMESTAMP_DRIFT_MS = 30_000; // 30 seconds

export interface WorkerAuthConfig {
  sharedSecret: string;
  allowedCallers: string[]; // e.g., ['generation-consumer', 'mentor-worker']
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
      error: 'Missing worker auth headers (signature, timestamp, or caller)' 
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
      error: `Request expired (timestamp drift: ${drift}ms > ${MAX_TIMESTAMP_DRIFT_MS}ms)` 
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

  // Use timing-safe comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }
  } catch (err) {
    // timingSafeEqual throws if buffer lengths differ
    return { valid: false, error: 'Invalid signature format' };
  }

  return { valid: true, caller };
}

/**
 * Express middleware for worker authentication
 * 
 * Routes:
 * - /health: Always public (for load balancer health checks)
 * - /internal/*: Requires worker authentication
 * - Everything else: Blocked (users must go through Workers)
 */
export function workerAuthMiddleware(config: WorkerAuthConfig) {
  return (req: any, res: any, next: any) => {
    // Health check is always public (for ALB/Lambda health checks)
    if (req.path === '/health' || req.path === '/') {
      return next();
    }

    // Internal endpoints require worker auth
    if (req.path.startsWith('/internal/')) {
      const result = verifyWorkerRequest(
        { headers: req.headers, body: req.body },
        config
      );

      if (!result.valid) {
        console.warn(`⚠️ Unauthorized internal request: ${result.error}`, {
          path: req.path,
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          caller: req.headers['x-worker-caller'] || 'none',
        });
        
        return res.status(401).json({ 
          error: 'Unauthorized', 
          detail: result.error 
        });
      }

      // Attach caller info for logging/auditing
      req.workerCaller = result.caller;
      return next();
    }

    // ── Development mode bypass ──
    // In development (local), allow direct /api/* access for testing
    const isDev = process.env.NODE_ENV === 'development' || 
                  process.env.ALLOW_DIRECT_ACCESS === 'true';
    
    if (isDev) {
      return next();
    }

    // ── Production mode ──
    // Block ALL direct external access to /api/* routes.
    // In the hybrid model, users NEVER hit Lambda directly.
    // They must go through Workers at api.devcapsules.com
    if (req.path.startsWith('/api/')) {
      console.warn(`🚫 Blocked direct /api/ access: ${req.path}`, {
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      return res.status(403).json({
        error: 'Direct access forbidden',
        message: 'Please use api.devcapsules.com',
        hint: 'This Lambda endpoint only accepts requests from authorized Cloudflare Workers',
      });
    }

    // Allow other paths to pass through
    next();
  };
}

/**
 * Get worker auth config from environment
 */
export function getWorkerAuthConfig(): WorkerAuthConfig {
  const sharedSecret = process.env.WORKER_SHARED_SECRET;
  
  if (!sharedSecret) {
    console.warn('⚠️ WORKER_SHARED_SECRET not set - using development default');
  }

  return {
    sharedSecret: sharedSecret || 'dev-secret-change-me-in-production',
    allowedCallers: [
      'generation-consumer',
      'mentor-worker',
      'test-executor',
      'feedback-worker',
      'capsule-worker',
      'analytics-worker',
    ],
  };
}
