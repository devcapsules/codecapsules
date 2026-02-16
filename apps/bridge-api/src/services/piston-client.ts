/**
 * Piston Proxy — Transparent /api/v2/* Relay
 *
 * Workers call PISTON_URL/api/v2/execute which arrives here via cloudflared.
 * This router forwards the request to the Piston container on the Docker
 * internal network (http://piston:2000) — zero auth needed because the
 * Cloudflare Tunnel is the security boundary.
 *
 * Forwarded paths:
 *   /api/v2/execute     → POST  — Run user code
 *   /api/v2/runtimes    → GET   — List installed runtimes
 *   /api/v2/packages    → POST  — Install a Piston package (used by cloud-init)
 */

import { Router, Request, Response } from 'express';

export function createPistonProxy(pistonUrl: string): Router {
  const router = Router();

  router.all('/*', async (req: Request, res: Response) => {
    const targetUrl = `${pistonUrl}/api/v2${req.path}`;

    try {
      const fetchOptions: RequestInit = {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const upstream = await fetch(targetUrl, fetchOptions);
      const body = await upstream.text();

      // Forward status + safe headers
      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(lower)) {
          res.setHeader(key, value);
        }
      });

      res.send(body);
    } catch (error: any) {
      console.error(`Piston proxy error: ${req.method} ${targetUrl}:`, error.message);
      res.status(502).json({
        error: 'Piston proxy failed',
        detail: error.message,
      });
    }
  });

  return router;
}
