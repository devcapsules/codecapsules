/**
 * Request ID Middleware
 * 
 * Generates unique request ID for tracing.
 * Uses CF-Ray header if available, otherwise generates UUID.
 */

import { createMiddleware } from 'hono/factory';

export const requestId = createMiddleware<{ Bindings: Env; Variables: { requestId: string } }>(
  async (c, next) => {
    const cfRay = c.req.header('cf-ray');
    const id = cfRay || crypto.randomUUID();
    
    c.set('requestId', id);
    c.header('X-Request-ID', id);
    
    await next();
  }
);
