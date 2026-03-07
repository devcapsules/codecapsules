/**
 * Supabase Auth Proxy
 *
 * Proxies all Supabase Auth/REST requests through Cloudflare Workers
 * to bypass ISP-level DNS blocks (e.g. Indian ISPs blocking supabase.co).
 *
 * The dashboard Supabase client points to:
 *   https://devcapsules-api.devleep-edu.workers.dev/supabase
 * instead of:
 *   https://dinerkhhhoibcrznysen.supabase.co
 *
 * This route transparently forwards all requests to the real Supabase.
 */

import { Hono } from 'hono';

const SUPABASE_ORIGIN = 'https://dinerkhhhoibcrznysen.supabase.co';

type Variables = {
  requestId: string;
  auth: Auth | null;
  startTime: number;
};

export const supabaseProxy = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Catch-all proxy: forward every request to Supabase unchanged.
 * Preserves path, headers, method, and body.
 *
 * Example:
 *   POST /supabase/auth/v1/token?grant_type=password
 *   → POST https://dinerkhhhoibcrznysen.supabase.co/auth/v1/token?grant_type=password
 */
supabaseProxy.all('/*', async (c) => {
  // Build the target URL: strip the /supabase mount prefix
  const url = new URL(c.req.url);
  // c.req.path gives the path relative to the Hono sub-router mount point,
  // but c.req.url keeps the full original path. Strip the prefix manually.
  const supabasePath = url.pathname.replace(/^\/supabase/, '');
  const targetUrl = `${SUPABASE_ORIGIN}${supabasePath}${url.search}`;

  // Clone headers, swap host
  const headers = new Headers(c.req.raw.headers);
  headers.set('Host', new URL(SUPABASE_ORIGIN).host);
  // Remove CF-specific headers that might confuse Supabase
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');

  // Forward the request
  const init: RequestInit = {
    method: c.req.method,
    headers,
    redirect: 'manual', // Don't follow redirects — pass them through
  };

  // Attach body for non-GET/HEAD requests
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    init.body = c.req.raw.body;
    // @ts-ignore — duplex is needed for streaming body in Workers
    init.duplex = 'half';
  }

  try {
    const response = await fetch(targetUrl, init);

    // Buffer the full response body — Workers auto-decompresses gzip but
    // keeps stale content-length/content-encoding headers which causes the
    // browser to see a truncated / empty body ("Unexpected end of JSON input").
    const body = await response.arrayBuffer();

    // Build response headers (strip hop-by-hop & encoding headers)
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('connection');
    responseHeaders.delete('content-encoding'); // Already decompressed by Workers
    responseHeaders.delete('content-length');   // Will be set from actual body size

    // Set CORS headers for browser access
    const origin = c.req.header('Origin');
    if (origin) {
      responseHeaders.set('Access-Control-Allow-Origin', origin);
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
      responseHeaders.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type, x-supabase-api-version');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Expose-Headers', 'x-supabase-api-version');
    }

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Supabase proxy error:', err);
    return c.json({
      success: false,
      error: 'Failed to reach Supabase backend',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, 502);
  }
});
