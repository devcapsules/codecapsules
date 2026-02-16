/**
 * Error Handler Middleware
 * 
 * Global error handling with structured logging.
 * Returns consistent error responses across all routes.
 */

import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = createMiddleware<{ Bindings: Env; Variables: { requestId: string } }>(
  async (c, next) => {
    try {
      await next();
    } catch (error) {
      const requestId = c.get('requestId') || 'unknown';
      
      // Log error
      console.error(JSON.stringify({
        level: 'error',
        requestId,
        path: c.req.path,
        method: c.req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      }));

      // Handle known error types
      if (error instanceof ApiError) {
        return c.json({
          success: false,
          error: error.message,
          code: error.code,
          meta: {
            requestId,
            timestamp: Date.now(),
            version: c.env.API_VERSION,
          },
        }, error.statusCode as 400 | 401 | 403 | 404 | 409 | 413 | 429 | 500);
      }

      if (error instanceof HTTPException) {
        return c.json({
          success: false,
          error: error.message,
          meta: {
            requestId,
            timestamp: Date.now(),
            version: c.env.API_VERSION,
          },
        }, error.status);
      }

      // Unknown error — return 500
      return c.json({
        success: false,
        error: c.env.ENVIRONMENT === 'production' 
          ? 'Internal Server Error' 
          : (error instanceof Error ? error.message : 'Unknown error'),
        meta: {
          requestId,
          timestamp: Date.now(),
          version: c.env.API_VERSION,
        },
      }, 500);
    }
  }
);
