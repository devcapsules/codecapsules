/**
 * Body Size Limit Middleware — Stream-Safe (Hono Native)
 *
 * Uses Hono's built-in bodyLimit which intercepts the incoming byte stream
 * and counts actual chunks as they arrive. If physical bytes exceed the limit,
 * the connection is severed BEFORE JSON parsing — eliminating:
 *
 *   1. Content-Length spoofing (header says 100B, body is 50MB)
 *   2. Transfer-Encoding: chunked bypass (no Content-Length at all)
 *   3. V8 isolate OOM crashes from parsing massive payloads
 *
 * We export route-specific middleware instances. Apply them directly to
 * the sub-routers that need them, not as a global path-guessing wildcard.
 *
 * Limits:
 *   /execute   → 100KB  (source code + metadata)
 *   /generate  → 512KB  (prompts can be longer)
 *   default    → 1MB    (capsule content, etc.)
 */

import { bodyLimit } from 'hono/body-limit';
import { ApiError } from './error-handler';

// Route-specific limits (bytes)
const LIMITS = {
  EXECUTE: 100 * 1024,   // 100KB
  GENERATE: 512 * 1024,  // 512KB
  DEFAULT: 1024 * 1024,  // 1MB
} as const;

/** Apply on executeRoutes sub-router: executeRoutes.use('*', executeLimit) */
export const executeLimit = bodyLimit({
  maxSize: LIMITS.EXECUTE,
  onError: () => {
    throw new ApiError(413, 'Request body too large. Maximum 100KB for execution.', 'BODY_TOO_LARGE');
  },
});

/** Apply on generateRoutes sub-router: generateRoutes.use('*', generateLimit) */
export const generateLimit = bodyLimit({
  maxSize: LIMITS.GENERATE,
  onError: () => {
    throw new ApiError(413, 'Request body too large. Maximum 512KB for generation.', 'BODY_TOO_LARGE');
  },
});

/** Apply as default on the api router: api.use('*', defaultBodyLimit) */
export const defaultBodyLimit = bodyLimit({
  maxSize: LIMITS.DEFAULT,
  onError: () => {
    throw new ApiError(413, 'Request body too large. Maximum 1MB.', 'BODY_TOO_LARGE');
  },
});
