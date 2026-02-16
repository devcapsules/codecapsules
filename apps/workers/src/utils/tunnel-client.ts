/**
 * Tunnel Client — Signed HTTP Client for Workers → Azure VM Communication
 * 
 * Routes requests through Cloudflare Tunnel to Azure VMSS.
 * The Azure VMs have no public IPs — cloudflared tunnel daemon
 * auto-connects to the same Tunnel ID, providing free load balancing.
 * 
 * Security:
 * - Cloudflare Tunnel (no public IP exposure)
 * - HMAC-SHA256 signing with shared secret (defense in depth)
 * - Timestamp included to prevent replay attacks (30s window)
 * - Caller identity for audit logging
 */

export interface TunnelClientConfig {
  /** Tunnel endpoint URL (Cloudflare Tunnel hostname) */
  baseUrl: string;
  /** Shared HMAC secret for request signing (defense in depth) */
  sharedSecret: string;
  /** Worker identity for audit logging (e.g., 'generation-consumer') */
  callerName: string;
  /** Request timeout in milliseconds (default: 55000) */
  timeoutMs?: number;
}

export interface TunnelCallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  latencyMs: number;
  statusCode?: number;
}

export class TunnelClient {
  private config: Required<TunnelClientConfig>;

  constructor(config: TunnelClientConfig) {
    this.config = {
      timeoutMs: 55_000, // 55 seconds
      ...config,
    };
  }

  /**
   * Make a signed POST request through Cloudflare Tunnel to Azure VM
   * 
   * @param path - Endpoint path (e.g., '/internal/generate')
   * @param body - Request body (will be JSON stringified)
   * @param options - Override default timeout
   * @returns Result with success flag, data, and latency
   */
  async call<T>(
    path: string,
    body: Record<string, any>,
    options?: { timeoutMs?: number }
  ): Promise<TunnelCallResult<T>> {
    const startTime = Date.now();
    const timestamp = Date.now();
    const payload = JSON.stringify(body);

    // ── Sign the request ──
    const signature = await this.sign(timestamp, payload);

    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs || this.config.timeoutMs;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.config.baseUrl}${path}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Signature': signature,
          'X-Worker-Timestamp': String(timestamp),
          'X-Worker-Caller': this.config.callerName,
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        
        // Log error details for debugging
        console.error(JSON.stringify({
          type: 'log',
          level: 'error',
          action: 'tunnel.call.failed',
          path,
          statusCode: response.status,
          errorBody: errorBody.slice(0, 500),
          latencyMs: Date.now() - startTime,
        }));

        return {
          success: false,
          error: `Tunnel returned ${response.status}: ${errorBody.slice(0, 200)}`,
          latencyMs: Date.now() - startTime,
          statusCode: response.status,
        };
      }

      const data = (await response.json()) as T;
      
      return {
        success: true,
        data,
        latencyMs: Date.now() - startTime,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        console.error(JSON.stringify({
          type: 'log',
          level: 'error',
          action: 'tunnel.call.timeout',
          path,
          timeoutMs,
          latencyMs: Date.now() - startTime,
        }));

        return {
          success: false,
          error: `Tunnel request timed out after ${timeoutMs}ms`,
          latencyMs: Date.now() - startTime,
        };
      }

      console.error(JSON.stringify({
        type: 'log',
        level: 'error',
        action: 'tunnel.call.error',
        path,
        error: err.message,
        latencyMs: Date.now() - startTime,
      }));

      return {
        success: false,
        error: `Tunnel request failed: ${err.message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Make a signed GET request to Azure VM via tunnel
   */
  async get<T>(
    path: string,
    options?: { timeoutMs?: number }
  ): Promise<TunnelCallResult<T>> {
    const startTime = Date.now();
    const timestamp = Date.now();

    // For GET requests, we sign the path instead of body
    const signature = await this.sign(timestamp, path);

    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs || this.config.timeoutMs;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.config.baseUrl}${path}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Worker-Signature': signature,
          'X-Worker-Timestamp': String(timestamp),
          'X-Worker-Caller': this.config.callerName,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          success: false,
          error: `Tunnel returned ${response.status}: ${errorBody.slice(0, 200)}`,
          latencyMs: Date.now() - startTime,
          statusCode: response.status,
        };
      }

      const data = (await response.json()) as T;
      
      return {
        success: true,
        data,
        latencyMs: Date.now() - startTime,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        return {
          success: false,
          error: `Tunnel request timed out after ${timeoutMs}ms`,
          latencyMs: Date.now() - startTime,
        };
      }

      return {
        success: false,
        error: `Tunnel request failed: ${err.message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check if Azure VM endpoint is healthy
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const result = await this.get<{ status: string }>('/internal/health', { timeoutMs: 5000 });
    
    return {
      healthy: result.success && result.data?.status === 'ok',
      latencyMs: result.latencyMs,
      error: result.error,
    };
  }

  /**
   * Sign a request using HMAC-SHA256
   * Format: HMAC(timestamp:caller:payload)
   */
  private async sign(timestamp: number, payload: string): Promise<string> {
    const data = `${timestamp}:${this.config.callerName}:${payload}`;
    
    // Import the key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.config.sharedSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the data
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(data)
    );
    
    // Convert to hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * Create a tunnel client from environment variables
 * Routes through Cloudflare Tunnel to Azure VMSS
 */
export function createTunnelClient(
  env: { TUNNEL_URL: string; WORKER_SHARED_SECRET: string },
  callerName: string,
  timeoutMs?: number
): TunnelClient {
  if (!env.TUNNEL_URL) {
    throw new Error('TUNNEL_URL environment variable is required');
  }
  if (!env.WORKER_SHARED_SECRET) {
    throw new Error('WORKER_SHARED_SECRET environment variable is required');
  }

  return new TunnelClient({
    baseUrl: env.TUNNEL_URL,
    sharedSecret: env.WORKER_SHARED_SECRET,
    callerName,
    timeoutMs,
  });
}
